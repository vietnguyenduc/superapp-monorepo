import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/types';

export type DbResult<T> = {
  data: T | null;
  error: Error | null;
};

/**
 * Standardizes Supabase query results into the expected { data, error } format
 */
export async function handleQuery<T>(promise: Promise<{ data: T | null; error: any }>): Promise<DbResult<T>> {
  try {
    const { data, error } = await promise;
    if (error) {
      console.error('Database Error:', error);
      return { data: null, error: new Error(error.message) };
    }
    return { data, error: null };
  } catch (error: any) {
    console.error('Unexpected Database Error:', error);
    return { data: null, error: new Error(error.message || 'Unknown error occurred') };
  }
}

/**
 * Helper to ensure a query is scoped to a specific company
 */
export function withCompanyScope(
  query: any, // Use any for builder type
  companyId: string
) {
  return query.eq('company_id', companyId);
}

/**
 * Helper to ensure a query is scoped to a specific branch
 */
export function withBranchScope(
  query: any, // Use any for builder type
  branchId: string
) {
  return query.eq('branch_id', branchId);
}
