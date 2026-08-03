/**
 * apiClient — Drop-in replacement for supabase.from() / supabase.rpc()
 *
 * Routes data through the InsForge API server (packages/api) instead of
 * hitting Supabase cloud directly. Supabase is kept ONLY for auth (sign in).
 *
 * API surface mirrors @supabase/supabase-js so existing call sites can be
 * migrated with a single import swap:
 *
 *   BEFORE:  const { data, error } = await supabase.from('products').select('*').eq('id', 1).single();
 *   AFTER :  const { data, error } = await apiClient.from('products').select('*').eq('id', 1).single();
 *
 * Supported chainable methods (supabase-js parity):
 *   select, insert, update, upsert, delete, eq, neq, gt, gte, lt, lte,
 *   like, ilike, in, is, order, limit, range, single, maybeSingle, count
 *
 * Unsupported (yet) — fall back to supabase-js if needed:
 *   .or(), .not(), .filter(), .csv(), .geojson(), foreign-table joins (table!fk)
 *
 * Endpoint: ${API_URL}/api/v1/query  (POST, requires Bearer JWT)
 */

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is' | 'cs' | 'cd';

interface Filter {
  column: string;
  op: FilterOp;
  value: any;
}

interface OrGroup {
  filters: Filter[];
}

interface OrderBy {
  column: string;
  direction: 'asc' | 'desc';
}

interface QueryDef {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | 'rpc';
  columns?: string[];
  filters?: Filter[];
  orGroups?: OrGroup[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
  values?: Record<string, any>;
  valuesList?: Record<string, any>[];
  returning?: string[];
  count?: 'exact' | 'planned' | 'estimated';
  head?: boolean;
}

export interface ApiResult<T = any> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
  status: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_API_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.appforyou.xyz')
    ? 'https://api.appforyou.xyz'
    : 'http://localhost:3001');

let _apiUrl: string = DEFAULT_API_URL;
let _tokenGetter: () => string | null | Promise<string | null> = () => null;

export function configureApiClient(opts: {
  apiUrl?: string;
  tokenGetter?: () => string | null | Promise<string | null>;
}) {
  if (opts.apiUrl) _apiUrl = opts.apiUrl.replace(/\/$/, '');
  if (opts.tokenGetter) _tokenGetter = opts.tokenGetter;
}

export function getApiUrl(): string {
  return _apiUrl;
}

// ──────────────────────────────────────────────────────────────────────────
// HTTP transport
// ──────────────────────────────────────────────────────────────────────────

