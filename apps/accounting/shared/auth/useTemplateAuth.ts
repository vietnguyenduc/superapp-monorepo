import { useState, useEffect, useCallback } from "react";

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
}

export const useTemplateAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // On init: initialize auth state
  useEffect(() => {
    setState({ user: null, loading: false, error: null });
  }, []);

  const signIn = async (_email: string, _password: string) => {
    // placeholder: integrate real auth here
    setState((prev) => ({ ...prev, loading: true, error: null }));
    // Simulate failure for template; implement real logic per app
    setState((prev) => ({ ...prev, loading: false, error: "Not implemented" }));
    return { error: "Not implemented" } as const;
  };

  const signOut = async () => {
    setState({ user: null, loading: false, error: null });
    return { error: null } as const;
  };

  const clearError = () => setState((prev) => ({ ...prev, error: null }));

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signIn,
    signOut,
    clearError,
  } as const;
};
