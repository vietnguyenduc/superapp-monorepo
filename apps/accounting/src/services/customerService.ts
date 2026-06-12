import { BaseService } from "@superapp/shared-utils";
import { supabase } from "./supabase";
import { getTrialMode, trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";
import { validateCustomerData, transformRawCustomer } from "./businessLogic";
import { normalizeTransactionType } from "./businessLogic";

export class CustomerService extends BaseService {
  static async getCustomers(filters?: any) {
    return this.execute(
      async () => {
        let query = supabase.from("customers").select("*");
        if (filters?.company_id) {
          query = query.eq("company_id", filters.company_id);
        }
        
        if (filters?.search) {
          const s = `%${filters.search}%`;
          query = query.or(`full_name.ilike.${s},customer_code.ilike.${s},phone.ilike.${s},email.ilike.${s}`);
        }
        
        query = query.order("created_at", { ascending: false });
        
        if (Number.isFinite(filters?.limit)) {
          const limit = Number(filters.limit);
          const offset = Number(filters.offset || 0);
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
        
        data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
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
        let query = supabase.from("customers").select("*").eq("id", id);
        if (companyId) query = query.eq("company_id", companyId);
        
        const { data: customer, error } = await query.single();
        if (error || !customer) return { data: null, error: error || { message: "Customer not found" } };
        
        let updatedByEmail = null;
        if (customer.updated_by) {
          const { data: userData } = await supabase.from("users").select("email").eq("id", customer.updated_by).single();
          updatedByEmail = userData?.email || null;
        }
        
        const { data: txData } = await supabase.from("transactions").select("transaction_type, amount").eq("customer_id", id);
        
        const parseAmount = (value: any) => {
          const num = Number(String(value ?? 0).replace(/[\s,]/g, ""));
          return Number.isFinite(num) ? num : 0;
        };

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
        
        const parseAmount = (value: any) => {
          const num = Number(String(value ?? 0).replace(/[\s,]/g, ""));
          return Number.isFinite(num) ? num : 0;
        };

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
          let checkQ = supabase.from("customers").select("id").eq("customer_code", proposedCode);
          if (transformed.company_id) checkQ = checkQ.eq("company_id", transformed.company_id);
          const { data: existing } = await checkQ;
          if (existing && existing.length > 0) {
            return { data: null, error: { message: `Customer with code "${proposedCode}" already exists` } };
          }
        }
        
        const { data, error } = await supabase.from("customers").insert(transformed as any).select().single();
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

  static async updateCustomer(id: string, customerData: any) {
    return this.execute(
      async () => {
        const validation = validateCustomerData(customerData);
        if (!validation.isValid) return { data: null, error: { message: validation.errors.join(", ") } };
        
        const transformed = transformRawCustomer(customerData, true);
        const proposedCode = transformed.customer_code?.trim();
        
        if (proposedCode) {
          let checkQ = supabase.from("customers").select("id").eq("customer_code", proposedCode).neq("id", id);
          if (transformed.company_id) checkQ = checkQ.eq("company_id", transformed.company_id);
          const { data: existing } = await checkQ;
          if (existing && existing.length > 0) {
            return { data: null, error: { message: `Customer with code "${proposedCode}" already exists` } };
          }
        }
        
        const { data, error } = await supabase.from("customers").update(transformed as any).eq("id", id).select().single();
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
        const { error } = await supabase.from("customers").delete().eq("id", id);
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
        let q = supabase.from("customers").select("*").eq("id", customerId);
        if (companyId) q = q.eq("company_id", companyId);
        const { data: existing, error: fetchErr } = await q.single();
        if (fetchErr || !existing) return { data: null, error: fetchErr || { message: "Customer not found" } };
        
        const oldOpening = Number(existing.opening_balance || 0);
        const oldCurrent = Number(existing.current_balance || 0);
        const delta = oldCurrent - oldOpening;
        const newCurrent = newOpening + delta;
        
        const { data, error } = await supabase.from("customers").update({
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

  static async bulkUpdateOpeningBalances(rows: { customer_code?: string; opening_balance?: number }[]) {
    return this.execute(
      async () => {
        let updatedCount = 0;
        const errors: any[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const code = String(row.customer_code || "").trim();
          const opening = Number(row.opening_balance);
          if (!code) { errors.push({ row: i, message: "Missing customer_code" }); continue; }
          
          const { data: customer } = await supabase.from("customers").select("*").eq("customer_code", code).single();
          if (!customer) { errors.push({ row: i, message: "Customer not found" }); continue; }
          
          await supabase.from("customers").update({
            opening_balance: opening,
            current_balance: opening,
            updated_at: new Date().toISOString()
          } as any).eq("id", customer.id);
          updatedCount++;
        }
        return { data: { updatedCount, errors }, error: null };
      },
      async () => {
        let updatedCount = 0;
        const errors: any[] = [];
        const customers = trialGet("customers") || [];
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const code = String(row.customer_code || "").trim();
          const opening = Number(row.opening_balance);
          if (!code) { errors.push({ row: i, message: "Missing customer_code" }); continue; }
          
          const customer = customers.find((c: any) => c.customer_code === code);
          if (!customer) { errors.push({ row: i, message: "Customer not found" }); continue; }
          
          trialUpdate("customers", customer.id, {
            opening_balance: opening,
            current_balance: opening,
            updated_at: new Date().toISOString()
          });
          updatedCount++;
        }
        return { data: { updatedCount, errors }, error: null };
      }
    );
  }
}

export const customerService = {
  getCustomers: CustomerService.getCustomers.bind(CustomerService),
  getCustomerById: CustomerService.getCustomerById.bind(CustomerService),
  createCustomer: CustomerService.createCustomer.bind(CustomerService),
  updateCustomer: CustomerService.updateCustomer.bind(CustomerService),
  deleteCustomer: CustomerService.deleteCustomer.bind(CustomerService),
  updateCustomerOpeningBalance: CustomerService.updateCustomerOpeningBalance.bind(CustomerService),
  bulkUpdateOpeningBalances: CustomerService.bulkUpdateOpeningBalances.bind(CustomerService),
};
