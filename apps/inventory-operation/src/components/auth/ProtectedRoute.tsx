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

  // Safety timeout: if loading exceeds 4s, force-render to prevent infinite spinner
  const [forceRender, setForceRender] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => {
      setForceRender(true);
      console.warn("ProtectedRoute: force-rendering after 4s timeout (auth/company loading stalled)");
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  // 1. Wait for IAM Auth to initialize
  if (loading && !forceRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 2. If Auth finished but user is not logged in, boot them to login immediately!
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Trial users skip company selection — go straight to the app
  if (isTrial) {
    return <>{children}</>;
  }

  // 4. Now that we know user is authenticated and not trial, wait for Company data
  if (companyLoading && !forceRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to company selector if no company selected (unless already there)
  if (!selectedCompany && location.pathname !== "/company-selector") {
    return <Navigate to="/company-selector" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
