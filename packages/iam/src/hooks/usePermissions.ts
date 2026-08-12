import { useAuthContext } from "../contexts/AuthProvider";

export const usePermissions = () => {
  const { user } = useAuthContext();

  const hasAppAccess = (appName: string): boolean => {
    if (!user) return false;
    const permissions = (user as any).app_permissions || (user as any).app_metadata?.app_permissions;
    if (!permissions) return false;
    return !!permissions[appName];
  };

  const getRole = (): string | null => {
    return (user as any)?.role || (user as any)?.app_metadata?.role || null;
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
