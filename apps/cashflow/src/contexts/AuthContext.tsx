import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  updateProfile: (
    updates: Partial<User>,
  ) => Promise<{ data?: User; error: string | null }>;
  clearError: () => void;
  isAuthenticated: boolean;
  // JWT token management
  getAccessToken: () => string | null;
  refreshToken: () => Promise<{ error: string | null }>;
  isTokenExpired: () => boolean;
  isTrial: boolean;
  startTrial: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  // JWT token management functions
  const getAccessToken = (): string | null => {
    return auth.session?.access_token || null;
  };

  const refreshToken = async (): Promise<{ error: string | null }> => {
    // Supabase JS v2 handles refresh internally; exposing a helper for API symmetry
    return { error: null };
  };

  const isTokenExpired = (): boolean => {
    if (!auth.session?.expires_at) return true;

    const expiresAt = new Date(auth.session.expires_at * 1000);
    const now = new Date();

    // Consider token expired if it expires within 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return expiresAt.getTime() - now.getTime() < bufferTime;
  };

  const contextValue: AuthContextType = {
    ...auth,
    getAccessToken,
    refreshToken,
    isTokenExpired,
    isTrial: auth.isTrial,
    startTrial: auth.startTrial,
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

// Export the context for testing purposes
export { AuthContext };
