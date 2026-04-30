// Cashflow database services — all data served from Supabase
import type { Customer, Transaction, TransactionType } from "../types";
import { supabase } from "./supabase";
import { userService } from "./user-service";
import { getTrialMode, trialGet, trialDelete, trialUpdate, trialInsert } from "./trialMockStore";
import { getDataAdapter } from "./dataAdapter";
import { validateTransactionTypeData, transformRawTransactionType, validateBranchData, transformRawBranch, validateBankAccountData, transformRawBankAccount, validateCustomerData, transformRawCustomer } from "./businessLogic";

type TimeRange = "day" | "week" | "month" | "quarter" | "year";

const reportService = {
  async getReports() {
    return { data: [], error: null };
  },
};

const colorSettingsService = {
  async getTransactionTypeColors() {
    // Trial mode: return default colors without Supabase call
    if (getTrialMode()) {
      return { data: this.getDefaultTransactionTypeColors(), error: null };
    }

    try {
      const { data, error } = await (supabase as any)
        .from("color_settings")
        .select("setting_value")
        .eq("setting_key", "transaction_type_colors")
        .single();

      if (error) {
        console.warn("Failed to fetch transaction type colors, using defaults", error);
        return this.getDefaultTransactionTypeColors();
      }

      return { data: data?.setting_value || this.getDefaultTransactionTypeColors(), error: null };
    } catch (err) {
      console.warn("Error fetching transaction type colors, using defaults", err);
      return { data: this.getDefaultTransactionTypeColors(), error: null };
    }
  },

  async getCustomerBalanceColors() {
    // Trial mode: return default colors without Supabase call
    if (getTrialMode()) {
      return { data: this.getDefaultCustomerBalanceColors(), error: null };
    }

    try {
      const { data, error } = await (supabase as any)
        .from("color_settings")
        .select("setting_value")
        .eq("setting_key", "customer_balance_colors")
        .single();

      if (error) {
        console.warn("Failed to fetch customer balance colors, using defaults", error);
        return this.getDefaultCustomerBalanceColors();
      }

      return { data: data?.setting_value || this.getDefaultCustomerBalanceColors(), error: null };
    } catch (err) {
      console.warn("Error fetching customer balance colors, using defaults", err);
      return { data: this.getDefaultCustomerBalanceColors(), error: null };
    }
  },

  async updateTransactionTypeColors(colors: any) {
    try {
      const { data, error } = await (supabase as any)
        .from("color_settings")
        .upsert({
          setting_key: "transaction_type_colors",
          setting_value: colors,
          description: "Màu sắc cho các loại giao dịch (payment, charge, adjustment, refund)",
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to update colors" };
    }
  },

  async updateCustomerBalanceColors(colors: any) {
    try {
      const { data, error } = await (supabase as any)
        .from("color_settings")
        .upsert({
          setting_key: "customer_balance_colors",
          setting_value: colors,
          description: "Màu sắc cho số dư khách hàng (danh sách và chi tiết)",
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to update colors" };
    }
  },

  getDefaultTransactionTypeColors() {
    return {
      payment: {
        label: "Điều chỉnh giảm",
        bg_color: "bg-green-100",
        text_color: "text-green-800",
        dark_bg_color: "dark:bg-green-900",
        dark_text_color: "dark:text-green-200",
        amount_color: "text-green-600",
        dark_amount_color: "dark:text-green-400",
      },
      charge: {
        label: "Điều chỉnh tăng",
        bg_color: "bg-red-100",
        text_color: "text-red-800",
        dark_bg_color: "dark:bg-red-900",
        dark_text_color: "dark:text-red-200",
        amount_color: "text-red-600",
        dark_amount_color: "dark:text-red-400",
      },
      adjustment: {
        label: "Điều chỉnh",
        bg_color: "bg-blue-100",
        text_color: "text-blue-800",
        dark_bg_color: "dark:bg-blue-900",
        dark_text_color: "dark:text-blue-200",
        amount_color: "text-blue-600",
        dark_amount_color: "dark:text-blue-400",
      },
      refund: {
        label: "Hoàn tiền",
        bg_color: "bg-green-100",
        text_color: "text-green-800",
        dark_bg_color: "dark:bg-green-900",
        dark_text_color: "dark:text-green-200",
        amount_color: "text-green-600",
        dark_amount_color: "dark:text-green-400",
      },
    };
  },

  getDefaultCustomerBalanceColors() {
    return {
      customer_list: {
        positive_balance_color: "text-black dark:text-white",
        zero_or_negative_color: "text-green-600 dark:text-green-400",
      },
      customer_detail: {
        positive_balance_color: "text-red-600 dark:text-red-400",
        zero_or_negative_color: "text-green-600 dark:text-green-400",
      },
    };
  },
};

const transactionTypeService = {
  async getTransactionTypes(companyId?: string) {
    try {
      const adapter = getDataAdapter();
      const filters: any[] = companyId ? [{ field: "company_id", operator: "eq", value: companyId }] : [];
      
      let data = await adapter.get("transaction_types", filters);
      
      if (!Array.isArray(data) || data.length === 0) {
        return {
          data: [],
          error: "Không tìm thấy loại giao dịch nào. Vui lòng tạo loại giao dịch trong Cài đặt."
        };
      }

      // Return ALL records (including inactive) so legacy-ID lookups keep working.
      // UI layers must filter is_active themselves for dropdowns.
      const allTypes = data.map((t: any) => ({
        id: t.id,
        name: t.name,
        color: t.color || "blue",
        isActive: t.is_active !== false,
        math_factor: t.math_factor ?? 1,
        impact_type: t.impact_type ?? "increase",
        company_id: t.company_id,
      }));

      return {
        data: allTypes,
        error: null,
      };
    } catch (err) {
      console.error("Exception fetching transaction types:", err);
      return { 
        data: [], 
        error: err instanceof Error 
          ? `Lỗi hệ thống: ${err.message}` 
          : "Không thể tải loại giao dịch. Vui lòng thử lại." 
      };
    }
  },

  async upsertTransactionType(payload: { id?: string; name: string; color?: string; is_active?: boolean; math_factor?: number; impact_type?: string; company_id?: string }) {
    try {
      // Use shared validation
      const validation = validateTransactionTypeData(payload);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(", ")
        };
      }

      const adapter = getDataAdapter();
      const useUuidId = !getTrialMode();
      
      // Transform data using shared transformation
      const transformed = transformRawTransactionType(payload, useUuidId);
      
      // STRICT VALIDATION: Check for duplicate name within company (for new types)
      if (payload.company_id && !payload.id) {
        const existingTypes = await adapter.get("transaction_types", [
          { field: "company_id", operator: "eq" as any, value: payload.company_id }
        ]);

        if (existingTypes && existingTypes.length > 0) {
          const duplicate = existingTypes.find(
            (t: any) => t.name === payload.name
          );
          if (duplicate) {
            return {
              data: null,
              error: `Loại giao dịch "${payload.name}" đã tồn tại. Vui lòng chọn tên khác.`
            };
          }
        }
      }

      let result;
      if (payload.id) {
        // Update existing
        result = await adapter.update("transaction_types", payload.id, transformed);
      } else {
        // Insert new
        result = await adapter.insert("transaction_types", transformed);
      }
      
      return { data: result, error: null };
    } catch (err) {
      console.error("Exception upserting transaction type:", err);
      return { 
        data: null, 
        error: err instanceof Error 
          ? `Lỗi hệ thống: ${err.message}` 
          : "Không thể lưu loại giao dịch. Vui lòng thử lại." 
      };
    }
  },

  async toggleTransactionType(id: string, isActive: boolean) {
    try {
      const adapter = getDataAdapter();
      
      // STRICT VALIDATION: Check if transaction type exists
      const existingType: any = await adapter.getById("transaction_types", id);
      
      if (!existingType) {
        return { 
          error: "Loại giao dịch không tồn tại" 
        };
      }

      // STRICT VALIDATION: If deactivating, check if type is in use
      if (!isActive) {
        const transactions = await adapter.get("transactions", [
          { field: "transaction_type", operator: "eq" as any, value: id }
        ]);
        
        if (transactions && transactions.length > 0) {
          return { 
            error: `Không thể vô hiệu hóa loại giao dịch "${existingType.name}" vì đang được sử dụng trong giao dịch. Vui lòng sử dụng tính năng soft delete.` 
          };
        }
      }

      await adapter.update("transaction_types", id, { is_active: isActive });
      
      return { error: null };
    } catch (err) {
      console.error("Exception toggling transaction type:", err);
      return { 
        error: err instanceof Error 
          ? `Lỗi hệ thống: ${err.message}` 
          : "Không thể cập nhật loại giao dịch. Vui lòng thử lại." 
      };
    }
  },

  async deleteTransactionType(id: string) {
    try {
      const adapter = getDataAdapter();
      
      // STRICT VALIDATION: Check if transaction type exists
      const existingType: any = await adapter.getById("transaction_types", id);

      if (!existingType) {
        return {
          error: "Loại giao dịch không tồn tại"
        };
      }

      // STRICT VALIDATION: Check if type is in use before deletion
      const transactions = await adapter.get("transactions", [
        { field: "transaction_type", operator: "eq" as any, value: id }
      ]);

      if (transactions && transactions.length > 0) {
        return {
          error: `Không thể xóa loại giao dịch "${existingType.name}" vì đang được sử dụng trong ${transactions.length} giao dịch. Vui lòng vô hiệu hóa thay vì xóa.`
        };
      }

      // STRICT VALIDATION: Perform deletion (foreign key constraint will also prevent deletion)
      await adapter.delete("transaction_types", id);
      
      return { error: null };
    } catch (err) {
      console.error("Exception deleting transaction type:", err);
      const error = err as any;
      // Foreign key constraint violation
      if (error?.message?.includes("violates foreign key constraint")) {
        return { 
          error: `Không thể xóa loại giao dịch vì đang được tham chiếu bởi dữ liệu khác.` 
        };
      }
      return { 
        error: error?.message || "Không thể xóa loại giao dịch. Vui lòng thử lại." 
      };
    }
  },
};

function getNowIso() {
  return new Date().toISOString();
}

function uuid() {
  const anyCrypto = (globalThis as any).crypto;
  if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function normalizeTransactionType(input: string): TransactionType {
  const raw = (input || "").toLowerCase().trim();
  if (raw === "payment" || raw === "thu" || raw === "điều chỉnh giảm" || raw === "dieuchinhgiam" || raw === "thanh toán" || raw === "thanhtoan") return "payment";
  if (raw === "charge" || raw === "chi" || raw === "điều chỉnh tăng" || raw === "dieuchinhtang" || raw === "cho nợ" || raw === "chono" || raw === "chono") return "charge";
  if (raw === "refund" || raw === "hoàn tiền" || raw === "hoantien") return "refund";
  if (raw === "adjustment" || raw === "điều chỉnh" || raw === "dieuchinh") return "adjustment";
  return "payment";
}

function inflowOutflowByType(type: TransactionType, amount: number) {
  // AR-flow mapping (receivables):
  // - payment: reduce receivable (toward 0)
  // - charge: increase receivable (more negative)
  // - refund: reduce receivable (e.g. return goods reduces debt)
  // - adjustment: can be +/-; positive reduces receivable, negative increases receivable
  if (type === "payment") return { inflow: Math.abs(amount), outflow: 0 };
  if (type === "refund") return { inflow: Math.abs(amount), outflow: 0 };
  if (type === "charge") return { inflow: 0, outflow: Math.abs(amount) };
  if (type === "adjustment") {
    return amount >= 0
      ? { inflow: Math.abs(amount), outflow: 0 }
      : { inflow: 0, outflow: Math.abs(amount) };
  }
  return { inflow: Math.abs(amount), outflow: 0 };
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function dateKeyForRange(date: Date, timeRange: TimeRange) {
  const d = new Date(date);
  if (timeRange === "day") {
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
  if (timeRange === "week") {
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
  if (timeRange === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
  if (timeRange === "quarter") {
    const qStart = Math.floor(d.getMonth() / 3) * 3;
    d.setMonth(qStart, 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function aggregateCashFlow(transactions: Transaction[], timeRange: TimeRange, count: number) {
  const map = new Map<string, { date: string; inflow: number; outflow: number; netFlow: number }>();
  const periodStarts = buildPeriodStarts(timeRange, count, new Date());

  periodStarts.forEach((start) => {
    const key = dateKeyForRange(start, timeRange);
    map.set(key, { date: new Date(key).toISOString(), inflow: 0, outflow: 0, netFlow: 0 });
  });

  for (const tx of transactions) {
    const dt = new Date(tx.transaction_date);
    const key = dateKeyForRange(dt, timeRange);
    const agg = map.get(key) || { date: new Date(key).toISOString(), inflow: 0, outflow: 0, netFlow: 0 };
    const { inflow, outflow } = inflowOutflowByType(tx.transaction_type, tx.amount);
    agg.inflow += inflow;
    agg.outflow += outflow;
    agg.netFlow = agg.inflow - agg.outflow;
    map.set(key, agg);
  }
  return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function receivableBalanceFromTransactions(transactions: Transaction[]) {
  // Receivable (AR) balance: typically negative when there is money to collect.
  // Convention:
  //   charge (increase receivable): subtract
  //   payment/refund (decrease receivable): add
  //   adjustment: add signed amount
  let sum = 0;
  for (const tx of transactions) {
    if (tx.transaction_type === "charge") sum -= Math.abs(tx.amount);
    else if (tx.transaction_type === "payment") sum += Math.abs(tx.amount);
    else if (tx.transaction_type === "refund") sum += Math.abs(tx.amount);
    else if (tx.transaction_type === "adjustment") sum += tx.amount;
    else sum += tx.amount;
  }
  return sum;
}

function cashDeltaFromTransaction(tx: Transaction) {
  // Cash/bank balance convention:
  // - payment increases cash
  // - refund decreases cash
  // - charge does not affect cash (it increases receivable)
  // - adjustment: signed cash adjustment (can be +/-)
  if (tx.transaction_type === "payment") return Math.abs(tx.amount);
  if (tx.transaction_type === "refund") return -Math.abs(tx.amount);
  if (tx.transaction_type === "adjustment") return tx.amount;
  return 0;
}

function buildPeriodStarts(timeRange: TimeRange, count: number, endDate: Date) {
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const starts: Date[] = [];

  if (timeRange === "day") {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      starts.push(d);
    }
    return starts;
  }

  if (timeRange === "week") {
    // Align weeks to Monday
    const endMonday = new Date(end);
    const day = (endMonday.getDay() + 6) % 7;
    endMonday.setDate(endMonday.getDate() - day);
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(endMonday);
      d.setDate(endMonday.getDate() - i * 7);
      starts.push(d);
    }
    return starts;
  }

  if (timeRange === "month") {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
      starts.push(d);
    }
    return starts;
  }

  if (timeRange === "quarter") {
    const endQuarterStartMonth = Math.floor(end.getMonth() / 3) * 3;
    const endQuarterStart = new Date(end.getFullYear(), endQuarterStartMonth, 1);
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(endQuarterStart);
      d.setMonth(endQuarterStart.getMonth() - i * 3);
      starts.push(d);
    }
    return starts;
  }

  // year
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear() - i, 0, 1);
    starts.push(d);
  }
  return starts;
}

function getPeriodWindow(timeRange: TimeRange, count: number, baseDate?: Date) {
  const end = endOfDay(baseDate ? new Date(baseDate) : new Date());
  const start = startOfDay(new Date(end));

  if (timeRange === "day") {
    start.setDate(start.getDate() - (count - 1));
  } else if (timeRange === "week") {
    start.setDate(start.getDate() - (count * 7 - 1));
  } else if (timeRange === "month") {
    start.setMonth(start.getMonth() - (count - 1));
    start.setDate(1);
  } else if (timeRange === "quarter") {
    start.setMonth(start.getMonth() - (count * 3 - 3));
    const qStart = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(qStart, 1);
  } else {
    start.setFullYear(start.getFullYear() - (count - 1), 0, 1);
  }

  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
  const prevStart = startOfDay(new Date(prevEnd));
  if (timeRange === "day") {
    prevStart.setDate(prevStart.getDate() - (count - 1));
  } else if (timeRange === "week") {
    prevStart.setDate(prevStart.getDate() - (count * 7 - 1));
  } else if (timeRange === "month") {
    prevStart.setMonth(prevStart.getMonth() - (count - 1));
    prevStart.setDate(1);
  } else if (timeRange === "quarter") {
    prevStart.setMonth(prevStart.getMonth() - (count * 3 - 3));
    const qStart = Math.floor(prevStart.getMonth() / 3) * 3;
    prevStart.setMonth(qStart, 1);
  } else {
    prevStart.setFullYear(prevStart.getFullYear() - (count - 1), 0, 1);
  }

  return { start, end, prevStart, prevEnd };
}

const customerService = {
  async getCustomers(_filters?: any) {
    try {
      const adapter = getDataAdapter();
      const filters: any[] = [];
      
      if (_filters?.company_id) {
        filters.push({ field: "company_id", operator: "eq" as any, value: _filters.company_id });
      }

      let data = await adapter.get("customers", filters);
      
      if (!Array.isArray(data)) {
        data = [];
      }

      // Apply search filter (client-side since adapter doesn't support complex OR queries)
      const search = String(_filters?.search || "").toLowerCase().trim();
      if (search) {
        data = data.filter((c: any) => 
          (c.full_name && c.full_name.toLowerCase().includes(search)) ||
          (c.customer_code && c.customer_code.toLowerCase().includes(search)) ||
          (c.phone && c.phone.toLowerCase().includes(search)) ||
          (c.email && c.email.toLowerCase().includes(search))
        );
      }

      // Sort by created_at descending
      data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply pagination
      let count = data.length;
      if (Number.isFinite(_filters?.limit)) {
        const limit = Number(_filters.limit);
        const offset = Number(_filters.offset || 0);
        data = data.slice(offset, offset + limit);
      }

      // Map current_balance to total_balance for frontend compatibility
      const mappedData = data.map((c: any) => ({
        ...c,
        total_balance: c.current_balance ?? c.total_balance ?? 0
      }));

      return {
        data: mappedData,
        error: null,
        count,
      };
    } catch (err) {
      console.error("Failed to load customers:", err);
      return { data: [], error: err instanceof Error ? err.message : "Failed to load customers", count: 0 };
    }
  },

  async getCustomerById(id: string, companyId?: string) {
    try {
      const adapter = getDataAdapter();
      const filters: any[] = [{ field: "id", operator: "eq" as any, value: id }];
      if (companyId) {
        filters.push({ field: "company_id", operator: "eq" as any, value: companyId });
      }
      
      const customers = await adapter.get("customers", filters);
      const customer = customers && customers.length > 0 ? customers[0] : null;

      if (!customer) {
        return { data: null, error: "Customer not found" };
      }

      let updatedByEmail = null;
      if ((customer as any).updated_by) {
        const { data: userData } = await supabase
          .from("users")
          .select("email")
          .eq("id", (customer as any).updated_by)
          .single();
        updatedByEmail = userData?.email || null;
      }

      // Calculate balance from transactions
      const { data: txData } = await supabase
        .from("transactions")
        .select("transaction_type, amount")
        .eq("customer_id", id);

      const parseAmount = (value: any) => {
        const num = Number(String(value ?? 0).replace(/[\s,]/g, ""));
        return Number.isFinite(num) ? num : 0;
      };

      let calculatedBalance = parseAmount((customer as any).opening_balance) || 0;
      let transactionCount = 0;
      
      if (txData) {
        transactionCount = txData.length;
        for (const tx of txData) {
          const amtSigned = parseAmount(tx.amount);
          const amtAbs = Math.abs(amtSigned);
          const type = normalizeTransactionType(String(tx.transaction_type || ""));
          
          if (type === "payment") {
            calculatedBalance -= amtAbs; // Payment reduces debt
          } else if (type === "charge") {
            calculatedBalance += amtAbs; // Charge increases debt
          } else if (type === "refund") {
            calculatedBalance -= amtAbs; // Refund reduces debt
          } else {
            calculatedBalance += amtSigned; // Adjustment keeps sign
          }
        }
      }

      return {
        data: {
          ...(customer as any),
          total_balance: calculatedBalance,
          transaction_count: transactionCount,
          updated_by_email: updatedByEmail,
        },
        error: null,
      };
    } catch (err) {
      console.error("Failed to load customer:", err);
      return { data: null, error: err instanceof Error ? err.message : "Failed to load customer" };
    }
  },

  async createCustomer(_customerData?: any) {
    try {
      // Use shared validation
      const validation = validateCustomerData(_customerData);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(", ")
        };
      }

      const adapter = getDataAdapter();
      const useUuidId = !getTrialMode();
      
      // Transform data using shared transformation
      const transformed = transformRawCustomer(_customerData, useUuidId);

      // CRITICAL: Server-side duplicate check for customer_code (per memory 210bb746)
      const proposedCode = transformed.customer_code?.trim();
      if (proposedCode) {
        const filters: any[] = [{ field: "customer_code", operator: "eq" as any, value: proposedCode }];
        if (transformed.company_id) {
          filters.push({ field: "company_id", operator: "eq" as any, value: transformed.company_id });
        }
        const existingCustomers = await adapter.get("customers", filters);
        if (existingCustomers && existingCustomers.length > 0) {
          return {
            data: null,
            error: `Customer with code "${proposedCode}" already exists`
          };
        }
      }
      
      // Insert using adapter
      const result = await adapter.insert("customers", transformed);
      
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to create customer" };
    }
  },

  async updateCustomer(id: string, _customerData: any) {
    try {
      // Use shared validation
      const validation = validateCustomerData(_customerData);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(", ")
        };
      }

      const adapter = getDataAdapter();
      const useUuidId = !getTrialMode();
      
      // Transform data using shared transformation
      const transformed = transformRawCustomer(_customerData, useUuidId);

      // CRITICAL: Server-side duplicate check for customer_code (excluding current customer)
      const proposedCode = transformed.customer_code?.trim();
      if (proposedCode) {
        const filters: any[] = [
          { field: "customer_code", operator: "eq" as any, value: proposedCode },
          { field: "id", operator: "neq" as any, value: id } // Exclude current customer
        ];
        if (transformed.company_id) {
          filters.push({ field: "company_id", operator: "eq" as any, value: transformed.company_id });
        }
        const existingCustomers = await adapter.get("customers", filters);
        if (existingCustomers && existingCustomers.length > 0) {
          return {
            data: null,
            error: `Customer with code "${proposedCode}" already exists`
          };
        }
      }
      
      // Update using adapter
      const result = await adapter.update("customers", id, transformed);
      
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to update customer" };
    }
  },

  async deleteCustomer(id: string) {
    try {
      const adapter = getDataAdapter();
      
      // Check if customer exists
      const customer: any = await adapter.getById("customers", id);
      if (!customer) {
        return { data: null, error: "Customer not found" };
      }
      
      await adapter.delete("customers", id);
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to delete customer" };
    }
  },

  async updateCustomerOpeningBalance(customerId: string, newOpening: number, companyId?: string) {
    try {
      const adapter = getDataAdapter();
      
      // Get existing customer
      const filters: any[] = [{ field: "id", operator: "eq" as any, value: customerId }];
      if (companyId) {
        filters.push({ field: "company_id", operator: "eq" as any, value: companyId });
      }
      
      const customers = await adapter.get("customers", filters);
      const existing = customers && customers.length > 0 ? customers[0] : null;

      if (!existing) {
        return { data: null, error: "Customer not found" };
      }

      // Calculate new current balance preserving the delta
      const oldOpening = Number((existing as any).opening_balance || 0);
      const oldCurrent = Number((existing as any).current_balance || 0);
      const delta = oldCurrent - oldOpening;
      const newCurrent = newOpening + delta;

      // Update using adapter
      const updated = await adapter.update("customers", customerId, {
        opening_balance: newOpening,
        current_balance: newCurrent,
        updated_at: new Date().toISOString(),
      });

      return { data: { ...existing, opening_balance: newOpening, current_balance: newCurrent }, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || "Failed to update opening balance" };
    }
  },

  async bulkUpdateOpeningBalances(rows: { customer_code?: string; opening_balance?: number }[]) {
    try {
      const adapter = getDataAdapter();
      const errors: { row: number; message: string; value?: any }[] = [];
      let updatedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const code = String(row.customer_code || "").trim();
        const opening = Number(row.opening_balance);

        if (!code) {
          errors.push({ row: i, message: "Missing customer_code" });
          continue;
        }

        // Find customer by customer_code
        const filters: any[] = [{ field: "customer_code", operator: "eq" as any, value: code }];
        const customers = await adapter.get("customers", filters);
        const customer = customers && customers.length > 0 ? customers[0] : null;

        if (!customer) {
          errors.push({ row: i, message: "Customer not found", value: code });
          continue;
        }

        // Update using adapter
        const updated = await adapter.update("customers", (customer as any).id, {
          opening_balance: opening,
          current_balance: opening,
          updated_at: new Date().toISOString(),
        });

        if (updated) {
          updatedCount++;
        } else {
          errors.push({ row: i, message: "Failed to update customer", value: code });
        }
      }

      return { data: { updated: updatedCount }, errors };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed bulk update" };
    }
  },

  async bulkCreateCustomers(_customers?: any[]) {
    try {
      const adapter = getDataAdapter();
      const useUuidId = !getTrialMode();
      const createdCustomers: any[] = [];
      const errors: { row: number; message: string; value?: any }[] = [];

      for (let i = 0; i < (_customers || []).length; i++) {
        const raw = _customers![i];
        
        // Use shared validation
        const validation = validateCustomerData(raw);
        if (!validation.isValid) {
          errors.push({ row: i, message: validation.errors.join(", "), value: raw.customer_code });
          continue;
        }

        // Transform data using shared transformation
        const transformed = transformRawCustomer(raw, useUuidId);

        // CRITICAL: Server-side duplicate check for customer_code (per memory 210bb746)
        // Check PER ROW to avoid race condition (not at function start)
        const proposedCode = transformed.customer_code?.trim();
        if (proposedCode) {
          const filters: any[] = [{ field: "customer_code", operator: "eq" as any, value: proposedCode }];
          if (transformed.company_id) {
            filters.push({ field: "company_id", operator: "eq" as any, value: transformed.company_id });
          }
          const existingCustomers = await adapter.get("customers", filters);
          if (existingCustomers && existingCustomers.length > 0) {
            errors.push({ row: i, message: `Customer with code "${proposedCode}" already exists`, value: proposedCode });
            continue;
          }
        }

        // Insert using adapter
        const result = await adapter.insert("customers", transformed);
        if (result) {
          createdCustomers.push(result);
        } else {
          errors.push({ row: i, message: "Failed to create customer", value: raw.customer_code });
        }
      }

      return { data: createdCustomers, errors };
    } catch (err) {
      console.error('[bulkCreateCustomers] Exception:', err);
      return { data: null, error: err instanceof Error ? err.message : "Failed bulk create" };
    }
  },
};

