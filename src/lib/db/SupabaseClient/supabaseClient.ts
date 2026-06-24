// src/lib/db/SupabaseClient/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/config/Env';

// Server-side client med secret key (bruges kun i Server Components og API routes)
export function getSupabaseServerClient() {
  return createClient(env.supabase.url, env.supabase.secretKey);
}

// Browser-side client med anon key (bruges i Client Components)
export function getSupabaseBrowserClient() {
  return createClient(env.supabase.url, env.supabase.anonKey);
}
