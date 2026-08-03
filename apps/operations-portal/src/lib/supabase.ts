import { createSupabaseClient as createSharedClient, createApiClient } from '@superapp/shared-utils';
import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables at runtime only
let envValidationError: string | null = null;

if (!supabaseUrl) {
  envValidationError = 'Missing VITE_SUPABASE_URL environment variable';
  console.error(envValidationError);
}

if (!supabaseAnonKey) {
  envValidationError = 'Missing VITE_SUPABASE_ANON_KEY environment variable';
  console.error(envValidationError);
}

// Create Supabase client with enhanced configuration
// Use placeholder values during build time if env vars are missing
const createSupabaseClient = () => {
  if (envValidationError) {
    throw new Error(envValidationError);
  }

  return createSharedClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    db: {
      schema: 'public',
    },
  });
};

// Export the client - will throw error on first use if env vars are missing
const rawSupabase = supabaseUrl && supabaseAnonKey 
  ? createSupabaseClient() 
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Trial Mode Interceptor: Prevents network egress when in trial mode
export const supabase = new Proxy(rawSupabase, {
  get(target, prop, receiver) {
    // Only intercept in browser and if isTrial is true or missing env vars
    const isTrial = typeof window !== 'undefined' && (localStorage.getItem('isTrial') === 'true' || !supabaseUrl);
    
    // If we're in trial mode and trying to access data-fetching methods
    if (isTrial && (prop === 'from' || prop === 'rpc' || prop === 'auth' || prop === 'storage')) {
      if (prop === 'auth') {
        // Return a mock auth object that mimics standard behaviors
        return {
          getUser: async () => ({ data: { user: { id: 'trial-user', email: 'trial@example.com' } }, error: null }),
          getSession: async () => ({ data: { session: null }, error: null }),
          signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Cannot sign in during trial mode') }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        };
      }

      // For from() and rpc(), return a chainable dummy that returns errors
      return (name: string) => {
        console.warn(`⚠️ Blocked Supabase ${String(prop)}('${name}') call during Trial Mode`);
        
        // Return a proxy that handles common chainable methods
        const dummy: any = new Proxy({}, {
          get(_, p) {
            if (p === 'then') {
              return (onfulfilled: any) => Promise.resolve(onfulfilled({ 
                data: null, 
                error: { message: 'Supabase calls are disabled in Trial Mode', code: 'TRIAL_MODE_BLOCKED' },
                count: 0
              }));
            }
            if (p === 'catch') {
              return (onrejected: any) => dummy;
            }
            if (p === 'finally') {
              return (onfinally: any) => { onfinally(); return dummy; };
            }
            // Chainable methods for PostgrestQueryBuilder
            if (['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'upsert', 'csv'].includes(String(p))) {
              return () => dummy;
            }
            return dummy;
          }
        });
        return dummy;
      };
    }

    return Reflect.get(target, prop, receiver);
  }
});

// Database table names
export const TABLES = {
  OPERATION_CHECKINS: 'operation_checkins',
  OPERATION_DOCUMENTS: 'operation_documents',
  OPERATION_CHAT_GROUPS: 'operation_chat_groups',
  OPERATION_CHAT_MEMBERS: 'operation_chat_members',
  OPERATION_CHAT_MESSAGES: 'operation_chat_messages',
  OPERATION_TICKETS: 'operation_tickets',
  OPERATION_ASSETS: 'operation_assets',
  OPERATION_CONSUMABLES: 'operation_consumables',
  OPERATION_EMERGENCY_CONTACTS: 'operation_emergency_contacts',
  OPERATION_TRAINING_COURSES: 'operation_training_courses',
  OPERATION_TRAINING_MATERIALS: 'operation_training_materials',
  OPERATION_TRAINING_QUESTIONS: 'operation_training_questions',
  OPERATION_TRAINING_PROGRESS: 'operation_training_progress',
  USERS: 'users',
  COMPANIES: 'companies'
} as const;

export const STORAGE = {
  OPERATIONS_MEDIA: 'operations_media'
} as const;

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper function to get user ID (for created_by, updated_by fields)
export const getCurrentUserId = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user?.id || null;
};

export default supabase;

// ── apiClient (drop-in for supabase.from() / supabase.rpc()) ────────────────
// Default to Supabase cloud as the single source of truth.
// On local/dev environments we prefer InsForge (local Postgres) when it is
// reachable, so AI agents and local tests can query the local schema.
// Auth (supabase.auth.*) stays on Supabase. Only .from() and .rpc() move to apiClient.
export const { apiClient, initializeApiClient } = createApiClient(supabase);
// ── End apiClient ─────────────────────────────────────────────────
