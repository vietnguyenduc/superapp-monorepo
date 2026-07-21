import { supabase, getCurrentUserId , apiClient} from "../lib/supabase";
import { InventoryRecord } from '../types';
import { fallbackService } from './fallbackService';
import { BaseService, ServiceResponse } from './baseService';
import { InventoryMapper } from './mappers/inventoryMapper';

export class InventoryService extends BaseService {
  static async getInventoryRecords(filters?: {
    date?: string;
    productId?: string;
    limit?: number;
  }): Promise<ServiceResponse<InventoryRecord[]>> {
    return this.execute(
      async () => {
        let query = apiClient.from('inventory_records').select(`
          *,
          product:products(id, name, business_code, category, input_unit, output_unit)
        `).order('date', { ascending: false });

        if (filters?.date) query = query.eq('date', filters.date);
        if (filters?.productId) query = query.eq('product_id', filters.productId);
        if (filters?.limit) query = query.limit(filters.limit);

        const res = await query;
        if (res.data) res.data = res.data.map(item => InventoryMapper.mapDbToInventory(item));
        return res;
      },
      () => fallbackService.getInventoryRecords({
        dateFrom: filters?.date ? new Date(filters.date) : undefined,
        productCode: filters?.productId
      })
    );
  }

  static async getInventoryRecord(id: string): Promise<ServiceResponse<InventoryRecord>> {
    return this.execute(
      async () => {
        const res = await apiClient.from('inventory_records').select(`
          *,
          product:products(id, name, business_code, category, input_unit, output_unit)
        `).eq('id', id).single();
        if (res.data) res.data = InventoryMapper.mapDbToInventory(res.data);
        return res;
      },
      () => fallbackService.getProductById(id) // Note: fallbackService might need an inventory lookup by ID
    );
  }

  static async createInventoryRecord(record: Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<InventoryRecord>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const productRow = await apiClient.from('products').select('id').eq('business_code', record.productCode).single();
        if (productRow.error) throw new Error('Không tìm thấy sản phẩm: ' + record.productCode);

        const row = InventoryMapper.mapInventoryToDb({ ...record, productId: productRow.data.id, createdBy: userId, updatedBy: userId });
        const res = await apiClient.from('inventory_records').insert([row]).select(`
          *,
          product:products(id, name, business_code, category, input_unit, output_unit)
        `).single();
        if (res.data) res.data = InventoryMapper.mapDbToInventory(res.data);
        return res;
      },
      () => fallbackService.createInventoryRecord(record)
    );
  }

  static async updateInventoryRecord(id: string, updates: Partial<InventoryRecord>): Promise<ServiceResponse<InventoryRecord>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const row = InventoryMapper.mapInventoryToDb({ ...updates, updatedBy: userId, updatedAt: new Date() });
        const res = await apiClient.from('inventory_records').update(row).eq('id', id).select(`
          *,
          product:products(id, name, business_code, category, input_unit, output_unit)
        `).single();
        if (res.data) res.data = InventoryMapper.mapDbToInventory(res.data);
        return res;
      },
      () => fallbackService.updateInventoryRecord(id, updates)
    );
  }

  static async deleteInventoryRecord(id: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const { error } = await apiClient.from('inventory_records').delete().eq('id', id);
        return { data: !error, error };
      },
      () => fallbackService.deleteProduct(id) // Note: using deleteProduct as placeholder if needed
    );
  }

  static async getInventorySummary(dateFrom: Date, dateTo: Date): Promise<ServiceResponse<any[]>> {
    return this.execute(async () => {
      const { data, error } = await apiClient.from('inventory_records')
        .select('product_code, product_name, input_quantity, raw_material_stock, processed_stock, finished_product_stock')
        .gte('date', dateFrom.toISOString())
        .lte('date', dateTo.toISOString());
      
      if (error) return { error };

      const summary = (data || []).reduce((acc: any, record: any) => {
        const key = record.product_code;
        if (!acc[key]) {
          acc[key] = { productCode: record.product_code, productName: record.product_name, totalInput: 0, totalRawMaterial: 0, totalProcessed: 0, totalFinished: 0 };
        }
        acc[key].totalInput += record.input_quantity || 0;
        acc[key].totalRawMaterial += record.raw_material_stock || 0;
        acc[key].totalProcessed += record.processed_stock || 0;
        acc[key].totalFinished += record.finished_product_stock || 0;
        return acc;
      }, {});

      return { data: Object.values(summary) };
    });
  }

  static async importInventoryRecords(records: Partial<InventoryRecord>[]): Promise<ServiceResponse<InventoryRecord[]>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const rows = records.map(r => InventoryMapper.mapInventoryToDb({ ...r, createdBy: userId, updatedBy: userId }));
        const res = await apiClient.from('inventory_records').insert(rows).select(`
          *,
          product:products(id, name, business_code, category, input_unit, output_unit)
        `);
        if (res.data) res.data = res.data.map(item => InventoryMapper.mapDbToInventory(item));
        return res;
      },
      async () => {
        const results: InventoryRecord[] = [];
        for (const r of records) {
          const res = await fallbackService.createInventoryRecord(r as any);
          if (res.data) results.push(res.data);
        }
        return { data: results, error: null };
      }
    );
  }
}

export const inventoryService = InventoryService;
