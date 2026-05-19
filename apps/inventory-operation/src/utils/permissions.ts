// Granular permission checking utility for inventory operations
import type { UserRole } from "./rbac";

interface UserPermissions {
  products?: {
    import_own?: boolean;
    manage_all?: boolean;
  };
  inventory?: {
    import_own?: boolean;
    manage_all?: boolean;
  };
  settings?: {
    edit_general?: boolean;
    branches?: boolean;
    warehouses?: boolean;
    product_categories?: boolean;
    color_settings?: boolean;
    reports?: boolean;
  };
  reports?: {
    view?: boolean;
  };
}

// Type for user with local permissions for type safety in this file
type User = {
  id: string;
  role: UserRole;
  staff_permissions?: UserPermissions;
  can_delete?: boolean;
  company_id?: string | null;
  branch_id?: string | null;
};

// Centralized admin-role check. Returns true for any of: admin_master, admin_company, admin_branch.
export function isAdmin(user?: { role?: string } | null): boolean {
  if (!user?.role) return false;
  return user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch";
}

// Check if user can import products (create and edit their own)
export function canImportProducts(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;
  return Boolean(user.staff_permissions?.products?.import_own);
}

// Check if user can manage all products (edit/delete any product)
export function canManageAllProducts(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;
  return Boolean(user.staff_permissions?.products?.manage_all);
}

// Check if user can edit a specific product (own or all)
export function canEditProduct(user: User, productCreatedBy?: string): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;

  const canManageAll = Boolean(user.staff_permissions?.products?.manage_all);
  const canImportOwn = Boolean(user.staff_permissions?.products?.import_own);

  // If can manage all, can edit any product
  if (canManageAll) return true;

  // If can only import own, can edit only own products
  if (canImportOwn) {
    return productCreatedBy === user.id;
  }

  return false;
}

// Check if user can delete a specific product
export function canDeleteProduct(user: User): boolean {
  if (!user) return false;
  if (!user.can_delete) return false;
  if (user.role === "admin_master" || user.role === "admin_company") return true;
  return Boolean(user.staff_permissions?.products?.manage_all);
}

// Check if user can import inventory (create and edit their own)
export function canImportInventory(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;
  return Boolean(user.staff_permissions?.inventory?.import_own);
}

// Check if user can manage all inventory (edit/delete any inventory)
export function canManageAllInventory(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;
  return Boolean(user.staff_permissions?.inventory?.manage_all);
}

// Check if user can edit a specific inventory record (own or all)
export function canEditInventory(user: User, inventoryCreatedBy?: string): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;

  const canManageAll = Boolean(user.staff_permissions?.inventory?.manage_all);
  const canImportOwn = Boolean(user.staff_permissions?.inventory?.import_own);

  // If can manage all, can edit any inventory
  if (canManageAll) return true;

  // If can only import own, can edit only own inventory
  if (canImportOwn) {
    return inventoryCreatedBy === user.id;
  }

  return false;
}

// Check if user can delete a specific inventory record
export function canDeleteInventory(user: User): boolean {
  if (!user) return false;
  if (!user.can_delete) return false;
  if (user.role === "admin_master" || user.role === "admin_company") return true;
  return Boolean(user.staff_permissions?.inventory?.manage_all);
}

// Check if user can edit general settings
export function canEditGeneralSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;
  return Boolean(user.staff_permissions?.settings?.edit_general);
}

// Check if user can edit branch settings
export function canEditBranchSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company") return true;
  return Boolean(user.staff_permissions?.settings?.branches);
}

// Check if user can edit warehouse settings
export function canEditWarehouseSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;
  return Boolean(user.staff_permissions?.settings?.warehouses);
}

// Check if user can edit product category settings
export function canEditProductCategorySettings(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;
  return Boolean(user.staff_permissions?.settings?.product_categories);
}

// Check if user can edit color settings
export function canEditColorSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;
  return Boolean(user.staff_permissions?.settings?.color_settings);
}

// Check if user can edit report settings
export function canEditReportSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company") return true;
  return Boolean(user.staff_permissions?.settings?.reports);
}

// Check if user can view reports
export function canViewReports(user: User): boolean {
  if (!user) return false;
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") return true;
  return Boolean(user.staff_permissions?.reports?.view);
}

// Check if user can access Settings tab (Accounts and Permissions)
// Only admin_master and admin_company can access this
export function canAccessAccountsAndPermissions(user: User): boolean {
  if (!user) return false;
  return user.role === "admin_master" || user.role === "admin_company";
}

// Check if user can revert a specific table from backup
// Admins can revert any table, staff can only revert tables they have permission for
export function canRevertTable(user: User, tableName: string): boolean {
  if (!user) return false;

  // Admins can revert any table
  if (user.role === "admin_master" || user.role === "admin_company" || user.role === "admin_branch") {
    return true;
  }

  // Check granular permissions for staff
  const permissions = user.staff_permissions;

  switch (tableName) {
    case "products":
      return Boolean(permissions?.products?.import_own || permissions?.products?.manage_all);
    case "inventory":
      return Boolean(permissions?.inventory?.import_own || permissions?.inventory?.manage_all);
    case "warehouses":
      return Boolean(permissions?.settings?.warehouses);
    case "branches":
      return Boolean(permissions?.settings?.branches);
    case "product_categories":
      return Boolean(permissions?.settings?.product_categories);
    default:
      return false;
  }
}

// Check if user can restore full backup
// Only admin_master and admin_company can restore full backups
export function canRestoreFullBackup(user: User): boolean {
  if (!user) return false;
  return user.role === "admin_master" || user.role === "admin_company";
}
