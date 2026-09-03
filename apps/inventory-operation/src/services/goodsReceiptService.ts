import { getCurrentCompanyId, getCurrentUserId, apiClient } from '../lib/supabase';
import { BaseService, ServiceResponse } from './baseService';
import { GoodsReceipt, GoodsReceiptInput, GRItem, GRStatus } from '../types';
import { fallbackService } from './fallbackService';

/**
 * GoodsReceiptService — manages goods_receipts + goods_receipt_items tables.
 *
 * GR workflow:
 *   1. Create GR (status=pending) — record what was received
 *   2. Complete GR → status=completed → create inventory_records (input_quantity) → increase stock
 *   3. If linked to PO → update po_items.received_quantity + PO status
 */

const TRIAL_GR_KEY = 'trial_goods_receipts';

function getTrialGRs(): GoodsReceipt[] {
  try {
    return JSON.parse(localStorage.getItem(TRIAL_GR_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTrialGRs(grs: GoodsReceipt[]) {
  localStorage.setItem(TRIAL_GR_KEY, JSON.stringify(grs));
}

function generateGRNumber(): string {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GR-${ymd}-${rand}`;
}

export class GoodsReceiptService extends BaseService {
  /**
   * Get all goods receipts with items + supplier + PO info.
   */
  static async getGoodsReceipts(filters?: {
    status?: string;
    supplierId?: string;
    poId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ServiceResponse<GoodsReceipt[]>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient
          .from('goods_receipts')
          .select(`*, supplier:suppliers(id, name, code), po:purchase_orders(id, po_number), items:goods_receipt_items(*)`)
          .order('created_at', { ascending: false });

        if (companyId) query = query.eq('company_id', companyId);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.supplierId) query = query.eq('supplier_id', filters.supplierId);
        if (filters?.poId) query = query.eq('po_id', filters.poId);
        if (filters?.dateFrom) query = query.gte('receipt_date', filters.dateFrom);
        if (filters?.dateTo) query = query.lte('receipt_date', filters.dateTo);

        const res = await query;
        if (res.data) {
          res.data = res.data.map((row: any) => this.mapDbToGR(row));
        }
        return res;
      },
      async () => {
        let grs = getTrialGRs();
        if (filters?.status) grs = grs.filter(g => g.status === filters.status);
        if (filters?.supplierId) grs = grs.filter(g => g.supplier_id === filters.supplierId);
        return { data: grs, error: null };
      }
    );
  }

  /**
   * Create a new goods receipt (status=pending).
   */
  static async createGoodsReceipt(input: GoodsReceiptInput): Promise<ServiceResponse<GoodsReceipt>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();
        const grNumber = generateGRNumber();
        const totalAmount = input.items.reduce(
          (sum, i) => sum + i.received_qty * i.unit_price, 0
        );

        const grRow: any = {
          po_id: input.po_id || null,
          supplier_id: input.supplier_id,
          gr_number: grNumber,
          receipt_date: input.receipt_date,
          status: 'pending' as GRStatus,
          total_amount: totalAmount,
          notes: input.notes || null,
          received_by: userId,
        };
        if (companyId) grRow.company_id = companyId;

        const grRes = await apiClient.from('goods_receipts').insert([grRow]).select().single();
        if (grRes.error || !grRes.data) return grRes;

        const grId = grRes.data.id;

        // Insert items
        const itemRows = input.items.map(i => ({
          gr_id: grId,
          product_id: i.product_id,
          po_item_id: i.po_item_id || null,
          expected_qty: i.expected_qty,
          received_qty: i.received_qty,
          defective_qty: i.defective_qty || 0,
          wrong_branch_qty: i.wrong_branch_qty || 0,
          unit_price: i.unit_price,
          notes: i.notes || null,
        }));
        const itemsRes = await apiClient.from('goods_receipt_items').insert(itemRows).select();
        if (itemsRes.error) return itemsRes;

        // Fetch complete GR with joins
        const fullRes = await apiClient
          .from('goods_receipts')
          .select(`*, supplier:suppliers(id, name, code), po:purchase_orders(id, po_number), items:goods_receipt_items(*)`)
          .eq('id', grId)
          .single();
        if (fullRes.data) fullRes.data = this.mapDbToGR(fullRes.data);
        return fullRes;
      },
      async () => {
        const id = 'trial-gr-' + Date.now();
        const now = new Date().toISOString();
        const gr: GoodsReceipt = {
          id,
          po_id: input.po_id,
          supplier_id: input.supplier_id,
          gr_number: generateGRNumber(),
          receipt_date: input.receipt_date,
          status: 'pending',
          total_amount: input.items.reduce((sum, i) => sum + i.received_qty * i.unit_price, 0),
          notes: input.notes,
          received_by: 'trial',
          created_at: now,
          updated_at: now,
          items: input.items.map((i, idx) => ({
            id: `item-${id}-${idx}`,
            gr_id: id,
            product_id: i.product_id,
            po_item_id: i.po_item_id,
            expected_qty: i.expected_qty,
            received_qty: i.received_qty,
            defective_qty: i.defective_qty || 0,
            wrong_branch_qty: i.wrong_branch_qty || 0,
            unit_price: i.unit_price,
            total_price: i.received_qty * i.unit_price,
            notes: i.notes,
            created_at: now,
          })),
        };
        const grs = getTrialGRs();
        grs.unshift(gr);
        saveTrialGRs(grs);
        return { data: gr, error: null };
      }
    );
  }

  /**
   * Complete a goods receipt → create inventory_records (input_quantity) + update PO.
   */
  static async completeGoodsReceipt(id: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();

        // 1. Fetch GR + items + product info
        let grQuery = apiClient
          .from('goods_receipts')
          .select(`*, items:goods_receipt_items(*, product:products(business_code, name))`)
          .eq('id', id);
        if (companyId) grQuery = grQuery.eq('company_id', companyId);
        const { data: grData, error: fetchErr } = await grQuery.maybeSingle();
        if (fetchErr || !grData) return { error: fetchErr?.message || 'Không tìm thấy GR' };

        if (grData.status === 'completed') return { error: 'GR đã hoàn thành rồi' };

        // 2. Update GR status to completed
        let updateQuery = apiClient
          .from('goods_receipts')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', id);
        if (companyId) updateQuery = updateQuery.eq('company_id', companyId);
        const { error: updateErr } = await updateQuery;
        if (updateErr) return { error: updateErr };

        // 3. Create inventory_records for each item (input_quantity > 0)
        for (const item of (grData.items || [])) {
          if (item.received_qty <= 0) continue;
          const recordRow: any = {
            date: grData.receipt_date,
            product_id: item.product_id,
            product_code: item.product?.business_code || '',
            product_name: item.product?.name || '',
            input_quantity: item.received_qty,
            output_quantity: 0,
            unit_price: item.unit_price,
            total_amount: item.received_qty * item.unit_price,
            supplier_id: grData.supplier_id,
            source_type: 'goods_receipt',
            reference_id: id,
            notes: `Nhập hàng - ${grData.gr_number}`,
            created_by: userId,
          };
          if (companyId) recordRow.company_id = companyId;
          await apiClient.from('inventory_records').insert([recordRow]);
        }

        // 4. If linked to PO → update po_items.received_quantity + PO status
        if (grData.po_id) {
          for (const item of (grData.items || [])) {
            if (item.po_item_id) {
              // Fetch current received_quantity
              const { data: poItem } = await apiClient
                .from('po_items')
                .select('received_quantity')
                .eq('id', item.po_item_id)
                .maybeSingle();
              const newReceived = (poItem?.received_quantity || 0) + item.received_qty;
              await apiClient
                .from('po_items')
                .update({ received_quantity: newReceived })
                .eq('id', item.po_item_id);
            }
          }

          // Update PO status: check if all items fully received
          const { data: poItems } = await apiClient
            .from('po_items')
            .select('quantity, received_quantity')
            .eq('po_id', grData.po_id);
          const allReceived = (poItems || []).every(i => i.received_quantity >= i.quantity);
          const anyReceived = (poItems || []).some(i => i.received_quantity > 0);
          const newPOStatus = allReceived ? 'received' : (anyReceived ? 'partial_received' : 'sent');
          await apiClient
            .from('purchase_orders')
            .update({ status: newPOStatus, updated_at: new Date().toISOString() })
            .eq('id', grData.po_id);
        }

        return { data: true };
      },
      async () => {
        const grs = getTrialGRs();
        const idx = grs.findIndex(g => g.id === id);
        if (idx === -1) return { data: null, error: { message: 'Không tìm thấy GR' } };
        grs[idx].status = 'completed';
        grs[idx].updated_at = new Date().toISOString();
        saveTrialGRs(grs);
        // Also create trial inventory records
        const gr = grs[idx];
        for (const item of (gr.items || [])) {
          if (item.received_qty <= 0) continue;
          await fallbackService.createInventoryRecord({
            date: new Date(gr.receipt_date),
            productCode: item.product_id,
            productName: '',
            inputQuantity: item.received_qty,
            outputQuantity: 0,
            rawMaterialStock: 0,
            rawMaterialUnit: '',
            processedStock: 0,
            processedUnit: '',
            finishedProductStock: 0,
            finishedProductUnit: '',
            unitPrice: item.unit_price,
            totalAmount: item.received_qty * item.unit_price,
            notes: `Nhập hàng - ${gr.gr_number}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'trial',
            updatedBy: 'trial',
          } as any);
        }
        return { data: true, error: null };
      }
    );
  }

  /**
   * Delete a goods receipt (only if pending).
   */
  static async deleteGoodsReceipt(id: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient.from('goods_receipts').delete().eq('id', id).eq('status', 'pending');
        if (companyId) query = query.eq('company_id', companyId);
        const { error } = await query;
        return { data: !error, error };
      },
      async () => {
        const grs = getTrialGRs().filter(g => g.id !== id);
        saveTrialGRs(grs);
        return { data: true, error: null };
      }
    );
  }

  private static mapDbToGR(row: any): GoodsReceipt {
    return {
      id: row.id,
      company_id: row.company_id,
      po_id: row.po_id,
      po_number: row.po?.po_number,
      supplier_id: row.supplier_id,
      supplier_name: row.supplier?.name,
      supplier_code: row.supplier?.code,
      gr_number: row.gr_number,
      receipt_date: row.receipt_date,
      status: row.status,
      total_amount: row.total_amount || 0,
      notes: row.notes,
      received_by: row.received_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      items: (row.items || []).map((i: any): GRItem => ({
        id: i.id,
        gr_id: i.gr_id,
        product_id: i.product_id,
        po_item_id: i.po_item_id,
        expected_qty: i.expected_qty || 0,
        received_qty: i.received_qty,
        defective_qty: i.defective_qty || 0,
        wrong_branch_qty: i.wrong_branch_qty || 0,
        unit_price: i.unit_price,
        total_price: i.total_price || i.received_qty * i.unit_price,
        notes: i.notes,
        created_at: i.created_at,
      })),
    };
  }
}

export const goodsReceiptService = GoodsReceiptService;
