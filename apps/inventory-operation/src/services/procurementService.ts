import { apiClient, getCurrentInventoryScope } from '../lib/supabase';
import { BaseService, ServiceResponse } from './baseService';

export interface ProcurementLineInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface PurchaseOrderRecord {
  id: string;
  po_number: string;
  status: 'draft' | 'sent' | 'partial_received' | 'received' | 'cancelled';
  expected_date: string | null;
  total_amount: number;
  notes: string | null;
  created_at: string;
  supplier?: { full_name?: string; name?: string } | null;
  items?: Array<{ id: string; quantity: number; received_quantity: number; unit_price: number; product?: { name: string; business_code?: string } | null }>;
}

export interface SupplierReturnRecord {
  id: string;
  return_number: string;
  return_date: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  reason: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  supplier?: { full_name?: string; name?: string } | null;
  items?: Array<{ id: string; quantity: number; unit: string; unit_price: number; product?: { name: string; business_code?: string } | null }>;
}

export class ProcurementService extends BaseService {
  static async getPurchaseOrders(): Promise<ServiceResponse<PurchaseOrderRecord[]>> {
    return this.execute(async () => {
      const { companyId, branchId } = await getCurrentInventoryScope();
      let query = apiClient
        .from('purchase_orders')
        .select('*, supplier:suppliers(full_name,name), items:po_items(*, product:products(name,business_code))')
        .order('created_at', { ascending: false });
      if (companyId) query = query.eq('company_id', companyId);
      if (branchId) query = query.eq('branch_id', branchId);
      return query;
    }, async () => ({ data: [], error: null }));
  }

  static async createPurchaseOrder(input: { supplierId: string; expectedDate?: string; notes?: string; items: ProcurementLineInput[] }): Promise<ServiceResponse<string>> {
    return this.execute(async () => {
      const { data, error } = await apiClient.rpc('inventory_create_purchase_order', {
        p_supplier_id: input.supplierId,
        p_expected_date: input.expectedDate || null,
        p_notes: input.notes || null,
        p_items: input.items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, notes: item.notes || null })),
      });
      return { data, error };
    }, async () => ({ data: `trial-po-${Date.now()}`, error: null }));
  }

  static async getSupplierReturns(): Promise<ServiceResponse<SupplierReturnRecord[]>> {
    return this.execute(async () => {
      const { companyId, branchId } = await getCurrentInventoryScope();
      let query = apiClient
        .from('supplier_returns')
        .select('*, supplier:suppliers(full_name,name), items:supplier_return_items(*, product:products(name,business_code))')
        .order('created_at', { ascending: false });
      if (companyId) query = query.eq('company_id', companyId);
      if (branchId) query = query.eq('branch_id', branchId);
      return query;
    }, async () => ({ data: [], error: null }));
  }

  static async createSupplierReturn(input: { supplierId: string; returnDate: string; reason: string; notes?: string; items: ProcurementLineInput[] }): Promise<ServiceResponse<string>> {
    return this.execute(async () => {
      const { data, error } = await apiClient.rpc('inventory_create_supplier_return', {
        p_supplier_id: input.supplierId,
        p_return_date: input.returnDate,
        p_reason: input.reason,
        p_notes: input.notes || null,
        p_items: input.items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, notes: item.notes || null })),
      });
      return { data, error };
    }, async () => ({ data: `trial-return-${Date.now()}`, error: null }));
  }

  static async reviewSupplierReturn(id: string, action: 'approve' | 'cancel'): Promise<ServiceResponse<{ status: string }>> {
    return this.execute(async () => apiClient.rpc('inventory_review_supplier_return', { p_return_id: id, p_action: action }), async () => ({ data: { status: action === 'approve' ? 'approved' : 'cancelled' }, error: null }));
  }

  static async completeSupplierReturn(id: string): Promise<ServiceResponse<{ completed: boolean; created: number }>> {
    return this.execute(async () => apiClient.rpc('inventory_complete_supplier_return', { p_return_id: id }), async () => ({ data: { completed: true, created: 0 }, error: null }));
  }
}

export const procurementService = ProcurementService;
