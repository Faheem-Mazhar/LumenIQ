import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON as string;

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON — Realtime subscriptions will not work.',
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnon ?? '');
