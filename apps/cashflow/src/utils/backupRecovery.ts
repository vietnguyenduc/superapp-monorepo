import * as XLSX from "xlsx";
import type { Customer, Transaction, BankAccount, Branch } from "../types";
import { databaseService } from "../services/database";
import { createError, ERROR_CODES } from "./errorHandling";
import { compressJSON, decompressJSON } from "./compression";
import { supabase } from "../services/supabase";

// Trigger a browser download for a Blob (works for Excel/CSV/JSON).
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.position = "fixed";
  link.style.left = "-9999px";
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

// Backup types
export interface BackupData {
  version: string;
  timestamp: string;
  company_id?: string;
  branch_id?: string;
  customers: Customer[];
  transactions: Transaction[];
  bank_accounts: BankAccount[];
  branches: Branch[];
  metadata: {
    totalCustomers: number;
    totalTransactions: number;
    totalBankAccounts: number;
    totalBranches: number;
    exportDate: string;
    exportedBy: string;
  };
}

export interface BackupOptions {
  includeCustomers: boolean;
  includeTransactions: boolean;
  includeBankAccounts: boolean;
  includeBranches: boolean;
  company_id?: string;
  branch_id?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  format: "xlsx" | "json";
}

export interface ConflictInfo {
  totalConflicts: number;
  conflicts: Array<{
    type: "customer" | "transaction" | "bank_account" | "branch";
    id: string;
    name: string;
    existingData: any;
    backupData: any;
  }>;
  backupMetadata: BackupData["metadata"];
}

// Default backup options
export const defaultBackupOptions: BackupOptions = {
  includeCustomers: true,
  includeTransactions: true,
  includeBankAccounts: true,
  includeBranches: true,
  format: "xlsx",
};

