import { apiClient as _rawApiClient, configureApiClient as _configureApiClient } from "@superapp/shared-utils";
import { createSupabaseClient } from '@superapp/shared-utils';

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

// ── InsForge apiClient (drop-in for supabase.from() / supabase.rpc()) ──────
// Data operations route through the InsForge API server instead of Supabase cloud.
// Auth (supabase.auth.*) stays on Supabase. Only .from() and .rpc() move to apiClient.
// On production (*.appforyou.xyz) the InsForge API server is not deployed, so we
// fall back to the Supabase client directly to avoid 530 errors on every data op.
_configureApiClient({
  tokenGetter: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  },
});
const _isProd =
  typeof window !== "undefined" &&
  window.location?.hostname?.endsWith(".appforyou.xyz");
export const apiClient = _isProd ? supabase : _rawApiClient;
// ── End InsForge apiClient ─────────────────────────────────────────────────
