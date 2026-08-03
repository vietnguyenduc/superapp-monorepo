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
// Default to Supabase cloud as the single source of truth.
// On local/dev environments we prefer InsForge (local Postgres) when it is
// reachable, so AI agents and local tests can query the local schema.
// Auth (supabase.auth.*) stays on Supabase. Only .from() and .rpc() move to apiClient.
export const { apiClient, initializeApiClient } = createApiClient(supabase);
// ── End apiClient ─────────────────────────────────────────────────
