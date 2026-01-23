import React from "react";
import { UserRole } from "../types";

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
    roles: ["admin", "branch_manager", "staff"],
  },
  {
    resource: "dashboard",
    action: "export",
    roles: ["admin", "branch_manager"],
  },

  // Customer permissions
  {
    resource: "customers",
    action: "view",
    roles: ["admin", "branch_manager", "staff"],
  },
  {
    resource: "customers",
    action: "create",
    roles: ["admin", "branch_manager", "staff"],
  },
  {
    resource: "customers",
    action: "edit",
    roles: ["admin", "branch_manager", "staff"],
  },
  { resource: "customers", action: "delete", roles: ["admin"] },
  {
    resource: "customers",
    action: "export",
    roles: ["admin", "branch_manager"],
  },

  // Transaction permissions
  {
    resource: "transactions",
    action: "view",
    roles: ["admin", "branch_manager", "staff"],
  },
  {
    resource: "transactions",
    action: "create",
    roles: ["admin", "branch_manager", "staff"],
  },
  {
    resource: "transactions",
    action: "edit",
    roles: ["admin", "branch_manager"],
  },
  { resource: "transactions", action: "delete", roles: ["admin"] },
  {
    resource: "transactions",
    action: "export",
    roles: ["admin", "branch_manager"],
  },

  // Import permissions
  {
    resource: "import",
    action: "transactions",
    roles: ["admin", "branch_manager", "staff"],
  },
  {
    resource: "import",
    action: "customers",
    roles: ["admin", "branch_manager"],
  },

  // User management permissions
  { resource: "users", action: "view", roles: ["admin"] },
  { resource: "users", action: "create", roles: ["admin"] },
  { resource: "users", action: "edit", roles: ["admin"] },
  { resource: "users", action: "delete", roles: ["admin"] },

  // Branch management permissions
  { resource: "branches", action: "view", roles: ["admin", "branch_manager"] },
  { resource: "branches", action: "create", roles: ["admin"] },
  { resource: "branches", action: "edit", roles: ["admin"] },
  { resource: "branches", action: "delete", roles: ["admin"] },

  // Bank account permissions
  {
    resource: "bank_accounts",
    action: "view",
    roles: ["admin", "branch_manager"],
  },
  { resource: "bank_accounts", action: "create", roles: ["admin"] },
  { resource: "bank_accounts", action: "edit", roles: ["admin"] },
  { resource: "bank_accounts", action: "delete", roles: ["admin"] },

  // Reports permissions
  { resource: "reports", action: "view", roles: ["admin", "branch_manager"] },
  { resource: "reports", action: "export", roles: ["admin", "branch_manager"] },
  { resource: "reports", action: "schedule", roles: ["admin"] },
];

// Role hierarchy (higher roles inherit permissions from lower roles)
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  admin: ["admin", "branch_manager", "staff"],
  branch_manager: ["branch_manager", "staff"],
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
  // Admin can access all branches
  if (userRole === "admin") return true;

  // Branch manager and staff can only access their own branch
  return userBranchId === targetBranchId;
};

// Get accessible branches for a user
export const getAccessibleBranches = (
  userRole: UserRole,
  userBranchId: string | null,
  allBranches: Array<{ id: string; name: string }>,
): Array<{ id: string; name: string }> => {
  if (userRole === "admin") {
    return allBranches;
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
export const withPermission = (
  WrappedComponent: React.ComponentType<any>,
  requiredPermissions: Array<{ resource: string; action: string }>,
  FallbackComponent?: React.ComponentType<any>,
) => {
  return (props: any) => {
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
