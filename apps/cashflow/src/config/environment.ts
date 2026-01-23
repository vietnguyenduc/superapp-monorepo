// Environment configuration utility
export const config = {
  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },

  // Application environment
  app: {
    env: import.meta.env.VITE_APP_ENV || "development",
    isDevelopment: import.meta.env.VITE_APP_ENV === "development",
    isStaging: import.meta.env.VITE_APP_ENV === "staging",
    isProduction: import.meta.env.VITE_APP_ENV === "production",
  },

  // Optional configurations
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL,
  },

  analytics: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  },
} as const;

// Validation function to ensure required environment variables are present
export function validateEnvironment(): void {
  const requiredVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName as keyof ImportMetaEnv],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }
}

// Helper function to get environment-specific configuration
export function getEnvironmentConfig() {
  return {
    isDevelopment: config.app.isDevelopment,
    isStaging: config.app.isStaging,
    isProduction: config.app.isProduction,
    apiUrl:
      config.api.baseUrl ||
      (config.app.isDevelopment ? "http://localhost:3000" : ""),
  };
}
