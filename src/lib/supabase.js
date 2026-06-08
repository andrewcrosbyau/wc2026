import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://cbabsnogruprypmvkuzv.supabase.co',
  'sb_publishable_yxy9Si_s3lxTSc0YlFs_Gw_3b4jypL5'
);

export function getClientId() {
  let id = localStorage.getItem('wc2026-client-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('wc2026-client-id', id);
  }
  return id;
}
