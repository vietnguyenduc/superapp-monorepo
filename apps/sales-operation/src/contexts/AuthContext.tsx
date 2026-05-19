import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useAuth as useAuthHook } from "../hooks/useAuth";

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

interface AuthContextType {
  user: InventoryUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: string | null; confirmationRequired?: boolean }>;
  signOut: () => Promise<{ error: string | null }>;
  updateProfile: (
    updates: Partial<InventoryUser>,
  ) => Promise<{ data?: InventoryUser; error: string | null }>;
  clearError: () => void;
  isAuthenticated: boolean;
  getAccessToken: () => string | null;
  refreshToken: () => Promise<{ error: string | null }>;
  isTokenExpired: () => boolean;
  isTrial: boolean;
  startTrial: () => void;
  // Phase 1 stubs for backward compatibility with legacy permission components
  hasPermission: (_permission: string) => boolean;
  permissions: string[];
  switchRole: (_role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthHook();

  const getAccessToken = (): string | null => {
    return auth.session?.access_token || null;
  };

  const refreshToken = async (): Promise<{ error: string | null }> => {
    return { error: null };
  };

  const isTokenExpired = (): boolean => {
    if (!auth.session?.expires_at) return true;

    const expiresAt = new Date(auth.session.expires_at * 1000);
    const now = new Date();

    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return expiresAt.getTime() - now.getTime() < bufferTime;
  };

  const contextValue: AuthContextType = {
    ...auth,
    getAccessToken,
    refreshToken,
    isTokenExpired,
    isTrial: auth.isTrial,
    startTrial: auth.startTrial,
    signUp: auth.signUp,
    // Permission checks based on user role and staff_permissions
    hasPermission: (permission: string) => {
      if (!auth.user) return false;
      if (auth.user.role === 'admin_master' || auth.user.role === 'admin') return true;
      return auth.user.staff_permissions?.[permission] === true;
    },
    permissions: auth.user?.staff_permissions
      ? Object.keys(auth.user.staff_permissions).filter(
          (k) => auth.user!.staff_permissions![k] === true
        )
      : [],
    switchRole: async (role: string) => {
      if (!auth.user) return;
      await auth.updateProfile({ role });
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

// Alias for backward compatibility with components importing useAuth
export const useAuth = useAuthContext;

export { AuthContext };
