import { useState } from 'react';
import { supabase, getClientId } from '../lib/supabase';

export default function useTripUser() {
  const [name, setNameState] = useState(() => localStorage.getItem('wc2026-display-name') || null);

  async function setName(newName) {
    localStorage.setItem('wc2026-display-name', newName);
    setNameState(newName);
    supabase.from('trip_users').upsert({ client_id: getClientId(), name: newName }).then(() => {});
  }

  return { name, setName };
}
