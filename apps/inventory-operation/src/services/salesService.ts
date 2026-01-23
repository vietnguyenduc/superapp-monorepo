import { supabase } from '../lib/supabase';
import { SalesRecord, ApiResponse } from '../types';
import { fallbackService } from './fallbackService';

const TABLES = {
  SALES_RECORDS: 'sales_records',
  PRODUCTS: 'products'
} as const;

// Helper function to handle Supabase responses
const handleSupabaseResponse = <T>(data: T | null, error: any, operation: string): ApiResponse<T> => {
  if (error) {
    console.error(`Supabase error in ${operation}:`, error);
    return {
      success: false,
      message: `Lỗi ${operation}: ${error.message || 'Không xác định'}`,
      data: null
    };
  }

  return {
    success: true,
    message: `${operation} thành công`,
    data
  };
};

// Helper function for success responses
const handleSupabaseSuccess = <T>(data: T, operation: string): ApiResponse<T> => {
  return {
    success: true,
    message: `${operation} thành công`,
    data
  };
};

export const salesService = {
  // Get all sales records with product information
  async getAllSalesRecords(): Promise<ApiResponse<SalesRecord[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SALES_RECORDS)
        .select(`
          *,
          product:products(
            id,
            name,
            business_code,
            category,
            input_unit,
            output_unit,
            business_status
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error in getAllSalesRecords:', error);
        console.warn('Database error, using fallback service for sales records');
        
        // Use fallback service when database fails
        const fallbackResponse = await fallbackService.getSalesRecords({});
        
        return {
          success: !fallbackResponse.error,
          message: fallbackResponse.error || 'Đã tải dữ liệu mẫu báo cáo bán hàng',
          data: fallbackResponse.data || []
        };
      }

      return handleSupabaseResponse(data, error, 'tải danh sách báo cáo bán hàng');
    } catch (error) {
      console.error('Error in getAllSalesRecords:', error);
      console.warn('Database error, using fallback service for sales records');
      
      // Use fallback service when database fails
      const fallbackResponse = await fallbackService.getSalesRecords({});
      
      return {
        success: !fallbackResponse.error,
        message: fallbackResponse.error || 'Đã tải dữ liệu mẫu báo cáo bán hàng',
        data: fallbackResponse.data || []
      };
    }
  },

  // Get sales records by date range
  async getSalesRecordsByDateRange(startDate: string, endDate: string): Promise<ApiResponse<SalesRecord[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SALES_RECORDS)
        .select(`
          *,
          product:products(
            id,
            name,
            business_code,
            category,
            input_unit,
            output_unit,
            business_status
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      return handleSupabaseResponse(data, error, 'tải báo cáo bán hàng theo khoảng thời gian');
    } catch (error) {
      console.error('Error in getSalesRecordsByDateRange:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tải báo cáo theo thời gian',
        data: null
      };
    }
  },

  // Get sales records by product
  async getSalesRecordsByProduct(productId: string): Promise<ApiResponse<SalesRecord[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SALES_RECORDS)
        .select(`
          *,
          product:products(
            id,
            name,
            business_code,
            category,
            input_unit,
            output_unit,
            business_status
          )
        `)
        .eq('product_id', productId)
        .order('date', { ascending: false });

      return handleSupabaseResponse(data, error, 'tải báo cáo bán hàng theo sản phẩm');
    } catch (error) {
      console.error('Error in getSalesRecordsByProduct:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tải báo cáo theo sản phẩm',
        data: null
      };
    }
  },

  // Create new sales record
  async createSalesRecord(recordData: Omit<SalesRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<SalesRecord>> {
    try {
      // Get current user (TODO: Replace with actual auth)
      const currentUser = 'current-user-id';
      
      const newRecord = {
        ...recordData,
        created_by: currentUser,
        updated_by: currentUser
      };

      const { data, error } = await supabase
        .from(TABLES.SALES_RECORDS)
        .insert([newRecord])
        .select(`
          *,
          product:products(
            id,
            name,
            business_code,
            category,
            input_unit,
            output_unit,
            business_status
          )
        `)
        .single();

      return handleSupabaseResponse(data, error, 'tạo báo cáo bán hàng');
    } catch (error) {
      console.error('Error in createSalesRecord:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tạo báo cáo bán hàng',
        data: null
      };
    }
  },

  // Update sales record
  async updateSalesRecord(id: string, updates: Partial<SalesRecord>): Promise<ApiResponse<SalesRecord>> {
    try {
      // Get current user (TODO: Replace with actual auth)
      const currentUser = 'current-user-id';
      
      const updateData = {
        ...updates,
        updated_by: currentUser,
        updated_at: new Date().toISOString()
      };

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.created_by;

      const { data, error } = await supabase
        .from(TABLES.SALES_RECORDS)
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
            output_unit,
            business_status
          )
        `)
        .single();

      return handleSupabaseResponse(data, error, 'cập nhật báo cáo bán hàng');
    } catch (error) {
      console.error('Error in updateSalesRecord:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi cập nhật báo cáo bán hàng',
        data: null
      };
    }
  },

  // Delete sales record
  async deleteSalesRecord(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.SALES_RECORDS)
        .delete()
        .eq('id', id);

      if (error) {
        return handleSupabaseResponse(null, error, 'xóa báo cáo bán hàng');
      }

      return handleSupabaseSuccess(true, 'xóa báo cáo bán hàng');
    } catch (error) {
      console.error('Error in deleteSalesRecord:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi xóa báo cáo bán hàng',
        data: null
      };
    }
  },

  // Import multiple sales records
  async importSalesRecords(records: Omit<SalesRecord, 'id' | 'created_at' | 'updated_at'>[]): Promise<ApiResponse<SalesRecord[]>> {
    try {
      // Get current user (TODO: Replace with actual auth)
      const currentUser = 'current-user-id';
      
      const recordsToInsert = records.map(record => ({
        ...record,
        created_by: currentUser,
        updated_by: currentUser
      }));

      const { data, error } = await supabase
        .from(TABLES.SALES_RECORDS)
        .insert(recordsToInsert)
        .select(`
          *,
          product:products(
            id,
            name,
            business_code,
            category,
            input_unit,
            output_unit,
            business_status
          )
        `);

      return handleSupabaseResponse(data, error, 'import báo cáo bán hàng');
    } catch (error) {
      console.error('Error in importSalesRecords:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi import báo cáo bán hàng',
        data: null
      };
    }
  },

  // Get sales statistics
  async getSalesStatistics(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    try {
      let query = supabase
        .from(TABLES.SALES_RECORDS)
        .select(`
          date,
          sales_quantity,
          promotion_quantity,
          product:products(name, category)
        `);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        return handleSupabaseResponse(null, error, 'tải thống kê bán hàng');
      }

      // Calculate statistics
      const stats = data?.reduce((acc: any, record: any) => {
        acc.totalSales += record.sales_quantity;
        acc.totalPromotion += record.promotion_quantity;
        acc.totalRecords += 1;
        
        // Group by category
        const category = record.product?.category || 'Khác';
        if (!acc.byCategory[category]) {
          acc.byCategory[category] = {
            sales: 0,
            promotion: 0,
            total: 0
          };
        }
        acc.byCategory[category].sales += record.sales_quantity;
        acc.byCategory[category].promotion += record.promotion_quantity;
        acc.byCategory[category].total += record.sales_quantity + record.promotion_quantity;

        return acc;
      }, {
        totalSales: 0,
        totalPromotion: 0,
        totalRecords: 0,
        byCategory: {}
      });

      return handleSupabaseSuccess(stats, 'tải thống kê bán hàng');
    } catch (error) {
      console.error('Error in getSalesStatistics:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tải thống kê bán hàng',
        data: null
      };
    }
  },

  // Test connection
  async testConnection(): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SALES_RECORDS)
        .select('count(*)', { count: 'exact', head: true });

      return handleSupabaseResponse(true, error, 'kiểm tra kết nối sales service');
    } catch (error) {
      console.error('Error in testConnection:', error);
      return {
        success: false,
        message: 'Lỗi kết nối đến sales service',
        data: null
      };
    }
  }
};
