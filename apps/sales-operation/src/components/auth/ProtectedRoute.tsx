import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@superapp/iam";
import { useCompany } from "@superapp/iam";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, isTrial } = useAuthContext();
  const { selectedCompany, loading: companyLoading } = useCompany();
  const location = useLocation();

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Trial users skip company selection — go straight to the app
  if (isTrial) {
    return <>{children}</>;
  }

  // Redirect to company selector if no company selected (unless already there)
  if (!selectedCompany && location.pathname !== "/company-selector") {
    return <Navigate to="/company-selector" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
