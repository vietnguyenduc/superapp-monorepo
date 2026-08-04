import { BaseService } from "@superapp/shared-utils";
import { apiClient } from "./supabase";
import { trialGet, trialInsert, trialDelete } from "./trialMockStore";
import { backupService, type BackupData } from "../utils/backupRecovery";
import { compressJSON, decompressJSON } from "../utils/compression";

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

  static async saveBackupToDatabase(backupData: BackupData, companyId: string, userId: string) {
    return this.execute(
      async () => backupService.saveBackupToDatabase(backupData, companyId, userId),
      async () => {
        const compressed = await compressJSON(backupData);
        const includedTables = Object.keys(backupData).filter((key) =>
          Array.isArray(backupData[key as keyof BackupData])
        );
        const record = trialInsert("backup_history", {
          company_id: companyId,
          backup_name: backupService.generateBackupFilename(undefined, "json"),
          backup_data: compressed,
          included_tables: includedTables,
          is_compressed: true,
          compression_algorithm: "base64",
          created_by: userId,
          backup_timestamp: new Date().toISOString(),
          backup_format: "json",
          backup_version: backupData.version,
          total_customers: backupData.customers?.length || 0,
          total_transactions: backupData.transactions?.length || 0,
          total_bank_accounts: backupData.bank_accounts?.length || 0,
          total_branches: backupData.branches?.length || 0,
          is_restorable: true,
        });
        if (!record) {
          return { data: null, error: "Trial mode: failed to save backup" };
        }
        return { data: record, error: null };
      }
    );
  }

  static async loadBackupData(backupId: string, _companyId?: string) {
    return this.execute(
      async () => backupService.loadBackupFromDatabase(backupId),
      async () => {
        const backups = (trialGet("backup_history") || []) as Record<string, unknown>[];
        const backup = backups.find((b) => String(b.id) === backupId);
        if (!backup || typeof backup.backup_data !== "string") {
          return { data: null, error: "Không tìm thấy bản sao lưu" };
        }
        const decompressed = await decompressJSON(backup.backup_data);
        return { data: decompressed as BackupData, error: null };
      }
    );
  }

  static async revertTableFromBackup(
    backupId: string,
    tableName: string,
    companyId: string,
    userId: string
  ) {
    return this.execute(
      async () =>
        backupService.revertTableFromBackup(backupId, tableName, {
          companyId,
          userId,
          restoreOnlyOwnChanges: true,
        }),
      async () => ({ data: null, error: "Không hỗ trợ revert trong chế độ dùng thử" })
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
  saveBackupToDatabase: BackupHistoryService.saveBackupToDatabase.bind(BackupHistoryService),
  loadBackupData: BackupHistoryService.loadBackupData.bind(BackupHistoryService),
  revertTableFromBackup: BackupHistoryService.revertTableFromBackup.bind(BackupHistoryService),
};
