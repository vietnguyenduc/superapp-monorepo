import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@superapp/iam";

interface ProtectedRouteProps {
  children: ReactNode;
}

const isTrialPreview = () => {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("trial_preview") === "true") return true;
  if (localStorage.getItem("framework-method-trial-preview") === "true") return true;
  if (localStorage.getItem("superapp_trial_mode")) return true;
  const raw = localStorage.getItem("cashflow_trial_user");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return !!parsed?.user;
    } catch {
      return false;
    }
  }
  return false;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated && !isTrialPreview()) {
    return <Navigate to="/login" replace />;
  }

  // Persist trial flag across navigation
  if (isTrialPreview()) {
    localStorage.setItem("framework-method-trial-preview", "true");
  }

  return <>{children}</>;
};

export default ProtectedRoute;