async function postJson(path: string, body: any): Promise<ApiResult> {
  let token: string | null = null;
  try {
    token = await _tokenGetter();
  } catch {
    token = null;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${_apiUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { error: { message: text || `HTTP ${res.status}` } };
    }

    if (!res.ok) {
      return {
        data: null,
        error: { message: json?.error?.message || json?.error || `HTTP ${res.status}`, code: json?.error?.code },
        status: res.status,
      };
    }

    return {
      data: json?.data ?? null,
      error: json?.error ?? null,
      count: json?.count ?? null,
      status: res.status,
    };
  } catch (err: any) {
    return {
      data: null,
      error: { message: err?.message || 'Network error' },
      status: 0,
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Query builder (chainable, supabase-js parity)
// ──────────────────────────────────────────────────────────────────────────

class QueryBuilder<T = any> {
  private def: QueryDef;

  constructor(table: string, operation: QueryDef['operation']) {
    this.def = { table, operation };
  }

  // ── SELECT ────────────────────────────────────────────────────────────
  // Also doubles as the RETURNING clause when chained after insert/update/upsert,
  // e.g. `.insert(data).select('id, name').single()`.
  select(
    columns: string | string[] = '*',
    opts?: { count?: 'exact' | 'planned' | 'estimated' },
  ): QueryBuilder<T> {
    const cols = typeof columns === 'string'
      ? (columns === '*' ? [] : columns.split(',').map((c) => c.trim()))
      : columns;
    this.def.columns = cols;
    if (opts?.count) {
      this.def.count = opts.count;
    }
    if (this.def.operation !== 'select') {
      this.def.returning = cols;
    }
    return this;
  }

  // ── INSERT ────────────────────────────────────────────────────────────
  insert(values: Record<string, any> | Record<string, any>[]): QueryBuilder<T> {
    if (Array.isArray(values)) {
      this.def.valuesList = values;
    } else {
      this.def.values = values;
    }
    this.def.operation = 'insert';
    return this;
  }

  // ── UPDATE ────────────────────────────────────────────────────────────
  update(values: Record<string, any>): QueryBuilder<T> {
    this.def.values = values;
    this.def.operation = 'update';
    return this;
  }

  // ── UPSERT ────────────────────────────────────────────────────────────
  upsert(values: Record<string, any>): QueryBuilder<T> {
    this.def.values = values;
    this.def.operation = 'upsert';
    return this;
  }

  // ── DELETE ────────────────────────────────────────────────────────────
  delete(): QueryBuilder<T> {
    this.def.operation = 'delete';
    return this;
  }

  // ── FILTERS ───────────────────────────────────────────────────────────
  private addFilter(column: string, op: FilterOp, value: any): QueryBuilder<T> {
    if (!this.def.filters) this.def.filters = [];
    this.def.filters.push({ column, op, value });
    return this;
  }

  eq(column: string, value: any): QueryBuilder<T> { return this.addFilter(column, 'eq', value); }
  neq(column: string, value: any): QueryBuilder<T> { return this.addFilter(column, 'neq', value); }
  gt(column: string, value: any): QueryBuilder<T> { return this.addFilter(column, 'gt', value); }
  gte(column: string, value: any): QueryBuilder<T> { return this.addFilter(column, 'gte', value); }
  lt(column: string, value: any): QueryBuilder<T> { return this.addFilter(column, 'lt', value); }
  lte(column: string, value: any): QueryBuilder<T> { return this.addFilter(column, 'lte', value); }
  like(column: string, value: string): QueryBuilder<T> { return this.addFilter(column, 'like', value); }
  ilike(column: string, value: string): QueryBuilder<T> { return this.addFilter(column, 'ilike', value); }
  in(column: string, values: any[]): QueryBuilder<T> { return this.addFilter(column, 'in', values); }
  is(column: string, value: any): QueryBuilder<T> { return this.addFilter(column, 'is', value); }

  /**
   * .or("col1.op.val,col2.op.val") — supabase-js parity.
   * Parses the PostgREST-style OR string into a group of filters joined by OR.
   * Example: .or("full_name.ilike.%john%,phone.ilike.%john%")
   */
  or(expr: string): QueryBuilder<T> {
    const parts = expr.split(',').map((s) => s.trim()).filter(Boolean);
    const filters: Filter[] = [];
    for (const part of parts) {
      // Match: column.op.value  (op is one of eq,neq,gt,gte,lt,lte,like,ilike,in,is,cs,cd)
      const m = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_]+\.)(.+)$/);
      if (!m) continue;
      const rest = part.slice(m[1].length);
      const [column, op] = m[1].slice(0, -1).split('.'); // remove trailing dot
      const validOps: FilterOp[] = ['eq','neq','gt','gte','lt','lte','like','ilike','in','is','cs','cd'];
      if (!validOps.includes(op as FilterOp)) continue;
      filters.push({ column, op: op as FilterOp, value: rest });
    }
    if (filters.length > 0) {
      if (!this.def.orGroups) this.def.orGroups = [];
      this.def.orGroups.push({ filters });
    }
    return this;
  }

  // ── ORDER / LIMIT / RANGE ─────────────────────────────────────────────
  order(column: string, opts: { ascending?: boolean } = {}): QueryBuilder<T> {
    if (!this.def.orderBy) this.def.orderBy = [];
    this.def.orderBy.push({ column, direction: opts.ascending === false ? 'desc' : 'asc' });
    return this;
  }

  limit(n: number): QueryBuilder<T> {
    this.def.limit = n;
    return this;
  }

  range(from: number, to: number): QueryBuilder<T> {
    this.def.offset = from;
    this.def.limit = to - from + 1;
    return this;
  }

  // ── TERMINATORS ───────────────────────────────────────────────────────
  single(): Promise<ApiResult<T>> {
    this.def.limit = 1;
    return this.then((r) => ({
      ...r,
      data: Array.isArray(r.data) ? r.data[0] ?? null : r.data,
    }));
  }

  maybeSingle(): Promise<ApiResult<T>> {
    return this.single();
  }

  count(opts: { count: 'exact' | 'planned' | 'estimated' } = { count: 'exact' }): Promise<ApiResult<T>> {
    this.def.count = opts.count;
    return this.execute();
  }

  // ── EXECUTE ───────────────────────────────────────────────────────────
  private async execute(): Promise<ApiResult<T>> {
    return postJson('/api/v1/query', this.def);
  }

  // Promise-like: await builder triggers execute
  then<TResult1 = ApiResult<T>>(
    onfulfilled?: (value: ApiResult<T>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => any,
  ): Promise<TResult1> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch(onRejected: (reason: any) => any): Promise<ApiResult<T>> {
    return this.execute().catch(onRejected);
  }

  finally(onFinally?: () => void): Promise<ApiResult<T>> {
    return this.execute().finally(onFinally);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// RPC builder
// ──────────────────────────────────────────────────────────────────────────

class RpcBuilder<T = any> {
  private name: string;
  private args: Record<string, any>;
  constructor(name: string, args: Record<string, any> = {}) {
    this.name = name;
    this.args = args;
  }

  async run(): Promise<ApiResult<T>> {
    return postJson('/api/v1/query', {
      table: this.name,
      operation: 'rpc',
      values: this.args,
    });
  }

  then<TResult1 = ApiResult<T>>(
    onfulfilled?: (value: ApiResult<T>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => any,
  ): Promise<TResult1> {
    return this.run().then(onfulfilled, onrejected);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Public client
// ──────────────────────────────────────────────────────────────────────────

export const apiClient = {
  /** Drop-in for supabase.from(table) — returns a chainable query builder. */
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table, 'select');
  },

  /** Drop-in for supabase.rpc(name, args). */
  rpc<T = any>(name: string, args: Record<string, any> = {}): RpcBuilder<T> {
    return new RpcBuilder<T>(name, args);
  },

  /** Batch multiple queries in one request. */
  async batch<T = any>(queries: QueryDef[]): Promise<ApiResult<T[]>> {
    return postJson('/api/v1/batch', queries);
  },
};

export default apiClient;
