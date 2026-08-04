import { BaseService } from "@superapp/shared-utils";
import { apiClient } from "./supabase";
import { getTrialMode, trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateTransactionData, transformRawTransaction, parseAmount, normalizeTransactionType } from "./businessLogic";
import { v4 as uuid } from "uuid";

// Mock helper to get current ISO string
const getNowIso = () => new Date().toISOString();

export class TransactionService extends BaseService {
  static async getTransactions(filters?: any) {
    return this.execute(
      async () => {
        let query = apiClient
          .from("transactions")
          .select(`
            *,
            customers(full_name),
            bank_accounts(account_name),
            branches(name),
            users!transactions_created_by_fkey(full_name)
          `);

        if (filters?.company_id) query = query.eq("company_id", filters.company_id);
        if (filters?.branch_id) query = query.eq("branch_id", filters.branch_id);
        if (filters?.transaction_type) query = query.eq("transaction_type", filters.transaction_type);
        if (filters?.customer_id) query = query.eq("customer_id", filters.customer_id);

        if (filters?.search) {
          const s = `%${filters.search}%`;
          query = query.or(`description.ilike.${s},reference_number.ilike.${s}`);
        }

        if (filters?.dateRange?.start && filters?.dateRange?.end) {
          query = query.gte("transaction_date", new Date(filters.dateRange.start).toISOString())
                       .lte("transaction_date", new Date(filters.dateRange.end).toISOString());
        }

        query = query.order("transaction_date", { ascending: false });

        if (filters?.page && filters?.pageSize) {
          const page = Number(filters.page || 1);
          const pageSize = Number(filters.pageSize || 20);
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          query = query.range(from, to);
        }

        const { data, error, count } = await query;

        const mappedData = (data || []).map((tx: any) => ({
          ...tx,
          customer_name: tx.customers?.full_name || tx.customer_name,
          bank_account_name: tx.bank_accounts?.account_name || tx.bank_account_name,
          branch_name: tx.branches?.name,
          creator_name: tx.users?.full_name,
        }));

        return { data: mappedData, error, count: count || mappedData.length };
      },
      async () => {
        let transactions = trialGet("transactions") || [];
        
        if (filters?.company_id) transactions = transactions.filter((t: any) => t.company_id === filters.company_id);
        if (filters?.branch_id) transactions = transactions.filter((t: any) => t.branch_id === filters.branch_id);
        if (filters?.transaction_type) transactions = transactions.filter((t: any) => t.transaction_type === filters.transaction_type);
        if (filters?.customer_id) transactions = transactions.filter((t: any) => t.customer_id === filters.customer_id);

        const search = String(filters?.search || "").toLowerCase().trim();
        if (search) {
          transactions = transactions.filter((tx: any) => {
            const desc = String(tx.description || "").toLowerCase();
            const ref = String(tx.reference_number || "").toLowerCase();
            return desc.includes(search) || ref.includes(search);
          });
        }

        if (filters?.dateRange?.start && filters?.dateRange?.end) {
          const start = new Date(filters.dateRange.start);
          const end = new Date(filters.dateRange.end);
          transactions = transactions.filter((tx: any) => {
            const txDate = new Date(tx.transaction_date);
            return txDate >= start && txDate <= end;
          });
        }

        transactions.sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
        const totalCount = transactions.length;

        const page = Number(filters?.page || 1);
        const pageSize = Number(filters?.pageSize || 20);
        const from = (page - 1) * pageSize;
        transactions = transactions.slice(from, from + pageSize);

        const customers = trialGet("customers") || [];
        const bankAccounts = trialGet("bank_accounts") || [];
        const branches = trialGet("branches") || [];
        const users = trialGet("users") || [];

        const cMap = new Map(customers.map((c: any) => [c.id, c]));
        const bMap = new Map(bankAccounts.map((b: any) => [b.id, b]));
        const brMap = new Map(branches.map((b: any) => [b.id, b]));
        const uMap = new Map(users.map((u: any) => [u.id, u]));

        const mappedData = transactions.map((tx: any) => ({
          ...tx,
          customer_name: cMap.get(tx.customer_id)?.full_name || tx.customer_name,
          bank_account_name: bMap.get(tx.bank_account_id)?.account_name || tx.bank_account_name,
          branch_name: brMap.get(tx.branch_id)?.name,
          creator_name: uMap.get(tx.created_by)?.full_name,
        }));

        return { data: mappedData, error: null, count: totalCount };
      }
    );
  }

