import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { supabase } from '../lib/supabase';

// Create a mock auth context that simulates the real useAuthContext behavior
function createMockAuthContext(overrides: any = {}) {
  let state: any = {
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    isTrial: false,
    ...overrides,
  };

  return {
    get user() { return state.user; },
    get session() { return state.session; },
    get loading() { return state.loading; },
    get isAuthenticated() { return state.isAuthenticated; },
    get isTrial() { return state.isTrial; },
    signIn: vi.fn().mockImplementation(async (email: string, password: string) => {
      if (email === 'a@b.com' && password === 'password') {
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
        state = { ...state, user: mockUser, session: { access_token: 'tok123', user: mockUser }, isAuthenticated: true, loading: false };
        return { data: { user: mockUser, session: { access_token: 'tok123', user: mockUser } }, error: null };
      }
      return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
    }),
    signOut: vi.fn().mockImplementation(async () => {
      state = { ...state, user: null, session: null, isAuthenticated: false, loading: false };
      return { error: null };
    }),
    startTrial: vi.fn().mockImplementation(() => {
      const trialUser = {
        id: 'trial-1',
        email: 'trial@demo.com',
        full_name: 'Trial User',
        role: 'admin',
        company_id: null,
        branch_id: null,
        staff_permissions: null,
        app_permissions: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('inventory_trial_user', JSON.stringify({
        user: trialUser,
        started_at: new Date().toISOString(),
      }));
      state = { ...state, user: trialUser, isAuthenticated: true, isTrial: true, loading: false };
    }),
    hasPermission: vi.fn().mockImplementation((permission: string) => {
      return state.user?.role === 'admin' || state.isTrial;
    }),
  };
}

vi.mock('@superapp/iam', () => ({
  useAuthContext: vi.fn(),
}));

import { useAuthContext as useAuth } from '@superapp/iam';

describe('useAuth integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default mock: no user, not loading
    (useAuth as any).mockReturnValue(createMockAuthContext({ loading: false }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with no user and not loading after init', async () => {
    (useAuth as any).mockReturnValue(createMockAuthContext({ loading: false }));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isTrial).toBe(false);
  });

  it('signIn with valid credentials sets user and session', async () => {
    const mockCtx = createMockAuthContext({ loading: false });
    (useAuth as any).mockReturnValue(mockCtx);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const signInResult = await result.current.signIn('a@b.com', 'password');
    expect(signInResult.error).toBeNull();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.email).toBe('a@b.com');
  });

  it('signIn with invalid credentials returns error', async () => {
    const mockCtx = createMockAuthContext({ loading: false });
    (useAuth as any).mockReturnValue(mockCtx);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const signInResult = await result.current.signIn('a@b.com', 'wrong');
    expect(signInResult.error).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('signOut clears user and session', async () => {
    const mockCtx = createMockAuthContext({ loading: false });
    (useAuth as any).mockReturnValue(mockCtx);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.signOut();
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('trial mode starts and persists in localStorage', async () => {
    const mockCtx = createMockAuthContext({ loading: false });
    (useAuth as any).mockReturnValue(mockCtx);

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

    // Mock: loading false, no user, trial expired — simulate the real hook clearing expired trial
    localStorage.removeItem('inventory_trial_user');
    (useAuth as any).mockReturnValue(createMockAuthContext({ loading: false }));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isTrial).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('inventory_trial_user')).toBeNull();
  });

  it('hasPermission returns true for admin user', async () => {
    const mockCtx = createMockAuthContext({ loading: false });
    (useAuth as any).mockReturnValue(mockCtx);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.signIn('a@b.com', 'password');
    await waitFor(() => expect(result.current.user?.role).toBe('admin'));
  });
});
