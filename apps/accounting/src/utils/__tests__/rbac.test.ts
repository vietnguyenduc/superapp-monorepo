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
    it("returns true for admin_master with any permission", () => {
      expect(hasPermission("admin_master", "customers", "delete")).toBe(true);
      expect(hasPermission("admin_master", "users", "create")).toBe(true);
      expect(hasPermission("admin_master", "dashboard", "view")).toBe(true);
    });

    it("returns true for admin_company with appropriate permissions", () => {
      expect(hasPermission("admin_company", "customers", "view")).toBe(true);
      expect(hasPermission("admin_company", "customers", "create")).toBe(true);
      expect(hasPermission("admin_company", "customers", "edit")).toBe(true);
    });

    it("returns false for admin_company with restricted permissions", () => {
      expect(hasPermission("admin_company", "customers", "delete")).toBe(true);
      expect(hasPermission("admin_company", "users", "view")).toBe(true);
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
      expect(hasPermission("admin_master", "nonexistent", "action")).toBe(false);
      expect(hasPermission("staff", "customers", "nonexistent")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true if user has any of the specified permissions", () => {
      const permissions = [
        { resource: "customers", action: "delete" },
        { resource: "customers", action: "view" },
      ];

      expect(hasAnyPermission("admin_master", permissions)).toBe(true);
      expect(hasAnyPermission("admin_company", permissions)).toBe(true);
      expect(hasAnyPermission("staff", permissions)).toBe(true);
    });

    it("returns false if user has none of the specified permissions", () => {
      const permissions = [
        { resource: "users", action: "create" },
        { resource: "users", action: "delete" },
      ];

      expect(hasAnyPermission("admin_company", permissions)).toBe(true);
      expect(hasAnyPermission("staff", permissions)).toBe(false);
    });

    it("returns false for empty permissions array", () => {
      expect(hasAnyPermission("admin_master", [])).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true if user has all specified permissions", () => {
      const permissions = [
        { resource: "customers", action: "view" },
        { resource: "customers", action: "create" },
      ];

      expect(hasAllPermissions("admin_master", permissions)).toBe(true);
      expect(hasAllPermissions("admin_company", permissions)).toBe(true);
      expect(hasAllPermissions("staff", permissions)).toBe(false);
    });

    it("returns false if user lacks any of the specified permissions", () => {
      const permissions = [
        { resource: "customers", action: "view" },
        { resource: "customers", action: "delete" },
      ];

      expect(hasAllPermissions("admin_company", permissions)).toBe(true);
      expect(hasAllPermissions("staff", permissions)).toBe(false);
    });

    it("returns true for empty permissions array", () => {
      expect(hasAllPermissions("admin_master", [])).toBe(true);
    });
  });

  describe("getRolePermissions", () => {
    it("returns all permissions for admin_master role", () => {
      const permissions = getRolePermissions("admin_master");

      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.every((p) => p.roles.includes("admin_master"))).toBe(true);
    });

    it("returns appropriate permissions for admin_company role", () => {
      const permissions = getRolePermissions("admin_company");

      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.every((p) => p.roles.includes("admin_company"))).toBe(
        true,
      );

      // Should not include admin_master-only permissions
      const adminOnlyPermissions = permissions.filter(
        (p) =>
          (p.resource === "users" && p.action === "delete") ||
          p.resource === "companies" ||
          (p.resource === "settings" && p.action === "manage_system"),
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
    it("allows admin_master to access any branch", () => {
      expect(canAccessBranch("admin_master", "branch-1", "branch-2")).toBe(true);
      expect(canAccessBranch("admin_master", null, "branch-1")).toBe(true);
    });

    it("allows admin_company to access any branch", () => {
      expect(canAccessBranch("admin_company", "branch-1", "branch-1")).toBe(
        true,
      );
      expect(canAccessBranch("admin_company", "branch-1", "branch-2")).toBe(
        true,
      );
    });

    it("allows staff to access their own branch", () => {
      expect(canAccessBranch("staff", "branch-1", "branch-1")).toBe(true);
    });

    it("prevents staff from accessing other branches", () => {
      expect(canAccessBranch("staff", "branch-1", "branch-2")).toBe(false);
    });

    it("prevents access when user has no branch assigned", () => {
      expect(canAccessBranch("admin_company", null, "branch-1")).toBe(true);
      expect(canAccessBranch("staff", null, "branch-1")).toBe(false);
    });
  });

  describe("getAccessibleBranches", () => {
    const allBranches = [
      { id: "branch-1", name: "Branch 1", company_id: "company-1" },
      { id: "branch-2", name: "Branch 2", company_id: "company-1" },
      { id: "branch-3", name: "Branch 3", company_id: "company-2" },
    ];

    it("returns all branches for admin_master", () => {
      const accessible = getAccessibleBranches(
        "admin_master",
        "branch-1",
        "company-1",
        allBranches,
      );
      expect(accessible).toEqual(allBranches);
    });

    it("returns company branches for admin_company", () => {
      const accessible = getAccessibleBranches(
        "admin_company",
        "branch-2",
        "company-1",
        allBranches,
      );
      expect(accessible).toEqual([
        { id: "branch-1", name: "Branch 1", company_id: "company-1" },
        { id: "branch-2", name: "Branch 2", company_id: "company-1" },
      ]);
    });

    it("returns only user branch for staff", () => {
      const accessible = getAccessibleBranches(
        "staff",
        "branch-3",
        "company-2",
        allBranches,
      );
      expect(accessible).toEqual([{ id: "branch-3", name: "Branch 3", company_id: "company-2" }]);
    });

    it("returns empty array when user has no branch assigned", () => {
      const accessible = getAccessibleBranches(
        "staff",
        null,
        "company-1",
        allBranches,
      );
      expect(accessible).toEqual([]);
    });

    it("returns empty array when user branch not found", () => {
      const accessible = getAccessibleBranches(
        "staff",
        "nonexistent",
        "company-1",
        allBranches,
      );
      expect(accessible).toEqual([]);
    });
  });

  describe("isMenuItemVisible", () => {
    it("returns true for menu items without permissions", () => {
      const menuItem = { path: "/dashboard" };
      expect(isMenuItemVisible("admin_master", menuItem)).toBe(true);
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

      expect(isMenuItemVisible("admin_master", menuItem)).toBe(true);
      expect(isMenuItemVisible("admin_company", menuItem)).toBe(true);
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

      const user = { role: "admin_master" as UserRole };
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
      const permissions = usePermissions("admin_master");

      expect(typeof permissions.hasPermission).toBe("function");
      expect(typeof permissions.hasAnyPermission).toBe("function");
      expect(typeof permissions.hasAllPermissions).toBe("function");
      expect(typeof permissions.getRolePermissions).toBe("function");
      expect(typeof permissions.canAccessBranch).toBe("function");
    });

    it("hasPermission works correctly", () => {
      const permissions = usePermissions("admin_company");

      expect(permissions.hasPermission("customers", "view")).toBe(true);
      expect(permissions.hasPermission("users", "view")).toBe(true);
    });

    it("hasAnyPermission works correctly", () => {
      const permissions = usePermissions("staff");

      const testPermissions = [
        { resource: "customers", action: "view" },
        { resource: "customers", action: "create" },
      ];

      expect(permissions.hasAnyPermission(testPermissions)).toBe(true);
    });

    it("hasAllPermissions works correctly", () => {
      const permissions = usePermissions("staff");

      const testPermissions = [
        { resource: "customers", action: "view" },
        { resource: "customers", action: "create" },
      ];

      expect(permissions.hasAllPermissions(testPermissions)).toBe(false);
    });

    it("getRolePermissions works correctly", () => {
      const permissions = usePermissions("admin_master");
      const rolePermissions = permissions.getRolePermissions();

      expect(Array.isArray(rolePermissions)).toBe(true);
      expect(rolePermissions.every((p) => p.roles.includes("admin_master"))).toBe(
        true,
      );
    });

    it("canAccessBranch works correctly", () => {
      const permissions = usePermissions("admin_company");

      expect(permissions.canAccessBranch("branch-1", "branch-1")).toBe(true);
      expect(permissions.canAccessBranch("branch-1", "branch-2")).toBe(true);
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
      expect(dashboardView?.roles).toContain("admin_master");

      const customersDelete = PERMISSIONS.find(
        (p) => p.resource === "customers" && p.action === "delete",
      );
      expect(customersDelete).toBeDefined();
      expect(customersDelete?.roles).toEqual(["admin_master", "admin_company"]);
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
      expect(ROLE_HIERARCHY.admin_master).toBeDefined();
      expect(ROLE_HIERARCHY.admin_company).toBeDefined();
      expect(ROLE_HIERARCHY.staff).toBeDefined();
    });

    it("has correct role hierarchy", () => {
      expect(ROLE_HIERARCHY.admin_master).toContain("admin_master");
      expect(ROLE_HIERARCHY.admin_master).toContain("admin_company");
      expect(ROLE_HIERARCHY.admin_master).toContain("staff");

      expect(ROLE_HIERARCHY.admin_company).toContain("admin_company");
      expect(ROLE_HIERARCHY.admin_company).toContain("staff");
      expect(ROLE_HIERARCHY.admin_company).not.toContain("admin_master");

      expect(ROLE_HIERARCHY.staff).toContain("staff");
      expect(ROLE_HIERARCHY.staff).not.toContain("admin_master");
      expect(ROLE_HIERARCHY.staff).not.toContain("admin_company");
    });
  });
});