  static async getTransactionById(id: string, companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient
          .from("transactions")
          .select("*, customers(full_name, customer_code), bank_accounts(account_name)")
          .eq("id", id);
        
        if (companyId) query = query.eq("company_id", companyId);
        
        const { data: tx, error } = await query.single();
        if (error || !tx) return { data: null, error: error || { message: "Transaction not found" } };
        
        return { data: tx, error: null };
      },
      async () => {
        const transactions = trialGet("transactions") || [];
        const tx = transactions.find((t: any) => t.id === id && (!companyId || t.company_id === companyId));
        if (!tx) return { data: null, error: { message: "Transaction not found" } };

        const customers = trialGet("customers") || [];
        const bankAccounts = trialGet("bank_accounts") || [];
        const customer = customers.find((c: any) => c.id === tx.customer_id);
        const bankAccount = bankAccounts.find((b: any) => b.id === tx.bank_account_id);

        return {
          data: {
            ...tx,
            customers: customer ? { full_name: customer.full_name, customer_code: customer.customer_code } : null,
            bank_accounts: bankAccount ? { account_name: bankAccount.account_name } : null,
          },
          error: null
        };
      }
    );
  }

  static async createTransaction(transactionData: any) {
    return this.execute(
      async () => {
        const validation = validateTransactionData(transactionData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawTransaction(transactionData, true);
        const { data, error } = await apiClient.from("transactions").insert(transformed as any).select().single();
        return { data, error };
      },
      async () => {
        const validation = validateTransactionData(transactionData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawTransaction(transactionData, false);
        const result = trialInsert("transactions", transformed);
        return { data: result, error: null };
      }
    );
  }

  static async updateTransaction(id: string, transactionData: any) {
    return this.execute(
      async () => {
        const validation = validateTransactionData(transactionData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawTransaction(transactionData, true);
        const { data, error } = await apiClient.from("transactions").update(transformed as any).eq("id", id).select().single();
        return { data, error };
      },
      async () => {
        const validation = validateTransactionData(transactionData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawTransaction(transactionData, false);
        const result = trialUpdate("transactions", id, transformed);
        return { data: result, error: null };
      }
    );
  }

  static async deleteTransaction(id: string) {
    return this.execute(
      async () => {
        const { error } = await apiClient.from("transactions").delete().eq("id", id);
        return { data: null, error };
      },
      async () => {
        trialDelete("transactions", id);
        return { data: null, error: null };
      }
    );
  }

  static async bulkImportTransactions(rawData: any[], branchId?: string, createdBy?: string, companyId?: string) {
    // Resolve display labels used in UI dropdowns ("Name - Code/Number") back to actual IDs
    const resolveBankAccount = (label: string, accounts: any[]): { id: string | null; name: string | null } => {
      const raw = (label || "").trim();
      if (!raw) return { id: null, name: null };
      const lower = raw.toLowerCase();
      const [namePart, codePart] = lower.split(" - ").map((s) => s.trim());
      const match = accounts.find((a) => {
        const names = [String(a.account_name || ""), String(a.bank_name || "")].map((n) => n.toLowerCase().trim());
        const codes = [String(a.account_number || ""), String(a.id || "")].map((n) => n.toLowerCase().trim());
        if (codePart) return names.includes(namePart) && codes.includes(codePart);
        return names.includes(namePart) || codes.includes(namePart);
      });
      return match ? { id: match.id, name: match.account_name || match.bank_name || null } : { id: null, name: null };
    };

    const resolveBranch = (label: string, branches: any[]): { id: string | null; name: string | null } => {
      const raw = (label || "").trim();
      if (!raw) return { id: null, name: null };
      const lower = raw.toLowerCase();
      const [namePart, codePart] = lower.split(" - ").map((s) => s.trim());
      const match = branches.find((b) => {
        const names = [String(b.name || ""), String(b.branch_name || "")].map((n) => n.toLowerCase().trim());
        const codes = [String(b.code || ""), String(b.id || "")].map((n) => n.toLowerCase().trim());
        if (codePart) return names.includes(namePart) && codes.includes(codePart);
        return names.includes(namePart) || codes.includes(namePart);
      });
      return match ? { id: match.id, name: match.name || match.branch_name || null } : { id: null, name: null };
    };

    return this.execute(
      async () => {
        const raw = Array.isArray(rawData) ? rawData : [];
        const now = getNowIso();

        const { data: validTypes, error: typeErr } = await apiClient.from("transaction_types").select("id, name").eq("is_active", true);
        if (typeErr || !validTypes?.length) return { data: null, error: { message: "Failed to fetch transaction types" } };

        const validTypeNames = new Set(validTypes.map((t: any) => t.name.toLowerCase()));

        let customerMap: Record<string, string> = {};
        const { data: customers } = await apiClient.from('customers').select('id, customer_code');
        if (customers) {
          customerMap = customers.reduce((acc, c) => {
            if (c.customer_code) acc[c.customer_code.toLowerCase().trim()] = c.id;
            return acc;
          }, {} as Record<string, string>);
        }

        let bankAccounts: any[] = [];
        let branches: any[] = [];
        let bankQuery: any = apiClient.from("bank_accounts").select("id, account_name, bank_name, account_number, company_id");
        let branchQuery: any = apiClient.from("branches").select("id, name, branch_name, code, company_id");
        if (companyId) {
          bankQuery = bankQuery.eq("company_id", companyId);
          branchQuery = branchQuery.eq("company_id", companyId);
        }
        const [{ data: bankData }, { data: branchData }] = await Promise.all([bankQuery, branchQuery]);
        if (bankData) bankAccounts = bankData;
        if (branchData) branches = branchData;

        const body = raw.map((r, idx) => {
          let cId = r.customer_id || null;
          if (!cId && r.customer_code) {
            let parsed = r.customer_code.toLowerCase().trim();
            const dashIdx = parsed.indexOf(' - ');
            if (dashIdx > 0) parsed = parsed.substring(0, dashIdx).trim();
            cId = customerMap[parsed] || null;
            if (!cId) throw new Error(`Row ${idx + 1}: Customer not found for code "${r.customer_code}"`);
          }

          const resolvedBank = resolveBankAccount(r.bank_account || r.bank_account_name, bankAccounts);
          const resolvedBranch = resolveBranch(r.branch || r.branch_name, branches);

          let parsedDate = now;
          if (r.transaction_date) {
            const date = new Date(r.transaction_date);
            if (!isNaN(date.getTime())) parsedDate = date.toISOString();
          }

          return {
            id: r.id || uuid(),
            transaction_code: r.transaction_code || `TXN${Date.now()}${idx}`,
            customer_id: cId,
            bank_account_id: resolvedBank.id || r.bank_account_id || null,
            bank_account_name: resolvedBank.name || r.bank_account_name || null,
            branch_id: resolvedBranch.id || r.branch_id || branchId || null,
            branch_name: resolvedBranch.name || r.branch_name || null,
            company_id: companyId || null,
            created_by: createdBy || null,
            transaction_type: normalizeTransactionType(r.transaction_type || 'payment'),
            amount: parseAmount(r.amount),
            description: r.description || null,
            reference_number: r.reference_number || null,
            transaction_date: parsedDate,
            created_at: now,
            updated_at: now,
          };
        });

        const { data, error } = await apiClient.from("transactions").insert(body as any).select();
        return { data: data || [], error };
      },
      async () => {
        const raw = Array.isArray(rawData) ? rawData : [];
        const now = getNowIso();
        const mockBankAccounts = trialGet("bank_accounts") || [];
        const mockBranches = trialGet("branches") || [];

        const body = raw.map((row: any) => {
          const resolvedBank = resolveBankAccount(row.bank_account || row.bank_account_name, mockBankAccounts);
          const resolvedBranch = resolveBranch(row.branch || row.branch_name, mockBranches);
          return {
            id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            transaction_code: row.transaction_code || `TXN${Date.now()}`,
            customer_id: row.customer_id || null,
            customer_name: row.customer_name || null,
            bank_account_id: resolvedBank.id || row.bank_account_id || null,
            bank_account_name: resolvedBank.name || row.bank_account_name || null,
            branch_id: resolvedBranch.id || row.branch_id || branchId || "trial-branch",
            branch_name: resolvedBranch.name || row.branch_name || null,
            company_id: companyId || "trial-company",
            created_by: createdBy || "",
            transaction_type: normalizeTransactionType(row.transaction_type || "payment"),
            amount: parseAmount(row.amount),
            description: row.description || null,
            reference_number: row.reference_number || null,
            transaction_date: row.transaction_date || now,
            created_at: now,
            updated_at: now,
          };
        });

        const inserted = body.map((tx: any) => trialInsert("transactions", tx));
        return { data: inserted, error: null };
      }
    );
  }
}

export const transactionService = {
  getTransactions: TransactionService.getTransactions.bind(TransactionService),
  getTransactionById: TransactionService.getTransactionById.bind(TransactionService),
  createTransaction: TransactionService.createTransaction.bind(TransactionService),
  updateTransaction: TransactionService.updateTransaction.bind(TransactionService),
  deleteTransaction: TransactionService.deleteTransaction.bind(TransactionService),
  bulkImportTransactions: TransactionService.bulkImportTransactions.bind(TransactionService),
};
