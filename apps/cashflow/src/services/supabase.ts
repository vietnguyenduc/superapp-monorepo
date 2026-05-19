import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

// Environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const APP_SUPABASE_SCHEMA = "public" as const;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable");
}

// Create Supabase client with enhanced JWT configuration and type safety
export const supabase = createClient<Database, "public">(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: APP_SUPABASE_SCHEMA,
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "sb-peslmsctejmvkwzyohke-auth-token",
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error("Error reading from localStorage:", error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error("Error writing to localStorage:", error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error("Error removing from localStorage:", error);
        }
      },
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "X-Client-Info": "debt-repayment-web-app",
    },
  },
});

export type SupabaseHealthCheckResult = {
  ok: boolean;
  schema: string;
  checks: Record<string, boolean>;
  errors: string[];
};

// Create a separate Supabase client for health checks without authentication
const healthCheckClient = createClient<Database, "public">(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: APP_SUPABASE_SCHEMA,
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "X-Client-Info": "debt-repayment-web-app-health-check",
    },
  },
});

export const runSupabaseHealthCheck = async (): Promise<SupabaseHealthCheckResult> => {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  const probes = [
    { name: "companies", query: () => healthCheckClient.from("companies").select("id", { head: true, count: "exact" }).limit(1) },
    { name: "customers", query: () => healthCheckClient.from("customers").select("id", { head: true, count: "exact" }).limit(1) },
    { name: "transactions", query: () => healthCheckClient.from("transactions").select("id", { head: true, count: "exact" }).limit(1) },
  ];

  for (const probe of probes) {
    try {
      const { error } = await probe.query();
      checks[probe.name] = !error;
      if (error) {
        errors.push(`${probe.name}: ${error.message}`);
      }
    } catch (error) {
      checks[probe.name] = false;
      errors.push(`${probe.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return {
    ok: errors.length === 0,
    schema: APP_SUPABASE_SCHEMA,
    checks,
    errors,
  };
};

// JWT token management utilities
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const sessionResult = await supabase.auth.getSession();
    return sessionResult.data.session?.access_token || null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

export const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
};

export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error);
      return { error };
    }
    return { data, error: null };
  } catch (error) {
    console.error("Error refreshing session:", error);
    return { error };
  }
};

// Export types for better TypeScript support
export type SupabaseClient = typeof supabase;
