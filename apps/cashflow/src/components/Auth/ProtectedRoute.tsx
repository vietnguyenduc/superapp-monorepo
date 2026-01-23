import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { hasPermission } from "../../utils/rbac";
import { UserRole } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Array<{ resource: string; action: string }>;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
  fallbackPath = "/login",
}) => {
  const { user, loading, isAuthenticated } = useAuthContext();

  // Debug logging
  console.log("ProtectedRoute", { loading, isAuthenticated, user });

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check role requirement
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permissions
  if (requiredPermissions.length > 0 && user) {
    const hasAllRequiredPermissions = requiredPermissions.every(
      ({ resource, action }) => hasPermission(user.role, resource, action),
    );

    if (!hasAllRequiredPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
