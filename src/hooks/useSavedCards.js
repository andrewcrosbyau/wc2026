import { useState, useEffect, useRef } from 'react';
import { supabase, getClientId } from '../lib/supabase';

export default function useSavedCards() {
  const [saved, setSaved] = useState(new Set());
  const clientId = useRef(getClientId());

  useEffect(() => {
    supabase
      .from('saved_cards')
      .select('card_id')
      .eq('client_id', clientId.current)
      .then(({ data }) => {
        if (data) setSaved(new Set(data.map(r => r.card_id)));
      });
  }, []);

  const toggle = (cardId) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
        supabase.from('saved_cards').delete()
          .eq('client_id', clientId.current)
          .eq('card_id', cardId);
      } else {
        next.add(cardId);
        supabase.from('saved_cards').insert({ client_id: clientId.current, card_id: cardId });
      }
      return next;
    });
  };

  return [saved, toggle];
}
