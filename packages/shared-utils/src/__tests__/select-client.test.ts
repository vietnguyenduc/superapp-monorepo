import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('optional local API discovery', () => {
  it('keeps the cloud client without probing when local API is disabled', async () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    vi.stubEnv('VITE_USE_LOCAL_API', 'false');
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

  it('preserves local discovery when not explicitly disabled', async () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    vi.stubEnv('VITE_USE_LOCAL_API', '');
    vi.resetModules();
    const { createApiClient } = await import('../api-client/select-client');
    const fetch = vi.fn().mockResolvedValue({ status: 503 });
    vi.stubGlobal('fetch', fetch);
    const cloudClient = { auth: {} };
    const client = createApiClient(cloudClient);
    await client.initializeApiClient();
    expect(fetch).toHaveBeenCalled();
    expect(client.apiClient).toBe(cloudClient);
  });
});
