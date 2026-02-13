// Real useAuth hook that uses Supabase authentication
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import type { User } from "../types";
import type { Session } from "@supabase/supabase-js";

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
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
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
        setState({
          user: null,
          session: null,
          loading: false,
          error: null,
          isTrial: false,
        });
      }
    }).catch((error) => {
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
    setState({
      user: {
        id: "trial-user",
        email: "trial@example.com",
        full_name: "Trial User",
        role: "staff",
        created_at: now,
        updated_at: now,
      } as User,
      session: null,
      loading: false,
      error: null,
      isTrial: true,
    });
  };

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
    updateProfile,
    clearError,
    isAuthenticated: (!!state.session && !!state.user) || state.isTrial,
    isTrial: state.isTrial,
    startTrial,
  };
};
