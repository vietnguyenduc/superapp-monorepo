import { supabase, handleSupabaseError, getCurrentUserId } from '../lib/supabase';
import { InventoryRecord } from '../types';
import { fallbackService } from './fallbackService';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class InventoryService {
  // Get all inventory records with optional filters
  static async getInventoryRecords(filters?: {
    date?: string;
    productId?: string;
    limit?: number;
  }): Promise<ApiResponse<InventoryRecord[]>> {
    try {
      let query = supabase
        .from('inventory_records')
        .select(`
          *,
          product:products(
            id,
            name,
            business_code,
            category,
            input_unit,
            output_unit
          )
        `)
        .order('date', { ascending: false });

      if (filters?.date) {
        query = query.eq('date', filters.date);
      }
      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching inventory records:', error);
        console.warn('Database error, using fallback service for inventory records');
        
        // Use fallback service when database fails
        const fallbackResponse = await fallbackService.getInventoryRecords({
          dateFrom: filters?.date ? new Date(filters.date) : undefined,
          productCode: filters?.productId
        });
        
        return {
          success: !fallbackResponse.error,
          data: fallbackResponse.data || [],
          error: fallbackResponse.error
        };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getInventoryRecords:', error);
      return { success: false, error: 'Không thể tải dữ liệu tồn kho' };
    }
  }

  // Get a single inventory record by ID
  static async getInventoryRecord(id: string): Promise<ApiResponse<InventoryRecord>> {
    try {
      const { data, error } = await supabase
        .from('inventory_records')
        .select(`
          *,
          product:products(
            id,
            name,
            business_code,
            category,
            input_unit,
            output_unit
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching inventory record:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getInventoryRecord:', error);
      return { success: false, error: 'Không thể tải bản ghi tồn kho' };
    }
  }

  // Create new inventory record
  static async createInventoryRecord(
    record: Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<InventoryRecord>> {
    try {
      const userId = await getCurrentUserId();
      
      const recordData = {
        ...record,
        created_by: userId,
        updated_by: userId
      };

      const { data, error } = await supabase
        .from('inventory_records')
        .insert([recordData])
        .select(`
          *,
          product:products(
            id,
            name,
            business_code,
            category,
            input_unit,
            output_unit
          )
        `)
        .single();

      if (error) {
        console.error('Error creating inventory record:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createInventoryRecord:', error);
      return { success: false, error: 'Không thể tạo bản ghi tồn kho' };
    }
  }

  // Update inventory record
  static async updateInventoryRecord(
    id: string,
    updates: Partial<InventoryRecord>
  ): Promise<ApiResponse<InventoryRecord>> {
    try {
      const userId = await getCurrentUserId();
      
      const updateData = {
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('inventory_records')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          product:products(
            id,
            name,
            business_code,
            category,
            input_unit,
            output_unit
          )
        `)
        .single();

      if (error) {
        console.error('Error updating inventory record:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateInventoryRecord:', error);
      return { success: false, error: 'Không thể cập nhật bản ghi tồn kho' };
    }
  }

  // Delete an inventory record
  static async deleteInventoryRecord(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('inventory_records')
        .delete()
        .eq('id', id);

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(true);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Get inventory summary for a specific date range
  static async getInventorySummary(dateFrom: Date, dateTo: Date): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVENTORY_RECORDS)
        .select(`
          product_code,
          product_name,
          input_quantity,
          raw_material_stock,
          processed_stock,
          finished_product_stock
        `)
        .gte('date', dateFrom.toISOString())
        .lte('date', dateTo.toISOString());

      if (error) {
        return handleSupabaseError(error);
      }

      // Group by product and calculate totals
      const summary = (data || []).reduce((acc: any, record: any) => {
        const key = record.product_code;
        if (!acc[key]) {
          acc[key] = {
            productCode: record.product_code,
            productName: record.product_name,
            totalInput: 0,
            totalRawMaterial: 0,
            totalProcessed: 0,
            totalFinished: 0,
          };
        }
        
        acc[key].totalInput += record.input_quantity || 0;
        acc[key].totalRawMaterial += record.raw_material_stock || 0;
        acc[key].totalProcessed += record.processed_stock || 0;
        acc[key].totalFinished += record.finished_product_stock || 0;
        
        return acc;
      }, {});

      return handleSupabaseSuccess(Object.values(summary));
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Import inventory records from Excel/CSV data
  static async importInventoryRecords(records: Partial<InventoryRecord>[]): Promise<ApiResponse<InventoryRecord[]>> {
    try {
      const recordsToInsert = records.map(record => ({
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from(TABLES.INVENTORY_RECORDS)
        .insert(recordsToInsert)
        .select();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
}
