import { BaseService } from "@superapp/shared-utils";
import { supabase , apiClient} from "./supabase";
import { getTrialMode, trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateCustomerData, transformRawCustomer } from "./businessLogic";
import { normalizeTransactionType, parseAmount } from "./businessLogic";

export class CustomerService extends BaseService {
  static async getCustomers(filters?: any) {
    return this.execute(
      async () => {
        let query = apiClient.from("customers").select("*", { count: "exact" });
        if (filters?.company_id) {
          query = query.eq("company_id", filters.company_id);
        }

        if (filters?.search) {
          const s = `%${filters.search}%`;
          query = query.or(`full_name.ilike.${s},customer_code.ilike.${s},phone.ilike.${s},email.ilike.${s}`);
        }

        const limit = Number.isFinite(filters?.limit) ? Number(filters.limit) : undefined;
        const offset = Number(filters.offset || 0);

        if (filters?.sortBy === "customer_code") {
          // customer_code is text but the user expects numeric ordering.
          // Fetch all matching rows, sort in memory, then slice to the requested page.
          const { data, error, count } = await query.order("created_at", { ascending: false }).range(0, 9999);
          let mappedData = (data || []).map((c: any) => ({
            ...c,
            total_balance: c.current_balance ?? c.total_balance ?? 0
          }));
          const direction = filters?.sortOrder === "asc" ? 1 : -1;
          const toNum = (v: any) => {
            const n = Number(String(v || "").replace(/\s/g, ""));
            return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
          };
          mappedData.sort((a: any, b: any) => (toNum(a.customer_code) - toNum(b.customer_code)) * direction);
          if (limit !== undefined) {
            mappedData = mappedData.slice(offset, offset + limit);
          }
          return { data: mappedData, error, count: count || mappedData.length };
        }

        const orderColumn = filters?.sortBy === "total_balance" ? "current_balance" : filters?.sortBy || "created_at";
        query = query.order(orderColumn, { ascending: filters?.sortOrder === "asc" });

        if (limit !== undefined) {
          query = query.range(offset, offset + limit - 1);
        }

        const { data, error, count } = await query;

        const mappedData = (data || []).map((c: any) => ({
          ...c,
          total_balance: c.current_balance ?? c.total_balance ?? 0
        }));

        return { data: mappedData, error, count: count || mappedData.length };
      },
      async () => {
        let data = trialGet("customers") || [];
        if (filters?.company_id) data = data.filter((c: any) => c.company_id === filters.company_id);
        
        const search = String(filters?.search || "").toLowerCase().trim();
        if (search) {
          data = data.filter((c: any) => 
            (c.full_name && c.full_name.toLowerCase().includes(search)) ||
            (c.customer_code && c.customer_code.toLowerCase().includes(search)) ||
            (c.phone && c.phone.toLowerCase().includes(search)) ||
            (c.email && c.email.toLowerCase().includes(search))
          );
        }
        
        const sortBy = filters?.sortBy || "created_at";
        const ascending = filters?.sortOrder === "asc";
        const direction = ascending ? 1 : -1;
        const toNum = (v: any) => {
          const n = Number(String(v || "").replace(/\s/g, ""));
          return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
        };
        data.sort((a: any, b: any) => {
          if (sortBy === "customer_code") {
            return (toNum(a.customer_code) - toNum(b.customer_code)) * direction;
          }
          const getValue = (item: any) => {
            if (sortBy === "total_balance") return item.current_balance ?? item.total_balance ?? 0;
            return item[sortBy] ?? null;
          };
          const aValue = getValue(a);
          const bValue = getValue(b);
          if (aValue === undefined || aValue === null) return 1 * direction;
          if (bValue === undefined || bValue === null) return -1 * direction;
          if (typeof aValue === "number" && typeof bValue === "number") return (aValue - bValue) * direction;
          if (sortBy === "last_transaction_date" || sortBy === "created_at") {
            return (new Date(aValue).getTime() - new Date(bValue).getTime()) * direction;
          }
          return String(aValue).localeCompare(String(bValue)) * direction;
        });
        
        let count = data.length;
        if (Number.isFinite(filters?.limit)) {
          const limit = Number(filters.limit);
          const offset = Number(filters.offset || 0);
          data = data.slice(offset, offset + limit);
        }
        
        const mappedData = data.map((c: any) => ({
          ...c,
          total_balance: c.current_balance ?? c.total_balance ?? 0
        }));
        
        return { data: mappedData, error: null, count };
      }
    );
  }

