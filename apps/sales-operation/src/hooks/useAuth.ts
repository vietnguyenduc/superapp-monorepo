// Real useAuth hook that uses Supabase authentication
// Adapted for inventory-operation app with app-level permissions
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

const TRIAL_STORAGE_KEY = "inventory_trial_user";
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface InventoryUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  company_id: string | null;
  branch_id: string | null;
  staff_permissions: Record<string, boolean> | null;
  app_permissions: Record<string, boolean> | null;
  branch?: any;
  company?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Read the persisted trial session from localStorage.
 * Returns null when there is no trial, when the JSON is corrupt,
 * or when the trial has expired (in which case the entry is also cleared).
 */
const readTrialFromStorage = (): { user: InventoryUser; started_at: string } | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { user?: InventoryUser; started_at?: string };
    if (!parsed?.user || !parsed?.started_at) {
      localStorage.removeItem(TRIAL_STORAGE_KEY);
      return null;
    }
    const startedMs = new Date(parsed.started_at).getTime();
    if (!Number.isFinite(startedMs) || Date.now() - startedMs > TRIAL_DURATION_MS) {
      localStorage.removeItem(TRIAL_STORAGE_KEY);
      return null;
    }
    return { user: parsed.user, started_at: parsed.started_at };
  } catch {
    localStorage.removeItem(TRIAL_STORAGE_KEY);
    return null;
  }
};

interface AuthState {
  user: InventoryUser | null;
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
  const fetchUserProfile = useCallback(async (userId: string): Promise<InventoryUser | null> => {
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

    // Check if user has inventory app access
    if (userData.app_permissions && !userData.app_permissions.inventory) {
      console.error("User does not have inventory app access");
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

    // If user has a company_id, fetch company separately
    let company = null;
    if (userData.company_id) {
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("id", userData.company_id)
        .single();
      company = companyData;
    }

    return { ...userData, branch, company } as unknown as InventoryUser;
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    // Safety-net timeout: only fires if Supabase init hangs completely
    const initTimeout = setTimeout(() => {
      if (!isMounted) return;
      setState((prev) => {
        if (!prev.loading) return prev; // Already resolved — skip
        console.warn("Auth initialization timeout — treating as unauthenticated");
        // Try trial mode (with expiry check) before giving up
        const trial = readTrialFromStorage();
        if (trial) {
          return {
            user: trial.user,
            session: null,
            loading: false,
            error: null,
            isTrial: true,
          };
        }
        return {
          user: null,
          session: null,
          loading: false,
          error: null,
          isTrial: false,
        };
      });
    }, 20000); // 20s — generous for cold-start Supabase projects

    // First, check if we are already in Trial Mode from a previous session
    const trial = readTrialFromStorage();
    if (trial) {
      console.log('⚡ Initializing in Trial Mode');
      if (typeof window !== "undefined") {
        localStorage.setItem('isTrial', 'true');
      }
      setState({
        user: trial.user,
        session: null,
        loading: false,
        error: null,
        isTrial: true,
      });
      return; // Skip Supabase init if in trial
    }

    // Primary init: getSession()
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(initTimeout);
        if (!isMounted) return;

        if (session?.user) {
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (!isMounted) return;
            
            // If profile fetch failed due to permissions but we have a user,
            // fall back to a basic user object from auth metadata
            const finalUser = profile || {
              id: session.user.id,
              email: session.user.email || '',
              full_name: (session.user.user_metadata as any)?.full_name || 'User',
              role: 'staff', // default role
              app_permissions: { inventory: true },
              created_at: session.user.created_at,
              updated_at: session.user.created_at,
            } as any;

            setState({
              user: finalUser,
              session,
              loading: false,
              error: null,
              isTrial: false,
            });
          } catch (profileError) {
            console.error("Critical error in profile fetch:", profileError);
            if (!isMounted) return;
            setState({
              user: (session.user as any) ?? null,
              session,
              loading: false,
              error: "Failed to fetch user profile",
              isTrial: false,
            });
          }
        } else {
          if (!isMounted) return;
          setState({
            user: null,
            session: null,
            loading: false,
            error: null,
            isTrial: false,
          });
        }
      })
      .catch((error) => {
        clearTimeout(initTimeout);
        console.error("Error getting session:", error);
        if (!isMounted) return;
        setState({
          user: null,
          session: null,
          loading: false,
          error: null,
          isTrial: false,
        });
      });