// Transaction service
const transactionService = {
  async getTransactions(_filters?: any) {
    // Trial mode: return mock transactions without Supabase call
    if (getTrialMode()) {
      const mockTransactions = trialGet("transactions") || [];
      return {
        data: mockTransactions,
        error: null,
        count: mockTransactions.length,
      };
    }

    try {
      const filters = _filters || {};
      let query = supabase
        .from("transactions")
        .select(`
          *,
          customers!customer_id (full_name, customer_code),
          bank_accounts!bank_account_id (account_name),
          branches!branch_id (name, code),
          users!created_by (full_name, email)
        `, { count: "exact" });

      if (filters.company_id) query = query.eq("company_id", filters.company_id);
      if (filters.branch_id) query = query.eq("branch_id", filters.branch_id);
      if (filters.transaction_type) query = query.eq("transaction_type", filters.transaction_type);
      if (filters.customer_id) query = query.eq("customer_id", filters.customer_id);

      const search = String(filters.search || "").toLowerCase().trim();
      if (search) {
        query = query.or(`description.ilike.%${search}%,reference_number.ilike.%${search}%`);
      }

      if (filters.dateRange?.start && filters.dateRange?.end) {
        query = query.gte("transaction_date", filters.dateRange.start).lte("transaction_date", filters.dateRange.end);
      }

      const page = Number(filters.page || 1);
      const pageSize = Number(filters.pageSize || 20);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order("transaction_date", { ascending: false });

      if (error) throw error;

      // Map nested objects to flat structure for frontend compatibility
      const mappedData = (data || []).map((tx: any) => ({
        ...tx,
        customer_name: tx.customers?.full_name || tx.customer_name,
        bank_account_name: tx.bank_accounts?.account_name || tx.bank_account_name,
        branch_name: tx.branches?.name,
        creator_name: tx.users?.full_name,
      }));

      return {
        data: mappedData,
        error: null,
        count: count || (data?.length || 0),
      };
    } catch (err) {
      console.error("Failed to load transactions from Supabase:", err);
      return { data: [], error: null, count: 0 };
    }
  },

  async getTransactionById(id: string, companyId?: string) {
    // Trial mode: return mock transaction without Supabase call
    if (getTrialMode()) {
      const mockTransactions = trialGet("transactions") || [];
      const transaction = mockTransactions.find((t: any) => t.id === id);
      if (transaction) {
        return { data: transaction, error: null };
      }
      return { data: null, error: "Transaction not found" };
    }

    try {
      let query = supabase
        .from("transactions")
        .select(`
          *,
          customers!customer_id (full_name, customer_code),
          bank_accounts!bank_account_id (account_name)
        `)
        .eq("id", id);

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Transaction not found" };
    }
  },

  async createTransaction(_transactionData?: any) {
    // Trial mode: create in mock store
    if (getTrialMode()) {
      const now = getNowIso();
      const body = {
        id: _transactionData.id || `txn-${Date.now()}`,
        transaction_code: _transactionData.transaction_code || `TXN${Date.now()}`,
        customer_id: _transactionData.customer_id || null,
        bank_account_id: _transactionData.bank_account_id || null,
        branch_id: _transactionData.branch_id || "trial-branch",
        company_id: _transactionData.company_id || "trial-company",
        created_by: _transactionData.created_by || null,
        transaction_type: _transactionData.transaction_type,
        amount: _transactionData.amount,
        description: _transactionData.description || null,
        reference_number: _transactionData.reference_number || null,
        transaction_date: _transactionData.transaction_date || now,
        created_at: now,
        updated_at: now,
      };
      const inserted = trialInsert("transactions", body);
      if (inserted) {
        return { data: body, error: null };
      }
      return { data: null, error: "Failed to create transaction" };
    }

    try {
      const now = getNowIso();
      const body = {
        id: _transactionData.id || uuid(),
        transaction_code: _transactionData.transaction_code || `TXN${Date.now()}`,
        customer_id: _transactionData.customer_id || null,
        bank_account_id: _transactionData.bank_account_id || null,
        branch_id: _transactionData.branch_id || null,
        company_id: _transactionData.company_id || null,
        created_by: _transactionData.created_by || null,
        transaction_type: _transactionData.transaction_type,
        amount: _transactionData.amount,
        description: _transactionData.description || null,
        reference_number: _transactionData.reference_number || null,
        transaction_date: _transactionData.transaction_date || now,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to create transaction" };
    }
  },

  async deleteTransaction(id: string) {
    // Trial mode: delete from mock store
    if (getTrialMode()) {
      const deleted = trialDelete("transactions", id);
      if (deleted) {
        return { error: null };
      }
      return { error: "Transaction not found" };
    }

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to delete transaction" };
    }
  },

  async updateTransaction(id: string, _transactionData?: any) {
    // Trial mode: update in mock store
    if (getTrialMode()) {
      const now = getNowIso();
      const body = {
        transaction_code: _transactionData.transaction_code,
        customer_id: _transactionData.customer_id || null,
        bank_account_id: _transactionData.bank_account_id || null,
        branch_id: _transactionData.branch_id || null,
        company_id: _transactionData.company_id || null,
        created_by: _transactionData.created_by || null,
        transaction_type: _transactionData.transaction_type,
        amount: _transactionData.amount,
        description: _transactionData.description || null,
        reference_number: _transactionData.reference_number || null,
        transaction_date: _transactionData.transaction_date || now,
        updated_at: now,
      };
      const updated = trialUpdate("transactions", id, body);
      if (updated) {
        return { data: body, error: null };
      }
      return { data: null, error: "Transaction not found" };
    }

    try {
      const now = getNowIso();
      const body = {
        transaction_code: _transactionData.transaction_code,
        customer_id: _transactionData.customer_id || null,
        bank_account_id: _transactionData.bank_account_id || null,
        branch_id: _transactionData.branch_id || null,
        company_id: _transactionData.company_id || null,
        created_by: _transactionData.created_by || null,
        transaction_type: _transactionData.transaction_type,
        amount: _transactionData.amount,
        description: _transactionData.description || null,
        reference_number: _transactionData.reference_number || null,
        transaction_date: _transactionData.transaction_date || now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from("transactions")
        .update(body)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to update transaction" };
    }
  },

  async bulkImportTransactions(
    _rawData?: any[],
    _branchId?: string,
    _createdBy?: string,
    _companyId?: string,
  ) {
    // Trial mode: import to mock store
    if (getTrialMode()) {
      const raw = Array.isArray(_rawData) ? _rawData : [];
      const branchId = _branchId ? String(_branchId) : "trial-branch";
      const createdBy = String(_createdBy || "");
      const companyId = _companyId || "trial-company";
      const now = getNowIso();
      const mockTransactions = trialGet("transactions") || [];
      const mockCustomers = trialGet("customers") || [];

      const body = raw.map((row: any) => ({
        id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        transaction_code: row.transaction_code || `TXN${Date.now()}`,
        customer_id: row.customer_id || null,
        customer_name: row.customer_name || null,
        bank_account_id: row.bank_account_id || null,
        bank_account_name: row.bank_account_name || null,
        branch_id: branchId,
        company_id: companyId,
        created_by: createdBy,
        transaction_type: row.transaction_type || "payment",
        amount: Number(row.amount) || 0,
        description: row.description || null,
        reference_number: row.reference_number || null,
        transaction_date: row.transaction_date || now,
        created_at: now,
        updated_at: now,
      }));

      const allTransactions = [...body, ...mockTransactions];
      localStorage.setItem("cashflow_trial_store", JSON.stringify({ transactions: allTransactions }));

      // Update customer balances
      const mockCustomersMap = new Map(mockCustomers.map((c: any) => [c.id, c]));
      body.forEach((tx: any) => {
        if (tx.customer_id && mockCustomersMap.has(tx.customer_id)) {
          const customer = mockCustomersMap.get(tx.customer_id);
          const amount = Number(tx.amount) || 0;
          const type = tx.transaction_type || "payment";
          const multiplier = (type === "payment" || type === "refund") ? 1 : -1;
          customer.total_balance = (customer.total_balance || 0) + (amount * multiplier);
          customer.current_balance = customer.current_balance || customer.total_balance;
          customer.updated_at = now;
        }
      });

      localStorage.setItem("cashflow_trial_store", JSON.stringify({ customers: Array.from(mockCustomersMap.values()) }));

      return { data: body, error: null };
    }

    try {
      const raw = Array.isArray(_rawData) ? _rawData : [];
      const branchId = _branchId ? String(_branchId) : "";
      const createdBy = String(_createdBy || "");
      const now = getNowIso();

      // STRICT VALIDATION: Fetch valid transaction types from database
      const { data: validTransactionTypes, error: typeError } = await supabase
        .from("transaction_types")
        .select("id, name")
        .eq("is_active", true);

      if (typeError) {
        console.error("Failed to fetch transaction types for validation:", typeError);
        throw new Error("Không thể tải loại giao dịch để validate. Vui lòng thử lại.");
      }

      if (!validTransactionTypes || validTransactionTypes.length === 0) {
        throw new Error("Không tìm thấy loại giao dịch nào. Vui lòng tạo loại giao dịch trong Cài đặt trước khi import.");
      }
      
      const validTypeIds = new Set(validTransactionTypes.map((t: any) => t.id));
      const validTypeNames = new Set(validTransactionTypes.map((t: any) => t.name.toLowerCase()));

      // STRICT VALIDATION: Normalize and validate transaction type
      // The transactions table CHECK constraint expects legacy canonical names:
      // payment, charge, adjustment, refund — not UUIDs from transaction_types.
      const normalizeAndValidateTransactionType = (type: string, rowIdx: number): string => {
        if (!type) {
          throw new Error(`Row ${rowIdx + 1}: Loại giao dịch không được để trống`);
        }

        const normalized = type.toLowerCase().trim();

        // Map Vietnamese/common names to canonical legacy type
        const mapToCanonical = (name: string): string => {
          const n = name.toLowerCase().trim();
          if (n.includes("thu") || n.includes("payment") || n.includes("income") || n.includes("receipt") || n.includes("tiền vào") || n.includes("nhận")) {
            return "payment";
          }
          if (n.includes("chi") || n.includes("charge") || n.includes("expense") || n.includes("cost") || n.includes("tiền ra") || n.includes("xuất")) {
            return "charge";
          }
          if (n.includes("hoàn") || n.includes("refund") || n.includes("trả lại") || n.includes("đền bù")) {
            return "refund";
          }
          if (n.includes("điều chỉnh") || n.includes("adjustment") || n.includes("bù trừ") || n.includes("offset")) {
            return "adjustment";
          }
          // Fallback: if it's already one of the canonical values
          if (["payment", "charge", "refund", "adjustment"].includes(n)) return n;
          return name.trim();
        };

        // Try to match by ID first (input is a UUID from the transaction_types table)
        if (validTypeIds.has(normalized)) {
          const matchedType = validTransactionTypes.find((t: any) => t.id.toLowerCase() === normalized);
          if (matchedType) {
            const canonical = mapToCanonical(matchedType.name);
            if (["payment", "charge", "refund", "adjustment"].includes(canonical)) {
              return canonical;
            }
          }
        }

        // Try to match by name
        if (validTypeNames.has(normalized)) {
          const matchedType = validTransactionTypes.find((t: any) => t.name.toLowerCase() === normalized);
          if (matchedType) {
            const canonical = mapToCanonical(matchedType.name);
            if (["payment", "charge", "refund", "adjustment"].includes(canonical)) {
              return canonical;
            }
          }
        }

        // STRICT: No fallback - reject if type not found
        throw new Error(
          `Row ${rowIdx + 1}: Loại giao dịch "${type}" không tồn tại. ` +
          `Các loại giao dịch hợp lệ: ${Array.from(validTypeNames).join(", ")}`
        );
      };

      // Fetch customers for mapping customer_code to customer_id
      let customerMap: Record<string, string> = {};
      try {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, customer_code');
        
        if (customers) {
          customerMap = customers.reduce((acc, c) => {
            if (c.customer_code) {
              acc[c.customer_code.toLowerCase().trim()] = c.id;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      } catch (e) {
        console.error('Failed to fetch customers for mapping:', e);
      }

      const body = raw.map((r, idx) => {
        // Map customer_code to customer_id
        let customerId = r.customer_id || null;
        if (!customerId && r.customer_code) {
          // Parse customer_code from input string (e.g., "CUST0003 - Công ty Hoàng Gia" -> "CUST0003")
          let parsedCustomerCode = r.customer_code.toLowerCase().trim();
          // Extract code before "-" or space if present
          const dashIndex = parsedCustomerCode.indexOf(' - ');
          if (dashIndex > 0) {
            parsedCustomerCode = parsedCustomerCode.substring(0, dashIndex).trim();
          } else {
            const spaceIndex = parsedCustomerCode.indexOf(' ');
            if (spaceIndex > 0) {
              parsedCustomerCode = parsedCustomerCode.substring(0, spaceIndex).trim();
            }
          }
          customerId = customerMap[parsedCustomerCode] || null;

          // Validation: customer_id is required
          if (!customerId) {
            console.error(`Row ${idx}: Customer not found for code "${r.customer_code}"`);
            throw new Error(`Row ${idx + 1}: Khách hàng không tồn tại với mã "${r.customer_code}". Vui lòng kiểm tra lại mã khách hàng.`);
          }
        }

        // Parse date from DD/MM/YYYY or other formats to ISO
        let parsedDate = now;
        if (r.transaction_date) {
          try {
            const date = new Date(r.transaction_date);
            if (!isNaN(date.getTime())) {
              parsedDate = date.toISOString();
            } else {
              // Try parsing DD/MM/YYYY
              const parts = r.transaction_date.split('/');
              if (parts.length === 3) {
                const [day, month, year] = parts;
                const isoDate = new Date(`${year}-${month}-${day}`);
                if (!isNaN(isoDate.getTime())) {
                  parsedDate = isoDate.toISOString();
                }
              }
            }
          } catch (e) {
            parsedDate = now;
          }
        }

        const normalizedType = normalizeAndValidateTransactionType(r.transaction_type, idx);

        return {
          id: r.id || uuid(),
          transaction_code: r.transaction_code || `TXN${Date.now()}${idx}`,
          customer_id: customerId,
          branch_id: (r.branch_id && r.branch_id !== "") ? r.branch_id : (branchId && branchId !== "") ? branchId : null,
          company_id: _companyId || null,
          created_by: createdBy || null,
          transaction_type: normalizedType,
          amount: typeof r.amount === 'string' ? parseFloat(r.amount.replace(/[$,€£¥₫\s]/g, '')) : r.amount,
          description: r.description || null,
          reference_number: r.reference_number || null,
          transaction_date: parsedDate,
          created_at: now,
          updated_at: now,
        };
      });

      // Pre-check duplicate transaction_code within the batch
      const seenCodes = new Set<string>();
      const duplicateErrors: { row: number; message: string }[] = [];
      body.forEach((row: any, idx: number) => {
        const code = String(row.transaction_code || "").trim();
        if (code) {
          if (seenCodes.has(code)) {
            duplicateErrors.push({
              row: idx + 1,
              message: `Mã chứng từ "${code}" bị trùng lặp trong file import (xuất hiện nhiều lần)`,
            });
          }
          seenCodes.add(code);
        }
      });

      if (duplicateErrors.length > 0) {
        const firstErr = duplicateErrors[0];
        throw new Error(`Dòng ${firstErr.row}: ${firstErr.message}`);
      }

      // Pre-check duplicate transaction_code against existing DB rows
      if (body.length > 0) {
        const codesInBatch = body
          .map((r: any) => String(r.transaction_code || "").trim())
          .filter(Boolean);
        if (codesInBatch.length > 0) {
          const { data: existingTxns, error: existingError } = await supabase
            .from("transactions")
            .select("transaction_code")
            .in("transaction_code", codesInBatch);
          if (existingError) {
            console.error("Pre-check duplicate error:", existingError);
            throw new Error("Không thể kiểm tra trùng lặp mã chứng từ trong cơ sở dữ liệu");
          }
          if (existingTxns && existingTxns.length > 0) {
            const existingSet = new Set(existingTxns.map((t: any) => String(t.transaction_code).trim()));
            const firstConflict = body.findIndex((r: any) =>
              existingSet.has(String(r.transaction_code || "").trim())
            );
            const conflictCode = firstConflict >= 0 ? String(body[firstConflict].transaction_code).trim() : "";
            throw new Error(
              `Mã chứng từ "${conflictCode}" đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.`
            );
          }
        }
      }

      const { data, error } = await supabase
        .from("transactions")
        .insert(body)
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      return { data: data || [], error: null };
    } catch (err) {
      console.error("Bulk import error:", err);
      return { data: [], errors: [{ row: 0, message: err instanceof Error ? err.message : "Bulk import failed", details: err }] };
    }
  },
};

// Bank account service
const bankAccountService = {
  async getBankAccounts(companyId?: string) {
    try {
      const adapter = getDataAdapter();
      const filters: any[] = companyId ? [{ field: "company_id", operator: "eq" as any, value: companyId }] : [];
      
      const data = await adapter.get("bank_accounts", filters);
      
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err instanceof Error ? err.message : "Failed to load bank accounts" };
    }
  },

  async getBankAccount(id: string, companyId?: string) {
    try {
      const adapter = getDataAdapter();
      const filters: any[] = [{ field: "id", operator: "eq" as any, value: id }];
      if (companyId) {
        filters.push({ field: "company_id", operator: "eq" as any, value: companyId });
      }
      
      const accounts = await adapter.get("bank_accounts", filters);
      const account = accounts && accounts.length > 0 ? accounts[0] : null;
      
      if (account) {
        return { data: account, error: null };
      }
      return { data: null, error: "Bank account not found" };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to load bank account" };
    }
  },

  async upsertBankAccount(payload: Partial<Record<string, any>>) {
    try {
      // Use shared validation
      const validation = validateBankAccountData(payload);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(", ")
        };
      }

      const adapter = getDataAdapter();
      const useUuidId = !getTrialMode();
      
      // Transform data using shared transformation
      const transformed = transformRawBankAccount(payload, useUuidId);
      
      let result;
      if (payload.id) {
        // Update existing
        result = await adapter.update("bank_accounts", payload.id, transformed);
      } else {
        // Insert new
        result = await adapter.insert("bank_accounts", transformed);
      }
      
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to save bank account" };
    }
  },

  async deleteBankAccount(id: string, companyId?: string) {
    try {
      const adapter = getDataAdapter();
      
      // Check if bank account exists
      const account: any = await adapter.getById("bank_accounts", id);
      if (!account) {
        return { error: "Bank account not found" };
      }
      
      // If companyId is provided, verify it matches
      if (companyId && account.company_id !== companyId) {
        return { error: "Bank account not found" };
      }
      
      await adapter.delete("bank_accounts", id);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to delete bank account" };
    }
  },
};

// Branch service
const branchService = {
  async getBranches(companyId?: string) {
    try {
      const adapter = getDataAdapter();
      const filters: any[] = companyId ? [{ field: "company_id", operator: "eq" as any, value: companyId }] : [];
      
      const data = await adapter.get("branches", filters);
      
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err instanceof Error ? err.message : "Failed to load branches" };
    }
  },

  async getBranchById(id: string, companyId?: string) {
    try {
      const adapter = getDataAdapter();
      const filters: any[] = [{ field: "id", operator: "eq" as any, value: id }];
      if (companyId) {
        filters.push({ field: "company_id", operator: "eq" as any, value: companyId });
      }
      
      const branches = await adapter.get("branches", filters);
      const branch = branches && branches.length > 0 ? branches[0] : null;
      
      if (branch) {
        return { data: branch, error: null };
      }
      return { data: null, error: "Branch not found" };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to load branch" };
    }
  },

  async upsertBranch(payload: Partial<Record<string, any>>) {
    try {
      // Use shared validation
      const validation = validateBranchData(payload);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(", ")
        };
      }

      const adapter = getDataAdapter();
      const useUuidId = !getTrialMode();
      
      // Transform data using shared transformation
      const transformed = transformRawBranch(payload, useUuidId);
      
      let result;
      if (payload.id) {
        // Update existing
        result = await adapter.update("branches", payload.id, transformed);
      } else {
        // Insert new
        result = await adapter.insert("branches", transformed);
      }
      
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to save branch" };
    }
  },

  async deleteBranch(id: string, companyId?: string) {
    try {
      const adapter = getDataAdapter();
      
      // Check if branch exists
      const branch: any = await adapter.getById("branches", id);
      if (!branch) {
        return { error: "Branch not found" };
      }
      
      // If companyId is provided, verify it matches
      if (companyId && branch.company_id !== companyId) {
        return { error: "Branch not found" };
      }
      
      await adapter.delete("branches", id);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to delete branch" };
    }
  },
};

