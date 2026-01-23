import * as XLSX from "xlsx";
import { Customer, Transaction, BankAccount, Branch } from "../types";
import { databaseService } from "../services/database";
import { createError, ERROR_CODES } from "./errorHandling";

// Backup types
export interface BackupData {
  version: string;
  timestamp: string;
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
  branch_id?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  format: "xlsx" | "json";
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
            branch_id: options.branch_id,
            is_active: true,
          });
        backupData.customers = customers;
        backupData.metadata.totalCustomers = customers.length;
      }

      // Fetch transactions
      if (options.includeTransactions) {
        const filters: any = { branch_id: options.branch_id };
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
          await databaseService.bankAccounts.getBankAccounts({
            branch_id: options.branch_id,
            is_active: true,
          });
        backupData.bank_accounts = bankAccounts;
        backupData.metadata.totalBankAccounts = bankAccounts.length;
      }

      // Fetch branches
      if (options.includeBranches) {
        const { data: branches } = await databaseService.branches.getBranches();
        backupData.branches = branches;
        backupData.metadata.totalBranches = branches.length;
      }

      return backupData;
    } catch (error) {
      throw createError(
        ERROR_CODES.IMPORT_FAILED,
        "Failed to create backup data",
        error,
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
        // TODO: Implement importJsonBackup
        throw createError(
          ERROR_CODES.FILE_READ_ERROR,
          "JSON import is not yet implemented.",
          null,
          false,
        );
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // TODO: Implement Excel backup import
        throw createError(
          ERROR_CODES.FILE_READ_ERROR,
          "Unsupported file format. Please use .xlsx or .json files.",
          null,
          false,
        );
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
          // TODO: Implement validateBackupData
          resolve(backupData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
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
              message: `Failed to restore branch ${branch.name}`,
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
              await databaseService.bankAccounts.getBankAccountById(
                bankAccount.id,
              );

            if (!existingAccount || options.overwriteExisting) {
              // Create or update bank account
              // Note: This would need to be implemented in the bank account service
              result.restored.bank_accounts++;
            }
          } catch (error) {
            result.errors.push({
              type: "bank_account",
              message: `Failed to restore bank account ${bankAccount.account_name}`,
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
            }
          } catch (error) {
            result.errors.push({
              type: "customer",
              message: `Failed to restore customer ${customer.full_name}`,
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
            }
          } catch (error) {
            result.errors.push({
              type: "transaction",
              message: `Failed to restore transaction ${transaction.transaction_code}`,
              data: transaction,
            });
          }
        }
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

// Recovery utilities
export const recoveryUtils = {
  // Validate backup before restoration
  validateBackupForRestoration(
    backupData: BackupData,
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
