import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@repo/types';

let supabaseInstance: SupabaseClient<Database> | null = null;

export function createSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  options: any = {}
): SupabaseClient<Database> {
  // Return existing instance if already created (singleton for client-side)
  if (supabaseInstance && typeof window !== 'undefined') {
    return supabaseInstance;
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      ...options.auth,
    },
    ...options,
  });

  if (typeof window !== 'undefined') {
    supabaseInstance = client;
  }

  return client;
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    throw new Error('Supabase client has not been initialized. Call createSupabaseClient first.');
  }
  return supabaseInstance;
}
