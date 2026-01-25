// Mock services for cashflow app
import { generateSampleCashFlowData } from "./sampleData";
import { dashboardMockData } from "./mockData";

// Dashboard service
const dashboardService = {
  async getDashboardMetrics(
    _branchId?: string,
    timeRange: "day" | "week" | "month" | "quarter" | "year" = "month",
  ) {
    // Get sample data for cash flow
    const sampleData = generateSampleCashFlowData();
    
    // Get the appropriate cash flow data based on the time range
    let cashFlowData;
    switch (timeRange) {
      case "day":
        cashFlowData = sampleData.dailyData.slice(-30); // Last 30 days
        break;
      case "week":
        cashFlowData = sampleData.weeklyData;
        break;
      case "quarter":
        cashFlowData = sampleData.quarterlyData;
        break;
      case "year":
        cashFlowData = sampleData.yearlyData;
        break;
      case "month":
      default:
        cashFlowData = sampleData.dailyData.slice(-30); // Default to last 30 days
        break;
    }

    // Calculate changes based on previous period
    const transactionChanges = {
      day: dashboardMockData.transactionCounts.day - dashboardMockData.previousTransactionCounts.day,
      week: dashboardMockData.transactionCounts.week - dashboardMockData.previousTransactionCounts.week,
      month: dashboardMockData.transactionCounts.month - dashboardMockData.previousTransactionCounts.month,
      quarter: dashboardMockData.transactionCounts.quarter - dashboardMockData.previousTransactionCounts.quarter,
      year: dashboardMockData.transactionCounts.year - dashboardMockData.previousTransactionCounts.year,
    };

    // Calculate income changes based on previous period
    const incomeChanges = {
      day: dashboardMockData.incomeAmounts.day - dashboardMockData.previousIncomeAmounts.day,
      week: dashboardMockData.incomeAmounts.week - dashboardMockData.previousIncomeAmounts.week,
      month: dashboardMockData.incomeAmounts.month - dashboardMockData.previousIncomeAmounts.month,
      quarter: dashboardMockData.incomeAmounts.quarter - dashboardMockData.previousIncomeAmounts.quarter,
      year: dashboardMockData.incomeAmounts.year - dashboardMockData.previousIncomeAmounts.year,
    };

    // Calculate debt changes based on previous period
    const debtChanges = {
      day: dashboardMockData.debtAmounts.day - dashboardMockData.previousDebtAmounts.day,
      week: dashboardMockData.debtAmounts.week - dashboardMockData.previousDebtAmounts.week,
      month: dashboardMockData.debtAmounts.month - dashboardMockData.previousDebtAmounts.month,
      quarter: dashboardMockData.debtAmounts.quarter - dashboardMockData.previousDebtAmounts.quarter,
      year: dashboardMockData.debtAmounts.year - dashboardMockData.previousDebtAmounts.year,
    };

    // Calculate outstanding changes based on previous period
    const outstandingChanges = {
      day: dashboardMockData.outstandingBalances.day - dashboardMockData.previousOutstandingBalances.day,
      week: dashboardMockData.outstandingBalances.week - dashboardMockData.previousOutstandingBalances.week,
      month: dashboardMockData.outstandingBalances.month - dashboardMockData.previousOutstandingBalances.month,
      quarter: dashboardMockData.outstandingBalances.quarter - dashboardMockData.previousOutstandingBalances.quarter,
      year: dashboardMockData.outstandingBalances.year - dashboardMockData.previousOutstandingBalances.year,
    };

    // Calculate active customers changes based on previous period
    const activeCustomersChanges = {
      day: dashboardMockData.activeCustomers.day - dashboardMockData.previousActiveCustomers.day,
      week: dashboardMockData.activeCustomers.week - dashboardMockData.previousActiveCustomers.week,
      month: dashboardMockData.activeCustomers.month - dashboardMockData.previousActiveCustomers.month,
      quarter: dashboardMockData.activeCustomers.quarter - dashboardMockData.previousActiveCustomers.quarter,
      year: dashboardMockData.activeCustomers.year - dashboardMockData.previousActiveCustomers.year,
    };

    // Return the dashboard metrics
    return {
      data: {
        totalOutstanding: dashboardMockData.outstandingBalances[timeRange],
        totalOutstandingChange: outstandingChanges[timeRange],
        activeCustomers: dashboardMockData.activeCustomers[timeRange],
        activeCustomersChange: activeCustomersChanges[timeRange],
        transactionPaymentCount: Math.floor(dashboardMockData.transactionCounts[timeRange] / 2),
        transactionChargeCount: Math.ceil(dashboardMockData.transactionCounts[timeRange] / 2),
        transactionPaymentChange: Math.floor(transactionChanges[timeRange] / 2),
        transactionChargeChange: Math.ceil(transactionChanges[timeRange] / 2),
        transactionIncomeInPeriod: dashboardMockData.incomeAmounts[timeRange],
        transactionDebtInPeriod: dashboardMockData.debtAmounts[timeRange],
        transactionIncomeChange: incomeChanges[timeRange],
        transactionDebtChange: debtChanges[timeRange],
        balanceByBankAccount: dashboardMockData.bankAccounts,
        cashFlowData: cashFlowData,
        transactionAmountsByBranch: dashboardMockData.transactionAmountsByBranch[timeRange],
        recentTransactions: dashboardMockData.recentTransactions,
        topCustomers: dashboardMockData.topCustomers,
      },
      error: null,
    };
  }
};

