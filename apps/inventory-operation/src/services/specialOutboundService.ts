import { supabase } from '../lib/supabase';
import { SpecialOutboundRecord, ApprovalLog, ApiResponse } from '../types';

const TABLES = {
  SPECIAL_OUTBOUND_RECORDS: 'special_outbound_records',
  APPROVAL_LOGS: 'approval_logs',
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

export const specialOutboundService = {
  // Get all special outbound records with product information
  async getAllRecords(): Promise<ApiResponse<SpecialOutboundRecord[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SPECIAL_OUTBOUND_RECORDS)
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

      return handleSupabaseResponse(data, error, 'tải danh sách xuất đặc biệt');
    } catch (error) {
      console.error('Error in getAllRecords:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tải danh sách xuất đặc biệt',
        data: null
      };
    }
  },

  // Get records by status
  async getRecordsByStatus(status: string): Promise<ApiResponse<SpecialOutboundRecord[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SPECIAL_OUTBOUND_RECORDS)
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
        .eq('approval_status', status)
        .order('date', { ascending: false });

      return handleSupabaseResponse(data, error, `tải danh sách xuất đặc biệt ${status}`);
    } catch (error) {
      console.error('Error in getRecordsByStatus:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tải danh sách theo trạng thái',
        data: null
      };
    }
  },

  // Create new special outbound record
  async createRecord(recordData: Omit<SpecialOutboundRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<SpecialOutboundRecord>> {
    try {
      // Get current user (TODO: Replace with actual auth)
      const currentUser = 'current-user-id';
      
      const newRecord = {
        ...recordData,
        approval_status: 'pending', // Always start as pending
        created_by: currentUser,
        updated_by: currentUser
      };

      const { data, error } = await supabase
        .from(TABLES.SPECIAL_OUTBOUND_RECORDS)
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

      if (data) {
        // Create initial approval log
        await this.createApprovalLog({
          record_id: data.id,
          action: 'created',
          comment: 'Tạo yêu cầu xuất đặc biệt',
          user_id: currentUser,
          user_name: 'Người dùng hiện tại' // TODO: Get from auth
        });
      }

      return handleSupabaseResponse(data, error, 'tạo yêu cầu xuất đặc biệt');
    } catch (error) {
      console.error('Error in createRecord:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tạo yêu cầu xuất đặc biệt',
        data: null
      };
    }
  },

  // Update special outbound record
  async updateRecord(id: string, updates: Partial<SpecialOutboundRecord>): Promise<ApiResponse<SpecialOutboundRecord>> {
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
        .from(TABLES.SPECIAL_OUTBOUND_RECORDS)
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

      if (data) {
        // Create approval log for update
        await this.createApprovalLog({
          record_id: id,
          action: 'updated',
          comment: 'Cập nhật yêu cầu xuất đặc biệt',
          user_id: currentUser,
          user_name: 'Người dùng hiện tại' // TODO: Get from auth
        });
      }

      return handleSupabaseResponse(data, error, 'cập nhật yêu cầu xuất đặc biệt');
    } catch (error) {
      console.error('Error in updateRecord:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi cập nhật yêu cầu xuất đặc biệt',
        data: null
      };
    }
  },

  // Delete special outbound record
  async deleteRecord(id: string): Promise<ApiResponse<boolean>> {
    try {
      // First, delete related approval logs
      await supabase
        .from(TABLES.APPROVAL_LOGS)
        .delete()
        .eq('record_id', id);

      // Then delete the record
      const { error } = await supabase
        .from(TABLES.SPECIAL_OUTBOUND_RECORDS)
        .delete()
        .eq('id', id);

      if (error) {
        return handleSupabaseResponse(null, error, 'xóa yêu cầu xuất đặc biệt');
      }

      return handleSupabaseSuccess(true, 'xóa yêu cầu xuất đặc biệt');
    } catch (error) {
      console.error('Error in deleteRecord:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi xóa yêu cầu xuất đặc biệt',
        data: null
      };
    }
  },

  // Approve record
  async approveRecord(id: string, comment?: string): Promise<ApiResponse<boolean>> {
    try {
      // Get current user (TODO: Replace with actual auth)
      const currentUser = 'current-user-id';

      // Update record status
      const { error: updateError } = await supabase
        .from(TABLES.SPECIAL_OUTBOUND_RECORDS)
        .update({
          approval_status: 'approved',
          updated_by: currentUser,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        return handleSupabaseResponse(null, updateError, 'phê duyệt yêu cầu');
      }

      // Create approval log
      await this.createApprovalLog({
        record_id: id,
        action: 'approved',
        comment: comment || 'Phê duyệt yêu cầu xuất đặc biệt',
        user_id: currentUser,
        user_name: 'Người dùng hiện tại' // TODO: Get from auth
      });

      return handleSupabaseSuccess(true, 'phê duyệt yêu cầu');
    } catch (error) {
      console.error('Error in approveRecord:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi phê duyệt yêu cầu',
        data: null
      };
    }
  },

  // Reject record
  async rejectRecord(id: string, comment: string): Promise<ApiResponse<boolean>> {
    try {
      // Get current user (TODO: Replace with actual auth)
      const currentUser = 'current-user-id';

      // Update record status
      const { error: updateError } = await supabase
        .from(TABLES.SPECIAL_OUTBOUND_RECORDS)
        .update({
          approval_status: 'rejected',
          updated_by: currentUser,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        return handleSupabaseResponse(null, updateError, 'từ chối yêu cầu');
      }

      // Create approval log
      await this.createApprovalLog({
        record_id: id,
        action: 'rejected',
        comment: comment,
        user_id: currentUser,
        user_name: 'Người dùng hiện tại' // TODO: Get from auth
      });

      return handleSupabaseSuccess(true, 'từ chối yêu cầu');
    } catch (error) {
      console.error('Error in rejectRecord:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi từ chối yêu cầu',
        data: null
      };
    }
  },

  // Get approval logs
  async getApprovalLogs(recordId?: string): Promise<ApiResponse<ApprovalLog[]>> {
    try {
      let query = supabase
        .from(TABLES.APPROVAL_LOGS)
        .select('*')
        .order('created_at', { ascending: false });

      if (recordId) {
        query = query.eq('record_id', recordId);
      }

      const { data, error } = await query;

      return handleSupabaseResponse(data, error, 'tải lịch sử phê duyệt');
    } catch (error) {
      console.error('Error in getApprovalLogs:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tải lịch sử phê duyệt',
        data: null
      };
    }
  },

  // Create approval log
  async createApprovalLog(logData: Omit<ApprovalLog, 'id' | 'created_at'>): Promise<ApiResponse<ApprovalLog>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.APPROVAL_LOGS)
        .insert([logData])
        .select()
        .single();

      return handleSupabaseResponse(data, error, 'tạo log phê duyệt');
    } catch (error) {
      console.error('Error in createApprovalLog:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tạo log phê duyệt',
        data: null
      };
    }
  },

  // Get statistics
  async getStatistics(): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SPECIAL_OUTBOUND_RECORDS)
        .select(`
          approval_status,
          quantity,
          reason,
          product:products(category)
        `);

      if (error) {
        return handleSupabaseResponse(null, error, 'tải thống kê xuất đặc biệt');
      }

      // Calculate statistics
      const stats = data?.reduce((acc: any, record: any) => {
        acc.total += 1;
        acc[record.approval_status] = (acc[record.approval_status] || 0) + 1;
        acc.totalQuantity += record.quantity;
        
        // Group by reason
        if (!acc.byReason[record.reason]) {
          acc.byReason[record.reason] = 0;
        }
        acc.byReason[record.reason] += 1;

        // Group by category
        const category = record.product?.category || 'Khác';
        if (!acc.byCategory[category]) {
          acc.byCategory[category] = {
            count: 0,
            quantity: 0
          };
        }
        acc.byCategory[category].count += 1;
        acc.byCategory[category].quantity += record.quantity;

        return acc;
      }, {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalQuantity: 0,
        byReason: {},
        byCategory: {}
      });

      return handleSupabaseSuccess(stats, 'tải thống kê xuất đặc biệt');
    } catch (error) {
      console.error('Error in getStatistics:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tải thống kê xuất đặc biệt',
        data: null
      };
    }
  },

  // Test connection
  async testConnection(): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SPECIAL_OUTBOUND_RECORDS)
        .select('count(*)', { count: 'exact', head: true });

      return handleSupabaseResponse(true, error, 'kiểm tra kết nối special outbound service');
    } catch (error) {
      console.error('Error in testConnection:', error);
      return {
        success: false,
        message: 'Lỗi kết nối đến special outbound service',
        data: null
      };
    }
  }
};
