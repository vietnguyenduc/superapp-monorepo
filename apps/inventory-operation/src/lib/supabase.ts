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

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'inventory-operation-auth',
      storage: {
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key);
          } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch (error) {
            console.error('Error writing to localStorage:', error);
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.error('Error removing from localStorage:', error);
          }
        },
      },
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
export const supabase = supabaseUrl && supabaseAnonKey ? createSupabaseClient() : createClient('https://placeholder.supabase.co', 'placeholder-key');

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
    const { error } = await supabase.from('products').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Log initialization
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('🔗 Supabase client initialized for Inventory Operation');
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
