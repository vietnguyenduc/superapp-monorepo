import { BaseService } from "@superapp/shared-utils";
import { apiClient } from "./supabase";
import { trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateBankAccountData, transformRawBankAccount } from "./businessLogic";
import { insertWithFallback, updateWithFallback } from "./updateHelpers";
import type { BankAccount } from "../types";

export class BankAccountService extends BaseService {
  static async getBankAccounts(companyId?: string, status?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("bank_accounts").select("*");
        if (companyId) query = query.eq("company_id", companyId);
        if (status) query = query.eq("status", status);
        const { data, error } = await query;
        return { data, error };
      },
      async () => {
        let data = (trialGet("bank_accounts") || []) as BankAccount[];
        if (companyId) data = data.filter((b) => b.company_id === companyId);
        if (status) data = data.filter((b) => b.status === status);
        return { data, error: null };
      }
    );
  }

  static async getBankAccount(id: string, companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("bank_accounts").select("*").eq("id", id);
        if (companyId) query = query.eq("company_id", companyId);
        const { data, error } = await query.single();
        return { data, error };
      },
      async () => {
        const data = (trialGet("bank_accounts") || []) as BankAccount[];
        const account = data.find((b) => b.id === id && (!companyId || b.company_id === companyId));
        return { data: account || null, error: account ? null : { message: "Bank account not found" } };
      }
    );
  }

  static async upsertBankAccount(payload: Record<string, unknown>) {
    return this.execute(
      async () => {
        const validation = validateBankAccountData(payload);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        if (payload.id) {
          const updatePayload: Record<string, unknown> = {
            ...payload,
            updated_at: new Date().toISOString(),
          };
          delete updatePayload.id;
          delete updatePayload.created_at;
          // company_id is a tenant field and must not be changed by user payload.
          delete updatePayload.company_id;
          const { data, error } = await updateWithFallback("bank_accounts", String(payload.id), updatePayload);
          return { data, error };
        } else {
          const transformed = transformRawBankAccount(payload) as Record<string, unknown>;
          const { data, error } = await insertWithFallback("bank_accounts", transformed);
          return { data, error };
        }
      },
      async () => {
        const validation = validateBankAccountData(payload);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        if (payload.id) {
          const updatePayload: Record<string, unknown> = {
            ...payload,
            updated_at: new Date().toISOString(),
          };
          delete updatePayload.id;
          delete updatePayload.created_at;
          // company_id is a tenant field and must not be changed by user payload.
          delete updatePayload.company_id;
          const result = trialUpdate("bank_accounts", String(payload.id), updatePayload);
          return { data: result, error: null };
        } else {
          const transformed = transformRawBankAccount(payload) as Record<string, unknown>;
          const result = trialInsert("bank_accounts", transformed);
          return { data: result, error: null };
        }
      }
    );
  }

  static async deleteBankAccount(id: string, companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("bank_accounts").delete().eq("id", id);
        if (companyId) query = query.eq("company_id", companyId);
        const { error } = await query;
        return { data: null, error };
      },
      async () => {
        const accounts = (trialGet("bank_accounts") || []) as BankAccount[];
        const account = accounts.find((b) => b.id === id);
        if (!account || (companyId && account.company_id !== companyId)) {
          return { data: null, error: { message: "Bank account not found" } };
        }
        trialDelete("bank_accounts", id);
        return { data: null, error: null };
      }
    );
  }
}

export const bankAccountService = {
  getBankAccounts: BankAccountService.getBankAccounts.bind(BankAccountService),
  getBankAccount: BankAccountService.getBankAccount.bind(BankAccountService),
  upsertBankAccount: BankAccountService.upsertBankAccount.bind(BankAccountService),
  deleteBankAccount: BankAccountService.deleteBankAccount.bind(BankAccountService),
};
