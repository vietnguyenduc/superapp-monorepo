import { BaseService } from "@superapp/shared-utils";
import { apiClient } from "./supabase";
import { trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateCustomerData, transformRawCustomer, parseAmount, parseAmountOrNull } from "./businessLogic";
import {
  insertWithFallback,
  bulkInsertWithFallback,
  updateWithFallback,
} from "./updateHelpers";
import type { Customer } from "../types";

export class CustomerService extends BaseService {
  static async getCustomers(filters?: Record<string, unknown>) {
    return this.execute(
      async () => {
        let query = apiClient.from("customers").select("*", { count: "exact" });

        const companyFilter = typeof filters?.company_id === "string" ? filters.company_id : undefined;
        if (companyFilter) query = query.eq("company_id", companyFilter);

        const statusFilter = typeof filters?.status === "string" ? filters.status : "active";
        if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter);

        const search = typeof filters?.search === "string" ? filters.search.trim() : "";
        if (search) {
          // Quote the ilike value so PostgREST treats commas/parentheses as literal text
          // instead of logic-tree separators. Double any internal double quotes.
          const safe = search.replace(/"/g, '""');
          const s = `%${safe}%`;
          query = query.or(`full_name.ilike."${s}",customer_code.ilike."${s}",phone.ilike."${s}",email.ilike."${s}"`);
        }

        const dateRange =
          typeof filters?.dateRange === "object" && filters?.dateRange
            ? (filters.dateRange as { start?: string; end?: string })
            : undefined;
        const startDate = dateRange?.start || undefined;
        const endDate = dateRange?.end || undefined;
        if (startDate) query = query.gte("last_transaction_date", startDate);
        if (endDate) query = query.lte("last_transaction_date", endDate);

        const balanceRange =
          typeof filters?.balanceRange === "object" && filters?.balanceRange
            ? (filters.balanceRange as { min?: number | null; max?: number | null })
            : undefined;
        if (balanceRange?.min != null) query = query.gte("total_balance", balanceRange.min);
        if (balanceRange?.max != null) query = query.lte("total_balance", balanceRange.max);

        const limit = Number.isFinite(filters?.limit) ? Number(filters.limit) : undefined;
        const offset = Number(filters.offset ?? 0);

        if (filters?.sortBy === "customer_code") {
          const { data: rawData, error, count } = await query.order("created_at", { ascending: false }).range(0, 9999);
          const data = (rawData || []) as Customer[];
          let mappedData = data.map((c) => ({
            ...c,
            total_balance: c.total_balance ?? 0
          }));
          const direction = filters?.sortOrder === "asc" ? 1 : -1;
          const toNum = (v: unknown) => {
            const n = Number(String(v ?? "").replace(/\s/g, ""));
            return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
          };
          mappedData.sort((a, b) => (toNum(a.customer_code) - toNum(b.customer_code)) * direction);
          if (limit !== undefined) {
            mappedData = mappedData.slice(offset, offset + limit);
          }
          return { data: mappedData, error, count: count || mappedData.length };
        }

        const sortBy = typeof filters?.sortBy === "string" ? filters.sortBy : undefined;
        const orderColumn = sortBy === "total_balance" ? "total_balance" : sortBy || "created_at";
        query = query.order(orderColumn, { ascending: filters?.sortOrder === "asc" });

        if (limit !== undefined) {
          query = query.range(offset, offset + limit - 1);
        }

        const { data: rawData, error, count } = await query;
        const data = (rawData || []) as Customer[];

        const mappedData = data.map((c) => ({
          ...c,
          total_balance: c.total_balance ?? 0
        }));

        return { data: mappedData, error, count: count || mappedData.length };
      },
      async () => {
        let data = (trialGet("customers") || []) as Customer[];
        const companyFilter = typeof filters?.company_id === "string" ? filters.company_id : undefined;
        if (companyFilter) data = data.filter((c) => c.company_id === companyFilter);

        const statusFilter = typeof filters?.status === "string" ? filters.status : "active";
        if (statusFilter && statusFilter !== "all") data = data.filter((c) => c.status === statusFilter);

        const search = typeof filters?.search === "string" ? filters.search.toLowerCase().trim() : "";
        if (search) {
          data = data.filter((c) =>
            c.full_name.toLowerCase().includes(search) ||
            c.customer_code.toLowerCase().includes(search) ||
            (c.phone && c.phone.toLowerCase().includes(search)) ||
            (c.email && c.email.toLowerCase().includes(search))
          );
        }

        const dateRange =
          typeof filters?.dateRange === "object" && filters?.dateRange
            ? (filters.dateRange as { start?: string; end?: string })
            : undefined;
        const startDate = dateRange?.start || undefined;
        const endDate = dateRange?.end || undefined;
        if (startDate || endDate) {
          data = data.filter((c) => {
            if (!c.last_transaction_date) return false;
            const datePart = new Date(c.last_transaction_date).toISOString().slice(0, 10);
            return (!startDate || datePart >= startDate) && (!endDate || datePart <= endDate);
          });
        }

        const balanceRange =
          typeof filters?.balanceRange === "object" && filters?.balanceRange
            ? (filters.balanceRange as { min?: number | null; max?: number | null })
            : undefined;
        if (balanceRange?.min != null || balanceRange?.max != null) {
          data = data.filter((c) => {
            const balance = Number(c.total_balance) || 0;
            return (balanceRange.min == null || balance >= balanceRange.min) &&
                   (balanceRange.max == null || balance <= balanceRange.max);
          });
        }

        const sortBy = typeof filters?.sortBy === "string" ? filters.sortBy : "created_at";
        const ascending = filters?.sortOrder === "asc";
        const direction = ascending ? 1 : -1;
        const toNum = (v: unknown) => {
          const n = Number(String(v ?? "").replace(/\s/g, ""));
          return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
        };
        data.sort((a, b) => {
          if (sortBy === "customer_code") {
            return (toNum(a.customer_code) - toNum(b.customer_code)) * direction;
          }
          const getValue = (item: Customer) => {
            if (sortBy === "total_balance") return item.total_balance ?? 0;
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

        const count = data.length;
        if (Number.isFinite(filters?.limit)) {
          const limit = Number(filters.limit);
          const offset = Number(filters.offset ?? 0);
          data = data.slice(offset, offset + limit);
        }

        const mappedData = data.map((c) => ({
          ...c,
          total_balance: c.total_balance ?? 0
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
        if (error || !customer) return { data: null, error: error || { message: "Không tìm thấy khách hàng" } };

        let updatedByEmail = null;
        if (customer.updated_by) {
          const { data: userData } = await apiClient.from("users").select("email").eq("id", customer.updated_by).single();
          updatedByEmail = userData?.email || null;
        }

        return {
          data: {
            ...customer,
            updated_by_email: updatedByEmail,
          },
          error: null
        };
      },
      async () => {
        const customers = (trialGet("customers") || []) as Customer[];
        const customer = customers.find((c) => c.id === id && (!companyId || c.company_id === companyId));
        if (!customer) return { data: null, error: { message: "Không tìm thấy khách hàng" } };

        return {
          data: {
            ...customer,
            updated_by_email: null,
          },
          error: null
        };
      }
    );
  }

  static async createCustomer(customerData: Record<string, unknown>) {
    return this.execute(
      async () => {
        const validation = validateCustomerData(customerData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        const transformed = transformRawCustomer(customerData) as Record<string, unknown>;
        const proposedCode = String(transformed.customer_code ?? "").trim();

        if (proposedCode) {
          let checkQ = apiClient.from("customers").select("id").eq("customer_code", proposedCode);
          if (typeof transformed.company_id === "string" && transformed.company_id) {
            checkQ = checkQ.eq("company_id", transformed.company_id);
          }
          const { data: existing } = await checkQ;
          if (existing && existing.length > 0) {
            return { data: null, error: { message: `Mã khách hàng "${proposedCode}" đã tồn tại. Vui lòng chọn mã khác.` } };
          }
        }

        const { data, error } = await insertWithFallback("customers", transformed);
        return { data, error };
      },
      async () => {
        const validation = validateCustomerData(customerData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        const transformed = transformRawCustomer(customerData) as Record<string, unknown>;
        const proposedCode = String(transformed.customer_code ?? "").trim();

        if (proposedCode) {
          const companyIdCheck = typeof transformed.company_id === "string" ? transformed.company_id : null;
          const existing = (trialGet("customers") || [] as Customer[]).find(
            (c) => c.customer_code === proposedCode && (!companyIdCheck || c.company_id === companyIdCheck)
          );
          if (existing) {
            return { data: null, error: { message: `Mã khách hàng "${proposedCode}" đã tồn tại. Vui lòng chọn mã khác.` } };
          }
        }

        const result = trialInsert("customers", transformed);
        return { data: result, error: null };
      }
    );
  }

  static async bulkCreateCustomers(customers: Record<string, unknown>[], options?: { skipExisting?: boolean }) {
    return this.execute(
      async () => {
        const errors: Record<string, unknown>[] = [];
        const validRows: { index: number; transformed: Record<string, unknown> }[] = [];
        const seenCodes = new Set<string>();
        const skipped: Record<string, unknown>[] = [];

        for (let i = 0; i < customers.length; i++) {
          const raw = customers[i];
          const validation = validateCustomerData(raw);
          if (!validation.isValid) {
            errors.push({ row: i, column: "general", message: validation.errors.join(", "), value: raw.customer_code });
            continue;
          }

          const transformed = transformRawCustomer(raw) as Record<string, unknown>;
          if (raw.company_id) transformed.company_id = raw.company_id;
          if (raw.branch_id !== undefined) transformed.branch_id = raw.branch_id;
          if (raw.working_method) transformed.working_method = raw.working_method;
          if (raw.notes) transformed.notes = raw.notes;

          const code = String(transformed.customer_code ?? "").trim();
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

        const codes = [...seenCodes];
        if (codes.length > 0) {
          let checkQ = apiClient.from("customers").select("customer_code").in("customer_code", codes);
          const firstCompanyId = validRows[0].transformed.company_id;
          if (typeof firstCompanyId === "string" && firstCompanyId) {
            checkQ = checkQ.eq("company_id", firstCompanyId);
          }
          const { data: existing } = await checkQ;
          if (existing && existing.length > 0) {
            const existingRows = existing as { customer_code: string }[];
            const existingCodes = new Set(existingRows.map((c) => c.customer_code));
            for (let j = validRows.length - 1; j >= 0; j--) {
              const code = String(validRows[j].transformed.customer_code ?? "").trim();
              if (code && existingCodes.has(code)) {
                if (options?.skipExisting) {
                  skipped.push({ row: validRows[j].index, column: "customer_code", message: `Mã khách hàng "${code}" đã tồn tại`, value: code });
                } else {
                  errors.push({ row: validRows[j].index, column: "customer_code", message: `Mã khách hàng "${code}" đã tồn tại. Vui lòng chọn mã khác.`, value: code });
                }
                validRows.splice(j, 1);
              }
            }
          }
        }

        if (validRows.length === 0) {
          return { data: [], error: null, errors, skipped };
        }

        const insertPayload = validRows.map((r) => r.transformed);
        const { data, error } = await bulkInsertWithFallback("customers", insertPayload as Record<string, unknown>[]);

        if (error) {
          return { data: null, error, errors, skipped };
        }

        return { data: data || [], error: null, errors, skipped };
      },
      async () => {
        const errors: Record<string, unknown>[] = [];
        const inserted: Record<string, unknown>[] = [];
        const skipped: Record<string, unknown>[] = [];
        const seenCodes = new Set<string>();

        for (let i = 0; i < customers.length; i++) {
          const raw = customers[i];
          const validation = validateCustomerData(raw);
          if (!validation.isValid) {
            errors.push({ row: i, column: "general", message: validation.errors.join(", "), value: raw.customer_code });
            continue;
          }

          const transformed = transformRawCustomer(raw) as Record<string, unknown>;
          if (raw.company_id) transformed.company_id = raw.company_id;
          if (raw.branch_id !== undefined) transformed.branch_id = raw.branch_id;
          if (raw.working_method) transformed.working_method = raw.working_method;
          if (raw.notes) transformed.notes = raw.notes;

          const code = String(transformed.customer_code ?? "").trim();
          if (code && seenCodes.has(code)) {
            errors.push({ row: i, column: "customer_code", message: `Mã khách hàng trùng trong file: ${code}`, value: code });
            continue;
          }

          const companyIdCheck = typeof transformed.company_id === "string" ? transformed.company_id : null;
          const existing = (trialGet("customers") || [] as Customer[]).find(
            (c) => c.customer_code === code && (!companyIdCheck || c.company_id === companyIdCheck)
          );
          if (existing) {
            if (options?.skipExisting) {
              skipped.push({ row: i, column: "customer_code", message: `Mã khách hàng "${code}" đã tồn tại`, value: code });
            } else {
              errors.push({ row: i, column: "customer_code", message: `Mã khách hàng "${code}" đã tồn tại. Vui lòng chọn mã khác.`, value: code });
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

  static async checkDuplicatePhone(phone: string, companyId?: string) {
    return this.execute(
      async () => {
        if (!phone.trim()) return { data: [], error: null };
        let query = apiClient.from("customers").select("id,full_name,phone,customer_code,email").eq("phone", phone.trim());
        if (companyId) query = query.eq("company_id", companyId);
        const { data, error } = await query;
        if (error) return { data: null, error };
        return { data: data || [], error: null };
      },
      async () => {
        if (!phone.trim()) return { data: [], error: null };
        const customers = (trialGet("customers") || []) as Customer[];
        const matches = customers.filter(
          (c) => c.phone === phone.trim() && (!companyId || c.company_id === companyId)
        );
        return { data: matches, error: null };
      }
    );
  }

  static async generateCustomerCode(companyId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("customers").select("customer_code");
        if (companyId) query = query.eq("company_id", companyId);
        const { data, error } = await query;
        if (error) return { data: null, error };
        const count = (data || []).length;
        const code = `KH${String(count + 1).padStart(4, "0")}`;
        return { data: code, error: null };
      },
      async () => {
        const customers = (trialGet("customers") || []) as Customer[];
        const count = companyId
          ? customers.filter((c) => c.company_id === companyId).length
          : customers.length;
        const code = `KH${String(count + 1).padStart(4, "0")}`;
        return { data: code, error: null };
      }
    );
  }

  static async checkDuplicateCustomers(customers: Record<string, unknown>[], companyId?: string) {
    return this.execute(
      async () => {
        const codes = [...new Set(customers.map((c) => String(c.customer_code ?? "").trim()).filter(Boolean))];
        if (codes.length === 0) return { data: [], error: null };

        const duplicates: Record<string, unknown>[] = [];
        const chunkSize = 100;
        for (let i = 0; i < codes.length; i += chunkSize) {
          const chunk = codes.slice(i, i + chunkSize);
          let q = apiClient.from("customers").select("id,customer_code").in("customer_code", chunk);
          if (companyId) q = q.eq("company_id", companyId);
          const { data, error } = await q;
          if (error) return { data: null, error, errors: [error] };
          duplicates.push(...((data || []) as Record<string, unknown>[]));
        }
        return { data: duplicates, error: null };
      },
      async () => {
        const trialCustomers = (trialGet("customers") || []) as Customer[];
        const seen = new Set<string>();
        const duplicates: Record<string, unknown>[] = [];
        for (const tc of trialCustomers) {
          const match = customers.find(
            (c) => String(c.customer_code ?? "").trim() === tc.customer_code && (!companyId || String(c.company_id ?? "") === companyId)
          );
          if (match && !seen.has(tc.customer_code)) {
            seen.add(tc.customer_code);
            duplicates.push(tc as Record<string, unknown>);
          }
        }
        return { data: duplicates, error: null };
      }
    );
  }

  static async updateCustomer(id: string, customerData: Record<string, unknown>) {
    return this.execute(
      async () => {
        const validation = validateCustomerData(customerData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        // Fetch the existing row to know its tenant and balance state.
        const { data: existingCustomer } = await apiClient.from("customers").select("company_id, opening_balance, total_balance").eq("id", id).single();
        const existing = (existingCustomer as Record<string, unknown> | null) ?? {};
        const companyIdCheck = existing.company_id as string | null | undefined;

        const updatePayload: Record<string, unknown> = {
          ...customerData,
          updated_at: new Date().toISOString(),
        };
        delete updatePayload.id;
        delete updatePayload.created_at;
        // Prevent a tenant change from ever being written by a user payload.
        delete updatePayload.company_id;

        // When the opening balance changes, keep total_balance in sync using the
        // same delta so list and detail stay consistent.
        if ("opening_balance" in updatePayload) {
          const oldOpening = parseAmount(existing.opening_balance) || 0;
          const oldTotal = parseAmount(existing.total_balance) || 0;
          const newOpening = parseAmount(updatePayload.opening_balance) ?? oldOpening;
          const newTotal = newOpening + (oldTotal - oldOpening);
          updatePayload.total_balance = newTotal;
          updatePayload.current_balance = newTotal;
        }

        const proposedCode = String(updatePayload.customer_code ?? "").trim();

        if (proposedCode) {
          let checkQ = apiClient.from("customers").select("id").eq("customer_code", proposedCode).neq("id", id);
          if (companyIdCheck) checkQ = checkQ.eq("company_id", companyIdCheck);
          const { data: existing } = await checkQ;
          if (existing && existing.length > 0) {
            return { data: null, error: { message: `Mã khách hàng "${proposedCode}" đã tồn tại. Vui lòng chọn mã khác.` } };
          }
        }

        const { data, error } = await updateWithFallback("customers", id, updatePayload);
        return { data, error };
      },
      async () => {
        const validation = validateCustomerData(customerData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };

        const existingCustomer = ((trialGet("customers") || []) as Customer[]).find((c) => c.id === id);
        const companyIdCheck = existingCustomer?.company_id;

        const updatePayload: Record<string, unknown> = {
          ...customerData,
          updated_at: new Date().toISOString(),
        };
        delete updatePayload.id;
        delete updatePayload.created_at;
        // Prevent a tenant change from ever being written by a user payload.
        delete updatePayload.company_id;

        // When the opening balance changes, keep total_balance in sync using the
        // same delta so list and detail stay consistent.
        if ("opening_balance" in updatePayload && existingCustomer) {
          const oldOpening = parseAmount(existingCustomer.opening_balance) || 0;
          const oldTotal = parseAmount(existingCustomer.total_balance) || 0;
          const newOpening = parseAmount(updatePayload.opening_balance) ?? oldOpening;
          const newTotal = newOpening + (oldTotal - oldOpening);
          updatePayload.total_balance = newTotal;
          updatePayload.current_balance = newTotal;
        }

        const proposedCode = String(updatePayload.customer_code ?? "").trim();

        if (proposedCode) {
          const existing = (trialGet("customers") || [] as Customer[]).find(
            (c) => c.id !== id && c.customer_code === proposedCode && (!companyIdCheck || c.company_id === companyIdCheck)
          );
          if (existing) {
            return { data: null, error: { message: `Mã khách hàng "${proposedCode}" đã tồn tại. Vui lòng chọn mã khác.` } };
          }
        }

        const result = trialUpdate("customers", id, updatePayload);
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
        if (fetchErr || !existing) return { data: null, error: fetchErr || { message: "Không tìm thấy khách hàng" } };

        const oldOpening = Number(existing.opening_balance || 0);
        const oldTotal = Number(existing.total_balance || 0);
        const delta = oldTotal - oldOpening;
        const newTotal = newOpening + delta;

        const { data, error } = await updateWithFallback("customers", customerId, {
          opening_balance: newOpening,
          total_balance: newTotal,
          current_balance: newTotal,
          company_id: (existing as any).company_id,
          updated_at: new Date().toISOString(),
        });

        return { data, error };
      },
      async () => {
        const customers = (trialGet("customers") || []) as Customer[];
        const existing = customers.find((c) => c.id === customerId && (!companyId || c.company_id === companyId));
        if (!existing) return { data: null, error: { message: "Không tìm thấy khách hàng" } };

        const oldOpening = Number(existing.opening_balance || 0);
        const oldTotal = Number(existing.total_balance || 0);
        const delta = oldTotal - oldOpening;
        const newTotal = newOpening + delta;

        const result = trialUpdate("customers", customerId, {
          opening_balance: newOpening,
          total_balance: newTotal,
          current_balance: newTotal,
          updated_at: new Date().toISOString()
        });

        return { data: result, error: null };
      }
    );
  }

  static async bulkUpdateOpeningBalances(rows: { customer_code?: string; opening_balance?: unknown }[], companyId?: string) {
    return this.execute(
      async () => {
        const errors: Record<string, unknown>[] = [];
        const codeToRow: Record<string, { row: number; opening: number }> = {};
        rows.forEach((row, i) => {
          const code = String(row.customer_code ?? "").trim();
          const opening = parseAmountOrNull(row.opening_balance);
          if (!code) {
            errors.push({ row: i, message: "Thiếu mã khách hàng" });
            return;
          }
          if (opening === null) {
            errors.push({ row: i, message: "Số dư đầu kỳ không hợp lệ", value: row.opening_balance });
            return;
          }
          codeToRow[code] = { row: i, opening };
        });

        const codes = Object.keys(codeToRow);
        if (codes.length === 0) return { data: { updatedCount: 0, errors }, error: null };

        let query = apiClient.from("customers").select("id,customer_code,opening_balance,total_balance,company_id,status,full_name").in("customer_code", codes);
        if (companyId) query = query.eq("company_id", companyId);
        const { data: customers, error: fetchError } = await query;
        if (fetchError) return { data: { updatedCount: 0, errors: [...errors, { message: fetchError.message }] }, error: fetchError };

        const customerRows = (customers || []) as Customer[];
        const customerMap = new Map(customerRows.map((c) => [c.customer_code, c]));
        const payload: Record<string, unknown>[] = [];
        const now = new Date().toISOString();

        for (const [code, { row, opening }] of Object.entries(codeToRow)) {
          const customer = customerMap.get(code);
          if (!customer) {
            errors.push({ row, message: "Không tìm thấy khách hàng", value: code });
            continue;
          }
          const oldOpening = Number(customer.opening_balance || 0);
          const oldTotal = Number(customer.total_balance || 0);
          const delta = oldTotal - oldOpening;
          payload.push({
            id: customer.id,
            customer_code: customer.customer_code,
            full_name: customer.full_name,
            company_id: customer.company_id,
            status: customer.status,
            opening_balance: opening,
            total_balance: opening + delta,
            current_balance: opening + delta,
            updated_at: now,
          });
        }

        if (payload.length === 0) return { data: { updatedCount: 0, errors }, error: null };

        const { data, error } = await apiClient.from("customers").upsert(payload as Record<string, unknown>[], { onConflict: "id" }).select();
        if (error) return { data: { updatedCount: 0, errors: [...errors, { message: error.message }] }, error };
        return { data: { updatedCount: data?.length || 0, errors }, error: null };
      },
      async () => {
        const errors: Record<string, unknown>[] = [];
        const customers = (trialGet("customers") || []) as Customer[];
        let updatedCount = 0;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const code = String(row.customer_code ?? "").trim();
          const opening = parseAmountOrNull(row.opening_balance);
          if (!code) { errors.push({ row: i, message: "Thiếu mã khách hàng" }); continue; }
          if (opening === null) { errors.push({ row: i, message: "Số dư đầu kỳ không hợp lệ", value: row.opening_balance }); continue; }

          const customer = customers.find((c) => c.customer_code === code && (!companyId || c.company_id === companyId));
          if (!customer) { errors.push({ row: i, message: "Không tìm thấy khách hàng", value: code }); continue; }

          const oldOpening = Number(customer.opening_balance || 0);
          const oldTotal = Number(customer.total_balance || 0);
          const delta = oldTotal - oldOpening;
          trialUpdate("customers", customer.id, {
            opening_balance: opening,
            total_balance: opening + delta,
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
        const { data, error } = await apiClient.from("customers").upsert(payload as Record<string, unknown>[]).select();
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
  checkDuplicatePhone: CustomerService.checkDuplicatePhone.bind(CustomerService),
  generateCustomerCode: CustomerService.generateCustomerCode.bind(CustomerService),
  updateCustomer: CustomerService.updateCustomer.bind(CustomerService),
  deleteCustomer: CustomerService.deleteCustomer.bind(CustomerService),
  updateCustomerOpeningBalance: CustomerService.updateCustomerOpeningBalance.bind(CustomerService),
  bulkUpdateOpeningBalances: CustomerService.bulkUpdateOpeningBalances.bind(CustomerService),
  bulkUpdateCustomerNames: CustomerService.bulkUpdateCustomerNames.bind(CustomerService),
};
