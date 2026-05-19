import { supabase, getCurrentUserId } from '../lib/supabase';
import { SpecialOutboundRecord, ApprovalLog } from '../types';
import { BaseService, ServiceResponse } from './baseService';

export class SpecialOutboundService extends BaseService {
  static async getAllRecords(): Promise<ServiceResponse<SpecialOutboundRecord[]>> {
    return this.execute(
      async () => {
        const { data, error } = await supabase
          .from('special_outbound_records')
          .select('*, product:products(id, name, business_code, category, input_unit, output_unit, business_status)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });
        return { data, error };
      },
      async () => ({ success: true, data: [], error: null })
    );
  }

  static async getRecordsByStatus(status: string): Promise<ServiceResponse<SpecialOutboundRecord[]>> {
    return this.execute(
      async () => {
        const { data, error } = await supabase
          .from('special_outbound_records')
          .select('*, product:products(id, name, business_code, category, input_unit, output_unit, business_status)')
          .eq('approval_status', status)
          .order('date', { ascending: false });
        return { data, error };
      },
      async () => ({ success: true, data: [], error: null })
    );
  }

  static async createRecord(recordData: Omit<SpecialOutboundRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<SpecialOutboundRecord>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const newRecord = { ...recordData, approval_status: 'pending', created_by: userId, updated_by: userId };
        const { data, error } = await supabase
          .from('special_outbound_records')
          .insert([newRecord])
          .select('*, product:products(id, name, business_code, category, input_unit, output_unit, business_status)')
          .single();

        if (data) {
          await this.createApprovalLog({
            record_id: data.id,
            action: 'created',
            comment: 'Tạo yêu cầu xuất đặc biệt',
            user_id: userId,
            user_name: 'Hệ thống'
          });
        }
        return { data, error };
      },
      async () => {
        const mock = { ...recordData, id: 'mock-' + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), approval_status: 'pending' as const };
        return { success: true, data: mock, error: null };
      }
    );
  }

  static async updateRecord(id: string, updates: Partial<SpecialOutboundRecord>): Promise<ServiceResponse<SpecialOutboundRecord>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
          .from('special_outbound_records')
          .update({ ...updates, updated_by: userId, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*, product:products(id, name, business_code, category, input_unit, output_unit, business_status)')
          .single();

        if (data) {
          await this.createApprovalLog({
            record_id: id,
            action: 'updated',
            comment: 'Cập nhật yêu cầu xuất đặc biệt',
            user_id: userId,
            user_name: 'Hệ thống'
          });
        }
        return { data, error };
      },
      async () => ({ success: true, data: null, error: null })
    );
  }

  static async deleteRecord(id: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        await supabase.from('approval_logs').delete().eq('record_id', id);
        const { error } = await supabase.from('special_outbound_records').delete().eq('id', id);
        return { data: !error, error };
      },
      async () => ({ success: true, data: true, error: null })
    );
  }

  static async approveRecord(id: string, comment?: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
          .from('special_outbound_records')
          .update({ approval_status: 'approved', updated_by: userId, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) return { error };

        await this.createApprovalLog({
          record_id: id,
          action: 'approved',
          comment: comment || 'Phê duyệt yêu cầu xuất đặc biệt',
          user_id: userId,
          user_name: 'Hệ thống'
        });
        return { data: true };
      },
      async () => ({ success: true, data: true, error: null })
    );
  }

  static async rejectRecord(id: string, comment: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
          .from('special_outbound_records')
          .update({ approval_status: 'rejected', updated_by: userId, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) return { error };

        await this.createApprovalLog({
          record_id: id,
          action: 'rejected',
          comment,
          user_id: userId,
          user_name: 'Hệ thống'
        });
        return { data: true };
      },
      async () => ({ success: true, data: true, error: null })
    );
  }

  static async getApprovalLogs(recordId?: string): Promise<ServiceResponse<ApprovalLog[]>> {
    return this.execute(
      async () => {
        let query = supabase.from('approval_logs').select('*').order('created_at', { ascending: false });
        if (recordId) query = query.eq('record_id', recordId);
        return await query;
      },
      async () => ({ success: true, data: [], error: null })
    );
  }

  static async createApprovalLog(logData: Omit<ApprovalLog, 'id' | 'created_at'>): Promise<ServiceResponse<ApprovalLog>> {
    return this.execute(
      async () => {
        return await supabase.from('approval_logs').insert([logData]).select().single();
      },
      async () => ({ success: true, data: null as any, error: null })
    );
  }

  static async getStatistics(): Promise<ServiceResponse<any>> {
    return this.execute(
      async () => {
        const { data, error } = await supabase
          .from('special_outbound_records')
          .select('approval_status, quantity, reason, product:products(category)');
        
        if (error) return { error };

        const stats = data?.reduce((acc: any, record: any) => {
          acc.total += 1;
          acc[record.approval_status] = (acc[record.approval_status] || 0) + 1;
          acc.totalQuantity += record.quantity;
          if (!acc.byReason[record.reason]) acc.byReason[record.reason] = 0;
          acc.byReason[record.reason] += 1;
          const category = record.product?.category || 'Khác';
          if (!acc.byCategory[category]) acc.byCategory[category] = { count: 0, quantity: 0 };
          acc.byCategory[category].count += 1;
          acc.byCategory[category].quantity += record.quantity;
          return acc;
        }, { total: 0, pending: 0, approved: 0, rejected: 0, totalQuantity: 0, byReason: {}, byCategory: {} });

        return { data: stats };
      },
      async () => ({ success: true, data: {}, error: null })
    );
  }
}

export const specialOutboundService = SpecialOutboundService;
