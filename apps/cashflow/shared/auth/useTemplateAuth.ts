import { useState, useEffect, useCallback } from "react";

export const TRIAL_KEY = "template_trial_user";
export interface TemplateUser {
  id: string;
  email: string;
  full_name: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: TemplateUser | null;
  loading: boolean;
  error: string | null;
  isTrial: boolean;
}

export const useTemplateAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isTrial: false,
  });

  // On init: restore trial user if present
  useEffect(() => {
    const trialRaw = typeof window !== "undefined" ? localStorage.getItem(TRIAL_KEY) : null;
    if (trialRaw) {
      const parsed = JSON.parse(trialRaw);
      setState({ user: parsed?.user || null, loading: false, error: null, isTrial: true });
    } else {
      setState({ user: null, loading: false, error: null, isTrial: false });
    }
  }, []);

  const signIn = async (_email: string, _password: string) => {
    // placeholder: integrate real auth here
    setState((prev) => ({ ...prev, loading: true, error: null }));
    // Simulate failure for template; implement real logic per app
    setState((prev) => ({ ...prev, loading: false, error: "Not implemented" }));
    return { error: "Not implemented" } as const;
  };

  const signOut = async () => {
    setState({ user: null, loading: false, error: null, isTrial: false });
    if (typeof window !== "undefined") {
      localStorage.removeItem(TRIAL_KEY);
    }
    return { error: null } as const;
  };

  const clearError = () => setState((prev) => ({ ...prev, error: null }));

  const startTrial = () => {
    const now = new Date().toISOString();
    const trialUser: TemplateUser = {
      id: "trial-user",
      email: "trial@example.com",
      full_name: "Trial User",
      role: "staff",
      created_at: now,
      updated_at: now,
    };
    setState({ user: trialUser, loading: false, error: null, isTrial: true });
    if (typeof window !== "undefined") {
      localStorage.setItem(TRIAL_KEY, JSON.stringify({ user: trialUser, started_at: now }));
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isTrial: state.isTrial,
    isAuthenticated: !!state.user || state.isTrial,
    signIn,
    signOut,
    startTrial,
    clearError,
  } as const;
};
