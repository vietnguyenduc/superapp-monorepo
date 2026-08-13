import { getCurrentCompanyId, getCurrentUserId, getCurrentUserRole, getCurrentBranchId, supabase } from "../lib/supabase";
import { SpecialOutboundRecord, ApprovalLog } from '../types';
import { BaseService, ServiceResponse } from './baseService';

export class SpecialOutboundService extends BaseService {
  static async getAllRecords(): Promise<ServiceResponse<SpecialOutboundRecord[]>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = supabase
          .from('special_outbound_records')
          .select('*, product:products(id, name, business_code, category, input_unit, output_unit, business_status)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });
        if (companyId) query = query.eq('company_id', companyId);
        const { data, error } = await query;
        return { data, error };
      },
      async () => ({ success: true, data: [], error: null })
    );
  }

  static async getRecordsByStatus(status: string): Promise<ServiceResponse<SpecialOutboundRecord[]>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = supabase
          .from('special_outbound_records')
          .select('*, product:products(id, name, business_code, category, input_unit, output_unit, business_status)')
          .eq('approval_status', status)
          .order('date', { ascending: false });
        if (companyId) query = query.eq('company_id', companyId);
        const { data, error } = await query;
        return { data, error };
      },
      async () => ({ success: true, data: [], error: null })
    );
  }

  static async createRecord(recordData: Omit<SpecialOutboundRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<SpecialOutboundRecord>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();
        const branchId = await getCurrentBranchId();
        if (!userId) {
          return { data: null, error: { message: 'Không xác định người dùng' } };
        }
        // Strip UI-only / non-DB fields and map to the actual table columns
        const { created_by, updated_by, requestedBy, requested_by, approval_status, ...rest } = recordData as any;
        const newRecord: any = {
          ...rest,
          approval_status: 'pending',
          requested_by: userId,
          company_id: companyId,
          branch_id: branchId,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from('special_outbound_records')
          .insert([newRecord])
          .select('*, product:products(id, name, business_code, category, input_unit, output_unit, business_status)')
          .maybeSingle();

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
        const { created_by, updated_by, requestedBy, requested_by, approval_status, ...rest } = recordData as any;
        const mock = { ...rest, id: 'mock-' + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), approval_status: 'pending' as const, requested_by: 'mock-user' };
        return { success: true, data: mock, error: null };
      }
    );
  }

  static async updateRecord(id: string, updates: Partial<SpecialOutboundRecord>): Promise<ServiceResponse<SpecialOutboundRecord>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();
        // Do not allow changing ownership/tenant fields via this path
        const { created_by, updated_by, requestedBy, requested_by, company_id, branch_id, ...rest } = updates as any;
        const updatePayload: any = {
          ...rest,
          updated_at: new Date().toISOString(),
        };
        let query = supabase
          .from('special_outbound_records')
          .update(updatePayload)
          .eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const { data, error } = await query
          .select('*, product:products(id, name, business_code, category, input_unit, output_unit, business_status)')
          .maybeSingle();

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
        const companyId = await getCurrentCompanyId();
        await supabase.from('approval_logs').delete().eq('record_id', id);
        let query = supabase.from('special_outbound_records').delete().eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const { error } = await query;
        return { data: !error, error };
      },
      async () => ({ success: true, data: true, error: null })
    );
  }

  static async approveRecord(id: string, comment?: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();
        let query = supabase
          .from('special_outbound_records')
          .update({
            approval_status: 'approved',
            approved_by: userId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const { error } = await query;

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
        const companyId = await getCurrentCompanyId();
        let query = supabase
          .from('special_outbound_records')
          .update({
            approval_status: 'rejected',
            approved_by: userId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            rejection_reason: comment,
          })
          .eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const { error } = await query;

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
        const { data, error } = await query;
        return { data, error };
      },
      async () => ({ success: true, data: [], error: null })
    );
  }

  static async createApprovalLog(logData: { record_id: string; action: string; comment?: string; user_id: string | null; user_name: string }): Promise<ServiceResponse<ApprovalLog>> {
    return this.execute(
      async () => {
        if (!logData.user_id) {
          return { data: null, error: { message: 'Thiếu user_id cho approval log' }, status: 400 };
        }
        const userRole = await getCurrentUserRole();
        const status = (logData.action === 'approved' || logData.action === 'rejected') ? logData.action : 'pending';
        const payload = {
          record_type: 'special_outbound',
          record_id: logData.record_id,
          action: logData.action,
          status,
          comment: logData.comment || null,
          user_id: logData.user_id,
          user_name: logData.user_name,
          user_role: userRole || 'staff',
        };
        return await supabase.from('approval_logs').insert([payload]).select().maybeSingle();
      },
      async () => ({ success: true, data: null as any, error: null })
    );
  }

  static async getStatistics(): Promise<ServiceResponse<any>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = supabase
          .from('special_outbound_records')
          .select('approval_status, quantity, reason, product:products(category)');
        if (companyId) query = query.eq('company_id', companyId);
        const { data, error } = await query;

        if (error) return { error };

        const stats = data?.reduce((acc: any, record: any) => {
          acc.total += 1;
          const status = record.approval_status ?? 'unknown';
          acc[status] = (acc[status] || 0) + 1;
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
