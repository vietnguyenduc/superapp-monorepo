import { BaseService } from "@superapp/shared-utils";
import { supabase , apiClient} from "./supabase";
import { getTrialMode, trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateBankAccountData, transformRawBankAccount } from "./businessLogic";

export class BankAccountService extends BaseService {
  static async getBankAccounts(companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("bank_accounts").select("*");
        if (companyId) query = query.eq("company_id", companyId);
        const { data, error } = await query;
        return { data, error };
      },
      async () => {
        let data = trialGet("bank_accounts") || [];
        if (companyId) data = data.filter((b: any) => b.company_id === companyId);
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
        let data = trialGet("bank_accounts") || [];
        const account = data.find((b: any) => b.id === id && (!companyId || b.company_id === companyId));
        return { data: account || null, error: account ? null : { message: "Bank account not found" } };
      }
    );
  }

  static async upsertBankAccount(payload: Partial<Record<string, any>>) {
    return this.execute(
      async () => {
        const validation = validateBankAccountData(payload);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawBankAccount(payload, true);
        if (payload.id) {
          const { data, error } = await apiClient.from("bank_accounts").update(transformed as any).eq("id", payload.id).select().single();
          return { data, error };
        } else {
          const { data, error } = await apiClient.from("bank_accounts").insert(transformed as any).select().single();
          return { data, error };
        }
      },
      async () => {
        const validation = validateBankAccountData(payload);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawBankAccount(payload, false);
        if (payload.id) {
          const result = trialUpdate("bank_accounts", payload.id, transformed);
          return { data: result, error: null };
        } else {
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
        const accounts = trialGet("bank_accounts") || [];
        const account = accounts.find((b: any) => b.id === id);
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
