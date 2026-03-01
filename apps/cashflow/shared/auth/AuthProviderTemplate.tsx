import React, { createContext, useContext } from "react";
import { useTemplateAuth, TemplateUser } from "./useTemplateAuth";

interface AuthContextType {
  user: TemplateUser | null;
  loading: boolean;
  error: string | null;
  isTrial: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  startTrial: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderTemplate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useTemplateAuth();

  const contextValue: AuthContextType = {
    ...auth,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuthTemplate = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthTemplate must be used within AuthProviderTemplate");
  return ctx;
};
