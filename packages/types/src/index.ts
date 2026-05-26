export type * from './database.types';
import type { Database } from './database.types';
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type User = TablesRow<'users'> & { branch?: any, company?: any, staff_permissions?: any };
export type Company = TablesRow<'companies'>;