    // Listen for future auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        setTimeout(async () => {
          if (!isMounted) return;
          let profile = await fetchUserProfile(session.user.id);

          if (!isMounted) return;
          setState({
            user: profile || (session.user as any) || null,
            session,
            loading: false,
            error: profile ? null : "Failed to fetch user profile",
            isTrial: false,
          });
        }, 0);
        return;
      }

      if (event === "SIGNED_OUT") {
        if (!isMounted) return;
        setState({
          user: null,
          session: null,
          loading: false,
          error: null,
          isTrial: false,
        });
        return;
      }

      if (event === "TOKEN_REFRESHED" && session) {
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          session,
          isTrial: false,
        }));
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
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

      const authUser = data.session?.user;
      if (!authUser) {
        setState((prev) => ({ ...prev, loading: false, error: "Không nhận được phiên đăng nhập" }));
        return { error: "Không nhận được phiên đăng nhập" };
      }

      let profile: InventoryUser | null = null;
      try {
        profile = await fetchUserProfile(authUser.id);
        if (!profile || !profile.app_permissions?.inventory) {
          setState((prev) => ({ ...prev, loading: false, error: "Bạn không có quyền truy cập ứng dụng Inventory" }));
          return { error: "Bạn không có quyền truy cập ứng dụng Inventory" };
        }
      } catch (profileErr) {
        console.error("Failed to fetch profile during sign in:", profileErr);
      }

      setState({
        user: profile || (authUser as any) || null,
        session: data.session,
        loading: false,
        error: null,
        isTrial: false,
      });

      return { error: null };
    } catch (err: any) {
      console.error("Unhandled error during sign in:", err);
      setState((prev) => ({ ...prev, loading: false, error: err?.message || "Sign in failed" }));
      return { error: err?.message || "Sign in failed" };
    }
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

      if (authUser && !data.session) {
        setState((prev) => ({ ...prev, loading: false, error: null }));
        return { error: null, confirmationRequired: true };
      }

      if (authUser && data.session) {
        // Create user profile row with inventory app access
        const profilePayload = {
          id: authUser.id,
          email: authUser.email ?? "",
          full_name: fullName || (authUser.user_metadata as { full_name?: string })?.full_name || null,
          role: "staff",
          app_permissions: { cashflow: false, inventory: true },
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

    try {
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ error: { message: "Sign out timed out" } }), 5000)
      );

      const result = await Promise.race([signOutPromise, timeoutPromise]);

      if (result.error) {
        console.warn("Sign out issue:", result.error.message);
      }
    } catch (err) {
      console.error("Sign out error:", err);
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
      localStorage.removeItem("inventory-operation-auth");
      localStorage.removeItem('isTrial');
    }

    return { error: null };
  };

  const updateProfile = async (
    updates: Partial<InventoryUser>
  ): Promise<{ data?: InventoryUser; error: string | null }> => {
    if (!state.user?.id) {
      return { error: "No user logged in" };
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", state.user.id)
      .select("*")
      .single();

    if (error) {
      return { error: error.message };
    }

    const updatedUser = data as unknown as InventoryUser;
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
      role: "admin",
      company_id: null,
      branch_id: null,
      staff_permissions: { import_products: true, import_inventory: true, view_reports: true, manage_settings: true },
      app_permissions: { cashflow: false, inventory: true },
      created_at: now,
      updated_at: now,
    } as InventoryUser;
    setState({
      user: trialUser,
      session: null,
      loading: false,
      error: null,
      isTrial: true,
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify({ user: trialUser, started_at: now }));
      localStorage.setItem('isTrial', 'true');
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
