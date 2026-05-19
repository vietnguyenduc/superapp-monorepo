import { describe, it, expect } from 'vitest';
import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions,
  getRoleDisplayName,
} from './UserRole';

function makeUser(role: UserRole, extraPermissions: Permission[] = []) {
  return {
    id: 'u1',
    username: 'test',
    email: 'test@test.com',
    fullName: 'Test User',
    role,
    permissions: [...getRolePermissions(role), ...extraPermissions],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
  };
}

describe('ROLE_PERMISSIONS', () => {
  it('ADMIN has all permissions', () => {
    const adminPerms = ROLE_PERMISSIONS[UserRole.ADMIN];
    const allPerms = Object.values(Permission);
    expect(adminPerms).toEqual(expect.arrayContaining(allPerms));
    expect(adminPerms.length).toBe(allPerms.length);
  });

  it('WAREHOUSE_KEEPER has limited permissions', () => {
    const perms = ROLE_PERMISSIONS[UserRole.WAREHOUSE_KEEPER];
    expect(perms).toContain(Permission.INVENTORY_INPUT_VIEW);
    expect(perms).toContain(Permission.INVENTORY_INPUT_CREATE);
    expect(perms).not.toContain(Permission.SYSTEM_ADMIN);
    expect(perms).not.toContain(Permission.USER_MANAGEMENT);
  });

  it('BUSINESS_OWNER has user management and audit', () => {
    const perms = ROLE_PERMISSIONS[UserRole.BUSINESS_OWNER];
    expect(perms).toContain(Permission.USER_MANAGEMENT);
    expect(perms).toContain(Permission.AUDIT_LOG_VIEW);
    expect(perms).toContain(Permission.SETTINGS_EDIT);
  });

  it('OPERATIONS_MANAGER can approve special outbound', () => {
    const perms = ROLE_PERMISSIONS[UserRole.OPERATIONS_MANAGER];
    expect(perms).toContain(Permission.SPECIAL_OUTBOUND_APPROVE);
    expect(perms).toContain(Permission.SPECIAL_OUTBOUND_REJECT);
    expect(perms).not.toContain(Permission.USER_MANAGEMENT);
  });

  it('WAREHOUSE_ACCOUNTANT can edit product catalog', () => {
    const perms = ROLE_PERMISSIONS[UserRole.WAREHOUSE_ACCOUNTANT];
    expect(perms).toContain(Permission.PRODUCT_CATALOG_EDIT);
    expect(perms).toContain(Permission.SALES_REPORT_CREATE);
  });

  it('no role has empty permissions', () => {
    Object.values(UserRole).forEach(role => {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    });
  });
});

describe('hasPermission', () => {
  it('returns true when permission exists', () => {
    const user = makeUser(UserRole.WAREHOUSE_KEEPER);
    expect(hasPermission(user, Permission.INVENTORY_INPUT_VIEW)).toBe(true);
  });

  it('returns false when permission missing', () => {
    const user = makeUser(UserRole.WAREHOUSE_KEEPER);
    expect(hasPermission(user, Permission.SYSTEM_ADMIN)).toBe(false);
  });

  it('works with extra permissions', () => {
    const user = makeUser(UserRole.WAREHOUSE_KEEPER, [Permission.SYSTEM_ADMIN]);
    expect(hasPermission(user, Permission.SYSTEM_ADMIN)).toBe(true);
  });
});

describe('getRolePermissions', () => {
  it('returns permissions for known role', () => {
    expect(getRolePermissions(UserRole.ADMIN).length).toBeGreaterThan(0);
  });

  it('returns empty array for unknown role', () => {
    expect(getRolePermissions('unknown' as UserRole)).toEqual([]);
  });
});

describe('getRoleDisplayName', () => {
  it('returns Vietnamese name for WAREHOUSE_KEEPER', () => {
    expect(getRoleDisplayName(UserRole.WAREHOUSE_KEEPER)).toBe('Thủ kho');
  });

  it('returns Vietnamese name for ADMIN', () => {
    expect(getRoleDisplayName(UserRole.ADMIN)).toBe('Quản trị viên');
  });

  it('falls back to role key for unknown', () => {
    expect(getRoleDisplayName('unknown' as UserRole)).toBe('unknown');
  });
});

describe('RBAC separation of duties', () => {
  it('warehouse keeper cannot approve special outbound', () => {
    const user = makeUser(UserRole.WAREHOUSE_KEEPER);
    expect(hasPermission(user, Permission.SPECIAL_OUTBOUND_APPROVE)).toBe(false);
  });

  it('operations manager can approve but cannot edit settings', () => {
    const user = makeUser(UserRole.OPERATIONS_MANAGER);
    expect(hasPermission(user, Permission.SPECIAL_OUTBOUND_APPROVE)).toBe(true);
    expect(hasPermission(user, Permission.SETTINGS_EDIT)).toBe(false);
  });

  it('business owner can do everything except system admin', () => {
    const user = makeUser(UserRole.BUSINESS_OWNER);
    expect(hasPermission(user, Permission.SYSTEM_ADMIN)).toBe(false);
    expect(hasPermission(user, Permission.USER_MANAGEMENT)).toBe(true);
  });
});
