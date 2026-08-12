import * as XLSX from "xlsx";
import type { Customer, Transaction, BankAccount, Branch } from "../types";
import { databaseService } from "../services/database";
import { createError, ERROR_CODES } from "./errorHandling";
import { compressJSON, decompressJSON } from "./compression";
import { supabase } from "../services/supabase";

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
        "Không thể tạo dữ liệu sao lưu",
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
        "Không thể xuất file sao lưu",
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
          "Định dạng file không hỗ trợ. Vui lòng dùng file .xlsx hoặc .json.",
          null,
          false,
        );
      }
    } catch (error) {
      throw createError(
        ERROR_CODES.IMPORT_FAILED,
        "Không thể nhập file sao lưu",
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
            reject(new Error("Không thể đọc file"));
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

      reader.onerror = () => reject(new Error("Không thể đọc file"));
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
            reject(new Error("Không thể đọc file"));
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

      reader.onerror = () => reject(new Error("Không thể đọc file"));
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
      throw new Error("Cấu trúc dữ liệu sao lưu không hợp lệ");
    }

    if (!backupData.version || !backupData.timestamp) {
      throw new Error(
        "Dữ liệu sao lưu thiếu các trường bắt buộc (version, timestamp)",
      );
    }

    if (!backupData.metadata) {
      throw new Error("Dữ liệu sao lưu thiếu metadata");
    }

    // Validate arrays exist
    if (!Array.isArray(backupData.customers)) {
      throw new Error("Dữ liệu sao lưu thiếu danh sách khách hàng");
    }

    if (!Array.isArray(backupData.transactions)) {
      throw new Error("Dữ liệu sao lưu thiếu danh sách giao dịch");
    }

    if (!Array.isArray(backupData.bank_accounts)) {
      throw new Error("Dữ liệu sao lưu thiếu danh sách tài khoản ngân hàng");
    }

    if (!Array.isArray(backupData.branches)) {
      throw new Error("Dữ liệu sao lưu thiếu danh sách chi nhánh");
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
            `Mã công ty trong file sao lưu (${backupData.company_id}) không khớp với công ty đích (${options.company_id})`,
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
              errors: [...result.errors, { type: "conflict", message: "Đã hủy khôi phục do xung đột dữ liệu" }],
            };
          }
        }
      }

      // Restore branches first (if needed for mapping)
      if (options.restoreBranches && backupData.branches.length > 0) {
        for (const branch of backupData.branches) {
          try {
            // Check if branch already exists
            const { data: existingBranch } =
              await databaseService.branches.getBranchById(branch.id);

            if (!existingBranch || options.overwriteExisting) {
              // Create or update branch
              // Note: This would need to be implemented in the branch service
              result.restored.branches++;
            }
          } catch (error) {
            result.errors.push({
              type: "branch",
              message: `Không thể khôi phục chi nhánh ${branch.name}`,
              data: branch,
            });
          }
        }
      }

      // Restore bank accounts
      if (options.restoreBankAccounts && backupData.bank_accounts.length > 0) {
        for (const bankAccount of backupData.bank_accounts) {
          try {
            // Map branch ID if provided
            if (options.branchMapping && bankAccount.branch_id) {
              bankAccount.branch_id =
                options.branchMapping[bankAccount.branch_id] ||
                bankAccount.branch_id;
            }

            // Check if bank account already exists
            const { data: existingAccount } =
              await databaseService.bankAccounts.getBankAccount(
                bankAccount.id,
              );

            if (!existingAccount || options.overwriteExisting) {
              // Create or update bank account
              await databaseService.bankAccounts.upsertBankAccount(bankAccount);
              result.restored.bank_accounts++;
            }
          } catch (error) {
            result.errors.push({
              type: "bank_account",
              message: `Không thể khôi phục tài khoản ngân hàng ${bankAccount.account_name}`,
              data: bankAccount,
            });
          }
        }
      }

      // Restore customers
      if (options.restoreCustomers && backupData.customers.length > 0) {
        for (const customer of backupData.customers) {
          try {
            // Map branch ID if provided
            if (options.branchMapping && customer.branch_id) {
              customer.branch_id =
                options.branchMapping[customer.branch_id] || customer.branch_id;
            }

            // Check if customer already exists
            const { data: existingCustomer } =
              await databaseService.customers.getCustomerById(customer.id);

            if (!existingCustomer || options.overwriteExisting) {
              // Create or update customer
              if (existingCustomer) {
                await databaseService.customers.updateCustomer(
                  customer.id,
                  customer,
                );
              } else {
                await databaseService.customers.createCustomer(customer);
              }
              result.restored.customers++;
            } else {
              // Skip existing customer
              continue;
            }
          } catch (error) {
            result.errors.push({
              type: "customer",
              message: `Không thể khôi phục khách hàng ${customer.full_name}`,
              data: customer,
            });
          }
        }
      }

      // Restore transactions
      if (options.restoreTransactions && backupData.transactions.length > 0) {
        for (const transaction of backupData.transactions) {
          try {
            // Map branch ID if provided
            if (options.branchMapping && transaction.branch_id) {
              transaction.branch_id =
                options.branchMapping[transaction.branch_id] ||
                transaction.branch_id;
            }

            // Check if transaction already exists
            const { data: existingTransaction } =
              await databaseService.transactions.getTransactionById(
                transaction.id,
              );

            if (!existingTransaction || options.overwriteExisting) {
              // Create or update transaction
              if (existingTransaction) {
                await databaseService.transactions.updateTransaction(
                  transaction.id,
                  transaction,
                );
              } else {
                await databaseService.transactions.createTransaction(
                  transaction,
                );
              }
              result.restored.transactions++;
            } else {
              // Skip existing transaction
              continue;
            }
          } catch (error) {
            result.errors.push({
              type: "transaction",
              message: `Không thể khôi phục giao dịch ${transaction.transaction_code}`,
              data: transaction,
            });
          }
        }
      }

      return result;
    } catch (error) {
      throw createError(
        ERROR_CODES.IMPORT_FAILED,
        "Khôi phục dữ liệu sao lưu thất bại",
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        error: error instanceof Error ? error.message : 'Không thể lưu sao lưu vào cơ sở dữ liệu' 
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
        return { data: null, error: loadError || 'Không thể tải dữ liệu sao lưu' };
      }
      
      // Get table data from backup
      const tableData = backupData[tableName as keyof BackupData];
      if (!Array.isArray(tableData)) {
        return { data: null, error: `Không tìm thấy bảng ${tableName} trong file sao lưu` };
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
          return { data: null, error: `Không hỗ trợ bảng: ${tableName}` };
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
        error: error instanceof Error ? error.message : 'Không thể hoàn tác bảng từ file sao lưu' 
      };
    }
  },

  // Helper: Restore customers
  async restoreCustomers(customers: any[], companyId: string): Promise<void> {
    for (const customer of customers) {
      try {
        const { data: existing } = await databaseService.customers.getCustomerById(customer.id);
        if (existing) {
          await databaseService.customers.updateCustomer(customer.id, customer);
        } else {
          await databaseService.customers.createCustomer(customer);
        }
      } catch (error) {
        console.error(`Không thể khôi phục khách hàng ${customer.id}:`, error);
      }
    }
  },

  // Helper: Restore transactions
  async restoreTransactions(transactions: any[], companyId: string): Promise<void> {
    for (const transaction of transactions) {
      try {
        const { data: existing } = await databaseService.transactions.getTransactionById(transaction.id);
        if (existing) {
          await databaseService.transactions.updateTransaction(transaction.id, transaction);
        } else {
          await databaseService.transactions.createTransaction(transaction);
        }
      } catch (error) {
        console.error(`Không thể khôi phục giao dịch ${transaction.id}:`, error);
      }
    }
  },

  // Helper: Restore bank accounts
  async restoreBankAccounts(accounts: any[], companyId: string): Promise<void> {
    for (const account of accounts) {
      try {
        await databaseService.bankAccounts.upsertBankAccount(account);
      } catch (error) {
        console.error(`Không thể khôi phục tài khoản ngân hàng ${account.id}:`, error);
      }
    }
  },

  // Helper: Restore branches
  async restoreBranches(branches: any[], companyId: string): Promise<void> {
    for (const branch of branches) {
      try {
        const { data: existing } = await databaseService.branches.getBranchById(branch.id);
        if (existing) {
          // Update branch (would need to implement updateBranch in service)
          console.log(`Chi nhánh ${branch.id} đã tồn tại, bỏ qua`);
        } else {
          // Create branch (would need to implement createBranch in service)
          console.log(`Đang tạo chi nhánh ${branch.id}`);
        }
      } catch (error) {
        console.error(`Không thể khôi phục chi nhánh ${branch.id}:`, error);
      }
    }
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
        `Phiên bản sao lưu ${backupData.version} có thể không tương thích hoàn toàn với hệ thống hiện tại`,
      );
    }

    // Check if backup is from different company
    if (
      targetCompanyId &&
      backupData.company_id &&
      backupData.company_id !== targetCompanyId
    ) {
      errors.push(
        `File sao lưu từ công ty khác (${backupData.company_id}). Không thể khôi phục sang công ty ${targetCompanyId}.`,
      );
    }

    // Check if backup is from different branch
    if (
      targetBranchId &&
      backupData.branch_id &&
      backupData.branch_id !== targetBranchId
    ) {
      warnings.push(
        "File sao lưu từ chi nhánh khác. Có thể cần ánh xạ lại dữ liệu về chi nhánh hiện tại.",
      );
    }

    // Check data integrity
    if (
      backupData.customers.length === 0 &&
      backupData.transactions.length === 0
    ) {
      errors.push("File sao lưu không có dữ liệu để khôi phục");
    }

    // Check for required relationships
    const customerIds = new Set(backupData.customers.map((c) => c.id));
    const bankAccountIds = new Set(backupData.bank_accounts.map((b) => b.id));
    const branchIds = new Set(backupData.branches.map((b) => b.id));

    // Check if transactions reference valid customers
    for (const transaction of backupData.transactions) {
      if (!customerIds.has(transaction.customer_id)) {
        warnings.push(
          `Giao dịch ${transaction.transaction_code} tham chiếu đến khách hàng không tồn tại ${transaction.customer_id}`,
        );
      }
      if (!bankAccountIds.has(transaction.bank_account_id)) {
        warnings.push(
          `Giao dịch ${transaction.transaction_code} tham chiếu đến tài khoản ngân hàng không tồn tại ${transaction.bank_account_id}`,
        );
      }
    }

    // Check if customers reference valid branches
    for (const customer of backupData.customers) {
      if (customer.branch_id && !branchIds.has(customer.branch_id)) {
        warnings.push(
          `Khách hàng ${customer.full_name} tham chiếu đến chi nhánh không tồn tại ${customer.branch_id}`,
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
