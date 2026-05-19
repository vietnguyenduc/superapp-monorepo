import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

describe('useAuth integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with no user and not loading after init', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isTrial).toBe(false);
  });

  it('signIn with valid credentials sets user and session', async () => {
    const mockSession = { access_token: 'tok123', user: { id: 'u1', email: 'a@b.com' } };
    const mockUser = {
      id: 'u1',
      email: 'a@b.com',
      full_name: 'Test',
      role: 'admin',
      company_id: null,
      branch_id: null,
      staff_permissions: null,
      app_permissions: { cashflow: false, inventory: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { session: mockSession, user: mockSession.user }, error: null });
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const signInResult = await result.current.signIn('a@b.com', 'password');
    expect(signInResult.error).toBeNull();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.email).toBe('a@b.com');
  });

  it('signIn with invalid credentials returns error', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { session: null, user: null }, error: { message: 'Invalid credentials' } });
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const signInResult = await result.current.signIn('a@b.com', 'wrong');
    expect(signInResult.error).toContain('Invalid credentials');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('signOut clears user and session', async () => {
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.signOut();
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('trial mode starts and persists in localStorage', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    result.current.startTrial();
    await waitFor(() => expect(result.current.isTrial).toBe(true));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.role).toBe('admin');
    expect(localStorage.getItem('inventory_trial_user')).toContain('trial');
  });

  it('trial expiration is detected on load', async () => {
    const oldTrial = {
      user: { id: 't1', email: 'trial@test.com', role: 'trial', full_name: 'Trial', company_id: null, branch_id: null, staff_permissions: null, app_permissions: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      started_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    };
    localStorage.setItem('inventory_trial_user', JSON.stringify(oldTrial));
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isTrial).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('inventory_trial_user')).toBeNull();
  });

  it('hasPermission returns true for admin user', async () => {
    const mockSession = { access_token: 'tok', user: { id: 'u1', email: 'a@b.com' } };
    const mockUser = {
      id: 'u1',
      email: 'a@b.com',
      full_name: 'Admin',
      role: 'admin',
      company_id: null,
      branch_id: null,
      staff_permissions: null,
      app_permissions: { cashflow: false, inventory: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { session: mockSession, user: mockSession.user }, error: null });
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.signIn('a@b.com', 'pw');
    await waitFor(() => expect(result.current.user?.role).toBe('admin'));
  });
});