// Dashboard service
const dashboardService = {
  async getDashboardMetrics(
    _branchId?: string,
    timeRange: TimeRange = "month",
    rangeCount?: { day: number; week: number; month: number; quarter: number },
    companyId?: string,
  ) {
    const branchId = String(_branchId || "");

    // Trial mode: return processed mock data without Supabase calls
    if (getTrialMode()) {
      const mockTransactions = trialGet("transactions") || [];
      const mockCustomers = trialGet("customers") || [];
      const mockBankAccounts = trialGet("bank_accounts") || [];
      const mockBranches = trialGet("branches") || [];

      // Process mock data to match real mode structure
      const currentIncome = mockTransactions
        .filter((t: any) => t.transaction_type === "payment" || t.transaction_type === "refund")
        .reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
      const currentDebt = mockTransactions
        .filter((t: any) => t.transaction_type === "charge")
        .reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
      const outstanding = mockCustomers.reduce((s: number, c: any) => s + (Math.abs(c.total_balance) || 0), 0);
      const activeCustomers = mockCustomers.length;
      const currentPaymentCount = mockTransactions.filter((t: any) => t.transaction_type === "payment").length;
      const currentChargeCount = mockTransactions.filter((t: any) => t.transaction_type === "charge").length;

      const recentTransactions = [...mockTransactions]
        .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
        .slice(0, 20);

      const topCustomers = [...mockCustomers]
        .sort((a: any, b: any) => Math.abs(b.total_balance) - Math.abs(a.total_balance))
        .slice(0, 10);

      const balanceByBankAccount = mockBankAccounts.map((b: any) => ({
        bank_account_id: b.id,
        account_name: b.account_name,
        account_number: b.account_number,
        balance: b.balance || 0,
        historical_data: [],
      }));

      const cashFlowData: any[] = [];
      const transactionAmountsByBranch = mockBranches.map((b: any) => ({
        branch_id: b.id,
        branch_name: b.name,
        incomeAmount: currentIncome,
        debtAmount: currentDebt,
      }));

      return {
        data: {
          totalOutstanding: outstanding,
          totalOutstandingChange: 0,
          activeCustomers,
          activeCustomersChange: 0,
          transactionPaymentCount: currentPaymentCount,
          transactionChargeCount: currentChargeCount,
          transactionPaymentChange: 0,
          transactionChargeChange: 0,
          transactionIncomeInPeriod: currentIncome,
          transactionDebtInPeriod: currentDebt,
          transactionIncomeChange: 0,
          transactionDebtChange: 0,
          balanceByBankAccount,
          cashFlowData,
          cashFlowStartBalance: outstanding,
          cashFlowEndBalance: outstanding,
          transactionAmountsByBranch,
          recentTransactions,
          topCustomers,
        },
        error: null,
      };
    }

    // Fetch all needed data from Supabase in parallel
    const [txResult, custResult, bankResult, branchResult] = await Promise.all([
      supabase.from("transactions").select("*").order("transaction_date", { ascending: false }),
      supabase.from("customers").select("*"),
      supabase.from("bank_accounts").select("*"),
      supabase.from("branches").select("id, name"),
    ]);

    const transactionsAll: Transaction[] = (txResult.data || []) as Transaction[];
    let transactions = companyId
      ? transactionsAll.filter((t: any) => !t.company_id || t.company_id === companyId)
      : transactionsAll;
    transactions = branchId ? transactions.filter((t) => (t as any).branch_id === branchId) : transactions;

    const latestTxDate = transactions.length
      ? new Date(
          transactions
            .slice()
            .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0]
            .transaction_date,
        )
      : undefined;

    const count =
      timeRange === "day"
        ? rangeCount?.day || 7
        : timeRange === "week"
          ? rangeCount?.week || 8
          : timeRange === "month"
            ? rangeCount?.month || 7
            : timeRange === "quarter"
              ? rangeCount?.quarter || 8
              : 2;

    const { start, end, prevStart, prevEnd } = getPeriodWindow(timeRange, count, latestTxDate);
    const inRange = (tx: Transaction, s: Date, e: Date) => {
      const t = new Date(tx.transaction_date).getTime();
      return t >= s.getTime() && t <= e.getTime();
    };

    const currentTx = transactions.filter((tx) => inRange(tx, start, end));
    const prevTx = transactions.filter((tx) => inRange(tx, prevStart, prevEnd));

    // Display purposes in UI currently use labels "Äiá»u chá»‰nh tÄƒng" and "Äiá»u chá»‰nh giáº£m".
    // Map to receivable logic:
    // - Äiá»u chá»‰nh tÄƒng (decrease AR): payment + refund + positive adjustments
    // - Äiá»u chá»‰nh giáº£m (increase AR): charge + negative adjustments
    const sumPositiveAdjustment = (txs: Transaction[]) =>
      txs
        .filter((t) => t.transaction_type === "adjustment" && t.amount >= 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
    const sumNegativeAdjustment = (txs: Transaction[]) =>
      txs
        .filter((t) => t.transaction_type === "adjustment" && t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0);

    const currentIncome =
      currentTx
        .filter((t) => t.transaction_type === "payment" || t.transaction_type === "refund")
        .reduce((s, t) => s + Math.abs(t.amount), 0) + sumPositiveAdjustment(currentTx);
    const currentDebt =
      currentTx
        .filter((t) => t.transaction_type === "charge")
        .reduce((s, t) => s + Math.abs(t.amount), 0) + sumNegativeAdjustment(currentTx);

    const prevIncome =
      prevTx
        .filter((t) => t.transaction_type === "payment" || t.transaction_type === "refund")
        .reduce((s, t) => s + Math.abs(t.amount), 0) + sumPositiveAdjustment(prevTx);
    const prevDebt =
      prevTx
        .filter((t) => t.transaction_type === "charge")
        .reduce((s, t) => s + Math.abs(t.amount), 0) + sumNegativeAdjustment(prevTx);

    const currentPaymentCount = currentTx.filter((t) => t.transaction_type === "payment").length;
    const currentChargeCount = currentTx.filter((t) => t.transaction_type === "charge").length;
    const prevPaymentCount = prevTx.filter((t) => t.transaction_type === "payment").length;
    const prevChargeCount = prevTx.filter((t) => t.transaction_type === "charge").length;

    const activeCustomers = new Set(currentTx.map((t) => t.customer_id).filter((id): id is string => id !== null)).size;
    const prevActiveCustomers = new Set(prevTx.map((t) => t.customer_id).filter((id): id is string => id !== null)).size;

    const parseAmount = (value: any) => {
      const num = Number(String(value ?? 0).replace(/[\s,]/g, ""));
      return Number.isFinite(num) ? num : 0;
    };

    // Tính dư nợ theo logic thông nhất: opening_balance + charge(+), payment(-), refund(-), adjustment(signed)
    const customersAll: Customer[] = (custResult.data || []) as Customer[];
    const balanceMap = new Map<string, number>();
    for (const c of customersAll) {
      balanceMap.set(c.id, parseAmount(c.total_balance));
    }
    const applyTxToMap = (txs: Transaction[]) => {
      for (const tx of txs) {
        if (!tx.customer_id) continue; // Skip transactions without customer
        const prev = balanceMap.get(tx.customer_id) || 0;
        const amtSigned = parseAmount(tx.amount);
        const amtAbs = Math.abs(amtSigned);
        switch (normalizeTransactionType(String(tx.transaction_type || ""))) {
          case "payment":
            balanceMap.set(tx.customer_id, prev - amtAbs); // Payment giảm công nợ
            break;
          case "charge":
            balanceMap.set(tx.customer_id, prev + amtAbs); // Charge tăng công nợ
            break;
          case "refund":
            balanceMap.set(tx.customer_id, prev - amtAbs); // Refund giảm công nợ
            break;
          case "adjustment":
            balanceMap.set(tx.customer_id, prev + amtSigned); // Adjustment giữ nguyên dấu
            break;
          default:
            balanceMap.set(tx.customer_id, prev + amtSigned);
            break;
        }
      }
    };

    applyTxToMap(transactions);
    const outstanding = Array.from(balanceMap.values()).reduce((s, v) => s + v, 0);

    const prevBalanceMap = new Map(balanceMap);
    prevBalanceMap.forEach((_, k) => prevBalanceMap.set(k, parseAmount(customersAll.find(c => c.id === k)?.total_balance)));
    for (const tx of transactions.filter((t) => new Date(t.transaction_date) <= prevEnd)) {
      if (!tx.customer_id) continue; // Skip transactions without customer
      const prev = prevBalanceMap.get(tx.customer_id) || 0;
      const amtSigned = parseAmount(tx.amount);
      const amtAbs = Math.abs(amtSigned);
      const type = normalizeTransactionType(String(tx.transaction_type || ""));
      if (type === "payment") prevBalanceMap.set(tx.customer_id, prev - amtAbs);
      else if (type === "charge") prevBalanceMap.set(tx.customer_id, prev + amtAbs);
      else if (type === "refund") prevBalanceMap.set(tx.customer_id, prev - amtAbs);
      else prevBalanceMap.set(tx.customer_id, prev + amtSigned);
    }
    const prevOutstanding = Array.from(prevBalanceMap.values()).reduce((s, v) => s + v, 0);

    const cashFlowData = aggregateCashFlow(currentTx, timeRange, count);

    const bankAccounts = (bankResult.data || []) as any[];
    const balanceByBankAccountAll = bankAccounts.map((b) => {
      const txForAccount = transactions.filter((t) => t.bank_account_id === b.id);
      // Compute balances from all history so latest balance stays stable across views
      const periodStarts = buildPeriodStarts(timeRange, count, end);
      const periodStart = periodStarts[0] ?? start;
      const txBeforeStart = txForAccount.filter((t) =>
        new Date(t.transaction_date).getTime() < periodStart.getTime(),
      );
      const baseCash = txBeforeStart.reduce((s, t) => s + cashDeltaFromTransaction(t), 0);
      const periodDeltas = periodStarts.map((ps, idx) => {
        const next = idx < periodStarts.length - 1 ? periodStarts[idx + 1] : null;
        const periodEnd = next
          ? new Date(new Date(next).getTime() - 1)
          : end;

        return txForAccount
          .filter((t) => {
            const ts = new Date(t.transaction_date).getTime();
            return ts >= ps.getTime() && ts <= periodEnd.getTime();
          })
          .reduce((s, t) => s + cashDeltaFromTransaction(t), 0);
      });

      const periodBalances: number[] = Array(periodStarts.length).fill(baseCash);
      let runningCash = baseCash;
      for (let i = 0; i < periodDeltas.length; i++) {
        runningCash += periodDeltas[i];
        periodBalances[i] = runningCash;
      }

      const historical_data = periodStarts.map((ps, idx) => ({
        date: ps.toISOString(),
        balance: periodBalances[idx] ?? baseCash,
      }));

      const balance = historical_data.length > 0 ? historical_data[historical_data.length - 1].balance : baseCash;
      return {
        bank_account_id: b.id,
        account_name: b.account_name,
        account_number: b.account_number,
        balance,
        historical_data,
      };
    });

    const balanceByBankAccount = balanceByBankAccountAll
      .slice()
      .sort((a, b) => a.balance - b.balance)
      .slice(Math.min(2, balanceByBankAccountAll.length));

    const customersWithBalance = customersAll.map((c) => ({
      ...c,
      total_balance: balanceMap.get(c.id) ?? c.total_balance,
    }));

    const debtCustomers = customersWithBalance
      .filter((c) => c.total_balance < 0)
      .sort((a, b) => a.total_balance - b.total_balance);

    const creditCustomers = customersWithBalance
      .filter((c) => c.total_balance >= 0)
      .sort((a, b) => b.total_balance - a.total_balance);

    const topCustomers = [...debtCustomers, ...creditCustomers];

    // Create maps for joining customer and bank account names
    const customerNameMap = new Map(
      customersAll.map((c) => [c.id, c.full_name || c.customer_code || c.id] as const)
    );
    const bankAccountNameMap = new Map(
      bankAccounts.map((b) => [b.id, b.account_name || b.bank_name || b.account_number || b.id] as const)
    );

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 20)
      .map((tx) => ({
        ...tx,
        customer_name: customerNameMap.get(tx.customer_id || "") || tx.customer_name,
        bank_account_name: bankAccountNameMap.get(tx.bank_account_id || "") || tx.bank_account_name,
      }));

    const branches = (branchResult.data || []) as { id: string; name: string }[];
    const branchNameMap = new Map(branches.map((b) => [b.id, b.name] as const));

    const branchAgg = new Map<string, { incomeAmount: number; debtAmount: number }>();
    for (const tx of currentTx) {
      const branchIdForTx = tx.branch_id ? String(tx.branch_id) : "";
      const prev = branchAgg.get(branchIdForTx) || { incomeAmount: 0, debtAmount: 0 };
      if (tx.transaction_type === "payment" || tx.transaction_type === "refund") {
        prev.incomeAmount += Math.abs(tx.amount);
      } else if (tx.transaction_type === "charge") {
        prev.debtAmount += Math.abs(tx.amount);
      } else if (tx.transaction_type === "adjustment") {
        if (tx.amount >= 0) prev.incomeAmount += Math.abs(tx.amount);
        else prev.debtAmount += Math.abs(tx.amount);
      } else {
        prev.incomeAmount += tx.amount;
      }
      branchAgg.set(branchIdForTx, prev);
    }

    const transactionAmountsByBranch = Array.from(branchAgg.entries())
      .map(([branch_id, v]) => ({
        branch_id,
        branch_name: branchNameMap.get(branch_id) || `Branch ${branch_id}`,
        incomeAmount: v.incomeAmount,
        debtAmount: v.debtAmount,
      }))
      .sort((a, b) => b.incomeAmount + b.debtAmount - (a.incomeAmount + a.debtAmount));

    // Return the dashboard metrics
    return {
      data: {
        totalOutstanding: outstanding,
        totalOutstandingChange: outstanding - prevOutstanding,
        activeCustomers,
        activeCustomersChange: activeCustomers - prevActiveCustomers,
        transactionPaymentCount: currentPaymentCount,
        transactionChargeCount: currentChargeCount,
        transactionPaymentChange: currentPaymentCount - prevPaymentCount,
        transactionChargeChange: currentChargeCount - prevChargeCount,
        transactionIncomeInPeriod: currentIncome,
        transactionDebtInPeriod: currentDebt,
        transactionIncomeChange: currentIncome - prevIncome,
        transactionDebtChange: currentDebt - prevDebt,
        balanceByBankAccount,
        cashFlowData,
        cashFlowStartBalance: prevOutstanding,
        cashFlowEndBalance: outstanding,
        transactionAmountsByBranch,
        recentTransactions,
        topCustomers,
      },
      error: null,
    };
  },

  async getReceivableLedger(
    _branchId?: string,
    timeRange: TimeRange = "month",
    rangeCount?: { day: number; week: number; month: number; quarter: number },
  ) {
    const branchId = String(_branchId || "");

    // Trial mode: return mock data without Supabase calls
    if (getTrialMode()) {
      const mockTransactions = trialGet("transactions") || [];
      const mockBranches = trialGet("branches") || [];
      return {
        transactions: mockTransactions,
        branches: mockBranches,
      };
    }

    const [txResult, branchResult] = await Promise.all([
      supabase.from("transactions").select("*").order("transaction_date", { ascending: false }),
      supabase.from("branches").select("id, name"),
    ]);

    const transactionsAll: Transaction[] = (txResult.data || []) as Transaction[];
    const transactions = branchId
      ? transactionsAll.filter((t: any) => t.branch_id === branchId)
      : transactionsAll;

    const count =
      timeRange === "day"
        ? rangeCount?.day || 7
        : timeRange === "week"
          ? rangeCount?.week || 8
          : timeRange === "month"
            ? rangeCount?.month || 7
            : timeRange === "quarter"
              ? rangeCount?.quarter || 8
              : 2;

    const { start, end } = getPeriodWindow(timeRange, count);

    const periodStart = start;
    const periodEnd = end;

    const txBeforeStart = transactions.filter(
      (t) => new Date(t.transaction_date).getTime() < periodStart.getTime(),
    );
    const openingBalance = receivableBalanceFromTransactions(txBeforeStart);

    const txInPeriod = transactions
      .filter((t) => {
        const ts = new Date(t.transaction_date).getTime();
        return ts >= periodStart.getTime() && ts <= periodEnd.getTime();
      })
      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    const branches = (branchResult.data || []) as { id: string; name: string }[];
    const branchNameMap = new Map(branches.map((b) => [b.id, b.name] as const));

    const rowEffect = (t: Transaction) => {
      if (t.transaction_type === "charge") return -Math.abs(t.amount);
      if (t.transaction_type === "payment") return Math.abs(t.amount);
      if (t.transaction_type === "refund") return Math.abs(t.amount);
      if (t.transaction_type === "adjustment") return t.amount;
      return t.amount;
    };

    const rowIncrease = (t: Transaction) => {
      if (t.transaction_type === "charge") return Math.abs(t.amount);
      if (t.transaction_type === "adjustment" && t.amount < 0) return Math.abs(t.amount);
      return 0;
    };

    const rowDecrease = (t: Transaction) => {
      if (t.transaction_type === "payment") return Math.abs(t.amount);
      if (t.transaction_type === "refund") return Math.abs(t.amount);
      if (t.transaction_type === "adjustment" && t.amount > 0) return Math.abs(t.amount);
      return 0;
    };

    let runningBalance = openingBalance;
    const rows = txInPeriod.map((t) => {
      const delta = rowEffect(t);
      runningBalance += delta;
      return {
        transaction_date: t.transaction_date,
        transaction_code: t.transaction_code,
        customer_id: t.customer_id,
        customer_name: t.customer_name,
        branch_id: t.branch_id,
        branch_name: t.branch_id ? (branchNameMap.get(t.branch_id) || `Branch ${t.branch_id}`) : "",
        bank_account_id: t.bank_account_id,
        bank_account_name: t.bank_account_name,
        transaction_type: t.transaction_type,
        description: t.description || "",
        reference_number: t.reference_number || "",
        increase: rowIncrease(t),
        decrease: rowDecrease(t),
        delta,
        running_balance: runningBalance,
      };
    });

    const closingBalance = runningBalance;

    return {
      data: {
        timeRange,
        count,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        openingBalance,
        closingBalance,
        rows,
      },
      error: null,
    };
  },
};

