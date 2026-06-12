import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/types';

let supabaseInstance: SupabaseClient<Database> | null = null;

const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + encodeURIComponent(key) + '=([^;]+)'));
    return match && match[2] ? decodeURIComponent(match[2]) : null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
    // For local dev, use localhost. For prod, use the root domain (e.g. .superapp.com)
    const domain = isLocalhost
      ? 'localhost'
      : `.${hostname.split('.').slice(-2).join('.')}`; // Extracts root domain from sub.domain.com
    
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; domain=${domain}; max-age=31536000; SameSite=Lax; ${!isLocalhost ? 'Secure' : ''}`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
    const domain = isLocalhost
      ? 'localhost'
      : `.${hostname.split('.').slice(-2).join('.')}`;
      
    document.cookie = `${encodeURIComponent(key)}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
};

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
      storage: cookieStorage,
      storageKey: 'sb-superapp-auth-token',
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
