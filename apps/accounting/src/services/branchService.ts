import { BaseService } from "@superapp/shared-utils";
import { supabase , apiClient} from "./supabase";
import { getTrialMode, trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateBranchData, transformRawBranch } from "./businessLogic";

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
        let data = trialGet("branches") || [];
        if (companyId) data = data.filter((b: any) => b.company_id === companyId);
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
        let data = trialGet("branches") || [];
        const branch = data.find((b: any) => b.id === id && (!companyId || b.company_id === companyId));
        return { data: branch || null, error: branch ? null : { message: "Branch not found" } };
      }
    );
  }

  static async upsertBranch(payload: Partial<Record<string, any>>) {
    return this.execute(
      async () => {
        const validation = validateBranchData(payload);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawBranch(payload, true);
        if (payload.id) {
          const { data, error } = await apiClient.from("branches").update(transformed as any).eq("id", payload.id).select().single();
          return { data, error };
        } else {
          const { data, error } = await apiClient.from("branches").insert(transformed as any).select().single();
          return { data, error };
        }
      },
      async () => {
        const validation = validateBranchData(payload);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawBranch(payload, false);
        if (payload.id) {
          const result = trialUpdate("branches", payload.id, transformed);
          return { data: result, error: null };
        } else {
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
        const branches = trialGet("branches") || [];
        const branch = branches.find((b: any) => b.id === id);
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
