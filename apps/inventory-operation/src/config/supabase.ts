// Supabase configuration for inventory-operation app
// Mock implementation for local testing

interface MockSupabaseClient {
  from: (table: string) => MockQueryBuilder;
}

interface MockQueryBuilder {
  select: (columns?: string) => MockQueryBuilder;
  insert: (data: any) => MockQueryBuilder;
  update: (data: any) => MockQueryBuilder;
  delete: () => MockQueryBuilder;
  eq: (column: string, value: any) => MockQueryBuilder;
  neq: (column: string, value: any) => MockQueryBuilder;
  gt: (column: string, value: any) => MockQueryBuilder;
  gte: (column: string, value: any) => MockQueryBuilder;
  lt: (column: string, value: any) => MockQueryBuilder;
  lte: (column: string, value: any) => MockQueryBuilder;
  in: (column: string, values: any[]) => MockQueryBuilder;
  or: (query: string) => MockQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder;
  limit: (count: number) => MockQueryBuilder;
  single: () => MockQueryBuilder;
  then: (callback: (result: { data: any; error: any }) => void) => Promise<any>;
}

// Mock Supabase client for local development
const createMockSupabaseClient = (): MockSupabaseClient => {
  const mockQueryBuilder: MockQueryBuilder = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    neq: () => mockQueryBuilder,
    gt: () => mockQueryBuilder,
    gte: () => mockQueryBuilder,
    lt: () => mockQueryBuilder,
    lte: () => mockQueryBuilder,
    in: () => mockQueryBuilder,
    or: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    single: () => mockQueryBuilder,
    then: async (callback) => {
      // Mock successful response
      const result = { data: [], error: null };
      callback(result);
      return result;
    }
  };

  return {
    from: (table: string) => {
      console.log(`Mock Supabase query on table: ${table}`);
      return mockQueryBuilder;
    }
  };
};

// Check if we have real Supabase credentials
const hasSupabaseCredentials = !!(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

let supabase: MockSupabaseClient;

if (hasSupabaseCredentials) {
  // TODO: Import and initialize real Supabase client
  // import { createClient } from '@supabase/supabase-js';
  // supabase = createClient(
  //   import.meta.env.VITE_SUPABASE_URL!,
  //   import.meta.env.VITE_SUPABASE_ANON_KEY!
  // );
  console.warn('Real Supabase client not implemented yet, using mock client');
  supabase = createMockSupabaseClient();
} else {
  console.log('Using mock Supabase client for local development');
  supabase = createMockSupabaseClient();
}

export { supabase };
export default supabase;
