import { BaseService } from "@superapp/shared-utils";
import { supabase } from "./supabase";
import { trialGet, trialDelete } from "./trialMockStore";
import { customerService } from "./customerService";
import { transactionService } from "./transactionService";
import { branchService } from "./branchService";
import { bankAccountService } from "./bankAccountService";

export class BackupHistoryService extends BaseService {
  static async restoreCustomers(customers: any[]) {
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
  }

  static async restoreTransactions(transactions: any[]) {
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
  }

  static async restoreBranches(branches: any[]) {
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
  }

  static async restoreBankAccounts(bankAccounts: any[]) {
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
  }

  static async cleanupOldBackups(companyId: string) {
    return this.execute(
      async () => {
        const { data: backups } = await supabase
          .from("backup_history")
          .select("id")
          .eq("company_id", companyId)
          .order("backup_timestamp", { ascending: false });
        
        if (backups && backups.length > 30) {
          const toDelete = backups.slice(30).map((b: any) => b.id);
          await supabase.from("backup_history").delete().in("id", toDelete);
        }
        return { data: null, error: null };
      }
    );
  }

  static async getBackupHistory(companyId?: string, userId?: string) {
    return this.execute(
      async () => {
        let query = supabase.from("backup_history").select("*").order("backup_timestamp", { ascending: false });
        if (companyId) query = query.eq("company_id", companyId);
        if (userId) query = query.eq("created_by", userId);
        const { data, error } = await query;
        return { data: data || [], error };
      },
      async () => {
        let data = trialGet("backup_history") || [];
        if (companyId) data = data.filter((b: any) => b.company_id === companyId);
        if (userId) data = data.filter((b: any) => b.created_by === userId);
        data.sort((a: any, b: any) => new Date(b.backup_timestamp).getTime() - new Date(a.backup_timestamp).getTime());
        return { data, error: null };
      }
    );
  }

  static async deleteBackupHistory(id: string) {
    return this.execute(
      async () => {
        const { error } = await supabase.from("backup_history").delete().eq("id", id);
        return { data: null, error };
      },
      async () => {
        trialDelete("backup_history", id);
        return { data: null, error: null };
      }
    );
  }
}

export const backupHistoryService = {
  restoreCustomers: BackupHistoryService.restoreCustomers.bind(BackupHistoryService),
  restoreTransactions: BackupHistoryService.restoreTransactions.bind(BackupHistoryService),
  restoreBranches: BackupHistoryService.restoreBranches.bind(BackupHistoryService),
  restoreBankAccounts: BackupHistoryService.restoreBankAccounts.bind(BackupHistoryService),
  cleanupOldBackups: BackupHistoryService.cleanupOldBackups.bind(BackupHistoryService),
  getBackupHistory: BackupHistoryService.getBackupHistory.bind(BackupHistoryService),
  deleteBackupHistory: BackupHistoryService.deleteBackupHistory.bind(BackupHistoryService),
};
