import { useAuthContext } from "../contexts/AuthProvider";

export const usePermissions = () => {
  const { user } = useAuthContext();
  
  const hasAppAccess = (appName: string): boolean => {
    // Expected structure in JWT app_metadata or user_metadata
    // For now we assume custom claims are injected into user.app_metadata.app_permissions
    if (!user) return false;
    const permissions = (user as any).app_metadata?.app_permissions;
    if (!permissions) return false;
    return !!permissions[appName];
  };

  const getRole = (): string | null => {
    return (user as any)?.app_metadata?.role || null;
  };

  const isRole = (role: string): boolean => {
    return getRole() === role;
  };

  return {
    hasAppAccess,
    getRole,
    isRole
  };
};
