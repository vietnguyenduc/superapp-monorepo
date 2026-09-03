import { getCurrentCompanyId, getCurrentUserId, apiClient } from '../lib/supabase';
import { fallbackService } from './fallbackService';
import { BaseService, ServiceResponse } from './baseService';

/**
 * Supplier type — mirrors the Cashflow `customers` table where
 * `partner_type = 'supplier'`. The inventory app reads/writes the same
 * table so suppliers are shared across apps (single source of truth).
 */
export interface Supplier {
  id: string;
  customer_code: string;
  full_name: string;
  partner_type: string; // 'supplier' | 'customer' | 'both'
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
  company_id?: string | null;
  branch_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SupplierInput {
  customer_code: string;
  full_name: string;
  partner_type?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

const SUPPLIER_PARTNER_TYPE = 'supplier';

export class SupplierService extends BaseService {
  /**
   * Get all suppliers (customers with partner_type containing 'supplier').
   * Queries the shared `customers` table, filtered by company_id.
   */
  static async getSuppliers(filters?: {
    search?: string;
    isActive?: boolean;
  }): Promise<ServiceResponse<Supplier[]>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient
          .from('customers')
          .select('*')
          .order('full_name');

        if (companyId) query = query.eq('company_id', companyId);
        // Filter for suppliers — partner_type can be 'supplier' or 'both'
        query = query.or(`partner_type.eq.${SUPPLIER_PARTNER_TYPE},partner_type.eq.both`);
        if (filters?.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive);
        }
        if (filters?.search) {
          query = query.or(
            `full_name.ilike.%${filters.search}%,customer_code.ilike.%${filters.search}%`
          );
        }

        const res = await query;
        return res;
      },
      () => fallbackService.getSuppliers(filters)
    );
  }

  static async getSupplier(id: string): Promise<ServiceResponse<Supplier>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient.from('customers').select('*').eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const res = await query.single();
        return res;
      },
      () => fallbackService.getSupplierById(id)
    );
  }

  static async createSupplier(
    supplier: SupplierInput
  ): Promise<ServiceResponse<Supplier>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();
        const row: Record<string, unknown> = {
          customer_code: supplier.customer_code,
          full_name: supplier.full_name,
          partner_type: supplier.partner_type || SUPPLIER_PARTNER_TYPE,
          phone: supplier.phone || null,
          email: supplier.email || null,
          address: supplier.address || null,
          notes: supplier.notes || null,
          is_active: true,
        };
        if (companyId) row.company_id = companyId;
        if (userId) row.created_by = userId;

        const res = await apiClient
          .from('customers')
          .insert([row])
          .select('*')
          .single();
        return res;
      },
      () => fallbackService.createSupplier(supplier)
    );
  }

  static async updateSupplier(
    id: string,
    updates: Partial<SupplierInput>
  ): Promise<ServiceResponse<Supplier>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();
        const row: Record<string, unknown> = { ...updates, updated_by: userId };
        let query = apiClient.from('customers').update(row).eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const res = await query.select('*').single();
        return res;
      },
      () => fallbackService.updateSupplier(id, updates)
    );
  }

  static async deleteSupplier(id: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient.from('customers').delete().eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const res = await query;
        return res;
      },
      () => fallbackService.deleteSupplier(id)
    );
  }

  /**
   * Bulk create suppliers from Excel/CSV import.
   * Returns count of successfully inserted rows + errors.
   */
  static async bulkCreateSuppliers(
    suppliers: SupplierInput[]
  ): Promise<ServiceResponse<{ created: number; errors: string[] }>> {
    const errors: string[] = [];
    let created = 0;

    for (const supplier of suppliers) {
      const res = await this.createSupplier(supplier);
      if (res.success) {
        created++;
      } else {
        errors.push(`${supplier.customer_code || supplier.full_name}: ${res.error}`);
      }
    }

    return { success: true, data: { created, errors } };
  }
}

export const supplierService = SupplierService;
