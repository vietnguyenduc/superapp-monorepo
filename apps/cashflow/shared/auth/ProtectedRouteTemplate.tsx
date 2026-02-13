import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthTemplate } from "./AuthProviderTemplate";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

const ProtectedRouteTemplate: React.FC<ProtectedRouteProps> = ({
  children,
  fallbackPath = "/login",
}) => {
  const { isAuthenticated, loading } = useAuthTemplate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRouteTemplate;
