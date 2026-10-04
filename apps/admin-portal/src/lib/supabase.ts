import { createSupabaseClient, createApiClient } from '@superapp/shared-utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables in admin-portal');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
});

// ── apiClient (drop-in for supabase.from() / supabase.rpc()) ────────────────
// Compatibility alias: all data and auth operations use Supabase cloud.
export const { apiClient, initializeApiClient } = createApiClient(supabase);
// ── End apiClient ─────────────────────────────────────────────────
