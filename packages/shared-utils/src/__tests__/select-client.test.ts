import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('cloud-only API client', () => {
  it('always returns the supplied Supabase client without probing localhost', async () => {
    vi.resetModules();
    const { createApiClient } = await import('../api-client/select-client');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const cloudClient = { auth: {} };
    const client = createApiClient(cloudClient);
    await client.initializeApiClient();
    expect(fetch).not.toHaveBeenCalled();
    expect(client.apiClient).toBe(cloudClient);
  });
});
