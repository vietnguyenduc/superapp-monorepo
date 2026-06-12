import { dashboardService } from "./dashboardService";
// Trigger Vite HMR
import { customerService } from "./customerService";
import { transactionService } from "./transactionService";
import { transactionTypeService } from "./transactionTypeService";
import { branchService } from "./branchService";
import { bankAccountService } from "./bankAccountService";
import { reportService } from "./reportService";
import { userService } from "./user-service";
import { colorSettingsService } from "./colorSettingsService";
import { backupHistoryService } from "./backupHistoryService";

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

export type { Customer, Transaction, BankAccount, TransactionType, Branch, TimeRange, CashFlowData } from "../types";
