/**
 * Shared Customer type used across apps.
 * Includes nguoi_dai_dien (representative) field for cashflow integration.
 */
export interface SharedCustomer {
  id: string;
  customer_code: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  nguoi_dai_dien?: string | null;
  opening_balance?: number;
  total_balance?: number;
  is_active?: boolean;
  company_id?: string;
  branch_id?: string | null;
  partner_type?: string | null;
  created_at?: string;
  updated_at?: string;
  notes?: string | null;
}
