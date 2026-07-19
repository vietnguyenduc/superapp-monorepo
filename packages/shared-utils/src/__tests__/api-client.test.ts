import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiClient, configureApiClient, getApiUrl } from '../api-client';

// api-client uses global fetch — mock it per test.
const originalFetch = global.fetch;

function mockFetchOnce(response: any, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(response),
  }) as any;
}

describe('apiClient (supabase.from() drop-in replacement)', () => {
  beforeEach(() => {
    configureApiClient({ apiUrl: 'http://test-api.local', tokenGetter: () => 'test-token' });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('configures the API URL', () => {
    configureApiClient({ apiUrl: 'http://example.com/' });
    expect(getApiUrl()).toBe('http://example.com');
  });

  it('sends the correct query definition for a simple select', async () => {
    mockFetchOnce({ data: [{ id: 1, name: 'Test' }], error: null, count: 1 });

    const result = await apiClient.from('customers').select('*').eq('company_id', 'abc').single();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (global.fetch as any).mock.calls[0];
    expect(url).toBe('http://test-api.local/api/v1/query');
    const body = JSON.parse(opts.body);
    expect(body.table).toBe('customers');
    expect(body.operation).toBe('select');
    expect(body.filters).toEqual([{ column: 'company_id', op: 'eq', value: 'abc' }]);
    expect(body.limit).toBe(1); // .single() forces limit 1

    // single() unwraps array to first element
    expect(result.data).toEqual({ id: 1, name: 'Test' });
  });

  it('attaches the Bearer token from the configured tokenGetter', async () => {
    mockFetchOnce({ data: [], error: null });
    await apiClient.from('customers').select('*');
    const [, opts] = (global.fetch as any).mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer test-token');
  });

  it('parses .or() PostgREST-style expressions into orGroups', async () => {
    mockFetchOnce({ data: [], error: null });
    await apiClient
      .from('customers')
      .select('*')
      .or('full_name.ilike.%john%,phone.ilike.%john%');

    const [, opts] = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.orGroups).toEqual([
      {
        filters: [
          { column: 'full_name', op: 'ilike', value: '%john%' },
          { column: 'phone', op: 'ilike', value: '%john%' },
        ],
      },
    ]);
  });

  it('builds insert operation with values and defaults operation to "insert"', async () => {
    mockFetchOnce({ data: [{ id: 1 }], error: null });
    await apiClient.from('customers').insert({ full_name: 'New Customer' });
    const [, opts] = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.operation).toBe('insert');
    expect(body.values).toEqual({ full_name: 'New Customer' });
  });

  it('keeps operation as "insert" even when .select() is chained after (maps to RETURNING, not a real select)', async () => {
    mockFetchOnce({ data: [{ id: 1, full_name: 'New Customer' }], error: null });
    await apiClient.from('customers').insert({ full_name: 'New Customer' }).select('id, full_name').single();
    const [, opts] = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.operation).toBe('insert');
    expect(body.returning).toEqual(['id', 'full_name']);
  });

  it('sets operation to "update" when .update() is called', async () => {
    mockFetchOnce({ data: [{ id: '123', full_name: 'Updated' }], error: null });
    await apiClient.from('customers').update({ full_name: 'Updated' }).eq('id', '123');
    const [, opts] = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.operation).toBe('update');
    expect(body.values).toEqual({ full_name: 'Updated' });
    expect(body.filters).toEqual([{ column: 'id', op: 'eq', value: '123' }]);
  });

  it('builds delete operation', async () => {
    mockFetchOnce({ data: [], error: null });
    await apiClient.from('customers').delete().eq('id', '123');
    const [, opts] = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.operation).toBe('delete');
    expect(body.filters).toEqual([{ column: 'id', op: 'eq', value: '123' }]);
  });

  it('supports range() for pagination', async () => {
    mockFetchOnce({ data: [], error: null });
    await apiClient.from('customers').select('*').range(10, 19);
    const [, opts] = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.offset).toBe(10);
    expect(body.limit).toBe(10);
  });

  it('returns a normalized error on non-2xx HTTP response', async () => {
    mockFetchOnce({ error: { message: 'Forbidden' } }, 403);
    const result = await apiClient.from('customers').select('*');
    expect(result.status).toBe(403);
    expect(result.error?.message).toBe('Forbidden');
    expect(result.data).toBeNull();
  });

  it('returns a network error result when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as any;
    const result = await apiClient.from('customers').select('*');
    expect(result.status).toBe(0);
    expect(result.error?.message).toBe('Network down');
  });

  it('rpc() posts to the query endpoint with operation "rpc"', async () => {
    mockFetchOnce({ data: { ok: true }, error: null });
    await apiClient.rpc('my_function', { foo: 'bar' });
    const [url, opts] = (global.fetch as any).mock.calls[0];
    expect(url).toBe('http://test-api.local/api/v1/query');
    const body = JSON.parse(opts.body);
    expect(body.table).toBe('my_function');
    expect(body.operation).toBe('rpc');
    expect(body.values).toEqual({ foo: 'bar' });
  });
});
