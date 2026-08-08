import { createSupabaseClient, createApiClient } from "@superapp/shared-utils";
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import type { FrameworkDatabase } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable");
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "X-Client-Info": "framework-method",
    },
  },
});

export const { apiClient } = createApiClient(supabase);

export const fmSupabase = supabase as unknown as SupabaseClientType<FrameworkDatabase>;

export type SupabaseClient = typeof supabase;
