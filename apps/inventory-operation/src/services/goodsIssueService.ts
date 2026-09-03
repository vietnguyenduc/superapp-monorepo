import { getCurrentCompanyId, getCurrentUserId, apiClient } from '../lib/supabase';
import { InventoryRecord, InventorySourceType } from '../types';
import { fallbackService } from './fallbackService';
import { BaseService, ServiceResponse } from './baseService';
import { InventoryMapper } from './mappers/inventoryMapper';

/**
 * GoodsIssueService — wraps inventory_records for "Xuất hàng" workflow.
 *
 * Two modes:
 *   1. Manual entry — user types in outbound records (output_quantity > 0)
 *   2. Sales sync   — query `sales_records` table (shared with Sales app),
 *                     map each sales record → inventory_record with
 *                     sourceType = 'sales_sync' + referenceId = sales_record.id
 */

export interface GoodsIssueInput {
  date: string;
  productCode: string;
  productName?: string;
  outputQuantity: number;
  reason?: string;
  notes?: string;
  sourceType?: InventorySourceType;
  referenceId?: string;
  branch?: string;
}

export interface SalesSyncRecord {
  id: string;
  date: string;
  product_id: string;
  productCode?: string;
  productName?: string;
  sales_quantity: number;
  promotion_quantity?: number;
  unit: string;
  customer_id?: string | null;
  alreadySynced: boolean; // true if inventory_record with reference_id = this id exists
}

export class GoodsIssueService extends BaseService {
  /**
   * Get goods issues (outbound records with output_quantity > 0).
   */
  static async getGoodsIssues(filters?: {
    dateFrom?: string;
    dateTo?: string;
    sourceType?: InventorySourceType;
  }): Promise<ServiceResponse<InventoryRecord[]>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient
          .from('inventory_records')
          .select(`*, product:products(id, name, business_code, category, input_unit, output_unit)`)
          .order('date', { ascending: false });

        if (companyId) query = query.eq('company_id', companyId);
        if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
        if (filters?.dateTo) query = query.lte('date', filters.dateTo);
        if (filters?.sourceType) {
          query = query.eq('source_type', filters.sourceType);
        } else {
          // Default: show manual + sales_sync outbound
          query = query.or(
            `source_type.eq.${InventorySourceType.SALES_SYNC},source_type.eq.${InventorySourceType.MANUAL}`
          );
        }

