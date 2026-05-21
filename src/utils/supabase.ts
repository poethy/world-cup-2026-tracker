import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing env vars — PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY not set');
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? 'missing'
);

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
