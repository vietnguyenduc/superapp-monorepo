import React from "react";
import type { UserRole } from "../types";

// Permission definitions
export interface Permission {
  resource: string;
  action: string;
  roles: UserRole[];
}

// Define permissions for different resources and actions
export const PERMISSIONS: Permission[] = [
  // Dashboard permissions
  {
    resource: "dashboard",
    action: "view",
    roles: ["admin_master", "admin_company", "staff"],
  },
  {
    resource: "dashboard",
    action: "export",
    roles: ["admin_master", "admin_company"],
  },

  // Customer permissions
  {
    resource: "customers",
    action: "view",
    roles: ["admin_master", "admin_company", "staff"],
  },
  {
    resource: "customers",
    action: "create",
    roles: ["admin_master", "admin_company"],
  },
  {
    resource: "customers",
    action: "edit",
    roles: ["admin_master", "admin_company"],
  },
  {
    resource: "customers",
    action: "delete",
    roles: ["admin_master", "admin_company"],
  },
  {
    resource: "customers",
    action: "export",
    roles: ["admin_master", "admin_company"],
  },
  {
    resource: "customers",
    action: "import",
    roles: ["admin_master", "admin_company"],
    requiresPermission: "import_customers",
  },
  {
    resource: "customers",
    action: "manage",
    roles: ["admin_master", "admin_company"],
    requiresPermission: "manage_customers",
  },

  // Transaction permissions
  {
    resource: "transactions",
    action: "view",
    roles: ["admin_master", "admin_company", "staff"],
  },
  {
    resource: "transactions",
    action: "create",
    roles: ["admin_master", "admin_company", "staff"],
  },
  {
    resource: "transactions",
    action: "edit",
    roles: ["admin_master", "admin_company"],
  },
  {
    resource: "transactions",
    action: "delete",
    roles: ["admin_master", "admin_company"],
  },
  {
    resource: "transactions",
    action: "export",
    roles: ["admin_master", "admin_company"],
  },
  {
    resource: "transactions",
    action: "import",
    roles: ["admin_master", "admin_company"],
    requiresPermission: "import_transactions",
  },
  {
    resource: "transactions",
    action: "add_only",
    roles: ["admin_master", "admin_company", "staff"],
    requiresPermission: "add_transaction_only",
  },
  {
    resource: "transactions",
    action: "no_edit",
    roles: ["admin_master", "admin_company", "staff"],
    requiresPermission: "no_edit_transaction",
  },
  {
    resource: "transactions",
    action: "manage",
    roles: ["admin_master", "admin_company"],
    requiresPermission: "manage_transactions",
  },

  // Import permissions
  {
    resource: "import",
    action: "transactions",
    roles: ["admin_master", "admin_company", "staff"],
  },
  {
    resource: "import",
    action: "customers",
    roles: ["admin_master", "admin_company", "staff"],
  },

  // User management permissions
  { resource: "users", action: "view", roles: ["admin_master", "admin_company"] },
  { resource: "users", action: "create", roles: ["admin_master", "admin_company"] },
  { resource: "users", action: "edit", roles: ["admin_master", "admin_company"] },
  { resource: "users", action: "delete", roles: ["admin_master"] },
  { resource: "users", action: "create_any_role", roles: ["admin_master"] },

  // Company management permissions
  { resource: "companies", action: "view", roles: ["admin_master"] },
  { resource: "companies", action: "create", roles: ["admin_master"] },
  { resource: "companies", action: "edit", roles: ["admin_master"] },
  { resource: "companies", action: "delete", roles: ["admin_master"] },
  { resource: "companies", action: "view_all", roles: ["admin_master"] },

  // Branch management permissions
  { resource: "branches", action: "view", roles: ["admin_master", "admin_company"] },
  { resource: "branches", action: "create", roles: ["admin_master", "admin_company"] },
  { resource: "branches", action: "edit", roles: ["admin_master", "admin_company"] },
  { resource: "branches", action: "delete", roles: ["admin_master"] },
  { resource: "branches", action: "view_all", roles: ["admin_master", "admin_company"] },

  // Bank account permissions
  {
    resource: "bank_accounts",
    action: "view",
    roles: ["admin_master", "admin_company"],
  },
  { resource: "bank_accounts", action: "create", roles: ["admin_master", "admin_company"] },
  { resource: "bank_accounts", action: "edit", roles: ["admin_master", "admin_company"] },
  { resource: "bank_accounts", action: "delete", roles: ["admin_master", "admin_company"] },

  // Reports permissions
  { resource: "reports", action: "view", roles: ["admin_master", "admin_company"] },
  { resource: "reports", action: "export", roles: ["admin_master", "admin_company"] },
  { resource: "reports", action: "schedule", roles: ["admin_master"] },
  
  // Settings permissions
  { resource: "settings", action: "manage_system", roles: ["admin_master"] },
  { resource: "settings", action: "manage_company", roles: ["admin_master", "admin_company"] },
];

