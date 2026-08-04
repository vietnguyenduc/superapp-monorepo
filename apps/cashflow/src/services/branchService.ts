import { BaseService } from "@superapp/shared-utils";
import { apiClient } from "./supabase";
import { trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateBranchData, transformRawBranch } from "./businessLogic";
import { insertWithFallback, updateWithFallback } from "./updateHelpers";
import type { Branch } from "../types";

export class BranchService extends BaseService {
  static async getBranches(companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("branches").select("*");
        if (companyId) query = query.eq("company_id", companyId);
        const { data, error } = await query;
        return { data, error };
      },
      async () => {
        let data = (trialGet("branches") || []) as Branch[];
        if (companyId) data = data.filter((b) => b.company_id === companyId);
        return { data, error: null };
      }
    );
  }

  static async getBranchById(id: string, companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("branches").select("*").eq("id", id);
        if (companyId) query = query.eq("company_id", companyId);
        const { data, error } = await query.single();
        return { data, error };
      },
      async () => {
        const data = (trialGet("branches") || []) as Branch[];
        const branch = data.find((b) => b.id === id && (!companyId || b.company_id === companyId));
        return { data: branch || null, error: branch ? null : { message: "Branch not found" } };
      }
    );
  }

  static async upsertBranch(payload: Record<string, unknown>) {
    return this.execute(
      async () => {
        const validation = validateBranchData(payload);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        if (payload.id) {
          const updatePayload: Record<string, unknown> = {
            ...payload,
            updated_at: new Date().toISOString(),
          };
          delete updatePayload.id;
          delete updatePayload.created_at;
          const { data, error } = await updateWithFallback("branches", String(payload.id), updatePayload);
          return { data, error };
        } else {
          const transformed = transformRawBranch(payload) as Record<string, unknown>;
          const { data, error } = await insertWithFallback("branches", transformed);
          return { data, error };
        }
      },
      async () => {
        const validation = validateBranchData(payload);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        if (payload.id) {
          const updatePayload: Record<string, unknown> = {
            ...payload,
            updated_at: new Date().toISOString(),
          };
          delete updatePayload.id;
          delete updatePayload.created_at;
          const result = trialUpdate("branches", String(payload.id), updatePayload);
          return { data: result, error: null };
        } else {
          const transformed = transformRawBranch(payload) as Record<string, unknown>;
          const result = trialInsert("branches", transformed);
          return { data: result, error: null };
        }
      }
    );
  }

  static async deleteBranch(id: string, companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("branches").delete().eq("id", id);
        if (companyId) query = query.eq("company_id", companyId);
        const { error } = await query;
        return { data: null, error };
      },
      async () => {
        const branches = (trialGet("branches") || []) as Branch[];
        const branch = branches.find((b) => b.id === id);
        if (!branch || (companyId && branch.company_id !== companyId)) {
          return { data: null, error: { message: "Branch not found" } };
        }
        trialDelete("branches", id);
        return { data: null, error: null };
      }
    );
  }
}

export const branchService = {
  getBranches: BranchService.getBranches.bind(BranchService),
  getBranchById: BranchService.getBranchById.bind(BranchService),
  upsertBranch: BranchService.upsertBranch.bind(BranchService),
  deleteBranch: BranchService.deleteBranch.bind(BranchService),
};