// Customer service
const customerService = {
  async getCustomers(_filters?: any) {
    return {
      data: dashboardMockData.topCustomers.map(customer => ({
        ...customer,
        address: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
        branch_id: null,
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      })),
      error: null,
      count: dashboardMockData.topCustomers.length,
    };
  },
  
  async getCustomerById(id: string) {
    const customer = dashboardMockData.topCustomers.find(c => c.id === id);
    
    if (!customer) {
      return {
        data: null,
        error: "Customer not found",
      };
    }

    return {
      data: {
        ...customer,
        address: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
        branch_id: null,
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      error: null,
    };
  },
  
  async createCustomer(_customerData?: any) {
    return { data: null, error: null };
  },
  
  async updateCustomer(_id: string, _updates?: any) {
    return { data: null, error: null };
  },
  
  async deleteCustomer(_id: string) {
    return { error: null };
  },
  
  async bulkCreateCustomers(_customers?: any[]) {
    return { data: [], errors: [] };
  },
};

// Transaction service
const transactionService = {
  async getTransactions(_filters?: any) {
    return {
      data: dashboardMockData.recentTransactions,
      error: null,
      count: dashboardMockData.recentTransactions.length,
    };
  },
  
  async getTransactionById(id: string) {
    const transaction = dashboardMockData.recentTransactions.find(t => t.id === id);
    
    if (!transaction) {
      return {
        data: {
          id: "1",
          transaction_code: "TXN0001",
          customer_id: "1",
          bank_account_id: "1",
          branch_id: "1",
          transaction_type: "payment" as const,
          amount: 500,
          description: "Test payment",
          reference_number: "REF123",
          transaction_date: "2024-01-01T00:00:00Z",
          created_by: "test-user",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        error: null,
      };
    }
    
    return {
      data: transaction,
      error: null,
    };
  },
  
  async createTransaction(_transactionData?: any) {
    return { data: null, error: null };
  },
  
  async updateTransaction(_id: string, _updates?: any) {
    return { data: null, error: null };
  },
  
  async deleteTransaction(_id: string) {
    return { error: null };
  },
  
  async bulkImportTransactions(
    _rawData?: any[],
    _branchId?: string,
    _createdBy?: string,
  ) {
    return { data: [], errors: [] };
  },
};

// Bank account service
const bankAccountService = {
  async getBankAccounts(_filters?: any) {
    return {
      data: dashboardMockData.bankAccounts.map(account => ({
        id: account.id,
        account_number: `ACCT${account.id}`,
        account_name: account.name,
        bank_name: account.name.split(' - ')[0],
        branch_id: "1",
        balance: account.balance,
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      })),
      error: null,
    };
  },
  
  async getBankAccountById(id: string) {
    const account = dashboardMockData.bankAccounts.find(a => a.id === id);
    
    if (!account) {
      return {
        data: {
          id: "1",
          account_number: "123456",
          account_name: "Test Bank",
          bank_name: "Test Bank",
          branch_id: "1",
          balance: 1000,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        error: null,
      };
    }
    
    return {
      data: {
        id: account.id,
        account_number: `ACCT${account.id}`,
        account_name: account.name,
        bank_name: account.name.split(' - ')[0],
        branch_id: "1",
        balance: account.balance,
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      error: null,
    };
  },
};

// Branch service
const branchService = {
  async getBranches() {
    return {
      data: dashboardMockData.transactionAmountsByBranch.day.map(branch => ({
        id: branch.branch_id,
        name: branch.branch_name,
        code: `BR${branch.branch_id}`,
        address: `${branch.branch_id}23 Đường chính, Quận 1, TP.HCM`,
        phone: `01234${branch.branch_id}789`,
        email: `${branch.branch_name.toLowerCase().replace(/\s+/g, '')}@branch.com`,
        manager_id: "test-user",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      })),
      error: null,
    };
  },
  
  async getBranchById(id: string) {
    const branch = dashboardMockData.transactionAmountsByBranch.day.find(b => b.branch_id === id);
    
    if (!branch) {
      return {
        data: {
          id: "1",
          name: "Main Branch",
          code: "MB001",
          address: "123 Main St",
          phone: "0123456789",
          email: "main@branch.com",
          manager_id: "test-user",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        error: null,
      };
    }
    
    return {
      data: {
        id: branch.branch_id,
        name: branch.branch_name,
        code: `BR${branch.branch_id}`,
        address: `${branch.branch_id}23 Đường chính, Quận 1, TP.HCM`,
        phone: `01234${branch.branch_id}789`,
        email: `${branch.branch_name.toLowerCase().replace(/\s+/g, '')}@branch.com`,
        manager_id: "test-user",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      error: null,
    };
  },
};

// Export all services as a single object to match the import in Dashboard.tsx
export const databaseService = {
  dashboard: dashboardService,
  customers: customerService,
  transactions: transactionService,
  bankAccounts: bankAccountService,
  branches: branchService
};
