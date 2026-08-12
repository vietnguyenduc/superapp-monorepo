import { BaseService } from "@superapp/shared-utils";
import { apiClient } from "./supabase";
import { trialGet, trialUpdate } from "./trialMockStore";

export class ApprovalService extends BaseService {
  static async updateEntityStatus(table: string, id: string, status: string, companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient
          .from(table)
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (companyId) query = query.eq("company_id", companyId);
        const { data, error } = await query;
        return { data, error };
      },
      async () => {
        const all = (trialGet(table as any) || []) as any[];
        const idx = all.findIndex((r) => r.id === id && (!companyId || r.company_id === companyId));
        if (idx === -1) return { data: null, error: { message: "Không tìm thấy dữ liệu cần duyệt" } };
        all[idx] = { ...all[idx], status, updated_at: new Date().toISOString() };
        return { data: all[idx], error: null };
      }
    );
  }
}

export const approvalService = {
  updateEntityStatus: ApprovalService.updateEntityStatus.bind(ApprovalService),
};
