// Mock data for dashboard metrics
export const dashboardMockData = {
  // Transaction counts by time range
  transactionCounts: {
    day: 5,
    week: 25,
    month: 100,
    quarter: 300,
    year: 1200,
  },

  // Previous period transaction counts
  previousTransactionCounts: {
    day: 3, // 3 transactions from previous day
    week: 20, // 20 transactions from previous week
    month: 85, // 85 transactions from previous month
    quarter: 250, // 250 transactions from previous quarter
    year: 1000, // 1000 transactions from previous year
  },

  // Transaction amounts by time range (in VND)
  transactionAmounts: {
    day: 7500000, // 7.5M VND (2M + 5.5M)
    week: 37500000, // 37.5M VND (10M + 27.5M)
    month: 150000000, // 150M VND (40M + 110M)
    quarter: 450000000, // 450M VND (120M + 330M)
    year: 1800000000, // 1.8B VND (480M + 1320M)
  },

  // Income amounts by time range
  incomeAmounts: {
    day: 2000000, // 2M VND income
    week: 10000000, // 10M VND income
    month: 40000000, // 40M VND income
    quarter: 120000000, // 120M VND income
    year: 480000000, // 480M VND income
  },

  // Previous period income amounts
  previousIncomeAmounts: {
    day: 1200000, // 1.2M VND income from previous day
    week: 6000000, // 6M VND income from previous week
    month: 24000000, // 24M VND income from previous month
    quarter: 72000000, // 72M VND income from previous quarter
    year: 288000000, // 288M VND income from previous year
  },

  // Debt amounts by time range
  debtAmounts: {
    day: 5500000, // 5.5M VND debt
    week: 27500000, // 27.5M VND debt
    month: 110000000, // 110M VND debt
    quarter: 330000000, // 330M VND debt
    year: 1320000000, // 1.32B VND debt
  },

  // Previous period debt amounts
  previousDebtAmounts: {
    day: 3300000, // 3.3M VND debt from previous day
    week: 16500000, // 16.5M VND debt from previous week
    month: 66000000, // 66M VND debt from previous month
    quarter: 198000000, // 198M VND debt from previous quarter
    year: 792000000, // 792M VND debt from previous year
  },

  // Outstanding balances by time range
  outstandingBalances: {
    day: 150000000, // 150M VND current debt
    week: 180000000, // 180M VND
    month: 220000000, // 220M VND
    quarter: 280000000, // 280M VND
    year: 350000000, // 350M VND
  },

  // Previous period outstanding balances
  previousOutstandingBalances: {
    day: 145000000, // 145M VND from previous day
    week: 170000000, // 170M VND from previous week
    month: 210000000, // 210M VND from previous month
    quarter: 260000000, // 260M VND from previous quarter
    year: 320000000, // 320M VND from previous year
  },

  // Active customers by time range
  activeCustomers: {
    day: 3, // 3 customers with transactions in the day
    week: 6, // 6 customers with transactions in the week
    month: 8, // 8 customers with transactions in the month
    quarter: 8, // 8 customers with transactions in the quarter
    year: 8, // 8 customers with transactions in the year
  },

  // Previous period active customers
  previousActiveCustomers: {
    day: 2, // 2 customers from previous day
    week: 5, // 5 customers from previous week
    month: 7, // 7 customers from previous month
    quarter: 7, // 7 customers from previous quarter
    year: 7, // 7 customers from previous year
  },

  // Bank accounts data
  bankAccounts: [
    {
      id: "1",
      name: "Vietcombank - TK Chính",
      balance: 150000000,
    },
    {
      id: "2",
      name: "BIDV - TK Thanh toán",
      balance: 85000000,
    },
    {
      id: "3",
      name: "Techcombank - TK Tiết kiệm",
      balance: 200000000,
    },
    {
      id: "4",
      name: "ACB - TK Vốn lưu động",
      balance: 75000000,
    },
    {
      id: "5",
      name: "MB Bank - TK Dự phòng",
      balance: 50000000,
    },
  ],

  // Transaction amounts by branch for each time range
  transactionAmountsByBranch: {
    day: [
      {
        branch_id: "1",
        branch_name: "Văn phòng Hà Nội",
        incomeAmount: 800000, // 0.8M VND income
        debtAmount: 2200000, // 2.2M VND debt
      },
      {
        branch_id: "2",
        branch_name: "Văn phòng TP.HCM",
        incomeAmount: 1000000, // 1M VND income
        debtAmount: 2500000, // 2.5M VND debt
      },
      {
        branch_id: "3",
        branch_name: "Văn phòng Đà Nẵng",
        incomeAmount: 200000, // 0.2M VND income
        debtAmount: 800000, // 0.8M VND debt
      },
    ],
    week: [
      {
        branch_id: "1",
        branch_name: "Văn phòng Hà Nội",
        incomeAmount: 4000000, // 4M VND income
        debtAmount: 11000000, // 11M VND debt
      },
      {
        branch_id: "2",
        branch_name: "Văn phòng TP.HCM",
        incomeAmount: 5000000, // 5M VND income
        debtAmount: 12500000, // 12.5M VND debt
      },
      {
        branch_id: "3",
        branch_name: "Văn phòng Đà Nẵng",
        incomeAmount: 1000000, // 1M VND income
        debtAmount: 4000000, // 4M VND debt
      },
    ],
    month: [
      {
        branch_id: "1",
        branch_name: "Văn phòng Hà Nội",
        incomeAmount: 16000000, // 16M VND income
        debtAmount: 44000000, // 44M VND debt
      },
      {
        branch_id: "2",
        branch_name: "Văn phòng TP.HCM",
        incomeAmount: 20000000, // 20M VND income
        debtAmount: 50000000, // 50M VND debt
      },
      {
        branch_id: "3",
        branch_name: "Văn phòng Đà Nẵng",
        incomeAmount: 4000000, // 4M VND income
        debtAmount: 16000000, // 16M VND debt
      },
    ],
    quarter: [
      {
        branch_id: "1",
        branch_name: "Văn phòng Hà Nội",
        incomeAmount: 48000000, // 48M VND income
        debtAmount: 132000000, // 132M VND debt
      },
      {
        branch_id: "2",
        branch_name: "Văn phòng TP.HCM",
        incomeAmount: 60000000, // 60M VND income
        debtAmount: 150000000, // 150M VND debt
      },
      {
        branch_id: "3",
        branch_name: "Văn phòng Đà Nẵng",
        incomeAmount: 12000000, // 12M VND income
        debtAmount: 48000000, // 48M VND debt
      },
    ],
    year: [
      {
        branch_id: "1",
        branch_name: "Văn phòng Hà Nội",
        incomeAmount: 192000000, // 192M VND income
        debtAmount: 528000000, // 528M VND debt
      },
      {
        branch_id: "2",
        branch_name: "Văn phòng TP.HCM",
        incomeAmount: 240000000, // 240M VND income
        debtAmount: 600000000, // 600M VND debt
      },
      {
        branch_id: "3",
        branch_name: "Văn phòng Đà Nẵng",
        incomeAmount: 48000000, // 48M VND income
        debtAmount: 192000000, // 192M VND debt
      },
    ],
  },

  // Recent transactions for display
  recentTransactions: [
    {
      id: "1",
      transaction_code: "TXN0001",
      customer_id: "1",
      customer_name: "Công ty TNHH ABC",
      bank_account_id: "1",
      bank_account_name: "Vietcombank - TK Chính",
      branch_id: "1",
      transaction_type: "payment",
      amount: 15000000,
      description: "Thanh toán nợ tháng 1",
      reference_number: "REF001",
      transaction_date: "2024-01-28T14:30:00Z",
      created_by: "test-user",
      created_at: "2024-01-28T14:30:00Z",
      updated_at: "2024-01-28T14:30:00Z",
    },
    {
      id: "2",
      transaction_code: "TXN0002",
      customer_id: "2",
      customer_name: "Công ty CP XYZ",
      bank_account_id: "2",
      bank_account_name: "BIDV - TK Thanh toán",
      branch_id: "2",
      transaction_type: "charge",
      amount: 25000000,
      description: "Cho vay mua hàng",
      reference_number: "REF002",
      transaction_date: "2024-01-28T10:15:00Z",
      created_by: "test-user",
      created_at: "2024-01-28T10:15:00Z",
      updated_at: "2024-01-28T10:15:00Z",
    },
    {
      id: "3",
      transaction_code: "TXN0003",
      customer_id: "3",
      customer_name: "Công ty TNHH DEF",
      bank_account_id: "3",
      bank_account_name: "Techcombank - TK Tiết kiệm",
      branch_id: "3",
      transaction_type: "payment",
      amount: 8000000,
      description: "Thanh toán một phần",
      reference_number: "REF003",
      transaction_date: "2024-01-28T09:45:00Z",
      created_by: "test-user",
      created_at: "2024-01-28T09:45:00Z",
      updated_at: "2024-01-28T09:45:00Z",
    },
  ],

  // Top customers for display
  topCustomers: [
    {
      id: "1",
      customer_code: "CUST0001",
      full_name: "Công ty TNHH ABC",
      phone: "0123456789",
      email: "info@abc.com.vn",
      total_balance: -85000000, // 85M VND debt
      last_transaction_date: "2024-01-28T14:30:00Z",
    },
    {
      id: "2",
      customer_code: "CUST0002",
      full_name: "Công ty CP XYZ",
      phone: "0987654321",
      email: "contact@xyz.com.vn",
      total_balance: -72000000, // 72M VND debt
      last_transaction_date: "2024-01-28T10:15:00Z",
    },
    {
      id: "3",
      customer_code: "CUST0003",
      full_name: "Công ty TNHH DEF",
      phone: "0369852147",
      email: "hello@def.com.vn",
      total_balance: -65000000, // 65M VND debt
      last_transaction_date: "2024-01-28T09:45:00Z",
    },
  ],
};
