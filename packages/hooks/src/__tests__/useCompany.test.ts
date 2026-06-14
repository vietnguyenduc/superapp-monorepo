import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock the useSupabaseClient hook
vi.mock('../useSupabaseClient', () => ({
  useSupabaseClient: vi.fn(),
}));

import { useSupabaseClient } from '../useSupabaseClient';

describe('useCompany', () => {
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

    const { useCompany } = await import('../useCompany');
    const { result } = renderHook(() => useCompany());

    expect(result.current.loading).toBe(true);
  });

  it('should get company ID from user metadata', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          user_metadata: { company_id: 'company-123' },
        },
      },
      error: null,
    });

    const { useCompany } = await import('../useCompany');
    const { result } = renderHook(() => useCompany());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.companyId).toBe('company-123');
  });

  it('should fallback to localStorage when no metadata', async () => {
    localStorage.setItem('company_id', 'local-company-456');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          user_metadata: {},
        },
      },
      error: null,
    });

    const { useCompany } = await import('../useCompany');
    const { result } = renderHook(() => useCompany());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.companyId).toBe('local-company-456');
  });

  it('should return null when no user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { useCompany } = await import('../useCompany');
    const { result } = renderHook(() => useCompany());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.companyId).toBeNull();
  });

  it('should return null when no company ID found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          user_metadata: {},
        },
      },
      error: null,
    });

    const { useCompany } = await import('../useCompany');
    const { result } = renderHook(() => useCompany());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.companyId).toBeNull();
  });
});
