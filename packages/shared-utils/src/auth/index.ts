import { getSupabaseClient } from '../supabase/client';
import type { SignInWithPasswordCredentials } from '@supabase/supabase-js';

export const authUtils = {
  async signIn(credentials: SignInWithPasswordCredentials) {
    const supabase = getSupabaseClient();
    return supabase.auth.signInWithPassword(credentials);
  },

  async signOut() {
    const supabase = getSupabaseClient();
    return supabase.auth.signOut();
  },

  async getSession() {
    const supabase = getSupabaseClient();
    return supabase.auth.getSession();
  },

  async getUser() {
    const supabase = getSupabaseClient();
    return supabase.auth.getUser();
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = getSupabaseClient();
    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription;
  }
};
