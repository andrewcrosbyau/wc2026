import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase, getClientId } from '../lib/supabase';

export default function usePlanItems() {
  const [items, setItems] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState(new Set());
  const deleteTimers = useRef({});
  const clientId = useRef(getClientId());

  // Initial fetch — async IIFE so setState is called after await, not synchronously
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('plan_items')
        .select('*')
        .eq('trip_id', 'wc2026-trip')
        .order('created_at', { ascending: true });
      if (active && data) setItems(data);
    })();
    return () => { active = false; };
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('plan_items_rt')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'plan_items',
        filter: 'trip_id=eq.wc2026-trip',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems(prev => {
            if (prev.some(i => i.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new : i));
        } else if (payload.eventType === 'DELETE') {
          const id = payload.old.id;
          if (deleteTimers.current[id]) {
            clearTimeout(deleteTimers.current[id]);
            delete deleteTimers.current[id];
          }
          setPendingDeletes(prev => { const n = new Set(prev); n.delete(id); return n; });
          setItems(prev => prev.filter(i => i.id !== id));
        }
      })
      .subscribe(status => setRealtimeOk(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Polling fallback when realtime is down
  useEffect(() => {
    if (realtimeOk) return;
    const id = setInterval(() => {
      supabase
        .from('plan_items')
        .select('*')
        .eq('trip_id', 'wc2026-trip')
        .order('created_at', { ascending: true })
        .then(({ data }) => { if (data) setItems(data); });
    }, 60000);
    return () => clearInterval(id);
  }, [realtimeOk]);

  // Online / offline detection
  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const itemsByDate = useMemo(() => {
    return items.reduce((map, item) => {
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date).push(item);
      return map;
    }, new Map());
  }, [items]);

  const addItem = useCallback(async (fields) => {
    const row = { trip_id: 'wc2026-trip', created_by: clientId.current, ...fields };
    const { data } = await supabase.from('plan_items').insert(row).select().single();
    if (data) setItems(prev => {
      if (prev.some(i => i.id === data.id)) return prev;
      return [...prev, data];
    });
  }, []);

  const updateItem = useCallback(async (id, fields) => {
    const { data } = await supabase
      .from('plan_items')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (data) setItems(prev => prev.map(i => i.id === id ? data : i));
  }, []);

  const deleteItem = useCallback((id) => {
    setPendingDeletes(prev => new Set([...prev, id]));
    deleteTimers.current[id] = setTimeout(async () => {
      await supabase.from('plan_items').delete().eq('id', id);
      setItems(prev => prev.filter(i => i.id !== id));
      setPendingDeletes(prev => { const n = new Set(prev); n.delete(id); return n; });
      delete deleteTimers.current[id];
    }, 5000);
  }, []);

  const undoDelete = useCallback((id) => {
    if (deleteTimers.current[id]) {
      clearTimeout(deleteTimers.current[id]);
      delete deleteTimers.current[id];
    }
    setPendingDeletes(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const toggleDone = useCallback((id, currentValue) => {
    updateItem(id, { is_done: !currentValue });
  }, [updateItem]);

  return { itemsByDate, isOnline, addItem, updateItem, deleteItem, toggleDone, pendingDeletes, undoDelete };
}
