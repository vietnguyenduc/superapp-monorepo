import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';

// Mock @superapp/iam
vi.mock('@superapp/iam', () => ({
  useAuthContext: vi.fn(),
}));

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false for all permissions when user is null', async () => {
    const { useAuthContext } = await import('@superapp/iam');
    (useAuthContext as any).mockReturnValue({ user: null, hasPermission: vi.fn() });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canImportProducts()).toBe(false);
    expect(result.current.canImportInventory()).toBe(false);
    expect(result.current.canViewReports()).toBe(false);
    expect(result.current.canManageSettings()).toBe(false);
    expect(result.current.canCreateProducts()).toBe(false);
    expect(result.current.canEditProducts()).toBe(false);
    expect(result.current.canDeleteProducts()).toBe(false);
    expect(result.current.canCreateInventory()).toBe(false);
    expect(result.current.canEditInventory()).toBe(false);
    expect(result.current.canDeleteInventory()).toBe(false);
    expect(result.current.hasInventoryAppAccess()).toBe(false);
  });

  it('returns true for all permissions when user is admin_master', async () => {
    const { useAuthContext } = await import('@superapp/iam');
    (useAuthContext as any).mockReturnValue({
      user: { role: 'admin_master', staff_permissions: {}, app_permissions: { inventory: true } },
      hasPermission: vi.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canImportProducts()).toBe(true);
    expect(result.current.canImportInventory()).toBe(true);
    expect(result.current.canViewReports()).toBe(true);
    expect(result.current.canManageSettings()).toBe(true);
    expect(result.current.canCreateProducts()).toBe(true);
    expect(result.current.canEditProducts()).toBe(true);
    expect(result.current.canDeleteProducts()).toBe(true);
    expect(result.current.canCreateInventory()).toBe(true);
    expect(result.current.canEditInventory()).toBe(true);
    expect(result.current.canDeleteInventory()).toBe(true);
    expect(result.current.hasInventoryAppAccess()).toBe(true);
  });

  it('returns true for all permissions when user is admin', async () => {
    const { useAuthContext } = await import('@superapp/iam');
    (useAuthContext as any).mockReturnValue({
      user: { role: 'admin', staff_permissions: {}, app_permissions: { inventory: true } },
      hasPermission: vi.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canImportProducts()).toBe(true);
    expect(result.current.canCreateProducts()).toBe(true);
    expect(result.current.canDeleteInventory()).toBe(true);
  });

  it('respects staff_permissions for non-admin users', async () => {
    const { useAuthContext } = await import('@superapp/iam');
    (useAuthContext as any).mockReturnValue({
      user: {
        role: 'staff',
        staff_permissions: {
          import_products: true,
          create_products: true,
          view_reports: true,
          create_inventory: true,
        },
        app_permissions: { inventory: true },
      },
      hasPermission: vi.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    // Permissions with true
    expect(result.current.canImportProducts()).toBe(true);
    expect(result.current.canCreateProducts()).toBe(true);
    expect(result.current.canViewReports()).toBe(true);
    expect(result.current.canCreateInventory()).toBe(true);

    // Permissions with false (not in staff_permissions)
    expect(result.current.canImportInventory()).toBe(false);
    expect(result.current.canEditProducts()).toBe(false);
    expect(result.current.canDeleteProducts()).toBe(false);
    expect(result.current.canEditInventory()).toBe(false);
    expect(result.current.canDeleteInventory()).toBe(false);
    expect(result.current.canManageSettings()).toBe(false);
  });

  it('hasInventoryAppAccess checks app_permissions.inventory', async () => {
    const { useAuthContext } = await import('@superapp/iam');

    // With inventory access
    (useAuthContext as any).mockReturnValue({
      user: { role: 'staff', staff_permissions: {}, app_permissions: { inventory: true } },
      hasPermission: vi.fn(),
    });

    const { result: result1 } = renderHook(() => usePermissions());
    expect(result1.current.hasInventoryAppAccess()).toBe(true);

    // Without inventory access
    (useAuthContext as any).mockReturnValue({
      user: { role: 'staff', staff_permissions: {}, app_permissions: { inventory: false } },
      hasPermission: vi.fn(),
    });

    const { result: result2 } = renderHook(() => usePermissions());
    expect(result2.current.hasInventoryAppAccess()).toBe(false);
  });

  it('exposes hasAuthPermission from context', async () => {
    const mockHasPermission = vi.fn();
    const { useAuthContext } = await import('@superapp/iam');
    (useAuthContext as any).mockReturnValue({
      user: { role: 'staff', staff_permissions: {}, app_permissions: {} },
      hasPermission: mockHasPermission,
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasAuthPermission).toBe(mockHasPermission);
  });

  it('returns user from context', async () => {
    const mockUser = { id: 'u1', role: 'staff' };
    const { useAuthContext } = await import('@superapp/iam');
    (useAuthContext as any).mockReturnValue({
      user: mockUser,
      hasPermission: vi.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.user).toEqual(mockUser);
  });
});