  static async getCustomerById(id: string, companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("customers").select("*").eq("id", id);
        if (companyId) query = query.eq("company_id", companyId);
        
        const { data: customer, error } = await query.single();
        if (error || !customer) return { data: null, error: error || { message: "Customer not found" } };
        
        let updatedByEmail = null;
        if (customer.updated_by) {
          const { data: userData } = await apiClient.from("users").select("email").eq("id", customer.updated_by).single();
          updatedByEmail = userData?.email || null;
        }
        
        const { data: txData } = await apiClient.from("transactions").select("transaction_type, amount").eq("customer_id", id);

        let calculatedBalance = parseAmount(customer.opening_balance) || 0;
        let transactionCount = 0;
        
        if (txData) {
          transactionCount = txData.length;
          for (const tx of txData) {
            const amtSigned = parseAmount(tx.amount);
            const amtAbs = Math.abs(amtSigned);
            const type = normalizeTransactionType(String(tx.transaction_type || ""));
            
            if (type === "payment") calculatedBalance -= amtAbs;
            else if (type === "charge") calculatedBalance += amtAbs;
            else if (type === "refund") calculatedBalance -= amtAbs;
            else calculatedBalance += amtSigned;
          }
        }
        
        return {
          data: {
            ...customer,
            total_balance: calculatedBalance,
            transaction_count: transactionCount,
            updated_by_email: updatedByEmail,
          },
          error: null
        };
      },
      async () => {
        const customers = trialGet("customers") || [];
        const customer = customers.find((c: any) => c.id === id && (!companyId || c.company_id === companyId));
        if (!customer) return { data: null, error: { message: "Customer not found" } };
        
        const transactions = trialGet("transactions") || [];
        const txData = transactions.filter((t: any) => t.customer_id === id);

        let calculatedBalance = parseAmount(customer.opening_balance) || 0;
        let transactionCount = txData.length;
        
        for (const tx of txData) {
          const amtSigned = parseAmount(tx.amount);
          const amtAbs = Math.abs(amtSigned);
          const type = normalizeTransactionType(String(tx.transaction_type || ""));
          
          if (type === "payment") calculatedBalance -= amtAbs;
          else if (type === "charge") calculatedBalance += amtAbs;
          else if (type === "refund") calculatedBalance -= amtAbs;
          else calculatedBalance += amtSigned;
        }
        
        return {
          data: {
            ...customer,
            total_balance: calculatedBalance,
            transaction_count: transactionCount,
            updated_by_email: null,
          },
          error: null
        };
      }
    );
  }

  static async createCustomer(customerData: any) {
    return this.execute(
      async () => {
        const validation = validateCustomerData(customerData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawCustomer(customerData, true);
        const proposedCode = transformed.customer_code?.trim();
        
        if (proposedCode) {
          let checkQ = apiClient.from("customers").select("id").eq("customer_code", proposedCode);
          if (transformed.company_id) checkQ = checkQ.eq("company_id", transformed.company_id);
          const { data: existing } = await checkQ;
          if (existing && existing.length > 0) {
            return { data: null, error: { message: `Customer with code "${proposedCode}" already exists` } };
          }
        }
        
        const { data, error } = await apiClient.from("customers").insert(transformed as any).select().single();
        return { data, error };
      },
      async () => {
        const validation = validateCustomerData(customerData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawCustomer(customerData, false);
        const proposedCode = transformed.customer_code?.trim();
        
        if (proposedCode) {
          const existing = (trialGet("customers") || []).find((c: any) => c.customer_code === proposedCode && c.company_id === transformed.company_id);
          if (existing) {
            return { data: null, error: { message: `Customer with code "${proposedCode}" already exists` } };
          }
        }
        
        const result = trialInsert("customers", transformed);
        return { data: result, error: null };
      }
    );
  }

  static async bulkCreateCustomers(customers: any[], options?: { skipExisting?: boolean }) {
    return this.execute(
      async () => {
        const errors: any[] = [];
        const validRows: any[] = [];
        const seenCodes = new Set<string>();
        const skipped: any[] = [];

        // Validate + transform each row
        for (let i = 0; i < customers.length; i++) {
          const raw = customers[i];
          const validation = validateCustomerData(raw);
          if (!validation.isValid) {
            errors.push({ row: i, column: "general", message: validation.errors.join(", "), value: raw.customer_code });
            continue;
          }

          const transformed = transformRawCustomer(raw, true);
          // Merge fields that transformRawCustomer doesn't include
          if (raw.company_id) transformed.company_id = raw.company_id;
          if (raw.branch_id !== undefined) transformed.branch_id = raw.branch_id;
          if (raw.working_method) transformed.working_method = raw.working_method;
          if (raw.notes) transformed.notes = raw.notes;

          const code = transformed.customer_code?.trim();
          if (code && seenCodes.has(code)) {
            errors.push({ row: i, column: "customer_code", message: `Mã khách hàng trùng trong file: ${code}`, value: code });
            continue;
          }
          if (code) seenCodes.add(code);
          validRows.push({ index: i, transformed });
        }

        if (validRows.length === 0) {
          return { data: [], error: null, errors, skipped };
        }

        // Check duplicate codes against existing DB records (single batch query)
        const codes = [...seenCodes];
        if (codes.length > 0) {
          let checkQ = apiClient.from("customers").select("customer_code").in("customer_code", codes);
          if (validRows[0].transformed.company_id) {
            checkQ = checkQ.eq("company_id", validRows[0].transformed.company_id);
          }
          const { data: existing } = await checkQ;
          if (existing && existing.length > 0) {
            const existingCodes = new Set(existing.map((c: any) => c.customer_code));
            for (let j = validRows.length - 1; j >= 0; j--) {
              const code = validRows[j].transformed.customer_code?.trim();
              if (code && existingCodes.has(code)) {
                if (options?.skipExisting) {
                  skipped.push({ row: validRows[j].index, column: "customer_code", message: `Mã khách hàng "${code}" đã tồn tại`, value: code });
                } else {
                  errors.push({ row: validRows[j].index, column: "customer_code", message: `Customer with code "${code}" already exists`, value: code });
                }
                validRows.splice(j, 1);
              }
            }
          }
        }

        if (validRows.length === 0) {
          return { data: [], error: null, errors, skipped };
        }

        // Batch insert
        const insertPayload = validRows.map((r) => r.transformed);
        const { data, error } = await apiClient.from("customers").insert(insertPayload as any).select();

        if (error) {
          return { data: null, error, errors, skipped };
        }

        return { data: data || [], error: null, errors, skipped };
      },
      async () => {
        const errors: any[] = [];
        const inserted: any[] = [];
        const skipped: any[] = [];
        const seenCodes = new Set<string>();

        for (let i = 0; i < customers.length; i++) {
          const raw = customers[i];
          const validation = validateCustomerData(raw);
          if (!validation.isValid) {
            errors.push({ row: i, column: "general", message: validation.errors.join(", "), value: raw.customer_code });
            continue;
          }

          const transformed = transformRawCustomer(raw, false);
          if (raw.company_id) transformed.company_id = raw.company_id;
          if (raw.branch_id !== undefined) transformed.branch_id = raw.branch_id;
          if (raw.working_method) transformed.working_method = raw.working_method;
          if (raw.notes) transformed.notes = raw.notes;

          const code = transformed.customer_code?.trim();
          if (code && seenCodes.has(code)) {
            errors.push({ row: i, column: "customer_code", message: `Mã khách hàng trùng trong file: ${code}`, value: code });
            continue;
          }

          const existing = (trialGet("customers") || []).find((c: any) => c.customer_code === code && c.company_id === transformed.company_id);
          if (existing) {
            if (options?.skipExisting) {
              skipped.push({ row: i, column: "customer_code", message: `Mã khách hàng "${code}" đã tồn tại`, value: code });
            } else {
              errors.push({ row: i, column: "customer_code", message: `Customer with code "${code}" already exists`, value: code });
            }
            continue;
          }

          if (code) seenCodes.add(code);
          const result = trialInsert("customers", transformed);
          if (result) inserted.push(result);
        }

        return { data: inserted, error: null, errors, skipped };
      }
    );
  }

  static async checkDuplicateCustomers(customers: any[], companyId?: string) {
    return this.execute(
      async () => {
        const codes = [...new Set(customers.map((c) => String(c.customer_code || "").trim()).filter(Boolean))];
        if (codes.length === 0) return { data: [], error: null };

        const duplicates: any[] = [];
        const chunkSize = 100;
        for (let i = 0; i < codes.length; i += chunkSize) {
          const chunk = codes.slice(i, i + chunkSize);
          let q = apiClient.from("customers").select("id,customer_code").in("customer_code", chunk);
          if (companyId) q = q.eq("company_id", companyId);
          const { data, error } = await q;
          if (error) return { data: null, error, errors: [error] };
          duplicates.push(...(data || []));
        }
        return { data: duplicates, error: null };
      },
      async () => {
        const trialCustomers = trialGet("customers") || [];
        const seen = new Set<string>();
        const duplicates: any[] = [];
        for (const tc of trialCustomers) {
          const match = customers.find(
            (c: any) => String(c.customer_code || "").trim() === tc.customer_code && (!companyId || c.company_id === companyId)
          );
          if (match && !seen.has(tc.customer_code)) {
            seen.add(tc.customer_code);
            duplicates.push(tc);
          }
        }
        return { data: duplicates, error: null };
      }
    );
  }

  static async updateCustomer(id: string, customerData: any) {
    return this.execute(
      async () => {
        const validation = validateCustomerData(customerData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawCustomer(customerData, true);
        const proposedCode = transformed.customer_code?.trim();
        
        if (proposedCode) {
          let checkQ = apiClient.from("customers").select("id").eq("customer_code", proposedCode).neq("id", id);
          if (transformed.company_id) checkQ = checkQ.eq("company_id", transformed.company_id);
          const { data: existing } = await checkQ;
          if (existing && existing.length > 0) {
            return { data: null, error: { message: `Customer with code "${proposedCode}" already exists` } };
          }
        }
        
        const { data, error } = await apiClient.from("customers").update(transformed as any).eq("id", id).select().single();
        return { data, error };
      },
      async () => {
        const validation = validateCustomerData(customerData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawCustomer(customerData, false);
        const proposedCode = transformed.customer_code?.trim();
        
        if (proposedCode) {
          const existing = (trialGet("customers") || []).find((c: any) => c.id !== id && c.customer_code === proposedCode && c.company_id === transformed.company_id);
          if (existing) {
            return { data: null, error: { message: `Customer with code "${proposedCode}" already exists` } };
          }
        }
        
        const result = trialUpdate("customers", id, transformed);
        return { data: result, error: null };
      }
    );
  }

  static async deleteCustomer(id: string) {
    return this.execute(
      async () => {
        const { error } = await apiClient.from("customers").delete().eq("id", id);
        return { data: null, error };
      },
      async () => {
        trialDelete("customers", id);
        return { data: null, error: null };
      }
    );
  }

  static async updateCustomerOpeningBalance(customerId: string, newOpening: number, companyId?: string) {
    return this.execute(
      async () => {
        let q = apiClient.from("customers").select("*").eq("id", customerId);
        if (companyId) q = q.eq("company_id", companyId);
        const { data: existing, error: fetchErr } = await q.single();
        if (fetchErr || !existing) return { data: null, error: fetchErr || { message: "Customer not found" } };
        
        const oldOpening = Number(existing.opening_balance || 0);
        const oldCurrent = Number(existing.current_balance || 0);
        const delta = oldCurrent - oldOpening;
        const newCurrent = newOpening + delta;
        
        const { data, error } = await apiClient.from("customers").update({
          opening_balance: newOpening,
          current_balance: newCurrent,
          updated_at: new Date().toISOString()
        } as any).eq("id", customerId).select().single();
        
        return { data, error };
      },
      async () => {
        const customers = trialGet("customers") || [];
        const existing = customers.find((c: any) => c.id === customerId && (!companyId || c.company_id === companyId));
        if (!existing) return { data: null, error: { message: "Customer not found" } };
        
        const oldOpening = Number(existing.opening_balance || 0);
        const oldCurrent = Number(existing.current_balance || 0);
        const delta = oldCurrent - oldOpening;
        const newCurrent = newOpening + delta;
        
        const result = trialUpdate("customers", customerId, {
          opening_balance: newOpening,
          current_balance: newCurrent,
          updated_at: new Date().toISOString()
        });
        
        return { data: result, error: null };
      }
    );
  }

  static async bulkUpdateOpeningBalances(rows: { customer_code?: string; opening_balance?: number }[], companyId?: string) {
    return this.execute(
      async () => {
        const errors: any[] = [];
        const codeToRow: Record<string, { row: number; opening: number }> = {};
        rows.forEach((row, i) => {
          const code = String(row.customer_code || "").trim();
          const opening = Number(row.opening_balance);
          if (!code) {
            errors.push({ row: i, message: "Missing customer_code" });
            return;
          }
          if (!Number.isFinite(opening)) {
            errors.push({ row: i, message: "Invalid opening_balance", value: row.opening_balance });
            return;
          }
          codeToRow[code] = { row: i, opening };
        });

        const codes = Object.keys(codeToRow);
        if (codes.length === 0) return { data: { updatedCount: 0, errors }, error: null };

        let query = apiClient.from("customers").select("id,customer_code,opening_balance,current_balance").in("customer_code", codes);
        if (companyId) query = query.eq("company_id", companyId);
        const { data: customers, error: fetchError } = await query;
        if (fetchError) return { data: { updatedCount: 0, errors: [...errors, { message: fetchError.message }] }, error: fetchError };

        const customerMap = new Map((customers || []).map((c: any) => [c.customer_code, c]));
        const payload: any[] = [];
        const now = new Date().toISOString();

        for (const [code, { row, opening }] of Object.entries(codeToRow)) {
          const customer = customerMap.get(code);
          if (!customer) {
            errors.push({ row, message: "Customer not found", value: code });
            continue;
          }
          const oldOpening = Number(customer.opening_balance || 0);
          const oldCurrent = Number(customer.current_balance || 0);
          const delta = oldCurrent - oldOpening;
          payload.push({
            id: customer.id,
            opening_balance: opening,
            current_balance: opening + delta,
            updated_at: now,
          });
        }

        if (payload.length === 0) return { data: { updatedCount: 0, errors }, error: null };

        const { data, error } = await apiClient.from("customers").upsert(payload as any).select();
        if (error) return { data: { updatedCount: 0, errors: [...errors, { message: error.message }] }, error };
        return { data: { updatedCount: data?.length || 0, errors }, error: null };
      },
      async () => {
        const errors: any[] = [];
        const customers = trialGet("customers") || [];
        let updatedCount = 0;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const code = String(row.customer_code || "").trim();
          const opening = Number(row.opening_balance);
          if (!code) { errors.push({ row: i, message: "Missing customer_code" }); continue; }
          if (!Number.isFinite(opening)) { errors.push({ row: i, message: "Invalid opening_balance", value: row.opening_balance }); continue; }

          const customer = customers.find((c: any) => c.customer_code === code && (!companyId || c.company_id === companyId));
          if (!customer) { errors.push({ row: i, message: "Customer not found", value: code }); continue; }

          const oldOpening = Number(customer.opening_balance || 0);
          const oldCurrent = Number(customer.current_balance || 0);
          const delta = oldCurrent - oldOpening;
          trialUpdate("customers", customer.id, {
            opening_balance: opening,
            current_balance: opening + delta,
            updated_at: new Date().toISOString()
          });
          updatedCount++;
        }
        return { data: { updatedCount, errors }, error: null };
      }
    );
  }

  static async bulkUpdateCustomerNames(records: { id: string; full_name: string; updated_at?: string }[]) {
    return this.execute(
      async () => {
        if (records.length === 0) return { data: { updatedCount: 0 }, error: null };
        const payload = records.map((r) => ({
          id: r.id,
          full_name: r.full_name,
          updated_at: r.updated_at || new Date().toISOString(),
        }));
        const { data, error } = await apiClient.from("customers").upsert(payload as any).select();
        if (error) return { data: null, error, errors: [error] };
        return { data: { updatedCount: data?.length || 0 }, error: null };
      },
      async () => {
        let updatedCount = 0;
        for (const r of records) {
          const updated = trialUpdate("customers", r.id, { full_name: r.full_name });
          if (updated) updatedCount++;
        }
        return { data: { updatedCount }, error: null };
      }
    );
  }
}

export const customerService = {
  getCustomers: CustomerService.getCustomers.bind(CustomerService),
  getCustomerById: CustomerService.getCustomerById.bind(CustomerService),
  createCustomer: CustomerService.createCustomer.bind(CustomerService),
  bulkCreateCustomers: CustomerService.bulkCreateCustomers.bind(CustomerService),
  checkDuplicateCustomers: CustomerService.checkDuplicateCustomers.bind(CustomerService),
  updateCustomer: CustomerService.updateCustomer.bind(CustomerService),
  deleteCustomer: CustomerService.deleteCustomer.bind(CustomerService),
  updateCustomerOpeningBalance: CustomerService.updateCustomerOpeningBalance.bind(CustomerService),
  bulkUpdateOpeningBalances: CustomerService.bulkUpdateOpeningBalances.bind(CustomerService),
  bulkUpdateCustomerNames: CustomerService.bulkUpdateCustomerNames.bind(CustomerService),
};
