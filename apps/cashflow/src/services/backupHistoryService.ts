import { BaseService } from "@superapp/shared-utils";
import { apiClient } from "./supabase";
import { trialGet, trialDelete } from "./trialMockStore";
import { backupService } from "../utils/backupRecovery";

export class BackupHistoryService extends BaseService {
  static async restoreCustomers(customers: Record<string, unknown>[], companyId: string) {
    await backupService.restoreCustomers(customers, companyId);
  }

  static async restoreTransactions(transactions: Record<string, unknown>[], companyId: string) {
    await backupService.restoreTransactions(transactions, companyId);
  }

  static async restoreBranches(branches: Record<string, unknown>[], companyId: string) {
    await backupService.restoreBranches(branches, companyId);
  }

  static async restoreBankAccounts(bankAccounts: Record<string, unknown>[], companyId: string) {
    await backupService.restoreBankAccounts(bankAccounts, companyId);
  }

  static async cleanupOldBackups(companyId: string) {
    return this.execute(
      async () => {
        const { data: backups } = await apiClient
          .from("backup_history")
          .select("id")
          .eq("company_id", companyId)
          .order("backup_timestamp", { ascending: false });
        
        if (backups && backups.length > 30) {
          const toDelete = backups.slice(30).map((b) => String(b.id ?? ""));
          await apiClient.from("backup_history").delete().in("id", toDelete);
        }
        return { data: null, error: null };
      }
    );
  }

  static async getBackupHistory(companyId?: string, userId?: string) {
    return this.execute(
      async () => {
        let query = apiClient.from("backup_history").select("*").order("backup_timestamp", { ascending: false });
        if (companyId) query = query.eq("company_id", companyId);
        if (userId) query = query.eq("created_by", userId);
        const { data, error } = await query;
        return { data: data || [], error };
      },
      async () => {
        let data = (trialGet("backup_history") || []) as Record<string, unknown>[];
        if (companyId) data = data.filter((b) => b.company_id === companyId);
        if (userId) data = data.filter((b) => b.created_by === userId);
        data.sort((a, b) => new Date(String(b.backup_timestamp ?? "")).getTime() - new Date(String(a.backup_timestamp ?? "")).getTime());
        return { data, error: null };
      }
    );
  }

  static async deleteBackupHistory(id: string) {
    return this.execute(
      async () => {
        const { error } = await apiClient.from("backup_history").delete().eq("id", id);
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
