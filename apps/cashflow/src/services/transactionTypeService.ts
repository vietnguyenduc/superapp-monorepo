import { BaseService } from "@superapp/shared-utils";
import { apiClient } from "./supabase";
import { trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateTransactionTypeData, transformRawTransactionType, normalizeTransactionType } from "./businessLogic";
import { insertWithFallback, updateWithFallback } from "./updateHelpers";

export class TransactionTypeService extends BaseService {
  static async getTransactionTypes(companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("transaction_types").select("*");
        if (companyId) query = query.or(`company_id.eq.${companyId},company_id.is.null`);
        const { data, error } = await query;
        
        if (error || !data) return { data: [], error: error || { message: "Not found" } };
        
        const allTypes = (data as Record<string, unknown>[]).map((t) => ({
          id: String(t.id ?? ""),
          name: String(t.name ?? ""),
          color: String(t.color || "blue"),
          isActive: t.is_active !== false,
          math_factor: Number(t.math_factor ?? 1),
          impact_type: String(t.impact_type ?? "increase"),
          company_id: typeof t.company_id === "string" ? t.company_id : null,
        }));

        return { data: allTypes, error: null };
      },
      async () => {
        let data = (trialGet("transaction_types") || []) as Record<string, unknown>[];
        if (companyId) data = data.filter((t) => !t.company_id || t.company_id === companyId);

        const allTypes = data.map((t) => ({
          id: String(t.id ?? ""),
          name: String(t.name ?? ""),
          color: String(t.color || "blue"),
          isActive: t.is_active !== false,
          math_factor: Number(t.math_factor ?? 1),
          impact_type: String(t.impact_type ?? "increase"),
          company_id: typeof t.company_id === "string" ? t.company_id : null,
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
          // company_id is a tenant field and must not be changed by user payload.
          delete updatePayload.company_id;
          const { data, error } = await updateWithFallback("transaction_types", String(payload.id), updatePayload);
          return { data, error };
        } else {
          const transformed = transformRawTransactionType(payload) as Record<string, unknown>;
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
          const existing = (trialGet("transaction_types") || [] as Record<string, unknown>[]).find(
            (t) => t.company_id === companyId && t.name === name
          );
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
          // company_id is a tenant field and must not be changed by user payload.
          delete updatePayload.company_id;
          const result = trialUpdate("transaction_types", String(payload.id), updatePayload);
          return { data: result, error: null };
        } else {
          const transformed = transformRawTransactionType(payload) as Record<string, unknown>;
          const result = trialInsert("transaction_types", transformed);
          return { data: result, error: null };
        }
      }
    );
  }

