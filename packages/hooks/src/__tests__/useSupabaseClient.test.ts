import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the shared-utils module
vi.mock('@superapp/shared-utils', () => ({
  getSupabaseClient: vi.fn(),
  createSupabaseClient: vi.fn(),
}));

import { getSupabaseClient, createSupabaseClient } from '@superapp/shared-utils';

describe('useSupabaseClient', () => {
  const mockClient = { auth: { getSession: vi.fn() } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return existing client from getSupabaseClient', async () => {
    (getSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const { useSupabaseClient } = await import('../useSupabaseClient');
    const { result } = renderHook(() => useSupabaseClient());

    expect(result.current).toBe(mockClient);
    expect(getSupabaseClient).toHaveBeenCalled();
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it('should create new client when getSupabaseClient throws', async () => {
    (getSupabaseClient as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Not initialized');
    });
    (createSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const { useSupabaseClient } = await import('../useSupabaseClient');
    const { result } = renderHook(() => useSupabaseClient('https://url', 'anon-key'));

    expect(result.current).toBe(mockClient);
    expect(createSupabaseClient).toHaveBeenCalledWith('https://url', 'anon-key');
  });

  it('should throw when no client and no credentials', async () => {
    (getSupabaseClient as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Not initialized');
    });

    const { useSupabaseClient } = await import('../useSupabaseClient');

    expect(() => {
      renderHook(() => useSupabaseClient());
    }).toThrow('Supabase client not initialized and credentials not provided.');
  });

  it('should create client in useEffect when credentials provided later', async () => {
    (getSupabaseClient as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Not initialized');
    });
    (createSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const { useSupabaseClient } = await import('../useSupabaseClient');
    const { result } = renderHook(() => useSupabaseClient('https://url', 'anon-key'));

    expect(result.current).toBe(mockClient);
    expect(createSupabaseClient).toHaveBeenCalledWith('https://url', 'anon-key');
  });
});
