import React from "react";
import { vi } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canAccessBranch,
  getAccessibleBranches,
  isMenuItemVisible,
  withPermission,
  usePermissions,
  PERMISSIONS,
  ROLE_HIERARCHY,
} from "../rbac";
import type { UserRole } from "../../types";

describe("RBAC Utils", () => {
  describe("hasPermission", () => {
    it("returns true for admin with any permission", () => {
      expect(hasPermission("admin", "customers", "delete")).toBe(true);
      expect(hasPermission("admin", "users", "create")).toBe(true);
      expect(hasPermission("admin", "dashboard", "view")).toBe(true);
    });

    it("returns true for branch_manager with appropriate permissions", () => {
      expect(hasPermission("branch_manager", "customers", "view")).toBe(true);
      expect(hasPermission("branch_manager", "customers", "create")).toBe(true);
      expect(hasPermission("branch_manager", "customers", "edit")).toBe(true);
    });

    it("returns false for branch_manager with restricted permissions", () => {
      expect(hasPermission("branch_manager", "customers", "delete")).toBe(
        false,
      );
      expect(hasPermission("branch_manager", "users", "view")).toBe(false);
    });

    it("returns true for staff with basic permissions", () => {
      expect(hasPermission("staff", "customers", "view")).toBe(true);
      expect(hasPermission("staff", "transactions", "view")).toBe(true);
    });

    it("returns false for staff with restricted permissions", () => {
      expect(hasPermission("staff", "customers", "delete")).toBe(false);
      expect(hasPermission("staff", "users", "view")).toBe(false);
      expect(hasPermission("staff", "reports", "view")).toBe(false);
    });

    it("returns false for non-existent permissions", () => {
      expect(hasPermission("admin", "nonexistent", "action")).toBe(false);
      expect(hasPermission("staff", "customers", "nonexistent")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true if user has any of the specified permissions", () => {
      const permissions = [
        { resource: "customers", action: "delete" },
        { resource: "customers", action: "view" },
      ];

      expect(hasAnyPermission("admin", permissions)).toBe(true);
      expect(hasAnyPermission("branch_manager", permissions)).toBe(true);
      expect(hasAnyPermission("staff", permissions)).toBe(true);
    });

    it("returns false if user has none of the specified permissions", () => {
      const permissions = [
        { resource: "users", action: "create" },
        { resource: "users", action: "delete" },
      ];

      expect(hasAnyPermission("branch_manager", permissions)).toBe(false);
      expect(hasAnyPermission("staff", permissions)).toBe(false);
    });

    it("returns false for empty permissions array", () => {
      expect(hasAnyPermission("admin", [])).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true if user has all specified permissions", () => {
      const permissions = [
        { resource: "customers", action: "view" },
        { resource: "customers", action: "create" },
      ];

      expect(hasAllPermissions("admin", permissions)).toBe(true);
      expect(hasAllPermissions("branch_manager", permissions)).toBe(true);
      expect(hasAllPermissions("staff", permissions)).toBe(true);
    });

    it("returns false if user lacks any of the specified permissions", () => {
      const permissions = [
        { resource: "customers", action: "view" },
        { resource: "customers", action: "delete" },
      ];

      expect(hasAllPermissions("branch_manager", permissions)).toBe(false);
      expect(hasAllPermissions("staff", permissions)).toBe(false);
    });

    it("returns true for empty permissions array", () => {
      expect(hasAllPermissions("admin", [])).toBe(true);
    });
  });

  describe("getRolePermissions", () => {
    it("returns all permissions for admin role", () => {
      const permissions = getRolePermissions("admin");

      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.every((p) => p.roles.includes("admin"))).toBe(true);
    });

    it("returns appropriate permissions for branch_manager role", () => {
      const permissions = getRolePermissions("branch_manager");

      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.every((p) => p.roles.includes("branch_manager"))).toBe(
        true,
      );

      // Should not include admin-only permissions
      const adminOnlyPermissions = permissions.filter(
        (p) =>
          p.resource === "users" ||
          (p.resource === "customers" && p.action === "delete"),
      );
      expect(adminOnlyPermissions).toHaveLength(0);
    });

    it("returns basic permissions for staff role", () => {
      const permissions = getRolePermissions("staff");

      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.every((p) => p.roles.includes("staff"))).toBe(true);

      // Should not include restricted permissions
      const restrictedPermissions = permissions.filter(
        (p) =>
          p.resource === "users" ||
          p.resource === "reports" ||
          (p.resource === "customers" && p.action === "delete"),
      );
      expect(restrictedPermissions).toHaveLength(0);
    });
  });

  describe("canAccessBranch", () => {
    it("allows admin to access any branch", () => {
      expect(canAccessBranch("admin", "branch-1", "branch-2")).toBe(true);
      expect(canAccessBranch("admin", null, "branch-1")).toBe(true);
    });

    it("allows branch_manager to access their own branch", () => {
      expect(canAccessBranch("branch_manager", "branch-1", "branch-1")).toBe(
        true,
      );
    });

    it("prevents branch_manager from accessing other branches", () => {
      expect(canAccessBranch("branch_manager", "branch-1", "branch-2")).toBe(
        false,
      );
    });

    it("allows staff to access their own branch", () => {
      expect(canAccessBranch("staff", "branch-1", "branch-1")).toBe(true);
    });

    it("prevents staff from accessing other branches", () => {
      expect(canAccessBranch("staff", "branch-1", "branch-2")).toBe(false);
    });

    it("prevents access when user has no branch assigned", () => {
      expect(canAccessBranch("branch_manager", null, "branch-1")).toBe(false);
      expect(canAccessBranch("staff", null, "branch-1")).toBe(false);
    });
  });

  describe("getAccessibleBranches", () => {
    const allBranches = [
      { id: "branch-1", name: "Branch 1" },
      { id: "branch-2", name: "Branch 2" },
      { id: "branch-3", name: "Branch 3" },
    ];

    it("returns all branches for admin", () => {
      const accessible = getAccessibleBranches(
        "admin",
        "branch-1",
        allBranches,
      );
      expect(accessible).toEqual(allBranches);
    });

    it("returns only user branch for branch_manager", () => {
      const accessible = getAccessibleBranches(
        "branch_manager",
        "branch-2",
        allBranches,
      );
      expect(accessible).toEqual([{ id: "branch-2", name: "Branch 2" }]);
    });

    it("returns only user branch for staff", () => {
      const accessible = getAccessibleBranches(
        "staff",
        "branch-3",
        allBranches,
      );
      expect(accessible).toEqual([{ id: "branch-3", name: "Branch 3" }]);
    });

    it("returns empty array when user has no branch assigned", () => {
      const accessible = getAccessibleBranches(
        "branch_manager",
        null,
        allBranches,
      );
      expect(accessible).toEqual([]);
    });

    it("returns empty array when user branch not found", () => {
      const accessible = getAccessibleBranches(
        "branch_manager",
        "nonexistent",
        allBranches,
      );
      expect(accessible).toEqual([]);
    });
  });

  describe("isMenuItemVisible", () => {
    it("returns true for menu items without permissions", () => {
      const menuItem = { path: "/dashboard" };
      expect(isMenuItemVisible("admin", menuItem)).toBe(true);
      expect(isMenuItemVisible("staff", menuItem)).toBe(true);
    });

    it("returns true if user has any required permission", () => {
      const menuItem = {
        path: "/customers",
        permissions: [
          { resource: "customers", action: "view" },
          { resource: "customers", action: "delete" },
        ],
      };

      expect(isMenuItemVisible("admin", menuItem)).toBe(true);
      expect(isMenuItemVisible("branch_manager", menuItem)).toBe(true);
      expect(isMenuItemVisible("staff", menuItem)).toBe(true);
    });

    it("returns false if user has no required permissions", () => {
      const menuItem = {
        path: "/users",
        permissions: [
          { resource: "users", action: "view" },
          { resource: "users", action: "create" },
        ],
      };

      expect(isMenuItemVisible("branch_manager", menuItem)).toBe(false);
      expect(isMenuItemVisible("staff", menuItem)).toBe(false);
    });
  });

  describe("withPermission HOC", () => {
    const TestComponent = vi
      .fn()
      .mockReturnValue(React.createElement("div", null, "Test Component"));
    const FallbackComponent = vi
      .fn()
      .mockReturnValue(React.createElement("div", null, "Access Denied"));

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("renders component when user has all required permissions", () => {
      const ProtectedComponent = withPermission(TestComponent, [
        { resource: "customers", action: "view" },
      ]);

      const user = { role: "admin" as UserRole };
      const { render } = require("@testing-library/react");
      render(React.createElement(ProtectedComponent, { user }));

      expect(TestComponent).toHaveBeenCalledWith({ user }, {});
    });

    it("renders fallback when user lacks permissions", () => {
      const ProtectedComponent = withPermission(
        TestComponent,
        [{ resource: "users", action: "view" }],
        FallbackComponent,
      );

      const user = { role: "staff" as UserRole };
      const { render } = require("@testing-library/react");
      render(React.createElement(ProtectedComponent, { user }));

      expect(TestComponent).not.toHaveBeenCalled();
      expect(FallbackComponent).toHaveBeenCalled();
    });

    it("renders nothing when no fallback provided and user lacks permissions", () => {
      const ProtectedComponent = withPermission(TestComponent, [
        { resource: "users", action: "view" },
      ]);

      const user = { role: "staff" as UserRole };
      const { render } = require("@testing-library/react");
      const { container } = render(
        React.createElement(ProtectedComponent, { user }),
      );

      expect(TestComponent).not.toHaveBeenCalled();
      expect(container.firstChild).toBeNull();
    });

    it("renders fallback when no user provided", () => {
      const ProtectedComponent = withPermission(
        TestComponent,
        [{ resource: "customers", action: "view" }],
        FallbackComponent,
      );

      const { render } = require("@testing-library/react");
      render(React.createElement(ProtectedComponent));

      expect(TestComponent).not.toHaveBeenCalled();
      expect(FallbackComponent).toHaveBeenCalled();
    });
  });

  describe("usePermissions hook", () => {
    it("returns permission checking functions", () => {
      const permissions = usePermissions("admin");

      expect(typeof permissions.hasPermission).toBe("function");
      expect(typeof permissions.hasAnyPermission).toBe("function");
      expect(typeof permissions.hasAllPermissions).toBe("function");
      expect(typeof permissions.getRolePermissions).toBe("function");
      expect(typeof permissions.canAccessBranch).toBe("function");
    });

    it("hasPermission works correctly", () => {
      const permissions = usePermissions("branch_manager");

      expect(permissions.hasPermission("customers", "view")).toBe(true);
      expect(permissions.hasPermission("users", "view")).toBe(false);
    });

    it("hasAnyPermission works correctly", () => {
      const permissions = usePermissions("staff");

      const testPermissions = [
        { resource: "customers", action: "view" },
        { resource: "users", action: "view" },
      ];

      expect(permissions.hasAnyPermission(testPermissions)).toBe(true);
    });

    it("hasAllPermissions works correctly", () => {
      const permissions = usePermissions("staff");

      const testPermissions = [
        { resource: "customers", action: "view" },
        { resource: "users", action: "view" },
      ];

      expect(permissions.hasAllPermissions(testPermissions)).toBe(false);
    });

    it("getRolePermissions works correctly", () => {
      const permissions = usePermissions("admin");
      const rolePermissions = permissions.getRolePermissions();

      expect(Array.isArray(rolePermissions)).toBe(true);
      expect(rolePermissions.every((p) => p.roles.includes("admin"))).toBe(
        true,
      );
    });

    it("canAccessBranch works correctly", () => {
      const permissions = usePermissions("branch_manager");

      expect(permissions.canAccessBranch("branch-1", "branch-1")).toBe(true);
      expect(permissions.canAccessBranch("branch-1", "branch-2")).toBe(false);
    });
  });

  describe("PERMISSIONS constant", () => {
    it("contains all expected permissions", () => {
      expect(PERMISSIONS.length).toBeGreaterThan(0);

      // Check for specific permissions
      const dashboardView = PERMISSIONS.find(
        (p) => p.resource === "dashboard" && p.action === "view",
      );
      expect(dashboardView).toBeDefined();
      expect(dashboardView?.roles).toContain("admin");

      const customersDelete = PERMISSIONS.find(
        (p) => p.resource === "customers" && p.action === "delete",
      );
      expect(customersDelete).toBeDefined();
      expect(customersDelete?.roles).toEqual(["admin"]);
    });

    it("has valid permission structure", () => {
      PERMISSIONS.forEach((permission) => {
        expect(permission.resource).toBeDefined();
        expect(permission.action).toBeDefined();
        expect(Array.isArray(permission.roles)).toBe(true);
        expect(permission.roles.length).toBeGreaterThan(0);
      });
    });
  });

  describe("ROLE_HIERARCHY constant", () => {
    it("contains all user roles", () => {
      expect(ROLE_HIERARCHY.admin).toBeDefined();
      expect(ROLE_HIERARCHY.branch_manager).toBeDefined();
      expect(ROLE_HIERARCHY.staff).toBeDefined();
    });

    it("has correct role hierarchy", () => {
      expect(ROLE_HIERARCHY.admin).toContain("admin");
      expect(ROLE_HIERARCHY.admin).toContain("branch_manager");
      expect(ROLE_HIERARCHY.admin).toContain("staff");

      expect(ROLE_HIERARCHY.branch_manager).toContain("branch_manager");
      expect(ROLE_HIERARCHY.branch_manager).toContain("staff");
      expect(ROLE_HIERARCHY.branch_manager).not.toContain("admin");

      expect(ROLE_HIERARCHY.staff).toContain("staff");
      expect(ROLE_HIERARCHY.staff).not.toContain("admin");
      expect(ROLE_HIERARCHY.staff).not.toContain("branch_manager");
    });
  });
});
