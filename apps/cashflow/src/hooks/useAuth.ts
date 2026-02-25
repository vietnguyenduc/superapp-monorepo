// Real useAuth hook that uses Supabase authentication
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import type { User } from "../types";
import type { TablesInsert } from "../types/database.types";
import type { Session } from "@supabase/supabase-js";

const TRIAL_STORAGE_KEY = "cashflow_trial_user";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isTrial: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isTrial: false,
  });

  // Fetch user profile from public.users table
  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    // First fetch user without branch join to avoid RLS recursion
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user profile:", userError);
      return null;
    }

    // If user has a branch_id, fetch branch separately
    let branch = null;
    if (userData.branch_id) {
      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .eq("id", userData.branch_id)
        .single();
      branch = branchData;
    }

    return { ...userData, branch } as unknown as User;
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Add a timeout to prevent infinite loading states
    const initTimeout = setTimeout(() => {
      console.warn("Auth initialization timeout - forcing loading to false");
      setState({
        user: null,
        session: null,
        loading: false,
        error: "Authentication check timed out",
      });
    }, 10000); // 10 second timeout

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(initTimeout); // Clear timeout if we got a response

      if (session?.user) {
        try {
          const profile = await fetchUserProfile(session.user.id);
          setState({
            user: profile,
            session,
            loading: false,
            error: null,
            isTrial: false,
          });
        } catch (profileError) {
          console.error("Error fetching user profile:", profileError);
          // Still set loading to false so user can retry login
          setState({
            user: null,
            session: null,
            loading: false,
            error: "Failed to fetch user profile",
            isTrial: false,
          });
        }
      } else {
        // If no real session, attempt to restore trial user from storage
        const trialRaw = typeof window !== "undefined" ? localStorage.getItem(TRIAL_STORAGE_KEY) : null;
        if (trialRaw) {
          const parsed = JSON.parse(trialRaw);
          setState({
            user: parsed?.user || null,
            session: null,
            loading: false,
            error: null,
            isTrial: true,
          });
        } else {
          setState({
            user: null,
            session: null,
            loading: false,
            error: null,
            isTrial: false,
          });
        }
      }
    }).catch((error) => {
      clearTimeout(initTimeout); // Clear timeout on error too
      // Handle getSession errors - ensure loading is set to false
      console.error("Error getting session:", error);
      setState({
        user: null,
        session: null,
        loading: false,
        error: "Failed to check authentication",
        isTrial: false,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setState({
          user: profile,
          session,
          loading: false,
          error: null,
          isTrial: false,
        });
      } else if (event === "SIGNED_OUT") {
        setState({
          user: null,
          session: null,
          loading: false,
          error: null,
          isTrial: false,
        });
      } else if (event === "TOKEN_REFRESHED" && session) {
        setState((prev) => ({
          ...prev,
          session,
          isTrial: false,
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      return { error: error.message };
    }

    if (data.session?.user) {
      const profile = await fetchUserProfile(data.session.user.id);
      setState({
        user: profile,
        session: data.session,
        loading: false,
        error: null,
        isTrial: false,
      });
    }

    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ error: string | null; confirmationRequired?: boolean }> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined,
        },
      });

      if (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
        return { error: error.message };
      }

      const authUser = data.session?.user ?? data.user;

      // If email confirmation is required, Supabase returns user without session.
      if (authUser && !data.session) {
        setState((prev) => ({ ...prev, loading: false, error: null }));
        return { error: null, confirmationRequired: true };
      }

      if (authUser && data.session) {
        // Create user profile row (requires session JWT)
        const profilePayload: TablesInsert<"users"> = {
          id: authUser.id,
          email: authUser.email ?? "",
          full_name: fullName || (authUser.user_metadata as { full_name?: string })?.full_name || null,
          role: "staff",
        };

        const { error: profileError } = await supabase.from("users").upsert(profilePayload);

        if (profileError) {
          console.error("Error creating profile during sign up:", profileError);
          setState((prev) => ({ ...prev, loading: false, error: profileError.message }));
          return { error: profileError.message };
        }

        const profile = await fetchUserProfile(authUser.id);
        setState({
          user: profile,
          session: data.session ?? null,
          loading: false,
          error: null,
          isTrial: false,
        });
      } else {
        // No user returned
        setState((prev) => ({ ...prev, loading: false }));
        return { error: "No user returned from sign up" };
      }

      return { error: null, confirmationRequired: false };
    } catch (err: any) {
      console.error("Unhandled error during sign up:", err);
      setState((prev) => ({ ...prev, loading: false, error: err?.message || "Sign up failed" }));
      return { error: err?.message || "Sign up failed" };
    }
  };

  const signOut = async (): Promise<{ error: string | null }> => {
    setState((prev) => ({ ...prev, loading: true }));

    const { error } = await supabase.auth.signOut();

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      return { error: error.message };
    }

    setState({
      user: null,
      session: null,
      loading: false,
      error: null,
      isTrial: false,
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem(TRIAL_STORAGE_KEY);
    }

    return { error: null };
  };

  const updateProfile = async (
    updates: Partial<User>
  ): Promise<{ data?: User; error: string | null }> => {
    if (!state.user?.id) {
      return { error: "No user logged in" };
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", state.user.id)
      .select(`
        *,
        branch:branches!users_branch_id_fkey(*)
      `)
      .single();

    if (error) {
      return { error: error.message };
    }

    const updatedUser = data as unknown as User;
    setState((prev) => ({
      ...prev,
      user: updatedUser,
    }));

    return { data: updatedUser, error: null };
  };

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const startTrial = () => {
    const now = new Date().toISOString();
    const trialUser = {
      id: "trial-user",
      email: "trial@example.com",
      full_name: "Trial User",
      role: "staff",
      created_at: now,
      updated_at: now,
    } as User;
    setState({
      user: trialUser,
      session: null,
      loading: false,
      error: null,
      isTrial: true,
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify({ user: trialUser, started_at: now }));
    }
  };

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
    signUp,
    updateProfile,
    clearError,
    isAuthenticated: (!!state.session && !!state.user) || state.isTrial,
    isTrial: state.isTrial,
    startTrial,
  };
};
