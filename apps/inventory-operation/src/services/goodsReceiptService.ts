import { getCurrentCompanyId, getCurrentInventoryScope, getCurrentUserId, apiClient } from '../lib/supabase';
import { BaseService, ServiceResponse } from './baseService';
import { GoodsReceipt, GoodsReceiptInput, GRItem, GRStatus } from '../types';
import { fallbackService } from './fallbackService';
import { importExportSettingsService } from './importExportSettingsService';
import { InventoryMapper } from './mappers/inventoryMapper';
import { InventorySourceType } from '../types';

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
        const { companyId, branchId } = await getCurrentInventoryScope();
        let query = apiClient
          .from('goods_receipts')
          .select(`*, supplier:suppliers(id, name, code), po:purchase_orders(id, po_number), items:goods_receipt_items(*)`)
          .order('created_at', { ascending: false });

        if (companyId) query = query.eq('company_id', companyId);
        if (branchId) query = query.eq('branch_id', branchId);
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
        const { companyId, branchId } = await getCurrentInventoryScope();
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
        grRow.company_id = companyId;
        grRow.branch_id = branchId;

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
        const { data, error } = await apiClient.rpc('inventory_complete_goods_receipt', { p_gr_id: id });
        if (error) return { data: null, error };
        return { data: Boolean(data?.completed), error: null };
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

  /**
   * Bulk create goods receipts (input inventory records) from flat rows.
   * Resolves product by configured match field (business_code or name).
   */
  static async bulkCreateGoodsReceipts(
    inputs: Array<{
      date: string;
      productId?: string;
      productCode: string;
      inputQuantity: number;
      unitPrice: number;
      supplierId?: string;
      supplierName?: string;
      notes?: string;
      sourceType?: InventorySourceType;
    }>
  ): Promise<ServiceResponse<{ created: number; errors: string[]; batchId: string }>> {
    const batchId = crypto.randomUUID();
    if (!this.isTrial) {
      const companyId = await getCurrentCompanyId();
      if (!companyId) return { success: false, error: 'Vui lòng chọn công ty trước khi nhập kho' };
      const { data, error } = await apiClient.rpc('inventory_import_batch', {
        p_company_id: companyId, p_batch_id: batchId, p_direction: 'input', p_rows: inputs,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, data: { created: Number(data?.created || 0), errors: [], batchId: data?.batch_id || batchId } };
    }
    const errors: string[] = [];
    let created = 0;

    for (const input of inputs) {
      try {
        if (!input.date || !input.productCode.trim() || input.inputQuantity <= 0) {
          throw new Error('Ngày, mã hàng và số lượng lớn hơn 0 là bắt buộc');
        }

        if (this.isTrial) {
          const trialRes = await fallbackService.createInventoryRecord({
            date: new Date(input.date),
            productCode: input.productCode,
            productName: input.productCode,
            inputQuantity: input.inputQuantity,
            outputQuantity: 0,
            rawMaterialStock: 0,
            rawMaterialUnit: '',
            processedStock: 0,
            processedUnit: '',
            finishedProductStock: 0,
            finishedProductUnit: '',
            unitPrice: input.unitPrice,
            totalAmount: input.inputQuantity * input.unitPrice,
            supplierId: input.supplierId,
            supplierName: input.supplierName,
            notes: input.notes,
            sourceType: input.sourceType || InventorySourceType.MANUAL,
            createdBy: 'trial',
            updatedBy: 'trial',
          });
          if (trialRes.error) throw new Error(trialRes.error);
          created++;
          continue;
        }

        const userId = await getCurrentUserId();
        const { companyId, branchId } = await getCurrentInventoryScope();
        const cfg = await importExportSettingsService.load();
        const matchField = cfg.inventoryMatchField;

        let productQuery = apiClient.from('products').select('id, name, business_code');
        if (matchField === 'name') {
          productQuery = productQuery.eq('name', input.productCode);
        } else {
          productQuery = productQuery.eq('business_code', input.productCode);
        }
        if (companyId) productQuery = productQuery.eq('company_id', companyId);
        const productRow = await productQuery.maybeSingle();
        if (!productRow.data) throw new Error('Không tìm thấy sản phẩm: ' + input.productCode);

        const row = InventoryMapper.mapInventoryToDb({
          date: new Date(input.date),
          productCode: productRow.data.business_code || input.productCode,
          productName: productRow.data.name,
          inputQuantity: input.inputQuantity,
          outputQuantity: 0,
          rawMaterialStock: 0,
          rawMaterialUnit: '',
          processedStock: 0,
          processedUnit: '',
          finishedProductStock: 0,
          finishedProductUnit: '',
          unitPrice: input.unitPrice,
          totalAmount: input.inputQuantity * input.unitPrice,
          notes: input.notes,
          sourceType: input.sourceType || InventorySourceType.MANUAL,
          productId: productRow.data.id,
          createdBy: userId || 'system',
          updatedBy: userId || 'system',
        } as any);
        row.company_id = companyId;
        row.branch_id = branchId;

        const res = await apiClient.from('inventory_records').insert([row]).select().single();
        if (res.error) throw new Error(res.error.message);
        created++;
      } catch (err: any) {
        errors.push(`${input.productCode} (${input.date}): ${err.message || err}`);
      }
    }

    return { success: true, data: { created, errors, batchId } };
  }
}

export const goodsReceiptService = GoodsReceiptService;