        const res = await query;
        if (res.data) res.data = res.data.map((item: any) => InventoryMapper.mapDbToInventory(item));
        return res;
      },
      () => fallbackService.getInventoryRecords({
        dateFrom: filters?.dateFrom ? new Date(filters.dateFrom) : undefined,
      })
    );
  }

  /**
   * Create a single goods issue (outbound record).
   */
  static async createGoodsIssue(
    input: GoodsIssueInput
  ): Promise<ServiceResponse<InventoryRecord>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();

        // Resolve product_id from business_code
        let productQuery = apiClient
          .from('products')
          .select('id, name')
          .eq('business_code', input.productCode);
        if (companyId) productQuery = productQuery.eq('company_id', companyId);
        const productRow = await productQuery.single();
        if (!productRow.data) throw new Error('Không tìm thấy sản phẩm: ' + input.productCode);

        const row = InventoryMapper.mapInventoryToDb({
          date: new Date(input.date),
          productCode: input.productCode,
          productName: input.productName || productRow.data.name,
          inputQuantity: 0,
          outputQuantity: input.outputQuantity,
          rawMaterialStock: 0,
          rawMaterialUnit: '',
          processedStock: 0,
          processedUnit: '',
          finishedProductStock: 0,
          finishedProductUnit: '',
          notes: input.reason || input.notes,
          sourceType: input.sourceType || InventorySourceType.MANUAL,
          referenceId: input.referenceId,
          branch: input.branch,
          productId: productRow.data.id,
          createdBy: userId || 'system',
          updatedBy: userId || 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        if (companyId) row.company_id = companyId;

        const res = await apiClient
          .from('inventory_records')
          .insert([row])
          .select(`*, product:products(id, name, business_code, category, input_unit, output_unit)`)
          .single();
        if (res.data) res.data = InventoryMapper.mapDbToInventory(res.data);
        return res;
      },
      () => fallbackService.createInventoryRecord({
        date: new Date(input.date),
        productCode: input.productCode,
        productName: input.productName || '',
        inputQuantity: 0,
        outputQuantity: input.outputQuantity,
        rawMaterialStock: 0,
        rawMaterialUnit: '',
        processedStock: 0,
        processedUnit: '',
        finishedProductStock: 0,
        finishedProductUnit: '',
        notes: input.reason || input.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'trial',
        updatedBy: 'trial',
      } as any)
    );
  }

  /**
   * Bulk create goods issues from Excel/CSV import.
   */
  static async bulkCreateGoodsIssues(
    inputs: GoodsIssueInput[]
  ): Promise<ServiceResponse<{ created: number; errors: string[] }>> {
    const errors: string[] = [];
    let created = 0;

    for (const input of inputs) {
      const res = await this.createGoodsIssue(input);
      if (res.success) {
        created++;
      } else {
        errors.push(`${input.productCode} (${input.date}): ${res.error}`);
      }
    }

    return { success: true, data: { created, errors } };
  }

  /**
   * Fetch sales_records from the shared Supabase table for sync preview.
   * Returns records in the date range, with a flag indicating whether each
   * has already been synced (inventory_record with reference_id exists).
   */
  static async getSalesRecordsForSync(
    dateFrom: string,
    dateTo: string
  ): Promise<ServiceResponse<SalesSyncRecord[]>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();

        // 1. Fetch sales_records in date range
        let salesQuery = apiClient
          .from('sales_records')
          .select(`*, product:products(id, name, business_code)`)
          .gte('date', dateFrom)
          .lte('date', dateTo)
          .order('date', { ascending: false });
        if (companyId) salesQuery = salesQuery.eq('company_id', companyId);
        const salesRes = await salesQuery;

        if (salesRes.error) return salesRes;

        // 2. Fetch existing synced inventory_record reference_ids
        let syncQuery = apiClient
          .from('inventory_records')
          .select('reference_id')
          .eq('source_type', InventorySourceType.SALES_SYNC);
        if (companyId) syncQuery = syncQuery.eq('company_id', companyId);
        const syncRes = await syncQuery;

        const syncedIds = new Set(
          (syncRes.data || []).map((r: any) => r.reference_id).filter(Boolean)
        );

        // 3. Map to SalesSyncRecord with alreadySynced flag
        const records: SalesSyncRecord[] = (salesRes.data || []).map((s: any) => ({
          id: s.id,
          date: s.date,
          product_id: s.product_id,
          productCode: s.product?.business_code,
          productName: s.product?.name,
          sales_quantity: Number(s.sales_quantity || 0),
          promotion_quantity: Number(s.promotion_quantity || 0),
          unit: s.unit,
          customer_id: s.customer_id,
          alreadySynced: syncedIds.has(s.id),
        }));

        return { data: records, error: null };
      },
      // Fallback: use mock sales records
      async () => {
        const { data } = await fallbackService.getSalesRecords({
          dateFrom: new Date(dateFrom),
          dateTo: new Date(dateTo),
        });
        const records: SalesSyncRecord[] = (data || []).map((s: any) => ({
          id: s.id,
          date: s.date instanceof Date ? s.date.toISOString().split('T')[0] : s.date,
          product_id: s.productId || s.product_id || '',
          productCode: s.productCode,
          productName: s.productName,
          sales_quantity: s.quantitySold || s.sales_quantity || 0,
          unit: s.unit || 'ly',
          customer_id: null,
          alreadySynced: false,
        }));
        return { data: records, error: null };
      }
    );
  }

  /**
   * Sync selected sales_records → create inventory_records (goods issues).
   * Skips records that are already synced (checked by reference_id).
   */
  static async syncFromSalesRecords(
    salesRecords: SalesSyncRecord[]
  ): Promise<ServiceResponse<{ created: number; skipped: number; errors: string[] }>> {
    const errors: string[] = [];
    let created = 0;
    let skipped = 0;

    for (const sr of salesRecords) {
      if (sr.alreadySynced) {
        skipped++;
        continue;
      }

      if (!sr.productCode) {
        errors.push(`Sales record ${sr.id}: không có mã sản phẩm`);
        continue;
      }

      const res = await this.createGoodsIssue({
        date: sr.date,
        productCode: sr.productCode,
        productName: sr.productName,
        outputQuantity: sr.sales_quantity,
        notes: `Đồng bộ từ bán hàng (sales_record: ${sr.id})`,
        sourceType: InventorySourceType.SALES_SYNC,
        referenceId: sr.id,
      });

      if (res.success) {
        created++;
      } else {
        errors.push(`Sales record ${sr.id}: ${res.error}`);
      }
    }

    return { success: true, data: { created, skipped, errors } };
  }

  /**
   * Delete a goods issue record.
   */
  static async deleteGoodsIssue(id: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient.from('inventory_records').delete().eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const res = await query;
        return res;
      },
      () => fallbackService.deleteInventoryRecord(id)
    );
  }
}

export const goodsIssueService = GoodsIssueService;
