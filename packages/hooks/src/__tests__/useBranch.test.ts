import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock the useSupabaseClient hook
vi.mock('../useSupabaseClient', () => ({
  useSupabaseClient: vi.fn(),
}));

import { useSupabaseClient } from '../useSupabaseClient';

describe('useBranch', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (useSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  });

  it('should return loading state initially', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { useBranch } = await import('../useBranch');
    const { result } = renderHook(() => useBranch());

    expect(result.current.loading).toBe(true);
  });

  it('should get branch ID from user metadata', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          user_metadata: { branch_id: 'branch-123' },
        },
      },
      error: null,
    });

    const { useBranch } = await import('../useBranch');
    const { result } = renderHook(() => useBranch());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.branchId).toBe('branch-123');
  });

  it('should fallback to localStorage when no metadata', async () => {
    localStorage.setItem('branch_id', 'local-branch-456');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          user_metadata: {},
        },
      },
      error: null,
    });

    const { useBranch } = await import('../useBranch');
    const { result } = renderHook(() => useBranch());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.branchId).toBe('local-branch-456');
  });

  it('should return null when no user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { useBranch } = await import('../useBranch');
    const { result } = renderHook(() => useBranch());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.branchId).toBeNull();
  });

  it('should return null when no branch ID found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          user_metadata: {},
        },
      },
      error: null,
    });

    const { useBranch } = await import('../useBranch');
    const { result } = renderHook(() => useBranch());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.branchId).toBeNull();
  });
});
