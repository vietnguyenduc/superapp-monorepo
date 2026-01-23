// Environment configuration and validation

export interface AppConfig {
  apiUrl: string;
  appName: string;
  supabase: {
    url: string;
    anonKey: string;
  };
  googleSheets?: {
    apiKey: string;
  };
  app: {
    defaultLocale: string;
    currency: string;
    timezone: string;
  };
}

const getEnvVar = (key: string, required = true): string => {
  const value = import.meta.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
};

export const config: AppConfig = {
  apiUrl: getEnvVar('VITE_API_URL'),
  appName: getEnvVar('VITE_APP_NAME', false) || 'Inventory Operation',
  
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  },
  
  googleSheets: {
    apiKey: getEnvVar('VITE_GOOGLE_SHEETS_API_KEY', false),
  },
  
  app: {
    defaultLocale: getEnvVar('VITE_DEFAULT_LOCALE', false) || 'vi-VN',
    currency: getEnvVar('VITE_CURRENCY', false) || 'VND',
    timezone: getEnvVar('VITE_TIMEZONE', false) || 'Asia/Ho_Chi_Minh',
  },
};

// Validation function
export const validateConfig = (): boolean => {
  try {
    // Check required fields
    if (!config.supabase.url || !config.supabase.anonKey) {
      console.error('Missing Supabase configuration');
      return false;
    }
    
    console.log('✅ Configuration validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    return false;
  }
};

// Initialize configuration on app start
export const initializeConfig = () => {
  if (!validateConfig()) {
    throw new Error('Invalid configuration. Please check your environment variables.');
  }
  
  console.log(`🚀 ${config.appName} initialized with locale: ${config.app.defaultLocale}`);
};
