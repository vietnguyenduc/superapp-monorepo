import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock the useSupabaseClient hook
vi.mock('../useSupabaseClient', () => ({
  useSupabaseClient: vi.fn(),
}));

import { useSupabaseClient } from '../useSupabaseClient';

describe('useAuth', () => {
  const mockSession = {
    user: { id: 'user-1', email: 'test@example.com' },
    access_token: 'token',
    refresh_token: 'refresh',
  };

  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  });

  it('should return loading state initially', async () => {
    // Simulate async getSession
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    // Dynamic import to get fresh module
    const { useAuth } = await import('../useAuth');
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
  });

  it('should set session and user after getSession resolves', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { useAuth } = await import('../useAuth');
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession.user);
  });

  it('should set null user when no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { useAuth } = await import('../useAuth');
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should listen for auth state changes', async () => {
    const mockUnsubscribe = vi.fn();
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    const { useAuth } = await import('../useAuth');
    const { result, unmount } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify onAuthStateChange was called
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();

    // Cleanup should unsubscribe
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should provide signOut function', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { useAuth } = await import('../useAuth');
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    result.current.signOut();
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});
