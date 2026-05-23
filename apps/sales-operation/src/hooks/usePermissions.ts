import { useAuthContext } from '@superapp/iam';

/**
 * Custom hook for checking inventory-specific permissions
 * Uses staff_permissions from user record
 */
export const usePermissions = () => {
  const { user, hasPermission: hasAuthPermission } = useAuthContext();

  /**
   * Check if user has a specific inventory permission
   */
  const canImportProducts = () => {
    if (!user) return false;
    if (user.role === 'admin_master' || user.role === 'admin') return true;
    return user.staff_permissions?.import_products === true;
  };

  const canImportInventory = () => {
    if (!user) return false;
    if (user.role === 'admin_master' || user.role === 'admin') return true;
    return user.staff_permissions?.import_inventory === true;
  };

  const canViewReports = () => {
    if (!user) return false;
    if (user.role === 'admin_master' || user.role === 'admin') return true;
    return user.staff_permissions?.view_reports === true;
  };

  const canManageSettings = () => {
    if (!user) return false;
    if (user.role === 'admin_master' || user.role === 'admin') return true;
    return user.staff_permissions?.manage_settings === true;
  };

  /**
   * Check if user can perform specific inventory operations
   */
  const canCreateProducts = () => {
    if (!user) return false;
    if (user.role === 'admin_master' || user.role === 'admin') return true;
    return user.staff_permissions?.create_products === true;
  };

  const canEditProducts = () => {
    if (!user) return false;
    if (user.role === 'admin_master' || user.role === 'admin') return true;
    return user.staff_permissions?.edit_products === true;
  };

  const canDeleteProducts = () => {
    if (!user) return false;
    if (user.role === 'admin_master' || user.role === 'admin') return true;
    return user.staff_permissions?.delete_products === true;
  };

  const canCreateInventory = () => {
    if (!user) return false;
    if (user.role === 'admin_master' || user.role === 'admin') return true;
    return user.staff_permissions?.create_inventory === true;
  };

  const canEditInventory = () => {
    if (!user) return false;
    if (user.role === 'admin_master' || user.role === 'admin') return true;
    return user.staff_permissions?.edit_inventory === true;
  };

  const canDeleteInventory = () => {
    if (!user) return false;
    if (user.role === 'admin_master' || user.role === 'admin') return true;
    return user.staff_permissions?.delete_inventory === true;
  };

  /**
   * Check if user has app-level access to inventory
   */
  const hasInventoryAppAccess = () => {
    if (!user) return false;
    return user.app_permissions?.inventory === true;
  };

  return {
    user,
    canImportProducts,
    canImportInventory,
    canViewReports,
    canManageSettings,
    canCreateProducts,
    canEditProducts,
    canDeleteProducts,
    canCreateInventory,
    canEditInventory,
    canDeleteInventory,
    hasInventoryAppAccess,
    hasAuthPermission,
  };
};
