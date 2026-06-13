import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';

// Mock useAuthContext
vi.mock('../../contexts/AuthProvider', () => ({
  useAuthContext: vi.fn(),
}));

import { useAuthContext } from '../../contexts/AuthProvider';

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false for hasAppAccess when user is null', () => {
    (useAuthContext as any).mockReturnValue({ user: null });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAppAccess('sales')).toBe(false);
  });

  it('returns false for hasAppAccess when no app_permissions', () => {
    (useAuthContext as any).mockReturnValue({
      user: { app_metadata: {} },
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAppAccess('sales')).toBe(false);
  });

  it('returns true for hasAppAccess when permission exists', () => {
    (useAuthContext as any).mockReturnValue({
      user: {
        app_metadata: {
          app_permissions: { sales: true, inventory: true },
        },
      },
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAppAccess('sales')).toBe(true);
    expect(result.current.hasAppAccess('inventory')).toBe(true);
    expect(result.current.hasAppAccess('hr')).toBe(false);
  });

  it('getRole returns null when no role', () => {
    (useAuthContext as any).mockReturnValue({
      user: { app_metadata: {} },
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.getRole()).toBeNull();
  });

  it('getRole returns the role from app_metadata', () => {
    (useAuthContext as any).mockReturnValue({
      user: { app_metadata: { role: 'admin_master' } },
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.getRole()).toBe('admin_master');
  });

  it('isRole checks role correctly', () => {
    (useAuthContext as any).mockReturnValue({
      user: { app_metadata: { role: 'admin_master' } },
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isRole('admin_master')).toBe(true);
    expect(result.current.isRole('staff')).toBe(false);
  });
});