// Backup history service
const backupHistoryService = {
  async saveBackupHistory(backupData: any) {
    // Trial mode: save to mock store
    if (getTrialMode()) {
      const mockStore = JSON.parse(localStorage.getItem("cashflow_trial_store") || "{}");
      const mockBackups = mockStore.backup_history || [];
      const backup = {
        id: `backup-${Date.now()}`,
        company_id: backupData.company_id || "trial-company",
        backup_name: backupData.backup_name || `Backup ${new Date().toISOString()}`,
        backup_version: backupData.version || "1.0.0",
        backup_timestamp: backupData.timestamp || new Date().toISOString(),
        backup_format: backupData.format || "xlsx",
        backup_size: backupData.size,
        created_by: backupData.created_by,
        total_customers: backupData.metadata?.totalCustomers || 0,
        total_transactions: backupData.metadata?.totalTransactions || 0,
        total_bank_accounts: backupData.metadata?.totalBankAccounts || 0,
        total_branches: backupData.metadata?.totalBranches || 0,
        branch_id: backupData.branch_id || "trial-branch",
        notes: backupData.notes,
        is_restorable: true,
        created_at: new Date().toISOString(),
      };
      mockBackups.push(backup);
      mockStore.backup_history = mockBackups;
      localStorage.setItem("cashflow_trial_store", JSON.stringify(mockStore));
      return { data: backup, error: null };
    }

    try {
      const { data, error } = await (supabase as any)
        .from("backup_history")
        .insert({
          company_id: backupData.company_id,
          backup_name: backupData.backup_name || `Backup ${new Date().toISOString()}`,
          backup_version: backupData.version || "1.0.0",
          backup_timestamp: backupData.timestamp || new Date().toISOString(),
          backup_format: backupData.format || "xlsx",
          backup_size: backupData.size,
          created_by: backupData.created_by,
          total_customers: backupData.metadata?.totalCustomers || 0,
          total_transactions: backupData.metadata?.totalTransactions || 0,
          total_bank_accounts: backupData.metadata?.totalBankAccounts || 0,
          total_branches: backupData.metadata?.totalBranches || 0,
          branch_id: backupData.branch_id,
          notes: backupData.notes,
          is_restorable: true,
        })
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Failed to save backup history" };
    }
  },

  async saveBackupToDatabase(backupData: any, companyId: string, userId: string) {
    try {
      const { compressJSON } = await import("../utils/compression");
      
      // Compress backup data
      const compressed = await compressJSON(backupData);
      
      // Get included tables
      const includedTables = Object.keys(backupData).filter(
        (key: string) => Array.isArray(backupData[key])
      );
      
      // Save to database
      const { data, error } = await (supabase as any)
        .from('backup_history')
        .insert({
          company_id: companyId,
          backup_name: `Backup ${new Date().toISOString()}`,
          backup_data: compressed,
          included_tables: includedTables,
          is_compressed: true,
          compression_algorithm: 'base64',
          created_by: userId,
          backup_timestamp: new Date().toISOString(),
          backup_format: 'json',
          backup_version: backupData.version || '1.0.0',
          total_customers: backupData.customers?.length || 0,
          total_transactions: backupData.transactions?.length || 0,
          total_bank_accounts: backupData.bank_accounts?.length || 0,
          total_branches: backupData.branches?.length || 0,
          is_restorable: true,
        })
        .select()
        .single();
      
      if (error) return { data: null, error: error.message };
      
      // Cleanup old backups (keep only 30)
      await this.cleanupOldBackups(companyId);
      
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to save backup to database' 
      };
    }
  },

  async loadBackupData(backupId: string, companyId?: string) {
    try {
      const { decompressJSON } = await import("../utils/compression");
      
      let query = (supabase as any)
        .from('backup_history')
        .select('backup_data, is_compressed, company_id')
        .eq('id', backupId);
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query.single();
      
      if (error) return { data: null, error: error.message };
      
      // Decompress data
      const decompressed = data.is_compressed 
        ? await decompressJSON(data.backup_data)
        : data.backup_data;
      
      return { data: decompressed, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to load backup data' 
      };
    }
  },

  async revertTableFromBackup(backupId: string, tableName: string, companyId: string, userId: string) {
    try {
      const backupData = await this.loadBackupData(backupId, companyId);
      if (backupData.error) return { error: backupData.error };
      
      // Get table data from backup
      const tableData = backupData.data[tableName];
      if (!Array.isArray(tableData)) {
        return { error: `Table ${tableName} not found in backup` };
      }
      
      // Restore table data based on table type
      switch (tableName) {
        case 'customers':
          await this.restoreCustomers(tableData);
          break;
        case 'transactions':
          await this.restoreTransactions(tableData);
          break;
        case 'bank_accounts':
          await this.restoreBankAccounts(tableData);
          break;
        case 'branches':
          await this.restoreBranches(tableData);
          break;
        default:
          return { error: `Unsupported table: ${tableName}` };
      }
      
      // Update restore metadata
      await (supabase as any)
        .from('backup_history')
        .update({
          restore_count: (await (supabase as any)
            .from('backup_history')
            .select('restore_count')
            .eq('id', backupId)
            .single()).data?.restore_count || 0 + 1,
          last_restored_at: new Date().toISOString(),
          last_restored_by: userId,
        })
        .eq('id', backupId);
      
      return { data: null, error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to revert table from backup' 
      };
    }
  },

  async restoreCustomers(customers: any[]) {
    for (const customer of customers) {
      try {
        const { data: existing } = await customerService.getCustomerById(customer.id);
        if (existing) {
          await customerService.updateCustomer(customer.id, customer);
        } else {
          await customerService.createCustomer(customer);
        }
      } catch (error) {
        console.error(`Failed to restore customer ${customer.id}:`, error);
      }
    }
  },

  async restoreTransactions(transactions: any[]) {
    for (const transaction of transactions) {
      try {
        const { data: existing } = await transactionService.getTransactionById(transaction.id);
        if (existing) {
          await transactionService.updateTransaction(transaction.id, transaction);
        } else {
          await transactionService.createTransaction(transaction);
        }
      } catch (error) {
        console.error(`Failed to restore transaction ${transaction.id}:`, error);
      }
    }
  },

  async restoreBranches(branches: any[]) {
    for (const branch of branches) {
      try {
        const { data: existing } = await branchService.getBranchById(branch.id);
        if (existing) {
          console.log(`Branch ${branch.id} already exists, skipping`);
        } else {
          console.log(`Creating branch ${branch.id}`);
        }
      } catch (error) {
        console.error(`Failed to restore branch ${branch.id}:`, error);
      }
    }
  },

  async restoreBankAccounts(bankAccounts: any[]) {
    for (const bankAccount of bankAccounts) {
      try {
        const { data: existing } = await bankAccountService.getBankAccount(bankAccount.id);
        if (existing) {
          console.log(`Bank account ${bankAccount.id} already exists, skipping`);
        } else {
          console.log(`Creating bank account ${bankAccount.id}`);
        }
      } catch (error) {
        console.error(`Failed to restore bank account ${bankAccount.id}:`, error);
      }
    }
  },

  async cleanupOldBackups(companyId: string) {
    try {
      const { data: backups } = await (supabase as any)
        .from('backup_history')
        .select('id')
        .eq('company_id', companyId)
        .order('backup_timestamp', { ascending: false });
      
      if (backups && backups.length > 30) {
        const toDelete = backups.slice(30);
        const ids = toDelete.map((b: any) => b.id);
        
        await (supabase as any)
          .from('backup_history')
          .delete()
          .in('id', ids);
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      // Don't throw error, cleanup is not critical
    }
  },

  async getBackupHistory(companyId?: string, userId?: string) {
    // Trial mode: return mock backups without Supabase call
    if (getTrialMode()) {
      const mockBackups = trialGet("backup_history") || [];
      return { data: mockBackups, error: null };
    }

    try {
      let query = (supabase as any)
        .from("backup_history")
        .select("*")
        .order("backup_timestamp", { ascending: false });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      if (userId) {
        query = query.eq("created_by", userId);
      }

      const { data, error } = await query;
      if (error) return { data: [], error: error.message };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err instanceof Error ? err.message : "Failed to load backup history" };
    }
  },

  async deleteBackupHistory(id: string) {
    // Trial mode: delete from mock store
    if (getTrialMode()) {
      const mockBackups = trialGet("backup_history") || [];
      const filtered = mockBackups.filter((b: any) => b.id !== id);
      localStorage.setItem("cashflow_trial_store", JSON.stringify({ backup_history: filtered }));
      return { error: null };
    }

    try {
      const { error } = await (supabase as any)
        .from("backup_history")
        .delete()
        .eq("id", id);

      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to delete backup history" };
    }
  },
};

// Export all services as a single object to match the import in Dashboard.tsx
export const databaseService = {
  dashboard: dashboardService,
  customers: customerService,
  transactions: transactionService,
  transactionTypes: transactionTypeService,
  branches: branchService,
  bankAccounts: bankAccountService,
  reports: reportService,
  users: userService,
  colorSettings: colorSettingsService,
  backupHistory: backupHistoryService,
};