// Backup service
export const backupService = {
  // Create backup data
  async createBackup(
    options: BackupOptions = defaultBackupOptions,
    userId?: string,
  ): Promise<BackupData> {
    try {
      const backupData: BackupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        company_id: options.company_id,
        branch_id: options.branch_id,
        customers: [],
        transactions: [],
        bank_accounts: [],
        branches: [],
        metadata: {
          totalCustomers: 0,
          totalTransactions: 0,
          totalBankAccounts: 0,
          totalBranches: 0,
          exportDate: new Date().toISOString(),
          exportedBy: userId || "unknown",
        },
      };

      // Fetch customers
      if (options.includeCustomers) {
        const { data: customers } =
          await databaseService.customers.getCustomers({
            company_id: options.company_id,
            branch_id: options.branch_id,
            is_active: true,
          });
        backupData.customers = customers;
        backupData.metadata.totalCustomers = customers.length;
      }

      // Fetch transactions
      if (options.includeTransactions) {
        const filters: any = {
          company_id: options.company_id,
          branch_id: options.branch_id,
        };
        if (options.dateRange) {
          filters.dateRange = options.dateRange;
        }

        const { data: transactions } =
          await databaseService.transactions.getTransactions(filters);
        backupData.transactions = transactions;
        backupData.metadata.totalTransactions = transactions.length;
      }

      // Fetch bank accounts
      if (options.includeBankAccounts) {
        const { data: bankAccounts } =
          await databaseService.bankAccounts.getBankAccounts(options.company_id);
        // Filter by branch_id if specified and exclude null branch_ids
        let filteredBankAccounts = bankAccounts.filter((ba: any) => ba.branch_id !== null);
        if (options.branch_id) {
          filteredBankAccounts = filteredBankAccounts.filter((ba: any) => ba.branch_id === options.branch_id);
        }
        backupData.bank_accounts = filteredBankAccounts as BankAccount[];
        backupData.metadata.totalBankAccounts = filteredBankAccounts.length;
      }

      // Fetch branches
      if (options.includeBranches) {
        const { data: branches } = await databaseService.branches.getBranches(options.company_id);
        backupData.branches = branches;
        backupData.metadata.totalBranches = branches.length;
      }

      return backupData;
    } catch {
      throw createError(
        ERROR_CODES.IMPORT_FAILED,
        "Failed to create backup data",
        null,
        false,
      );
    }
  },

  // Export backup to file
  async exportBackup(
    backupData: BackupData,
    format: "xlsx" | "json" = "xlsx",
  ): Promise<Blob> {
    try {
      if (format === "json") {
        const jsonString = JSON.stringify(backupData, null, 2);
        return new Blob([jsonString], { type: "application/json" });
      }

      // Create Excel workbook
      const workbook = XLSX.utils.book_new();

      // Add metadata sheet
      const metadataSheet = XLSX.utils.json_to_sheet([backupData.metadata]);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");

      // Add customers sheet
      if (backupData.customers.length > 0) {
        const customersSheet = XLSX.utils.json_to_sheet(backupData.customers);
        XLSX.utils.book_append_sheet(workbook, customersSheet, "Customers");
      }

      // Add transactions sheet
      if (backupData.transactions.length > 0) {
        const transactionsSheet = XLSX.utils.json_to_sheet(
          backupData.transactions,
        );
        XLSX.utils.book_append_sheet(
          workbook,
          transactionsSheet,
          "Transactions",
        );
      }

      // Add bank accounts sheet
      if (backupData.bank_accounts.length > 0) {
        const bankAccountsSheet = XLSX.utils.json_to_sheet(
          backupData.bank_accounts,
        );
        XLSX.utils.book_append_sheet(
          workbook,
          bankAccountsSheet,
          "Bank Accounts",
        );
      }

      // Add branches sheet
      if (backupData.branches.length > 0) {
        const branchesSheet = XLSX.utils.json_to_sheet(backupData.branches);
        XLSX.utils.book_append_sheet(workbook, branchesSheet, "Branches");
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      return new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    } catch (error) {
      throw createError(
        ERROR_CODES.IMPORT_FAILED,
        "Failed to export backup file",
        error,
        false,
      );
    }
  },

  // Import backup from file
  async importBackup(file: File): Promise<BackupData> {
    try {
      if (file.name.endsWith(".json")) {
        return await this.importJsonBackup(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        return await this.importExcelBackup(file);
      } else {
        throw createError(
          ERROR_CODES.FILE_READ_ERROR,
          "Unsupported file format. Please use .xlsx or .json files.",
          null,
          false,
        );
      }
    } catch (error) {
      throw createError(
        ERROR_CODES.IMPORT_FAILED,
        "Failed to import backup file",
        error,
        false,
      );
    }
  },

  // Import JSON backup
  async importJsonBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file"));
            return;
          }

          const json = JSON.parse(data as string);
          
          // Validate backup data structure
          this.validateBackupData(json);

          resolve(json as BackupData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  },

  // Import Excel backup
  async importExcelBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file"));
            return;
          }

          const workbook = XLSX.read(data, { type: "binary" });

          const backupData: BackupData = {
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            customers: [],
            transactions: [],
            bank_accounts: [],
            branches: [],
            metadata: {
              totalCustomers: 0,
              totalTransactions: 0,
              totalBankAccounts: 0,
              totalBranches: 0,
              exportDate: new Date().toISOString(),
              exportedBy: "unknown",
            },
          };

          // Read metadata
          if (workbook.Sheets["Metadata"]) {
            const metadata = XLSX.utils.sheet_to_json(
              workbook.Sheets["Metadata"],
            );
            if (metadata.length > 0) {
              backupData.metadata = metadata[0] as any;
            }
          }

          // Read customers
          if (workbook.Sheets["Customers"]) {
            backupData.customers = XLSX.utils.sheet_to_json(
              workbook.Sheets["Customers"],
            );
            backupData.metadata.totalCustomers = backupData.customers.length;
          }

          // Read transactions
          if (workbook.Sheets["Transactions"]) {
            backupData.transactions = XLSX.utils.sheet_to_json(
              workbook.Sheets["Transactions"],
            );
            backupData.metadata.totalTransactions =
              backupData.transactions.length;
          }

          // Read bank accounts
          if (workbook.Sheets["Bank Accounts"]) {
            backupData.bank_accounts = XLSX.utils.sheet_to_json(
              workbook.Sheets["Bank Accounts"],
            );
            backupData.metadata.totalBankAccounts =
              backupData.bank_accounts.length;
          }

          // Read branches
          if (workbook.Sheets["Branches"]) {
            backupData.branches = XLSX.utils.sheet_to_json(
              workbook.Sheets["Branches"],
            );
            backupData.metadata.totalBranches = backupData.branches.length;
          }

          // Validate backup data structure
          this.validateBackupData(backupData);
          resolve(backupData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  },

  // Detect conflicts between backup data and existing data
  async detectConflicts(
    backupData: BackupData,
    targetCompanyId?: string,
  ): Promise<ConflictInfo["conflicts"]> {
    const conflicts: ConflictInfo["conflicts"] = [];

    // Check customer conflicts
    for (const customer of backupData.customers) {
      try {
        const { data: existingCustomer } =
          await databaseService.customers.getCustomerById(customer.id);
        if (existingCustomer) {
          // Check if company_id matches (if specified)
          if (targetCompanyId && existingCustomer.company_id !== targetCompanyId) {
            continue; // Skip if different company
          }
          conflicts.push({
            type: "customer",
            id: customer.id,
            name: customer.full_name || customer.customer_code,
            existingData: existingCustomer,
            backupData: customer,
          });
        }
      } catch {
        // Customer doesn't exist, no conflict
      }
    }

    // Check transaction conflicts
    for (const transaction of backupData.transactions) {
      try {
        const { data: existingTransaction } =
          await databaseService.transactions.getTransactionById(transaction.id);
        if (existingTransaction) {
          // Check if company_id matches (if specified)
          if (targetCompanyId && existingTransaction.company_id !== targetCompanyId) {
            continue; // Skip if different company
          }
          conflicts.push({
            type: "transaction",
            id: transaction.id,
            name: transaction.transaction_code,
            existingData: existingTransaction,
            backupData: transaction,
          });
        }
      } catch (error) {
        // Transaction doesn't exist, no conflict
      }
    }

    // Check bank account conflicts
    for (const bankAccount of backupData.bank_accounts) {
      try {
        const { data: existingAccount } =
          await databaseService.bankAccounts.getBankAccount(bankAccount.id);
        if (existingAccount) {
          // Check if company_id matches (if specified)
          if (targetCompanyId && existingAccount.company_id !== targetCompanyId) {
            continue; // Skip if different company
          }
          conflicts.push({
            type: "bank_account",
            id: bankAccount.id,
            name: bankAccount.account_name,
            existingData: existingAccount,
            backupData: bankAccount,
          });
        }
      } catch (error) {
        // Bank account doesn't exist, no conflict
      }
    }

    // Check branch conflicts
    for (const branch of backupData.branches) {
      try {
        const { data: existingBranch } =
          await databaseService.branches.getBranchById(branch.id);
        if (existingBranch) {
          // Check if company_id matches (if specified)
          if (targetCompanyId && existingBranch.company_id !== targetCompanyId) {
            continue; // Skip if different company
          }
          conflicts.push({
            type: "branch",
            id: branch.id,
            name: branch.name,
            existingData: existingBranch,
            backupData: branch,
          });
        }
      } catch (error) {
        // Branch doesn't exist, no conflict
      }
    }

    return conflicts;
  },

  // Validate backup data structure
  validateBackupData(backupData: any): void {
    if (!backupData || typeof backupData !== "object") {
      throw new Error("Invalid backup data structure");
    }

    if (!backupData.version || !backupData.timestamp) {
      throw new Error(
        "Backup data missing required fields (version, timestamp)",
      );
    }

    if (!backupData.metadata) {
      throw new Error("Backup data missing metadata");
    }

    // Validate arrays exist
    if (!Array.isArray(backupData.customers)) {
      throw new Error("Backup data missing customers array");
    }

    if (!Array.isArray(backupData.transactions)) {
      throw new Error("Backup data missing transactions array");
    }

    if (!Array.isArray(backupData.bank_accounts)) {
      throw new Error("Backup data missing bank_accounts array");
    }

    if (!Array.isArray(backupData.branches)) {
      throw new Error("Backup data missing branches array");
    }
  },

  // Restore backup data
  async restoreBackup(
    backupData: BackupData,
    options: {
      restoreCustomers?: boolean;
      restoreTransactions?: boolean;
      restoreBankAccounts?: boolean;
      restoreBranches?: boolean;
      overwriteExisting?: boolean;
      branchMapping?: Record<string, string>; // Map old branch IDs to new branch IDs
      company_id?: string; // Target company_id for validation
      onConflict?: (conflicts: ConflictInfo) => Promise<boolean>; // Callback for conflict resolution
    } = {},
  ): Promise<{
    restored: {
      customers: number;
      transactions: number;
      bank_accounts: number;
      branches: number;
    };
    errors: Array<{ type: string; message: string; data?: any }>;
  }> {
    const result = {
      restored: {
        customers: 0,
        transactions: 0,
        bank_accounts: 0,
        branches: 0,
      },
      errors: [] as Array<{ type: string; message: string; data?: any }>,
    };

    try {
      // Validate company_id if specified
      if (options.company_id && backupData.company_id) {
        if (backupData.company_id !== options.company_id) {
          throw createError(
            ERROR_CODES.IMPORT_FAILED,
            `Backup company_id (${backupData.company_id}) does not match target company_id (${options.company_id})`,
            null,
            false,
          );
        }
      }
      // Detect conflicts before restoration
      const conflicts = await this.detectConflicts(backupData, options.company_id);
      
      // If conflicts exist and overwrite is not enabled, ask for confirmation
      if (conflicts.length > 0 && !options.overwriteExisting) {
        if (options.onConflict) {
          const shouldProceed = await options.onConflict({
            totalConflicts: conflicts.length,
            conflicts,
            backupMetadata: backupData.metadata,
          });
          if (!shouldProceed) {
            return {
              restored: result.restored,
              errors: [...result.errors, { type: "conflict", message: "Restore cancelled by user due to conflicts" }],
            };
          }
        }
      }

      // Restore branches first (if needed for mapping)
      if (options.restoreBranches && backupData.branches.length > 0 && options.company_id) {
        result.restored.branches = await this.restoreBranches(
          backupData.branches,
          options.company_id,
          options.branchMapping,
          options.overwriteExisting,
        );
      }

      // Restore bank accounts
      if (options.restoreBankAccounts && backupData.bank_accounts.length > 0 && options.company_id) {
        result.restored.bank_accounts = await this.restoreBankAccounts(
          backupData.bank_accounts,
          options.company_id,
          options.branchMapping,
          options.overwriteExisting,
        );
      }

      // Restore customers
      if (options.restoreCustomers && backupData.customers.length > 0 && options.company_id) {
        result.restored.customers = await this.restoreCustomers(
          backupData.customers,
          options.company_id,
          options.branchMapping,
          options.overwriteExisting,
        );
      }

      // Restore transactions
      if (options.restoreTransactions && backupData.transactions.length > 0 && options.company_id) {
        result.restored.transactions = await this.restoreTransactions(
          backupData.transactions,
          options.company_id,
          options.branchMapping,
          options.overwriteExisting,
        );
      }

      return result;
    } catch (error) {
      throw createError(
        ERROR_CODES.IMPORT_FAILED,
        "Failed to restore backup data",
        error,
        false,
      );
    }
  },

  // Generate backup filename
  generateBackupFilename(
    branchName?: string,
    format: "xlsx" | "json" = "xlsx",
  ): string {
    const timestamp = new Date().toISOString().split("T")[0];
    const time = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
    const branch = branchName ? `_${branchName.replace(/\s+/g, "_")}` : "";
    const extension = format === "json" ? "json" : "xlsx";

    return `backup${branch}_${timestamp}_${time}.${extension}`;
  },

  // Download backup file
  downloadBackup(blob: Blob, filename: string): void {
    downloadFile(blob, filename);
  },

  // Save backup to database
  async saveBackupToDatabase(
    backupData: BackupData,
    companyId: string,
    userId: string,
  ): Promise<{ data: any; error: string | null }> {
    try {
      // Compress backup data
      const compressed = await compressJSON(backupData);
      
      // Get included tables
      const includedTables = Object.keys(backupData).filter(
        key => Array.isArray(backupData[key as keyof BackupData])
      );
      
      // Save to database
      const { data, error } = await supabase
        .from('backup_history')
        .insert({
          company_id: companyId,
          backup_name: this.generateBackupFilename(undefined, 'json'),
          backup_data: compressed,
          included_tables: includedTables,
          is_compressed: true,
          compression_algorithm: 'base64',
          created_by: userId,
          backup_timestamp: new Date().toISOString(),
          backup_format: 'json',
          backup_version: backupData.version,
          total_customers: backupData.customers?.length || 0,
          total_transactions: backupData.transactions?.length || 0,
          total_bank_accounts: backupData.bank_accounts?.length || 0,
          total_branches: backupData.branches?.length || 0,
          is_restorable: true,
        })
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      // Cleanup old backups (keep only 30)
      await this.cleanupOldBackups(companyId);
      
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to save backup to database' 
      };
    }
  },

  // Load backup from database
  async loadBackupFromDatabase(
    backupId: string,
  ): Promise<{ data: BackupData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('backup_history')
        .select('backup_data, is_compressed')
        .eq('id', backupId)
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      // Decompress data
      const decompressed = data.is_compressed 
        ? await decompressJSON(data.backup_data)
        : data.backup_data;
      
      // Validate backup data structure
      this.validateBackupData(decompressed);
      
      return { data: decompressed as BackupData, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to load backup from database' 
      };
    }
  },

  // Cleanup old backups (keep only 30 most recent)
  async cleanupOldBackups(companyId: string): Promise<void> {
    try {
      const { data: backups } = await supabase
        .from('backup_history')
        .select('id')
        .eq('company_id', companyId)
        .order('backup_timestamp', { ascending: false });
      
      if (backups && backups.length > 30) {
        const toDelete = backups.slice(30);
        const ids = toDelete.map(b => b.id);
        
        await supabase
          .from('backup_history')
          .delete()
          .in('id', ids);
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      // Don't throw error, cleanup is not critical
    }
  },

  // Revert specific table from backup
  async revertTableFromBackup(
    backupId: string,
    tableName: string,
    options: {
      companyId: string;
      userId: string;
      restoreOnlyOwnChanges: boolean;
    },
  ): Promise<{ data: null; error: string | null }> {
    try {
      // Load backup data
      const { data: backupData, error: loadError } = await this.loadBackupFromDatabase(backupId);
      
      if (loadError || !backupData) {
        return { data: null, error: loadError || 'Failed to load backup data' };
      }
      
      // Get table data from backup
      const tableData = backupData[tableName as keyof BackupData];
      if (!Array.isArray(tableData)) {
        return { data: null, error: `Table ${tableName} not found in backup` };
      }
      
      // If restoreOnlyOwnChanges, filter by created_by/updated_by
      let dataToRestore = tableData;
      if (options.restoreOnlyOwnChanges) {
        dataToRestore = tableData.filter((record: any) => 
          record.created_by === options.userId || record.updated_by === options.userId
        );
      }
      
      // Restore table data based on table type
      switch (tableName) {
        case 'customers':
          await this.restoreCustomers(dataToRestore as any[], options.companyId);
          break;
        case 'transactions':
          await this.restoreTransactions(dataToRestore as any[], options.companyId);
          break;
        case 'bank_accounts':
          await this.restoreBankAccounts(dataToRestore as any[], options.companyId);
          break;
        case 'branches':
          await this.restoreBranches(dataToRestore as any[], options.companyId);
          break;
        default:
          return { data: null, error: `Unsupported table: ${tableName}` };
      }
      
      // Update restore metadata
      await supabase
        .from('backup_history')
        .update({
          restore_count: (await supabase
            .from('backup_history')
            .select('restore_count')
            .eq('id', backupId)
            .single()).data?.restore_count || 0 + 1,
          last_restored_at: new Date().toISOString(),
          last_restored_by: options.userId,
        })
        .eq('id', backupId);
      
      return { data: null, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to revert table from backup' 
      };
    }
  },

  // Helper: Restore customers
  async restoreCustomers(customers: any[], companyId: string, branchMapping?: Record<string, string>, overwriteExisting = false): Promise<number> {
    let restored = 0;
    for (const customer of customers) {
      try {
        const normalized = this.normalizeRestoreRecord(customer, companyId, branchMapping);
        const id = String(normalized.id ?? "");
        const { data: existing } = await databaseService.customers.getCustomerById(id);
        if (existing && overwriteExisting) {
          await databaseService.customers.updateCustomer(id, normalized);
          restored++;
        } else if (!existing) {
          const createPayload = { ...normalized };
          delete createPayload.id;
          await databaseService.customers.createCustomer(createPayload);
          restored++;
        }
      } catch (error) {
        console.error(`Failed to restore customer ${customer.id}:`, error);
      }
    }
    return restored;
  },

  // Helper: Restore transactions
  async restoreTransactions(transactions: any[], companyId: string, branchMapping?: Record<string, string>, overwriteExisting = false): Promise<number> {
    let restored = 0;
    for (const transaction of transactions) {
      try {
        const normalized = this.normalizeRestoreRecord(transaction, companyId, branchMapping);
        const id = String(normalized.id ?? "");
        const { data: existing } = await databaseService.transactions.getTransactionById(id);
        if (existing && overwriteExisting) {
          await databaseService.transactions.updateTransaction(id, normalized);
          restored++;
        } else if (!existing) {
          const createPayload = { ...normalized };
          delete createPayload.id;
          await databaseService.transactions.createTransaction(createPayload);
          restored++;
        }
      } catch (error) {
        console.error(`Failed to restore transaction ${transaction.id}:`, error);
      }
    }
    return restored;
  },

  // Helper: Restore bank accounts
  async restoreBankAccounts(accounts: any[], companyId: string, branchMapping?: Record<string, string>, overwriteExisting = false): Promise<number> {
    let restored = 0;
    for (const account of accounts) {
      try {
        const normalized = this.normalizeRestoreRecord(account, companyId, branchMapping);
        const id = String(normalized.id ?? "");
        const { data: existing } = await databaseService.bankAccounts.getBankAccount(id);
        if (existing && overwriteExisting) {
          await databaseService.bankAccounts.upsertBankAccount({ ...normalized, id });
          restored++;
        } else if (!existing) {
          const createPayload = { ...normalized };
          delete createPayload.id;
          await databaseService.bankAccounts.upsertBankAccount(createPayload);
          restored++;
        }
      } catch (error) {
        console.error(`Failed to restore bank account ${account.id}:`, error);
      }
    }
    return restored;
  },

  // Helper: Restore branches
  async restoreBranches(branches: any[], companyId: string, branchMapping?: Record<string, string>, overwriteExisting = false): Promise<number> {
    let restored = 0;
    for (const branch of branches) {
      try {
        const normalized = this.normalizeRestoreRecord(branch, companyId, branchMapping);
        const id = String(normalized.id ?? "");
        const { data: existing } = await databaseService.branches.getBranchById(id);
        if (existing && overwriteExisting) {
          await databaseService.branches.upsertBranch({ ...normalized, id });
          restored++;
        } else if (!existing) {
          const createPayload = { ...normalized };
          delete createPayload.id;
          await databaseService.branches.upsertBranch(createPayload);
          restored++;
        }
      } catch (error) {
        console.error(`Failed to restore branch ${branch.id}:`, error);
      }
    }
    return restored;
  },

  // Normalize a backup record for restoration into the active tenant.
  normalizeRestoreRecord(record: Record<string, unknown>, companyId: string, branchMapping?: Record<string, string>): Record<string, unknown> {
    const normalized = { ...record };
    normalized.company_id = companyId;
    delete normalized.created_at;
    delete normalized.updated_at;
    if (branchMapping && normalized.branch_id && typeof normalized.branch_id === "string") {
      normalized.branch_id = branchMapping[normalized.branch_id] ?? normalized.branch_id;
    }
    return normalized;
  },
};

