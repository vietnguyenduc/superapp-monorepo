import { BaseService } from "@superapp/shared-utils";
import { apiClient } from "./supabase";
import { trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateTransactionData, validateTransactionUpdateData, transformRawTransaction, parseAmount, parseDate, normalizeTransactionType, getCustomerBalanceDelta, getBankAccountBalanceDelta } from "./businessLogic";
import { updateWithFallback, insertWithFallback, bulkInsertWithFallback } from "./updateHelpers";
import { transactionTypeService } from "./transactionTypeService";
import { v4 as uuid } from "uuid";
import type { Transaction, Customer, BankAccount, Branch, User } from "../types";

const getNowIso = () => new Date().toISOString();

export class TransactionService extends BaseService {
  private static async _getTransactionForBalanceSync(id: string) {
    const { data, error } = await apiClient
      .from("transactions")
      .select("customer_id, bank_account_id, transaction_type, amount, transaction_date, company_id, status")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as Record<string, unknown>;
  }

  private static _balanceFields(tx: Record<string, unknown>) {
    return {
      customer_id: tx.customer_id ? String(tx.customer_id) : null,
      bank_account_id: tx.bank_account_id ? String(tx.bank_account_id) : null,
      transaction_type: String(tx.transaction_type || ""),
      amount: tx.amount ?? 0,
      transaction_date: String(tx.transaction_date || getNowIso()),
      company_id: tx.company_id ? String(tx.company_id) : null,
      status: String(tx.status || ""),
    };
  }

  private static _completedDelta(delta: number, status: string | null | undefined) {
    return status === "completed" ? delta : 0;
  }

  private static _normalizeTransactionPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const copy: Record<string, unknown> = { ...payload, updated_at: getNowIso() };

    // Immutable / RLS fields must not be changed by an update payload.
    delete copy.id;
    delete copy.created_at;
    delete copy.company_id;
    delete copy.created_by;

    // UUID fields must be null, not empty strings, to avoid "invalid input syntax for type uuid".
    for (const key of ["customer_id", "bank_account_id", "branch_id"]) {
      if (key in copy) {
        const val = copy[key];
        if (val === "" || val === undefined) {
          copy[key] = null;
        }
      }
    }

    // Empty optional text fields are stored as null.
    for (const key of ["description", "reference_number"]) {
      if (key in copy && typeof copy[key] === "string" && String(copy[key]).trim() === "") {
        copy[key] = null;
      }
    }

    // Amount should be numeric; parse VN-formatted strings if necessary.
    if ("amount" in copy && typeof copy.amount === "string") {
      copy.amount = parseAmount(copy.amount);
    }

