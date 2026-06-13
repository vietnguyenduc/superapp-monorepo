import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @superapp/shared-utils BEFORE importing supabase
vi.mock('@superapp/shared-utils', () => ({
  createSupabaseClient: vi.fn(() => ({
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    storage: { from: vi.fn() },
  })),
}));

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    storage: { from: vi.fn() },
  })),
}));

describe('operations-portal supabase lib', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
    // Set env vars for non-trial mode
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('should export TABLES with correct table names', async () => {
    const { TABLES } = await import('../supabase');
    expect(TABLES.OPERATION_CHECKINS).toBe('operation_checkins');
    expect(TABLES.OPERATION_DOCUMENTS).toBe('operation_documents');
    expect(TABLES.OPERATION_CHAT_GROUPS).toBe('operation_chat_groups');
    expect(TABLES.OPERATION_TICKETS).toBe('operation_tickets');
    expect(TABLES.OPERATION_ASSETS).toBe('operation_assets');
    expect(TABLES.USERS).toBe('users');
    expect(TABLES.COMPANIES).toBe('companies');
  });

  it('should export STORAGE with correct bucket name', async () => {
    const { STORAGE } = await import('../supabase');
    expect(STORAGE.OPERATIONS_MEDIA).toBe('operations_media');
  });

  it('should export supabase client as default', async () => {
    const { default: supabase } = await import('../supabase');
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
    expect(typeof supabase.auth.getUser).toBe('function');
  });

  it('should export getCurrentUser and getCurrentUserId helpers', async () => {
    const { getCurrentUser, getCurrentUserId } = await import('../supabase');
    expect(typeof getCurrentUser).toBe('function');
    expect(typeof getCurrentUserId).toBe('function');
  });
});
