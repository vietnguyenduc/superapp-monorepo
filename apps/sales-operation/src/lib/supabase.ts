import { createSupabaseClient as createSharedClient } from '@superapp/shared-utils';
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
    // Only intercept in browser and if isTrial is true
    const isTrial = typeof window !== 'undefined' && localStorage.getItem('isTrial') === 'true';
    
    // If we're in trial mode and trying to access data-fetching methods
    if (isTrial && (prop === 'from' || prop === 'rpc' || prop === 'auth')) {
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
                error: { message: 'Supabase calls are disabled in Trial Mode', code: 'TRIAL_MODE_BLOCKED' } 
              }));
            }
            // Chainable methods for PostgrestQueryBuilder
            if (['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'upsert'].includes(String(p))) {
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
  PRODUCTS: 'products',
  INVENTORY_RECORDS: 'inventory_records',
  SALES_RECORDS: 'sales_records',
  SPECIAL_OUTBOUND_RECORDS: 'special_outbound_records',
  USERS: 'users',
  APPROVAL_LOGS: 'approval_logs',
  APPROVAL_WORKFLOWS: 'approval_workflows',
} as const;

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    // Common Supabase error messages in Vietnamese
    const errorMap: Record<string, string> = {
      'Invalid input': 'Dữ liệu đầu vào không hợp lệ',
      'Permission denied': 'Không có quyền truy cập',
      'Row not found': 'Không tìm thấy dữ liệu',
      'Duplicate key value': 'Dữ liệu đã tồn tại',
      'Connection error': 'Lỗi kết nối cơ sở dữ liệu',
    };

    for (const [key, value] of Object.entries(errorMap)) {
      if (error.message.includes(key)) {
        return value;
      }
    }

    return error.message;
  }
  return 'Đã xảy ra lỗi không xác định';
};

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
};

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

// Helper function to test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const isTrial = localStorage.getItem('isTrial') === 'true';
    if (isTrial) {
      return true;
    }

    const { error } = await supabase.from('products').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Log initialization
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('🔗 Supabase client initialized for Sales Operation');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('🌍 Environment:', import.meta.env.VITE_APP_ENV || 'development');
  console.log('🔄 Realtime enabled:', import.meta.env.VITE_ENABLE_REALTIME !== 'false');
}

// Helper function for successful responses
export const handleSupabaseSuccess = <T>(data: T) => {
  return {
    success: true,
    data,
  };
};

export default supabase;
