// Real useAuth hook that uses Supabase authentication
import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@superapp/shared-utils";
import { setTrialMode, clearTrialStore } from "../utils/trialManager";
import type { User, TablesInsert } from "@repo/types";
import type { Session } from "@supabase/supabase-js";

const TRIAL_STORAGE_KEY = "cashflow_trial_user";
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Read the persisted trial session from localStorage.
 * Returns null when there is no trial, when the JSON is corrupt,
 * or when the trial has expired (in which case the entry is also cleared).
 */
const readTrialFromStorage = (): { user: User; started_at: string } | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { user?: User; started_at?: string };
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
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isTrial: boolean;
}

export const useAuth = () => {
  const supabase = getSupabaseClient();
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
      .maybeSingle();

    if (userError || !userData) {
      if (userError) console.error("Error fetching user profile:", userError);
      return null;
    }

    // If user has a branch_id, fetch branch separately
    let branch = null;
    if (userData.branch_id) {
      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .eq("id", userData.branch_id)
        .maybeSingle();
      branch = branchData ?? null;
    }

    // If user has a company_id, fetch company separately
    let company = null;
    if (userData.company_id) {
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("id", userData.company_id)
        .maybeSingle();
      company = companyData ?? null;
    }

    return { ...userData, branch, company } as unknown as User;
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    // Safety-net timeout: only fires if Supabase init hangs completely
    // (e.g. total network failure, Supabase project sleeping on free tier).
    const initTimeout = setTimeout(() => {
      if (!isMounted) return;
      setState((prev) => {
        if (!prev.loading) return prev; // Already resolved — skip
        console.warn("Auth initialization timeout — treating as unauthenticated");
        // Try trial mode (with expiry check) before giving up
        const trial = readTrialFromStorage();
        if (trial) {
          setTrialMode(true);
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
          error: null, // No scary error — just redirect to login
          isTrial: false,
        };
      });
    }, 20000); // 20s — generous for cold-start Supabase projects

    // ─── Single Sign-On check (URL Params) ──────────────────────────────────
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get("access_token");
      const refreshToken = urlParams.get("refresh_token");

      if (accessToken && refreshToken) {
        // Clear them from URL to avoid leaking
        window.history.replaceState({}, document.title, window.location.pathname);
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).catch(err => console.error("Error setting session from URL:", err));
      }

      // ─── Trial preview mode (from admin Trial Seed Editor) ─────────────
      // ?trial_preview=true → auto-start trial so admin can preview seed data
      const trialPreview = urlParams.get("trial_preview");
      if (trialPreview === "true") {
        const trial = readTrialFromStorage();
        if (trial) {
          // Trial already active — keep it
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // Start trial immediately
          const now = new Date().toISOString();
          const trialUser = {
            id: "trial-user",
            email: "trial@example.com",
            full_name: "Trial User",
            role: "admin",
            company_id: "trial-company",
            branch_id: "trial-branch",
            created_at: now,
            updated_at: now,
          };
          localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify({ user: trialUser, started_at: now }));
          window.history.replaceState({}, document.title, window.location.pathname);
          // Don't set state here — the primary init flow below will pick it up
        }
      }
    }

    // ─── Primary init: getSession() ─────────────────────────────────────────
    // This is called OUTSIDE the auth lock, so fetchUserProfile()
    // (which internally calls getSession() for the access token) won't deadlock.

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }: any) => {
        clearTimeout(initTimeout);
        if (!isMounted) return;

        if (session?.user) {
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (!isMounted) return;
            setState({
              user: profile,
              session,
              loading: false,
              error: null,
              isTrial: false,
            });
          } catch (profileError) {
            console.error("Error fetching user profile:", profileError);
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
          // No real session — check trial mode (with expiry)
          const trial = readTrialFromStorage();
          if (trial) {
            setTrialMode(true);
            if (!isMounted) return;
            setState({
              user: trial.user,
              session: null,
              loading: false,
              error: null,
              isTrial: true,
            });
            return;
          }
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
      .catch((error: any) => {
        clearTimeout(initTimeout);
        const msg = error?.message ?? "";
        if (!msg.includes("Refresh Token")) {
          console.error("Error getting session:", error);
        }
        if (!isMounted) return;
        setState({
          user: null,
          session: null,
          loading: false,
          error: null,
          isTrial: false,
        });
      });

    // ─── Listen for future auth changes ─────────────────────────────────────
    // CRITICAL: Never do Supabase DB queries (from/select/upsert) inside this
    // callback! Supabase holds an internal auth lock while calling back, and
    // every DB query calls getSession() to get the access token — which needs
    // the SAME lock → deadlock.
    //
    // Instead, schedule heavy work via setTimeout(0) so it runs AFTER the
    // callback returns and the lock is released.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === "INITIAL_SESSION") {
        // Already handled by getSession() above — return immediately
        // to release the auth lock.
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        // Schedule profile fetch OUTSIDE the lock via setTimeout(0)
        setTimeout(async () => {
          if (!isMounted) return;
          let profile = await fetchUserProfile(session.user.id);

          // If no profile exists (e.g., after email confirmation), create one.
          // Use INSERT (not UPSERT) so an existing profile's role/company_id is never overwritten.
          if (!profile) {
            const meta = session.user.user_metadata as { full_name?: string };
            const profilePayload: TablesInsert<"users"> = {
              id: session.user.id,
              email: session.user.email ?? "",
              full_name: meta?.full_name || null,
              role: "staff",
            };
            const { error: insertError } = await supabase
              .from("users")
              .insert(profilePayload);
            if (insertError && (insertError as any).code !== "23505") {
              console.error("Error creating user profile on sign-in:", insertError);
            }
            profile = await fetchUserProfile(session.user.id);
          }

          if (!isMounted) return;
          setState({
            user: profile || (session.user as any) || null,
            session,
            loading: false,
            error: profile ? null : "Failed to fetch user profile",
            isTrial: false,
          });

          // Explicitly disable trial mode when signed in with real credentials
          setTrialMode(false);
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

        // Explicitly disable trial mode when signed out
        setTrialMode(false);
        return;
      }

      if (event === "TOKEN_REFRESHED" && session) {
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          session,
          isTrial: false,
        }));

        // Explicitly disable trial mode during token refresh (real user)
        setTrialMode(false);
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

      let profile: User | null = null;
      try {
        profile = await fetchUserProfile(authUser.id);
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

      // Explicitly disable trial mode when signing in with real credentials
      setTrialMode(false);

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

        const { error: profileError } = await supabase.from("users").insert(profilePayload);

        if (profileError && (profileError as any).code !== "23505") {
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

        // Explicitly disable trial mode when signing up with real credentials
        setTrialMode(false);
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

    try {
      // Race signOut against a timeout to prevent hanging forever
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

    // Always clear the local state regardless of API response
    setState({
      user: null,
      session: null,
      loading: false,
      error: null,
      isTrial: false,
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem(TRIAL_STORAGE_KEY);
      // Also clear the Supabase auth storage to prevent stale sessions
      localStorage.removeItem("debt-repayment-auth");
      clearTrialStore();
    }

    // Explicitly disable trial mode when signing out
    setTrialMode(false);

    return { error: null };
  };

  const updateProfile = async (
    updates: Partial<Omit<User, 'branch' | 'company' | 'staff_permissions'>>
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
      role: "admin",
      company_id: "trial-company",
      branch_id: "trial-branch",
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
    setTrialMode(true);
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
