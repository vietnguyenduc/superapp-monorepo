import { BaseService } from "@superapp/shared-utils";
import { apiClient } from "./supabase";
import { trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateTransactionTypeData, transformRawTransactionType } from "./businessLogic";
import { insertWithFallback, updateWithFallback } from "./updateHelpers";

export class TransactionTypeService extends BaseService {
  static async getTransactionTypes(companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("transaction_types").select("*");
        if (companyId) query = query.or(`company_id.eq.${companyId},company_id.is.null`);
        const { data, error } = await query;
        
        if (error || !data) return { data: [], error: error || { message: "Not found" } };
        
        const allTypes = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color || "blue",
          isActive: t.is_active !== false,
          math_factor: t.math_factor ?? 1,
          impact_type: t.impact_type ?? "increase",
          company_id: t.company_id,
        }));
        
        return { data: allTypes, error: null };
      },
      async () => {
        let data = trialGet("transaction_types") || [];
        if (companyId) data = data.filter((t: any) => !t.company_id || t.company_id === companyId);
        
        const allTypes = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color || "blue",
          isActive: t.is_active !== false,
          math_factor: t.math_factor ?? 1,
          impact_type: t.impact_type ?? "increase",
          company_id: t.company_id,
        }));
        
        return { data: allTypes, error: null };
      }
    );
  }

  static async upsertTransactionType(payload: Record<string, unknown>) {
    return this.execute(
      async () => {
        const validation = validateTransactionTypeData(payload);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        const name = String(payload.name || "");
        const companyId = payload.company_id ? String(payload.company_id) : null;

        if (companyId && !payload.id) {
          const { data: existing } = await apiClient.from("transaction_types").select("id").eq("company_id", companyId).eq("name", name);
          if (existing && existing.length > 0) {
            return { data: null, error: { message: `Loại giao dịch "${name}" đã tồn tại. Vui lòng chọn tên khác.` } };
          }
        }

        if (payload.id) {
          const updatePayload: Record<string, unknown> = {
            ...payload,
            updated_at: new Date().toISOString(),
          };
          delete updatePayload.id;
          delete updatePayload.created_at;
          const { data, error } = await updateWithFallback("transaction_types", String(payload.id), updatePayload);
          return { data, error };
        } else {
          const transformed = transformRawTransactionType(payload, true) as Record<string, unknown>;
          const { data, error } = await insertWithFallback("transaction_types", transformed);
          return { data, error };
        }
      },
      async () => {
        const validation = validateTransactionTypeData(payload);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        const name = String(payload.name || "");
        const companyId = payload.company_id ? String(payload.company_id) : null;

        if (companyId && !payload.id) {
          const existing = (trialGet("transaction_types") || []).find((t: any) => t.company_id === companyId && t.name === name);
          if (existing) {
            return { data: null, error: { message: `Loại giao dịch "${name}" đã tồn tại. Vui lòng chọn tên khác.` } };
          }
        }

        if (payload.id) {
          const updatePayload: Record<string, unknown> = {
            ...payload,
            updated_at: new Date().toISOString(),
          };
          delete updatePayload.id;
          delete updatePayload.created_at;
          const result = trialUpdate("transaction_types", String(payload.id), updatePayload);
          return { data: result, error: null };
        } else {
          const transformed = transformRawTransactionType(payload, false) as Record<string, unknown>;
          const result = trialInsert("transaction_types", transformed);
          return { data: result, error: null };
        }
      }
    );
  }

  static async toggleTransactionType(id: string, isActive: boolean) {
    return this.execute(
      async () => {
        if (!isActive) {
          const { data: txs } = await apiClient.from("transactions").select("id").eq("transaction_type", id).limit(1);
          if (txs && txs.length > 0) {
            return { data: null, error: { message: "Không thể vô hiệu hóa loại giao dịch vì đang được sử dụng trong giao dịch." } };
          }
        }
        
        const { error } = await apiClient.from("transaction_types").update({ is_active: isActive }).eq("id", id);
        return { data: null, error };
      },
      async () => {
        if (!isActive) {
          const txs = (trialGet("transactions") || []).find((t: any) => t.transaction_type === id);
          if (txs) {
            return { data: null, error: { message: "Không thể vô hiệu hóa loại giao dịch vì đang được sử dụng trong giao dịch." } };
          }
        }
        trialUpdate("transaction_types", id, { is_active: isActive });
        return { data: null, error: null };
      }
    );
  }

  static async deleteTransactionType(id: string) {
    return this.execute(
      async () => {
        const { data: txs } = await apiClient.from("transactions").select("id").eq("transaction_type", id).limit(1);
        if (txs && txs.length > 0) {
          return { data: null, error: { message: "Không thể xóa loại giao dịch vì đang được sử dụng trong giao dịch. Vui lòng vô hiệu hóa thay vì xóa." } };
        }
        
        const { error } = await apiClient.from("transaction_types").delete().eq("id", id);
        return { data: null, error };
      },
      async () => {
        const txs = (trialGet("transactions") || []).find((t: any) => t.transaction_type === id);
        if (txs) {
          return { data: null, error: { message: "Không thể xóa loại giao dịch vì đang được sử dụng trong giao dịch. Vui lòng vô hiệu hóa thay vì xóa." } };
        }
        trialDelete("transaction_types", id);
        return { data: null, error: null };
      }
    );
  }
}

export const transactionTypeService = {
  getTransactionTypes: TransactionTypeService.getTransactionTypes.bind(TransactionTypeService),
  upsertTransactionType: TransactionTypeService.upsertTransactionType.bind(TransactionTypeService),
  toggleTransactionType: TransactionTypeService.toggleTransactionType.bind(TransactionTypeService),
  deleteTransactionType: TransactionTypeService.deleteTransactionType.bind(TransactionTypeService),
};
