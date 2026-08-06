import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@superapp/iam";

interface ProtectedRouteProps {
  children: ReactNode;
}

const isTrialPreview = () => {
  if (typeof window === "undefined") return false;
  return (
    new URLSearchParams(window.location.search).get("trial_preview") === "true" ||
    localStorage.getItem("framework-method-trial-preview") === "true"
  );
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuthContext();
  const location = useLocation();

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
