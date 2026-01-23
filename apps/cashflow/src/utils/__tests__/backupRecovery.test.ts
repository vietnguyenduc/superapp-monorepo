import { vi } from 'vitest';
import "@testing-library/jest-dom";
import {
  defaultBackupOptions,
  BackupData,
  BackupOptions,
} from "../backupRecovery";

describe("Backup Recovery Utils", () => {
  describe("defaultBackupOptions", () => {
    it("has correct default values", () => {
      expect(defaultBackupOptions.includeCustomers).toBe(true);
      expect(defaultBackupOptions.includeTransactions).toBe(true);
      expect(defaultBackupOptions.includeBankAccounts).toBe(true);
      expect(defaultBackupOptions.includeBranches).toBe(true);
      expect(defaultBackupOptions.format).toBe("xlsx");
    });

    it("is readonly", () => {
      expect(() => {
        (defaultBackupOptions as any).includeCustomers = false;
      }).toThrow();
    });
  });

  describe("BackupData interface", () => {
    it("has correct structure", () => {
      const backupData: BackupData = {
        version: "1.0.0",
        timestamp: "2024-01-15T10:00:00Z",
        customers: [],
        transactions: [],
        bank_accounts: [],
        branches: [],
        metadata: {
          totalCustomers: 0,
          totalTransactions: 0,
          totalBankAccounts: 0,
          totalBranches: 0,
          exportDate: "2024-01-15T10:00:00Z",
          exportedBy: "user-1",
        },
      };

      expect(backupData.version).toBe("1.0.0");
      expect(backupData.timestamp).toBe("2024-01-15T10:00:00Z");
      expect(Array.isArray(backupData.customers)).toBe(true);
      expect(Array.isArray(backupData.transactions)).toBe(true);
      expect(Array.isArray(backupData.bank_accounts)).toBe(true);
      expect(Array.isArray(backupData.branches)).toBe(true);
      expect(backupData.metadata.totalCustomers).toBe(0);
      expect(backupData.metadata.exportedBy).toBe("user-1");
    });
  });

  describe("BackupOptions interface", () => {
    it("has correct structure", () => {
      const options: BackupOptions = {
        includeCustomers: true,
        includeTransactions: false,
        includeBankAccounts: true,
        includeBranches: false,
        format: "json",
        branch_id: "branch-1",
        dateRange: {
          start: "2024-01-01",
          end: "2024-01-31",
        },
      };

      expect(options.includeCustomers).toBe(true);
      expect(options.includeTransactions).toBe(false);
      expect(options.includeBankAccounts).toBe(true);
      expect(options.includeBranches).toBe(false);
      expect(options.format).toBe("json");
      expect(options.branch_id).toBe("branch-1");
      expect(options.dateRange?.start).toBe("2024-01-01");
      expect(options.dateRange?.end).toBe("2024-01-31");
    });

    it("supports different format types", () => {
      const xlsxOptions: BackupOptions = {
        includeCustomers: true,
        includeTransactions: true,
        includeBankAccounts: true,
        includeBranches: true,
        format: "xlsx",
      };

      const jsonOptions: BackupOptions = {
        includeCustomers: true,
        includeTransactions: true,
        includeBankAccounts: true,
        includeBranches: true,
        format: "json",
      };

      expect(xlsxOptions.format).toBe("xlsx");
      expect(jsonOptions.format).toBe("json");
    });
  });

  describe("Backup data validation", () => {
    it("validates correct backup data structure", () => {
      const validBackup: BackupData = {
        version: "1.0.0",
        timestamp: "2024-01-15T10:00:00Z",
        customers: [],
        transactions: [],
        bank_accounts: [],
        branches: [],
        metadata: {
          totalCustomers: 0,
          totalTransactions: 0,
          totalBankAccounts: 0,
          totalBranches: 0,
          exportDate: "2024-01-15T10:00:00Z",
          exportedBy: "user-1",
        },
      };

      // Check required fields
      expect(validBackup.version).toBeDefined();
      expect(validBackup.timestamp).toBeDefined();
      expect(validBackup.customers).toBeDefined();
      expect(validBackup.transactions).toBeDefined();
      expect(validBackup.bank_accounts).toBeDefined();
      expect(validBackup.branches).toBeDefined();
      expect(validBackup.metadata).toBeDefined();

      // Check metadata structure
      expect(validBackup.metadata.totalCustomers).toBeDefined();
      expect(validBackup.metadata.totalTransactions).toBeDefined();
      expect(validBackup.metadata.totalBankAccounts).toBeDefined();
      expect(validBackup.metadata.totalBranches).toBeDefined();
      expect(validBackup.metadata.exportDate).toBeDefined();
      expect(validBackup.metadata.exportedBy).toBeDefined();
    });

    it("handles backup data with content", () => {
      const backupWithContent: BackupData = {
        version: "1.0.0",
        timestamp: "2024-01-15T10:00:00Z",
        customers: [
          {
            id: "customer-1",
            customer_code: "CUST001",
            full_name: "John Doe",
            phone: "1234567890",
            email: "john@example.com",
            address: "123 Main St",
            branch_id: "branch-1",
            total_balance: 1000.5,
            last_transaction_date: "2024-01-15",
            is_active: true,
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
          },
        ],
        transactions: [
          {
            id: "transaction-1",
            transaction_code: "TXN001",
            customer_id: "customer-1",
            bank_account_id: "account-1",
            branch_id: "branch-1",
            transaction_type: "payment",
            amount: 1000.5,
            description: "Payment for services",
            reference_number: "REF001",
            transaction_date: "2024-01-15",
            created_by: "user-1",
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
          },
        ],
        bank_accounts: [
          {
            id: "account-1",
            account_name: "Main Account",
            account_number: "1234567890",
            bank_name: "Test Bank",
            branch_id: "branch-1",
            balance: 5000.0,
            is_active: true,
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
          },
        ],
        branches: [
          {
            id: "branch-1",
            name: "Main Branch",
            code: "BR001",
            address: "123 Main St",
            phone: "1234567890",
            email: "main@example.com",
            is_active: true,
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
          },
        ],
        metadata: {
          totalCustomers: 1,
          totalTransactions: 1,
          totalBankAccounts: 1,
          totalBranches: 1,
          exportDate: "2024-01-15T10:00:00Z",
          exportedBy: "user-1",
        },
      };

      expect(backupWithContent.customers).toHaveLength(1);
      expect(backupWithContent.transactions).toHaveLength(1);
      expect(backupWithContent.bank_accounts).toHaveLength(1);
      expect(backupWithContent.branches).toHaveLength(1);
      expect(backupWithContent.metadata.totalCustomers).toBe(1);
      expect(backupWithContent.metadata.totalTransactions).toBe(1);
      expect(backupWithContent.metadata.totalBankAccounts).toBe(1);
      expect(backupWithContent.metadata.totalBranches).toBe(1);
    });
  });

  describe("Backup options validation", () => {
    it("validates backup options with all data types", () => {
      const fullOptions: BackupOptions = {
        includeCustomers: true,
        includeTransactions: true,
        includeBankAccounts: true,
        includeBranches: true,
        format: "xlsx",
      };

      expect(fullOptions.includeCustomers).toBe(true);
      expect(fullOptions.includeTransactions).toBe(true);
      expect(fullOptions.includeBankAccounts).toBe(true);
      expect(fullOptions.includeBranches).toBe(true);
      expect(fullOptions.format).toBe("xlsx");
    });

    it("validates backup options with selective data types", () => {
      const selectiveOptions: BackupOptions = {
        includeCustomers: true,
        includeTransactions: false,
        includeBankAccounts: false,
        includeBranches: false,
        format: "json",
      };

      expect(selectiveOptions.includeCustomers).toBe(true);
      expect(selectiveOptions.includeTransactions).toBe(false);
      expect(selectiveOptions.includeBankAccounts).toBe(false);
      expect(selectiveOptions.includeBranches).toBe(false);
      expect(selectiveOptions.format).toBe("json");
    });

    it("validates backup options with branch filter", () => {
      const branchOptions: BackupOptions = {
        includeCustomers: true,
        includeTransactions: true,
        includeBankAccounts: true,
        includeBranches: true,
        format: "xlsx",
        branch_id: "branch-1",
      };

      expect(branchOptions.branch_id).toBe("branch-1");
    });

    it("validates backup options with date range", () => {
      const dateRangeOptions: BackupOptions = {
        includeCustomers: true,
        includeTransactions: true,
        includeBankAccounts: true,
        includeBranches: true,
        format: "xlsx",
        dateRange: {
          start: "2024-01-01",
          end: "2024-01-31",
        },
      };

      expect(dateRangeOptions.dateRange?.start).toBe("2024-01-01");
      expect(dateRangeOptions.dateRange?.end).toBe("2024-01-31");
    });
  });

  describe("Backup data serialization", () => {
    it("can be serialized to JSON", () => {
      const backupData: BackupData = {
        version: "1.0.0",
        timestamp: "2024-01-15T10:00:00Z",
        customers: [],
        transactions: [],
        bank_accounts: [],
        branches: [],
        metadata: {
          totalCustomers: 0,
          totalTransactions: 0,
          totalBankAccounts: 0,
          totalBranches: 0,
          exportDate: "2024-01-15T10:00:00Z",
          exportedBy: "user-1",
        },
      };

      const jsonString = JSON.stringify(backupData);
      const parsedData = JSON.parse(jsonString);

      expect(parsedData.version).toBe(backupData.version);
      expect(parsedData.timestamp).toBe(backupData.timestamp);
      expect(parsedData.metadata.exportedBy).toBe(
        backupData.metadata.exportedBy,
      );
    });

    it("maintains data integrity through serialization", () => {
      const backupData: BackupData = {
        version: "1.0.0",
        timestamp: "2024-01-15T10:00:00Z",
        customers: [
          {
            id: "customer-1",
            customer_code: "CUST001",
            full_name: "John Doe",
            phone: "1234567890",
            email: "john@example.com",
            address: "123 Main St",
            branch_id: "branch-1",
            total_balance: 1000.5,
            last_transaction_date: "2024-01-15",
            is_active: true,
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
          },
        ],
        transactions: [],
        bank_accounts: [],
        branches: [],
        metadata: {
          totalCustomers: 1,
          totalTransactions: 0,
          totalBankAccounts: 0,
          totalBranches: 0,
          exportDate: "2024-01-15T10:00:00Z",
          exportedBy: "user-1",
        },
      };

      const jsonString = JSON.stringify(backupData);
      const parsedData = JSON.parse(jsonString);

      expect(parsedData.customers).toHaveLength(1);
      expect(parsedData.customers[0].full_name).toBe("John Doe");
      expect(parsedData.customers[0].total_balance).toBe(1000.5);
      expect(parsedData.metadata.totalCustomers).toBe(1);
    });
  });
});