// Role hierarchy (higher roles inherit permissions from lower roles)
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  admin_master: ["admin_master", "admin_company", "staff"],
  admin_company: ["admin_company", "staff"],
  staff: ["staff"],
};

// Check if a user has permission for a specific resource and action
export const hasPermission = (
  userRole: UserRole,
  resource: string,
  action: string,
): boolean => {
  const permission = PERMISSIONS.find(
    (p) => p.resource === resource && p.action === action,
  );

  if (!permission) return false;

  // Check if user's role is in the allowed roles
  return permission.roles.includes(userRole);
};

// Check if a user has any of the specified permissions
export const hasAnyPermission = (
  userRole: UserRole,
  permissions: Array<{ resource: string; action: string }>,
): boolean => {
  return permissions.some(({ resource, action }) =>
    hasPermission(userRole, resource, action),
  );
};

// Check if a user has all of the specified permissions
export const hasAllPermissions = (
  userRole: UserRole,
  permissions: Array<{ resource: string; action: string }>,
): boolean => {
  return permissions.every(({ resource, action }) =>
    hasPermission(userRole, resource, action),
  );
};

// Get all permissions for a specific role
export const getRolePermissions = (userRole: UserRole): Permission[] => {
  return PERMISSIONS.filter((permission) =>
    permission.roles.includes(userRole),
  );
};

// Check if user can access a specific branch (for branch-specific data)
export const canAccessBranch = (
  userRole: UserRole,
  userBranchId: string | null,
  targetBranchId: string,
): boolean => {
  // Admin Master can access all branches
  if (userRole === "admin_master") return true;

  // Admin Company can access all branches in their company
  if (userRole === "admin_company") return true;

  // Staff can only access their own branch
  return userBranchId === targetBranchId;
};

// Check if user can access a specific company
export const canAccessCompany = (
  userRole: UserRole,
  userCompanyId: string | null,
  targetCompanyId: string,
): boolean => {
  // Admin Master can access all companies
  if (userRole === "admin_master") return true;

  // Admin Company and Staff can only access their own company
  return userCompanyId === targetCompanyId;
};

// Get accessible branches for a user
export const getAccessibleBranches = (
  userRole: UserRole,
  userBranchId: string | null,
  userCompanyId: string | null,
  allBranches: Array<{ id: string; name: string; company_id: string }>,
): Array<{ id: string; name: string }> => {
  if (userRole === "admin_master") {
    return allBranches;
  }

  if (userRole === "admin_company") {
    return allBranches.filter((branch) => branch.company_id === userCompanyId);
  }

  return allBranches.filter((branch) => branch.id === userBranchId);
};

// Menu item visibility based on permissions
export const isMenuItemVisible = (
  userRole: UserRole,
  menuItem: {
    path: string;
    permissions?: Array<{ resource: string; action: string }>;
  },
): boolean => {
  if (!menuItem.permissions) return true;

  return hasAnyPermission(userRole, menuItem.permissions);
};

// Component-level permission check
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermissions: Array<{ resource: string; action: string }>,
  FallbackComponent?: React.ComponentType,
) => {
  return (props: P & { user?: { role: UserRole } }) => {
    const { user } = props;

    if (!user) {
      return FallbackComponent ? React.createElement(FallbackComponent) : null;
    }

    const hasAccess = hasAllPermissions(user.role, requiredPermissions);

    if (!hasAccess) {
      return FallbackComponent ? React.createElement(FallbackComponent) : null;
    }

    return React.createElement(WrappedComponent, props);
  };
};

// Hook for permission checking
export const usePermissions = (userRole: UserRole) => {
  return {
    hasPermission: (resource: string, action: string) =>
      hasPermission(userRole, resource, action),
    hasAnyPermission: (
      permissions: Array<{ resource: string; action: string }>,
    ) => hasAnyPermission(userRole, permissions),
    hasAllPermissions: (
      permissions: Array<{ resource: string; action: string }>,
    ) => hasAllPermissions(userRole, permissions),
    getRolePermissions: () => getRolePermissions(userRole),
    canAccessBranch: (userBranchId: string | null, targetBranchId: string) =>
      canAccessBranch(userRole, userBranchId, targetBranchId),
  };
};