    return copy;
  }

  private static async _adjustCustomerBalance(
    customerId: string | null | undefined,
    delta: number,
    transactionDate: string,
    companyId?: string | null,
  ) {
    if (!customerId || delta === 0) return;
    let q = apiClient.from("customers").select("total_balance, last_transaction_date").eq("id", customerId);
    if (companyId) q = q.eq("company_id", companyId);
    const { data: customer } = await q.single();
    if (!customer) return;

    const c = customer as Record<string, unknown>;
    const currentBalance = parseAmount(c.total_balance) || 0;
    const currentLastDate = String(c.last_transaction_date || "");
    const newBalance = currentBalance + delta;
    const newLastDate = !currentLastDate || transactionDate > currentLastDate ? transactionDate : currentLastDate;

    const update: Record<string, unknown> = { total_balance: newBalance, updated_at: getNowIso() };
    if (newLastDate !== currentLastDate) update.last_transaction_date = newLastDate;

    await apiClient.from("customers").update(update).eq("id", customerId);
  }

  private static async _adjustBankAccountBalance(
    accountId: string | null | undefined,
    delta: number,
    companyId?: string | null,
  ) {
    if (!accountId || delta === 0) return;
    let q = apiClient.from("bank_accounts").select("balance").eq("id", accountId);
    if (companyId) q = q.eq("company_id", companyId);
    const { data: account } = await q.single();
    if (!account) return;

    const a = account as Record<string, unknown>;
    const currentBalance = parseAmount(a.balance) || 0;
    const newBalance = currentBalance + delta;

    await apiClient.from("bank_accounts").update({ balance: newBalance, updated_at: getNowIso() }).eq("id", accountId);
  }

  private static async _getLiveFactorMap(companyId?: string | null): Promise<Record<string, number>> {
    return transactionTypeService.getTransactionTypeFactorMap(companyId || undefined);
  }

  private static _getTrialFactorMap(): Record<string, number> {
    return transactionTypeService.buildFactorMap(trialGet("transaction_types") || []);
  }

  private static async _syncTransactionBalance(
    previous: Record<string, unknown> | null,
    current: Record<string, unknown> | null,
    companyId?: string | null,
    factorMap?: Record<string, number>,
  ) {
    if (!previous && !current) return;

    const oldTx = previous ? this._balanceFields(previous) : null;
    const newTx = current ? this._balanceFields(current) : null;

    if (!factorMap) {
      factorMap = await this._getLiveFactorMap(companyId || newTx?.company_id || oldTx?.company_id);
    }

    const oldCustomerDelta = this._completedDelta(oldTx ? getCustomerBalanceDelta(oldTx.transaction_type, oldTx.amount, factorMap[oldTx.transaction_type]) : 0, oldTx?.status);
    const newCustomerDelta = this._completedDelta(newTx ? getCustomerBalanceDelta(newTx.transaction_type, newTx.amount, factorMap[newTx.transaction_type]) : 0, newTx?.status);
    const oldBankDelta = this._completedDelta(oldTx ? getBankAccountBalanceDelta(oldTx.transaction_type, oldTx.amount) : 0, oldTx?.status);
    const newBankDelta = this._completedDelta(newTx ? getBankAccountBalanceDelta(newTx.transaction_type, newTx.amount) : 0, newTx?.status);

    const oldCustomer = oldTx?.customer_id;
    const newCustomer = newTx?.customer_id;
    const oldBank = oldTx?.bank_account_id;
    const newBank = newTx?.bank_account_id;

    if (oldCustomer === newCustomer) {
      await this._adjustCustomerBalance(newCustomer, newCustomerDelta - oldCustomerDelta, newTx?.transaction_date || getNowIso(), companyId);
    } else {
      if (oldCustomer) await this._adjustCustomerBalance(oldCustomer, -oldCustomerDelta, oldTx?.transaction_date || getNowIso(), companyId);
      if (newCustomer) await this._adjustCustomerBalance(newCustomer, newCustomerDelta, newTx?.transaction_date || getNowIso(), companyId);
    }

    if (oldBank === newBank) {
      await this._adjustBankAccountBalance(newBank, newBankDelta - oldBankDelta, companyId);
    } else {
      if (oldBank) await this._adjustBankAccountBalance(oldBank, -oldBankDelta, companyId);
      if (newBank) await this._adjustBankAccountBalance(newBank, newBankDelta, companyId);
    }
  }

  // ----- trial helpers -----
  private static _trialAdjustCustomerBalance(
    customerId: string | null | undefined,
    delta: number,
    transactionDate: string,
  ) {
    if (!customerId || delta === 0) return;
    const customers = (trialGet("customers") || []) as Customer[];
    const idx = customers.findIndex((c) => c.id === customerId);
    if (idx === -1) return;

    const currentBalance = parseAmount(customers[idx].total_balance) || 0;
    const currentLastDate = String(customers[idx].last_transaction_date || "");
    const newBalance = currentBalance + delta;
    const newLastDate = !currentLastDate || transactionDate > currentLastDate ? transactionDate : currentLastDate;

    const updates: Record<string, unknown> = { total_balance: newBalance };
    if (newLastDate !== currentLastDate) updates.last_transaction_date = newLastDate;
    trialUpdate("customers", customerId, updates);
  }

  private static _trialAdjustBankAccountBalance(
    accountId: string | null | undefined,
    delta: number,
  ) {
    if (!accountId || delta === 0) return;
    const accounts = (trialGet("bank_accounts") || []) as BankAccount[];
    const idx = accounts.findIndex((b) => b.id === accountId);
    if (idx === -1) return;

    const currentBalance = parseAmount(accounts[idx].balance) || 0;
    const newBalance = currentBalance + delta;
    trialUpdate("bank_accounts", accountId, { balance: newBalance });
  }

  private static _trialSyncTransactionBalance(
    previous: Record<string, unknown> | null,
    current: Record<string, unknown> | null,
    factorMap?: Record<string, number>,
  ) {
    if (!previous && !current) return;

    if (!factorMap) factorMap = this._getTrialFactorMap();

    const oldTx = previous ? this._balanceFields(previous) : null;
    const newTx = current ? this._balanceFields(current) : null;

    const oldCustomerDelta = this._completedDelta(oldTx ? getCustomerBalanceDelta(oldTx.transaction_type, oldTx.amount, factorMap[oldTx.transaction_type]) : 0, oldTx?.status);
    const newCustomerDelta = this._completedDelta(newTx ? getCustomerBalanceDelta(newTx.transaction_type, newTx.amount, factorMap[newTx.transaction_type]) : 0, newTx?.status);
    const oldBankDelta = this._completedDelta(oldTx ? getBankAccountBalanceDelta(oldTx.transaction_type, oldTx.amount) : 0, oldTx?.status);
    const newBankDelta = this._completedDelta(newTx ? getBankAccountBalanceDelta(newTx.transaction_type, newTx.amount) : 0, newTx?.status);

    const oldCustomer = oldTx?.customer_id;
    const newCustomer = newTx?.customer_id;
    const oldBank = oldTx?.bank_account_id;
    const newBank = newTx?.bank_account_id;

    if (oldCustomer === newCustomer) {
      this._trialAdjustCustomerBalance(newCustomer, newCustomerDelta - oldCustomerDelta, newTx?.transaction_date || getNowIso());
    } else {
      if (oldCustomer) this._trialAdjustCustomerBalance(oldCustomer, -oldCustomerDelta, oldTx?.transaction_date || getNowIso());
      if (newCustomer) this._trialAdjustCustomerBalance(newCustomer, newCustomerDelta, newTx?.transaction_date || getNowIso());
    }

    if (oldBank === newBank) {
      this._trialAdjustBankAccountBalance(newBank, newBankDelta - oldBankDelta);
    } else {
      if (oldBank) this._trialAdjustBankAccountBalance(oldBank, -oldBankDelta);
      if (newBank) this._trialAdjustBankAccountBalance(newBank, newBankDelta);
    }
  }

  static async getTransactions(filters?: Record<string, unknown>) {
    return this.execute(
      async () => {
        let query = apiClient
          .from("transactions")
          .select(
            `*,
            customers(full_name),
            bank_accounts(account_name),
            branches(name),
            users!transactions_created_by_fkey(full_name)`,
            { count: "exact" }
          );

        const companyFilter = typeof filters?.company_id === "string" ? filters.company_id : undefined;
        const branchFilter = typeof filters?.branch_id === "string" ? filters.branch_id : undefined;
        const typeFilter = typeof filters?.transaction_type === "string" ? filters.transaction_type : undefined;
        const customerFilter = typeof filters?.customer_id === "string" ? filters.customer_id : undefined;
        const bankAccountFilter = typeof filters?.bank_account_id === "string" ? filters.bank_account_id : undefined;
        const userFilter = typeof filters?.created_by === "string" ? filters.created_by : undefined;
        const statusFilter = typeof filters?.status === "string" ? filters.status : undefined;

        if (companyFilter) query = query.eq("company_id", companyFilter);
        if (branchFilter) query = query.eq("branch_id", branchFilter);
        if (typeFilter) query = query.eq("transaction_type", typeFilter);
        if (customerFilter) query = query.eq("customer_id", customerFilter);
        if (bankAccountFilter) query = query.eq("bank_account_id", bankAccountFilter);
        if (userFilter) query = query.eq("created_by", userFilter);
        if (statusFilter) query = query.eq("status", statusFilter);

        const search = typeof filters?.search === "string" ? filters.search.trim() : "";
        if (search) {
          // Quote the ilike value so PostgREST treats commas/parentheses as literal text.
          const safe = search.replace(/"/g, '""');
          const s = `%${safe}%`;
          query = query.or(`description.ilike."${s}",reference_number.ilike."${s}"`);
        }

        const dateRange = filters?.dateRange as { start?: string; end?: string } | undefined;
        if (typeof dateRange?.start === "string" && typeof dateRange?.end === "string") {
          query = query.gte("transaction_date", new Date(dateRange.start).toISOString())
                       .lte("transaction_date", new Date(dateRange.end).toISOString());
        }

        query = query.order("transaction_date", { ascending: false });

        const hasPage = typeof filters?.page !== "undefined";
        const hasPageSize = typeof filters?.pageSize !== "undefined";
        if (hasPage && hasPageSize) {
          const page = typeof filters.page === "number" ? filters.page : Number(filters.page);
          const pageSize = typeof filters.pageSize === "number" ? filters.pageSize : Number(filters.pageSize);
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          query = query.range(from, to);
        }

        const { data: rawData, error, count } = await query;
        const data = (rawData || []) as Transaction[];

        const mappedData = data.map((tx) => ({
          ...tx,
          customer_name: tx.customers?.full_name || tx.customer_name,
          bank_account_name: tx.bank_accounts?.account_name || tx.bank_account_name,
          branch_name: tx.branches?.name,
          creator_name: tx.users?.full_name,
        }));

        return { data: mappedData, error, count: count || mappedData.length };
      },
      async () => {
        let transactions = (trialGet("transactions") || []) as Transaction[];

        const companyFilter = typeof filters?.company_id === "string" ? filters.company_id : undefined;
        const branchFilter = typeof filters?.branch_id === "string" ? filters.branch_id : undefined;
        const typeFilter = typeof filters?.transaction_type === "string" ? filters.transaction_type : undefined;
        const customerFilter = typeof filters?.customer_id === "string" ? filters.customer_id : undefined;
        const bankAccountFilter = typeof filters?.bank_account_id === "string" ? filters.bank_account_id : undefined;
        const userFilter = typeof filters?.created_by === "string" ? filters.created_by : undefined;
        const statusFilter = typeof filters?.status === "string" ? filters.status : undefined;

        if (companyFilter) transactions = transactions.filter((t) => t.company_id === companyFilter);
        if (branchFilter) transactions = transactions.filter((t) => t.branch_id === branchFilter);
        if (typeFilter) transactions = transactions.filter((t) => t.transaction_type === typeFilter);
        if (customerFilter) transactions = transactions.filter((t) => t.customer_id === customerFilter);
        if (bankAccountFilter) transactions = transactions.filter((t) => t.bank_account_id === bankAccountFilter);
        if (userFilter) transactions = transactions.filter((t) => t.created_by === userFilter);
        if (statusFilter) transactions = transactions.filter((t) => t.status === statusFilter);

        const search = typeof filters?.search === "string" ? filters.search.toLowerCase().trim() : "";
        if (search) {
          transactions = transactions.filter((tx) => {
            const desc = String(tx.description ?? "").toLowerCase();
            const ref = String(tx.reference_number ?? "").toLowerCase();
            return desc.includes(search) || ref.includes(search);
          });
        }

        const dateRange = filters?.dateRange as { start?: string; end?: string } | undefined;
        if (typeof dateRange?.start === "string" && typeof dateRange?.end === "string") {
          const start = new Date(dateRange.start);
          const end = new Date(dateRange.end);
          transactions = transactions.filter((tx) => {
            const txDate = new Date(tx.transaction_date);
            return txDate >= start && txDate <= end;
          });
        }

        transactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
        const totalCount = transactions.length;

        const page = typeof filters?.page === "number" ? filters.page : typeof filters?.page === "string" ? Number(filters.page) : 1;
        const pageSize = typeof filters?.pageSize === "number" ? filters.pageSize : typeof filters?.pageSize === "string" ? Number(filters.pageSize) : 20;
        const from = (page - 1) * pageSize;
        transactions = transactions.slice(from, from + pageSize);

        const customers = (trialGet("customers") || []) as Customer[];
        const bankAccounts = (trialGet("bank_accounts") || []) as BankAccount[];
        const branches = (trialGet("branches") || []) as Branch[];
        const users = (trialGet("users") || []) as User[];

        const cMap = new Map(customers.map((c) => [c.id, c]));
        const bMap = new Map(bankAccounts.map((b) => [b.id, b]));
        const brMap = new Map(branches.map((b) => [b.id, b]));
        const uMap = new Map(users.map((u) => [u.id, u]));

        const mappedData = transactions.map((tx) => ({
          ...tx,
          customer_name: cMap.get(tx.customer_id || "")?.full_name || tx.customer_name,
          bank_account_name: bMap.get(tx.bank_account_id || "")?.account_name || tx.bank_account_name,
          branch_name: brMap.get(tx.branch_id || "")?.name || tx.branch_name,
          creator_name: uMap.get(tx.created_by || "")?.full_name,
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
        const transactions = (trialGet("transactions") || []) as Transaction[];
        const tx = transactions.find((t) => t.id === id && (!companyId || t.company_id === companyId));
        if (!tx) return { data: null, error: { message: "Transaction not found" } };

        const customers = (trialGet("customers") || []) as Customer[];
        const bankAccounts = (trialGet("bank_accounts") || []) as BankAccount[];
        const customer = customers.find((c) => c.id === tx.customer_id);
        const bankAccount = bankAccounts.find((b) => b.id === tx.bank_account_id);

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

  static async createTransaction(transactionData: Record<string, unknown>) {
    return this.execute(
      async () => {
        const validation = validateTransactionData(transactionData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        const transformed = transformRawTransaction(transactionData) as Record<string, unknown>;
        const { data, error } = await insertWithFallback("transactions", transformed);
        if (error) return { data, error };

        await this._syncTransactionBalance(null, transformed, transformed.company_id as string | null | undefined);
        return { data, error };
      },
      async () => {
        const validation = validateTransactionData(transactionData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        const transformed = transformRawTransaction(transactionData) as Record<string, unknown>;
        const result = trialInsert("transactions", transformed);
        this._trialSyncTransactionBalance(null, result || transformed);
        return { data: result, error: null };
      }
    );
  }

  static async updateTransaction(id: string, transactionData: Record<string, unknown>) {
    return this.execute(
      async () => {
        const validation = validateTransactionUpdateData(transactionData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        const oldTx = await this._getTransactionForBalanceSync(id);

        const updatePayload = this._normalizeTransactionPayload(transactionData);

        const { data, error } = await updateWithFallback("transactions", id, updatePayload);
        if (error) return { data, error };

        const newTx = oldTx ? { ...oldTx, ...updatePayload } : updatePayload;
        await this._syncTransactionBalance(oldTx, newTx, oldTx?.company_id as string | null | undefined);
        return { data, error };
      },
      async () => {
        const validation = validateTransactionUpdateData(transactionData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        const allTxs = (trialGet("transactions") || []) as Transaction[];
        const oldTx = allTxs.find((t) => t.id === id);
        const oldTxSnapshot = oldTx ? { ...oldTx } : null;

        const updatePayload = this._normalizeTransactionPayload(transactionData);

        const result = trialUpdate("transactions", id, updatePayload);
        const newTx = oldTxSnapshot ? { ...oldTxSnapshot, ...updatePayload } : updatePayload;
        this._trialSyncTransactionBalance(oldTxSnapshot, newTx);
        return { data: result, error: null };
      }
    );
  }

  static async deleteTransaction(id: string) {
    return this.execute(
      async () => {
        const oldTx = await this._getTransactionForBalanceSync(id);
        const { error } = await apiClient.from("transactions").delete().eq("id", id);
        if (!error && oldTx) {
          await this._syncTransactionBalance(oldTx, null, oldTx.company_id as string | null | undefined);
        }
        return { data: null, error };
      },
      async () => {
        const allTxs = (trialGet("transactions") || []) as Transaction[];
        const oldTx = allTxs.find((t) => t.id === id);
        trialDelete("transactions", id);
        if (oldTx) this._trialSyncTransactionBalance(oldTx, null);
        return { data: null, error: null };
      }
    );
  }

  static async bulkImportTransactions(rawData: Record<string, unknown>[], branchId?: string, createdBy?: string, companyId?: string) {
    // Only persist columns that exist in the live transactions table. Extra UI
    // fields (e.g. bank_account_name, branch_name) must be stripped before the
    // real insert so Supabase does not log 400 errors for missing columns.
    const TRANSACTION_COLUMNS = new Set([
      "id",
      "transaction_code",
      "customer_id",
      "bank_account_id",
      "branch_id",
      "transaction_type",
      "amount",
      "description",
      "reference_number",
      "transaction_date",
      "status",
      "created_by",
      "company_id",
      "created_at",
      "updated_at",
    ]);
    const pickTransactionColumns = (row: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(row).filter(([k]) => TRANSACTION_COLUMNS.has(k)));

    const resolveBankAccount = (label: string, accounts: Record<string, unknown>[]): { id: string | null; name: string | null } => {
      const raw = (label || "").trim();
      if (!raw) return { id: null, name: null };
      const lower = raw.toLowerCase();
      const [namePart, codePart] = lower.split(" - ").map((s) => s.trim());
      const match = accounts.find((a) => {
        const names = [String(a.account_name ?? ""), String(a.bank_name ?? "")].map((n) => n.toLowerCase().trim());
        const codes = [String(a.account_number ?? ""), String(a.id ?? "")].map((n) => n.toLowerCase().trim());
        if (codePart) return names.includes(namePart) && codes.includes(codePart);
        return names.includes(namePart) || codes.includes(namePart);
      });
      return match
        ? { id: String(match.id ?? ""), name: String((match.account_name ?? match.bank_name) ?? "").trim() || null }
        : { id: null, name: null };
    };

    const resolveBranch = (label: string, branches: Record<string, unknown>[]): { id: string | null; name: string | null } => {
      const raw = (label || "").trim();
      if (!raw) return { id: null, name: null };
      const lower = raw.toLowerCase();
      const [namePart, codePart] = lower.split(" - ").map((s) => s.trim());
      const match = branches.find((b) => {
        const names = [String(b.name ?? "")].map((n) => n.toLowerCase().trim());
        const codes = [String(b.code ?? ""), String(b.id ?? "")].map((n) => n.toLowerCase().trim());
        if (codePart) return names.includes(namePart) && codes.includes(codePart);
        return names.includes(namePart) || codes.includes(namePart);
      });
      return match
        ? { id: String(match.id ?? ""), name: String(match.name ?? "").trim() || null }
        : { id: null, name: null };
    };

    const resolveCustomer = (label: string, customers: Record<string, unknown>[]): { id: string | null; name: string | null } => {
      const raw = (label || "").trim();
      if (!raw) return { id: null, name: null };
      const lower = raw.toLowerCase();
      // Try to extract a code from labels like "CUST0001 - ..." or "... (CUST0001)".
      let codePart: string | null = null;
      let namePart: string | null = null;
      if (lower.includes(" - ")) {
        const [first, ...rest] = lower.split(" - ");
        codePart = first.trim();
        namePart = rest.join(" - ").trim();
      } else if (lower.includes("(")) {
        const parens = lower.match(/\(([^)]+)\)/);
        if (parens) codePart = parens[1].trim();
        namePart = lower.replace(/\s*\([^)]+\)\s*$/, "").trim();
      } else {
        codePart = lower;
        namePart = lower;
      }
      const match = customers.find((c) => {
        const codes = [String(c.customer_code ?? ""), String(c.id ?? "")].map((n) => n.toLowerCase().trim());
        const names = [String(c.full_name ?? ""), String(c.name ?? "")].map((n) => n.toLowerCase().trim());
        if (codePart && codes.includes(codePart)) return true;
        if (namePart && names.some((n) => n.includes(namePart) || namePart.includes(n))) return true;
        return false;
      });
      return match
        ? { id: String(match.id ?? ""), name: String(match.full_name ?? match.name ?? "").trim() || null }
        : { id: null, name: null };
    };

    return this.execute(
      async () => {
        if (!companyId) {
          return { data: null, error: { message: "companyId is required to import transactions" } };
        }

        const raw = Array.isArray(rawData) ? rawData : [];
        const now = getNowIso();

        const { data: validTypes, error: typeErr } = await apiClient
          .from("transaction_types")
          .select("id, name")
          .eq("is_active", true)
          .or(`company_id.eq.${companyId},company_id.is.null`);
        if (typeErr || !validTypes?.length) return { data: null, error: { message: "Failed to fetch transaction types" } };

        const { data: customers } = await apiClient
          .from("customers")
          .select("id, customer_code, full_name")
          .eq("company_id", companyId);
        const customerList = (customers || []) as Record<string, unknown>[];

        const bankQuery = apiClient
          .from("bank_accounts")
          .select("id, account_name, bank_name, account_number, company_id")
          .eq("company_id", companyId);
        const branchQuery = apiClient
          .from("branches")
          .select("id, name, code, company_id")
          .eq("company_id", companyId);
        const [{ data: bankData }, { data: branchData }] = await Promise.all([bankQuery, branchQuery]);
        const bankAccounts = bankData as Record<string, unknown>[] || [];
        const branches = branchData as Record<string, unknown>[] || [];

        const { data: existingTxnCodes } = await apiClient
          .from("transactions")
          .select("transaction_code")
          .eq("company_id", companyId);
        const existingCodes = new Set(
          ((existingTxnCodes || []) as { transaction_code: string }[])
            .map((t) => t.transaction_code?.trim())
            .filter(Boolean) as string[]
        );

        const seenInBatch = new Set<string>();

        const generateTxnCode = (idx: number) => {
          let code: string;
          do {
            code = `TXN${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
          } while (existingCodes.has(code) || seenInBatch.has(code));
          return code;
        };

        const typeLookup = new Map<string, string>();
        const validCanonicals = new Set<string>();
        (validTypes || []).forEach((t: any) => {
          const id = String(t.id || "").toLowerCase().trim();
          const name = String(t.name || "").toLowerCase().trim();
          const canonical = normalizeTransactionType(name);
          if (id) typeLookup.set(id, canonical);
          if (name) typeLookup.set(name, canonical);
          typeLookup.set(canonical, canonical);
          validCanonicals.add(canonical);
        });

        const resolveTransactionType = (input: string): { type: string; valid: boolean } => {
          const key = input.toLowerCase().trim();
          if (typeLookup.has(key)) return { type: typeLookup.get(key)!, valid: true };
          if (validCanonicals.has(key)) return { type: key, valid: true };
          return { type: normalizeTransactionType(input), valid: false };
        };

        const errors: { row: number; message: string }[] = [];
        const body: Record<string, unknown>[] = [];

        for (let idx = 0; idx < raw.length; idx++) {
          const r = raw[idx];
          const rowNum = idx + 1;
          const rowErrors: string[] = [];

          const providedCode = String(r.transaction_code ?? "").trim();
          let transaction_code: string;
          if (!providedCode) {
            transaction_code = generateTxnCode(idx);
          } else if (existingCodes.has(providedCode)) {
            rowErrors.push(`Số chứng từ "${providedCode}" đã tồn tại`);
          } else if (seenInBatch.has(providedCode)) {
            rowErrors.push(`Số chứng từ "${providedCode}" bị trùng trong file`);
          } else {
            seenInBatch.add(providedCode);
            transaction_code = providedCode;
          }

          const customerInput =
            typeof r.customer_id === "string" && r.customer_id.trim()
              ? r.customer_id
              : typeof r.customer_code === "string"
              ? r.customer_code
              : "";
          const resolvedCustomer = resolveCustomer(customerInput, customerList);
          if (!resolvedCustomer.id) {
            rowErrors.push(`Không tìm thấy khách hàng với mã "${customerInput}"`);
          }

          const rawType = typeof r.transaction_type === "string" ? r.transaction_type.trim() : "";
          let transaction_type = "payment";
          if (!rawType) {
            rowErrors.push("Thiếu loại giao dịch");
          } else {
            const typeResult = resolveTransactionType(rawType);
            if (!typeResult.valid) {
              rowErrors.push(`Loại giao dịch "${rawType}" không hợp lệ`);
            } else {
              transaction_type = typeResult.type;
            }
          }

          const amount = parseAmountOrNull(r.amount);
          if (amount === null) {
            rowErrors.push(`Số tiền "${r.amount}" không đúng định dạng`);
          } else if (amount === 0) {
            rowErrors.push("Số tiền phải khác 0");
          }

          let parsedDate = now;
          if (r.transaction_date) {
            const date = parseDate(typeof r.transaction_date === "string" ? r.transaction_date : String(r.transaction_date));
            if (date) {
              parsedDate = date.toISOString();
            } else {
              rowErrors.push(`Ngày "${r.transaction_date}" không đúng định dạng DD/MM/YYYY`);
            }
          }

          if (rowErrors.length > 0) {
            rowErrors.forEach((msg) => errors.push({ row: idx, message: msg }));
            continue;
          }

          const bankLabel =
            typeof r.bank_account === "string" && r.bank_account.trim()
              ? r.bank_account
              : typeof r.bank_account_name === "string"
              ? r.bank_account_name
              : "";
          const branchLabel =
            typeof r.branch === "string" && r.branch.trim()
              ? r.branch
              : typeof r.branch_name === "string"
              ? r.branch_name
              : "";

          const resolvedBank = resolveBankAccount(bankLabel, bankAccounts);
          const resolvedBranch = resolveBranch(branchLabel, branches);

          body.push({
            id: String(r.id ?? "").trim() || uuid(),
            transaction_code,
            customer_id: resolvedCustomer.id,
            customer_name: resolvedCustomer.name,
            bank_account_id: resolvedBank.id || String(r.bank_account_id ?? "").trim() || null,
            bank_account_name: resolvedBank.name || String(r.bank_account_name ?? "").trim() || null,
            branch_id: resolvedBranch.id || String(r.branch_id ?? "").trim() || branchId || null,
            branch_name: resolvedBranch.name || String(r.branch_name ?? "").trim() || null,
            company_id: companyId || null,
            created_by: createdBy || null,
            transaction_type,
            amount,
            description: String(r.description ?? "").trim() || null,
            reference_number: String(r.reference_number ?? "").trim() || null,
            transaction_date: parsedDate,
            status: String(r.status ?? "").trim() || "completed",
            created_at: now,
            updated_at: now,
          });
        }

        if (errors.length > 0) {
          const total = errors.length;
          const duplicateCount = errors.filter((e) => e.message.includes("đã tồn tại")).length;
          const customerCount = errors.filter((e) => e.message.includes("Không tìm thấy khách hàng")).length;
          let summary = `Phát hiện ${total} lỗi ở các dòng trong file. Vui lòng sửa lại và thử lại.`;
          if (duplicateCount === total) {
            summary = `Tất cả ${total} dòng đều bị trùng Số chứng từ với hệ thống. Hãy để trống cột Số chứng từ để tự động tạo mã mới, hoặc xóa các giao dịch cũ trước khi nhập lại.`;
          } else if (customerCount === total) {
            summary = `Không tìm thấy khách hàng ở ${total} dòng. Vui lòng kiểm tra lại mã khách hàng (có thể dùng ID, mã khách hàng hoặc tên).`;
          } else if (duplicateCount > 0 && customerCount > 0) {
            summary = `Có ${duplicateCount} dòng trùng Số chứng từ và ${customerCount} dòng sai mã khách hàng. Vui lòng kiểm tra lại.`;
          } else if (duplicateCount > 0) {
            summary = `Có ${duplicateCount} dòng trùng Số chứng từ. Hãy để trống cột Số chứng từ để tự động tạo mã mới.`;
          } else if (customerCount > 0) {
            summary = `Có ${customerCount} dòng sai mã khách hàng. Vui lòng kiểm tra lại.`;
          }
          return { data: null, error: { message: summary }, errors };
        }

        const { data, error } = await bulkInsertWithFallback(
          "transactions",
          body.map(pickTransactionColumns) as Record<string, unknown>[],
        );
        if (!error) {
          const factorMap = await this._getLiveFactorMap(companyId || null);
          for (const row of body) {
            await this._syncTransactionBalance(null, row as Record<string, unknown>, companyId || null, factorMap);
          }
        }
        return { data: data || [], error };
      },
      async () => {
        const raw = Array.isArray(rawData) ? rawData : [];
        const now = getNowIso();
        const mockCustomers = (trialGet("customers") || []) as Record<string, unknown>[];
        const mockBankAccounts = (trialGet("bank_accounts") || []) as Record<string, unknown>[];
        const mockBranches = (trialGet("branches") || []) as Record<string, unknown>[];
        const existingTrialTxns = (trialGet("transactions") || []) as Record<string, unknown>[];
        const existingCodes = new Set(
          existingTrialTxns.map((t) => String(t.transaction_code ?? "").trim()).filter(Boolean)
        );

        const seenInBatch = new Set<string>();
        const duplicateErrors: { row: number; message: string }[] = [];

        const generateTxnCode = (idx: number) => {
          let code: string;
          do {
            code = `TXN${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
          } while (existingCodes.has(code) || seenInBatch.has(code));
          return code;
        };

        const body = raw.map((row, idx) => {
          const customerInput = typeof row.customer_id === "string" && row.customer_id.trim()
            ? row.customer_id
            : typeof row.customer_code === "string"
            ? row.customer_code
            : "";
          const bankLabel = typeof row.bank_account === "string" && row.bank_account.trim()
            ? row.bank_account
            : typeof row.bank_account_name === "string"
            ? row.bank_account_name
            : "";
          const branchLabel = typeof row.branch === "string" && row.branch.trim()
            ? row.branch
            : typeof row.branch_name === "string"
            ? row.branch_name
            : "";

          const resolvedCustomer = resolveCustomer(customerInput, mockCustomers);
          const resolvedBank = resolveBankAccount(bankLabel, mockBankAccounts);
          const resolvedBranch = resolveBranch(branchLabel, mockBranches);

          const rawType = typeof row.transaction_type === "string" ? row.transaction_type.trim() : "";
          const transaction_type = normalizeTransactionType(rawType || "payment");

          const providedCode = String(row.transaction_code ?? "").trim();
          let transaction_code: string;
          if (!providedCode) {
            transaction_code = generateTxnCode(idx);
          } else {
            if (existingCodes.has(providedCode)) {
              duplicateErrors.push({ row: idx, message: `Số chứng từ "${providedCode}" đã tồn tại` });
            } else if (seenInBatch.has(providedCode)) {
              duplicateErrors.push({ row: idx, message: `Số chứng từ "${providedCode}" bị trùng trong file` });
            }
            seenInBatch.add(providedCode);
            transaction_code = providedCode;
          }

          return {
            id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            transaction_code,
            customer_id: resolvedCustomer.id || String(row.customer_id ?? "").trim() || null,
            customer_name: resolvedCustomer.name || String(row.customer_name ?? "").trim() || null,
            bank_account_id: resolvedBank.id || String(row.bank_account_id ?? "").trim() || null,
            bank_account_name: resolvedBank.name || String(row.bank_account_name ?? "").trim() || null,
            branch_id: resolvedBranch.id || String(row.branch_id ?? "").trim() || branchId || null,
            branch_name: resolvedBranch.name || String(row.branch_name ?? "").trim() || null,
            company_id: companyId || "trial-company",
            created_by: createdBy || "",
            transaction_type,
            amount: parseAmount(row.amount),
            description: String(row.description ?? "").trim() || null,
            reference_number: String(row.reference_number ?? "").trim() || null,
            transaction_date: parseDate(String(row.transaction_date ?? ""))?.toISOString() ?? now,
            status: String(row.status ?? "").trim() || "completed",
            created_at: now,
            updated_at: now,
          };
        });

        if (duplicateErrors.length > 0) {
          return { data: null, error: { message: duplicateErrors[0].message }, errors: duplicateErrors };
        }

        const inserted = body.map((tx) => trialInsert("transactions", tx as Record<string, unknown>));
        const factorMap = this._getTrialFactorMap();
        for (const tx of body) {
          this._trialSyncTransactionBalance(null, tx as Record<string, unknown>, factorMap);
        }
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