  static async toggleTransactionType(id: string, isActive: boolean) {
    const resolveCanonical = (rowId: string, rowName: string) => {
      const lowerId = rowId.toLowerCase().trim();
      if (["payment", "charge", "adjustment", "refund", "deposit"].includes(lowerId)) return lowerId;
      const normalized = normalizeTransactionType(rowName);
      if (normalized !== rowName.toLowerCase().trim()) return normalized;
      return rowName;
    };

    return this.execute(
      async () => {
        const { data: typeRow } = await apiClient.from("transaction_types").select("name").eq("id", id).maybeSingle();
        const canonicalName = resolveCanonical(id, String(typeRow?.name ?? ""));
        if (!isActive) {
          const { data: txs } = await apiClient.from("transactions").select("id").eq("transaction_type", canonicalName).limit(1);
          if (txs && txs.length > 0) {
            return { data: null, error: { message: "Không thể vô hiệu hóa loại giao dịch vì đang được sử dụng trong giao dịch." } };
          }
        }

        const { error } = await apiClient.from("transaction_types").update({ is_active: isActive }).eq("id", id);
        return { data: null, error };
      },
      async () => {
        const typeRow = (trialGet("transaction_types") || [] as Record<string, unknown>[]).find(
          (t) => String(t.id ?? "") === id
        );
        const canonicalName = resolveCanonical(id, String(typeRow?.name ?? ""));
        if (!isActive) {
          const txs = (trialGet("transactions") || [] as Record<string, unknown>[]).find(
            (t) => String(t.transaction_type ?? "") === canonicalName
          );
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
    const resolveCanonical = (rowId: string, rowName: string) => {
      const lowerId = rowId.toLowerCase().trim();
      if (["payment", "charge", "adjustment", "refund", "deposit"].includes(lowerId)) return lowerId;
      const normalized = normalizeTransactionType(rowName);
      if (normalized !== rowName.toLowerCase().trim()) return normalized;
      return rowName;
    };

    return this.execute(
      async () => {
        const { data: typeRow } = await apiClient.from("transaction_types").select("name").eq("id", id).maybeSingle();
        const canonicalName = resolveCanonical(id, String(typeRow?.name ?? ""));
        const { data: txs } = await apiClient.from("transactions").select("id").eq("transaction_type", canonicalName).limit(1);
        if (txs && txs.length > 0) {
          return { data: null, error: { message: "Không thể xóa loại giao dịch vì đang được sử dụng trong giao dịch. Vui lòng vô hiệu hóa thay vì xóa." } };
        }

        const { error } = await apiClient.from("transaction_types").delete().eq("id", id);
        return { data: null, error };
      },
      async () => {
        const typeRow = (trialGet("transaction_types") || [] as Record<string, unknown>[]).find(
          (t) => String(t.id ?? "") === id
        );
        const canonicalName = resolveCanonical(id, String(typeRow?.name ?? ""));
        const txs = (trialGet("transactions") || [] as Record<string, unknown>[]).find(
          (t) => String(t.transaction_type ?? "") === canonicalName
        );
        if (txs) {
          return { data: null, error: { message: "Không thể xóa loại giao dịch vì đang được sử dụng trong giao dịch. Vui lòng vô hiệu hóa thay vì xóa." } };
        }
        trialDelete("transaction_types", id);
        return { data: null, error: null };
      }
    );
  }

  static buildFactorMap(types: Array<{ id?: unknown; name?: unknown; math_factor?: unknown }>): Record<string, number> {
    const map: Record<string, number> = {};
    for (const t of types) {
      const idKey = String(t.id ?? "").toLowerCase().trim();
      const nameKey = String(t.name ?? "").toLowerCase().trim();
      const factor = Number(t.math_factor ?? 1);

      if (idKey) map[idKey] = factor;
      if (nameKey) map[nameKey] = factor;

      const canonicalId = normalizeTransactionType(idKey);
      const canonicalName = normalizeTransactionType(nameKey);
      if (canonicalId && !map[canonicalId]) map[canonicalId] = factor;
      if (canonicalName && canonicalName !== canonicalId && !map[canonicalName]) map[canonicalName] = factor;
    }
    return map;
  }

  static async getTransactionTypeFactorMap(companyId?: string): Promise<Record<string, number>> {
    const { data, error } = await this.getTransactionTypes(companyId);
    if (error || !data) return {};
    return this.buildFactorMap(data as Array<{ id?: unknown; name?: unknown; math_factor?: unknown }>);
  }
}

export const transactionTypeService = {
  getTransactionTypes: TransactionTypeService.getTransactionTypes.bind(TransactionTypeService),
  upsertTransactionType: TransactionTypeService.upsertTransactionType.bind(TransactionTypeService),
  toggleTransactionType: TransactionTypeService.toggleTransactionType.bind(TransactionTypeService),
  deleteTransactionType: TransactionTypeService.deleteTransactionType.bind(TransactionTypeService),
  buildFactorMap: TransactionTypeService.buildFactorMap.bind(TransactionTypeService),
  getTransactionTypeFactorMap: TransactionTypeService.getTransactionTypeFactorMap.bind(TransactionTypeService),
};
