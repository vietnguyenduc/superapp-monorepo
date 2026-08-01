import { apiClient } from "./supabase";
import type { TablesUpdate } from '../types/database.types';

// RBAC user service for Settings
// All data ops route through apiClient (local InsForge Postgres) — auth stays on Supabase.
export const userService = {
  async getUsers(branchId?: string) {
    let query = apiClient.from('users').select('*');
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    const { data, error } = await query;
    return { data, error };
  },

  async updateUser(userId: string, updates: TablesUpdate<'users'>) {
    const { data, error } = await apiClient
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  }
};