// Recovery utilities
export const recoveryUtils = {
  // Validate backup before restoration
  validateBackupForRestoration(
    backupData: BackupData,
    targetCompanyId?: string,
    targetBranchId?: string,
  ): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check version compatibility
    if (backupData.version !== "1.0.0") {
      warnings.push(
        `Backup version ${backupData.version} may not be fully compatible with current system`,
      );
    }

    // Check if backup is from different company
    if (
      targetCompanyId &&
      backupData.company_id &&
      backupData.company_id !== targetCompanyId
    ) {
      errors.push(
        `Backup is from a different company (${backupData.company_id}). Cannot restore to company ${targetCompanyId}.`,
      );
    }

    // Check if backup is from different branch
    if (
      targetBranchId &&
      backupData.branch_id &&
      backupData.branch_id !== targetBranchId
    ) {
      warnings.push(
        "Backup is from a different branch. Data may need to be mapped to current branch.",
      );
    }

    // Check data integrity
    if (
      backupData.customers.length === 0 &&
      backupData.transactions.length === 0
    ) {
      errors.push("Backup contains no data to restore");
    }

    // Check for required relationships
    const customerIds = new Set(backupData.customers.map((c) => c.id));
    const bankAccountIds = new Set(backupData.bank_accounts.map((b) => b.id));
    const branchIds = new Set(backupData.branches.map((b) => b.id));

    // Check if transactions reference valid customers
    for (const transaction of backupData.transactions) {
      if (!customerIds.has(transaction.customer_id)) {
        warnings.push(
          `Transaction ${transaction.transaction_code} references non-existent customer ${transaction.customer_id}`,
        );
      }
      if (!bankAccountIds.has(transaction.bank_account_id)) {
        warnings.push(
          `Transaction ${transaction.transaction_code} references non-existent bank account ${transaction.bank_account_id}`,
        );
      }
    }

    // Check if customers reference valid branches
    for (const customer of backupData.customers) {
      if (customer.branch_id && !branchIds.has(customer.branch_id)) {
        warnings.push(
          `Customer ${customer.full_name} references non-existent branch ${customer.branch_id}`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  },

  // Create branch mapping for cross-branch restoration
  createBranchMapping(
    sourceBranches: Branch[],
    targetBranches: Branch[],
  ): Record<string, string> {
    const mapping: Record<string, string> = {};

    for (const sourceBranch of sourceBranches) {
      // Try to find matching branch by name
      const matchingBranch = targetBranches.find(
        (b) =>
          b.name.toLowerCase() === sourceBranch.name.toLowerCase() ||
          b.code.toLowerCase() === sourceBranch.code.toLowerCase(),
      );

      if (matchingBranch) {
        mapping[sourceBranch.id] = matchingBranch.id;
      }
    }

    return mapping;
  },
};

// Export all backup and recovery utilities
export default {
  backupService,
  recoveryUtils,
  defaultBackupOptions,
};
