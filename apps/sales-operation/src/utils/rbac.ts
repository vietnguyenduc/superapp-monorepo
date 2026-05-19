import React from "react";

// Role definitions for inventory-operation
export type UserRole = "admin_master" | "admin_company" | "admin_branch" | "staff";

// Permission definitions
export interface Permission {
  resource: string;
  action: string;
  roles: UserRole[];
  requiresPermission?: string;
}

// Define permissions for different resources and actions for inventory operations
export const PERMISSIONS: Permission[] = [
  // Dashboard permissions
  {
    resource: "dashboard",
    action: "view",
    roles: ["admin_master", "admin_company", "admin_branch", "staff"],
  },
  {
    resource: "dashboard",
    action: "export",
    roles: ["admin_master", "admin_company"],
  },

  // Product permissions
  {
    resource: "products",
    action: "view",
    roles: ["admin_master", "admin_company", "admin_branch", "staff"],
  },
  {
    resource: "products",
    action: "create",
    roles: ["admin_master", "admin_company", "admin_branch"],
  },
  {
    resource: "products",
    action: "edit",
    roles: ["admin_master", "admin_company", "admin_branch"],
  },
  {
    resource: "products",
    action: "delete",
    roles: ["admin_master", "admin_company"],
  },
  {
    resource: "products",
    action: "export",
    roles: ["admin_master", "admin_company", "admin_branch"],
  },
  {
    resource: "products",
    action: "import",
    roles: ["admin_master", "admin_company", "admin_branch"],
    requiresPermission: "import_products",
  },
  {
    resource: "products",
    action: "manage",
    roles: ["admin_master", "admin_company"],
    requiresPermission: "manage_products",
  },

  // Inventory permissions
  {
    resource: "inventory",
    action: "view",
    roles: ["admin_master", "admin_company", "admin_branch", "staff"],
  },
  {
    resource: "inventory",
    action: "create",
    roles: ["admin_master", "admin_company", "admin_branch", "staff"],
  },
  {
    resource: "inventory",
    action: "edit",
    roles: ["admin_master", "admin_company", "admin_branch"],
  },
  {
    resource: "inventory",
    action: "delete",
    roles: ["admin_master", "admin_company"],
  },
  {
    resource: "inventory",
    action: "export",
    roles: ["admin_master", "admin_company", "admin_branch"],
  },
  {
    resource: "inventory",
    action: "import",
    roles: ["admin_master", "admin_company", "admin_branch"],
    requiresPermission: "import_inventory",
  },
  {
    resource: "inventory",
    action: "manage",
    roles: ["admin_master", "admin_company"],
    requiresPermission: "manage_inventory",
  },

  // Import permissions
  {
    resource: "import",
    action: "products",
    roles: ["admin_master", "admin_company", "admin_branch", "staff"],
  },
  {
    resource: "import",
    action: "inventory",
    roles: ["admin_master", "admin_company", "admin_branch", "staff"],
  },

  // User management permissions
  { resource: "users", action: "view", roles: ["admin_master", "admin_company", "admin_branch"] },
  { resource: "users", action: "create", roles: ["admin_master", "admin_company", "admin_branch"] },
  { resource: "users", action: "edit", roles: ["admin_master", "admin_company", "admin_branch"] },
  { resource: "users", action: "delete", roles: ["admin_master", "admin_company"] },
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

  // Warehouse permissions
  {
    resource: "warehouses",
    action: "view",
    roles: ["admin_master", "admin_company", "admin_branch"],
  },
  { resource: "warehouses", action: "create", roles: ["admin_master", "admin_company", "admin_branch"] },
  { resource: "warehouses", action: "edit", roles: ["admin_master", "admin_company", "admin_branch"] },
  { resource: "warehouses", action: "delete", roles: ["admin_master", "admin_company"] },

  // Reports permissions
  { resource: "reports", action: "view", roles: ["admin_master", "admin_company", "admin_branch"] },
  { resource: "reports", action: "export", roles: ["admin_master", "admin_company", "admin_branch"] },
  { resource: "reports", action: "schedule", roles: ["admin_master", "admin_company"] },

  // Settings permissions
  { resource: "settings", action: "manage_system", roles: ["admin_master"] },
  { resource: "settings", action: "manage_company", roles: ["admin_master", "admin_company"] },
  { resource: "settings", action: "manage_branch", roles: ["admin_master", "admin_company", "admin_branch"] },
];

// Role hierarchy (higher roles inherit permissions from lower roles)
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  admin_master: ["admin_master", "admin_company", "admin_branch", "staff"],
  admin_company: ["admin_company", "admin_branch", "staff"],
  admin_branch: ["admin_branch", "staff"],
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

  // Admin Branch can access all branches in their company
  if (userRole === "admin_branch") return true;

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

  // Admin Company, Admin Branch, and Staff can only access their own company
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

  if (userRole === "admin_company" || userRole === "admin_branch") {
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
    canAccessCompany: (userCompanyId: string | null, targetCompanyId: string) =>
      canAccessCompany(userRole, userCompanyId, targetCompanyId),
  };
};
