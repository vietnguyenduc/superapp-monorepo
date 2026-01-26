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

  // Outstanding balances by time range (negative values represent receivables)
  outstandingBalances: {
    day: -150000000, // -150M VND current receivables
    week: -180000000, // -180M VND
    month: -180000000, // -180M VND
    quarter: -180000000, // -180M VND
    year: -180000000, // -180M VND
  },

  // Previous period outstanding balances (negative values represent receivables)
  previousOutstandingBalances: {
    day: -170000000, // -170M VND from previous day
    week: -190000000, // -190M VND from previous week
    month: -190000000, // -190M VND from previous month
    quarter: -190000000, // -190M VND from previous quarter
    year: -190000000, // -190M VND from previous year
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
      account_name: "Vietcombank - TK Chính",
      account_number: "1001234567",
      balance: 150000000,
      historical_data: [140000000, 145000000, 148000000, 150000000]
    },
    {
      id: "2",
      account_name: "BIDV - TK Thanh toán",
      account_number: "31012345678",
      balance: 85000000,
      historical_data: [75000000, 78000000, 82000000, 85000000]
    },
    {
      id: "3",
      account_name: "Techcombank - TK Tiết kiệm",
      account_number: "19001234567",
      balance: 200000000,
      historical_data: [180000000, 185000000, 195000000, 200000000]
    },
    {
      id: "4",
      account_name: "ACB - TK Vốn lưu động",
      account_number: "22012345678",
      balance: 75000000,
      historical_data: [65000000, 68000000, 72000000, 75000000]
    },
    {
      id: "5",
      account_name: "MB Bank - TK Dự phòng",
      account_number: "0001234567",
      balance: 50000000,
      historical_data: [45000000, 47000000, 49000000, 50000000]
    },
    {
      id: "6",
      account_name: "VPBank - TK Đầu tư",
      account_number: "0901234567",
      balance: 120000000,
      historical_data: [100000000, 105000000, 115000000, 120000000]
    },
    {
      id: "7",
      account_name: "TPBank - TK Doanh nghiệp",
      account_number: "0801234567",
      balance: 95000000,
      historical_data: [85000000, 88000000, 92000000, 95000000]
    },
    {
      id: "8",
      account_name: "Sacombank - TK Phát triển",
      account_number: "0601234567",
      balance: 110000000,
      historical_data: [95000000, 100000000, 105000000, 110000000]
    },
  ],

  // Transaction amounts by branch for each time range
  transactionAmountsByBranch: {
    day: [
      {
        branch_id: "1",
        branch_name: "Chi nhánh Hà Nội",
        incomeAmount: 800000, // 0.8M VND income
        debtAmount: 2200000, // 2.2M VND debt
      },
      {
        branch_id: "2",
        branch_name: "Chi nhánh TP.HCM",
        incomeAmount: 1000000, // 1M VND income
        debtAmount: 2500000, // 2.5M VND debt
      },
      {
        branch_id: "3",
        branch_name: "Chi nhánh Đà Nẵng",
        incomeAmount: 200000, // 0.2M VND income
        debtAmount: 800000, // 0.8M VND debt
      },
    ],
    week: [
      {
        branch_id: "1",
        branch_name: "Chi nhánh Hà Nội",
        incomeAmount: 4000000, // 4M VND income
        debtAmount: 11000000, // 11M VND debt
      },
      {
        branch_id: "2",
        branch_name: "Chi nhánh TP.HCM",
        incomeAmount: 5000000, // 5M VND income
        debtAmount: 12500000, // 12.5M VND debt
      },
      {
        branch_id: "3",
        branch_name: "Chi nhánh Đà Nẵng",
        incomeAmount: 1000000, // 1M VND income
        debtAmount: 4000000, // 4M VND debt
      },
    ],
    month: [
      {
        branch_id: "1",
        branch_name: "Chi nhánh Hà Nội",
        incomeAmount: 16000000, // 16M VND income
        debtAmount: 44000000, // 44M VND debt
      },
      {
        branch_id: "2",
        branch_name: "Chi nhánh TP.HCM",
        incomeAmount: 20000000, // 20M VND income
        debtAmount: 50000000, // 50M VND debt
      },
      {
        branch_id: "3",
        branch_name: "Chi nhánh Đà Nẵng",
        incomeAmount: 4000000, // 4M VND income
        debtAmount: 16000000, // 16M VND debt
      },
    ],
    quarter: [
      {
        branch_id: "1",
        branch_name: "Chi nhánh Hà Nội",
        incomeAmount: 48000000, // 48M VND income
        debtAmount: 132000000, // 132M VND debt
      },
      {
        branch_id: "2",
        branch_name: "Chi nhánh TP.HCM",
        incomeAmount: 60000000, // 60M VND income
        debtAmount: 150000000, // 150M VND debt
      },
      {
        branch_id: "3",
        branch_name: "Chi nhánh Đà Nẵng",
        incomeAmount: 12000000, // 12M VND income
        debtAmount: 48000000, // 48M VND debt
      },
    ],
    year: [
      {
        branch_id: "1",
        branch_name: "Chi nhánh Hà Nội",
        incomeAmount: 192000000, // 192M VND income
        debtAmount: 528000000, // 528M VND debt
      },
      {
        branch_id: "2",
        branch_name: "Chi nhánh TP.HCM",
        incomeAmount: 240000000, // 240M VND income
        debtAmount: 600000000, // 600M VND debt
      },
      {
        branch_id: "3",
        branch_name: "Chi nhánh Đà Nẵng",
        incomeAmount: 48000000, // 48M VND income
        debtAmount: 192000000, // 192M VND debt
      },
    ],
  },

  // Recent transactions for display - expanded to 15 transactions with historical data
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
    {
      id: "4",
      transaction_code: "TXN0004",
      customer_id: "4",
      customer_name: "Công ty TNHH Global Tech",
      bank_account_id: "4",
      bank_account_name: "ACB - TK Vốn lưu động",
      branch_id: "1",
      transaction_type: "payment",
      amount: 12000000,
      description: "Thanh toán đợt 1",
      reference_number: "REF004",
      transaction_date: "2024-01-27T15:20:00Z",
      created_by: "test-user",
      created_at: "2024-01-27T15:20:00Z",
      updated_at: "2024-01-27T15:20:00Z",
    },
    {
      id: "5",
      transaction_code: "TXN0005",
      customer_id: "5",
      customer_name: "Công ty CP Phát triển Đô thị",
      bank_account_id: "5",
      bank_account_name: "MB Bank - TK Dự phòng",
      branch_id: "2",
      transaction_type: "charge",
      amount: 18000000,
      description: "Cho vay vốn đầu tư",
      reference_number: "REF005",
      transaction_date: "2024-01-27T11:45:00Z",
      created_by: "test-user",
      created_at: "2024-01-27T11:45:00Z",
      updated_at: "2024-01-27T11:45:00Z",
    },
    {
      id: "6",
      transaction_code: "TXN0006",
      customer_id: "6",
      customer_name: "Công ty TNHH Thương mại Dịch vụ XNK",
      bank_account_id: "6",
      bank_account_name: "VPBank - TK Đầu tư",
      branch_id: "3",
      transaction_type: "payment",
      amount: 9500000,
      description: "Thanh toán hóa đơn",
      reference_number: "REF006",
      transaction_date: "2024-01-26T16:30:00Z",
      created_by: "test-user",
      created_at: "2024-01-26T16:30:00Z",
      updated_at: "2024-01-26T16:30:00Z",
    },
    {
      id: "7",
      transaction_code: "TXN0007",
      customer_id: "7",
      customer_name: "Công ty CP Đầu tư Bất động sản",
      bank_account_id: "7",
      bank_account_name: "TPBank - TK Doanh nghiệp",
      branch_id: "1",
      transaction_type: "charge",
      amount: 22000000,
      description: "Cho vay dự án mới",
      reference_number: "REF007",
      transaction_date: "2024-01-26T14:15:00Z",
      created_by: "test-user",
      created_at: "2024-01-26T14:15:00Z",
      updated_at: "2024-01-26T14:15:00Z",
    },
    {
      id: "8",
      transaction_code: "TXN0008",
      customer_id: "8",
      customer_name: "Công ty TNHH Sản xuất Vật liệu XD",
      bank_account_id: "8",
      bank_account_name: "Sacombank - TK Phát triển",
      branch_id: "2",
      transaction_type: "payment",
      amount: 13500000,
      description: "Thanh toán công nợ",
      reference_number: "REF008",
      transaction_date: "2024-01-25T10:45:00Z",
      created_by: "test-user",
      created_at: "2024-01-25T10:45:00Z",
      updated_at: "2024-01-25T10:45:00Z",
    },
    {
      id: "9",
      transaction_code: "TXN0009",
      customer_id: "9",
      customer_name: "Công ty CP Vận tải & Logistics",
      bank_account_id: "1",
      bank_account_name: "Vietcombank - TK Chính",
      branch_id: "3",
      transaction_type: "charge",
      amount: 16800000,
      description: "Cho vay vận chuyển hàng hóa",
      reference_number: "REF009",
      transaction_date: "2024-01-25T09:30:00Z",
      created_by: "test-user",
      created_at: "2024-01-25T09:30:00Z",
      updated_at: "2024-01-25T09:30:00Z",
    },
    {
      id: "10",
      transaction_code: "TXN0010",
      customer_id: "10",
      customer_name: "Công ty TNHH Xuất nhập khẩu Nông sản",
      bank_account_id: "2",
      bank_account_name: "BIDV - TK Thanh toán",
      branch_id: "1",
      transaction_type: "payment",
      amount: 11200000,
      description: "Thanh toán đợt cuối",
      reference_number: "REF010",
      transaction_date: "2024-01-24T16:45:00Z",
      created_by: "test-user",
      created_at: "2024-01-24T16:45:00Z",
      updated_at: "2024-01-24T16:45:00Z",
    },
    {
      id: "11",
      transaction_code: "TXN0011",
      customer_id: "1",
      customer_name: "Công ty TNHH ABC",
      bank_account_id: "3",
      bank_account_name: "Techcombank - TK Tiết kiệm",
      branch_id: "2",
      transaction_type: "charge",
      amount: 19500000,
      description: "Cho vay mở rộng sản xuất",
      reference_number: "REF011",
      transaction_date: "2024-01-24T11:30:00Z",
      created_by: "test-user",
      created_at: "2024-01-24T11:30:00Z",
      updated_at: "2024-01-24T11:30:00Z",
    },
    {
      id: "12",
      transaction_code: "TXN0012",
      customer_id: "2",
      customer_name: "Công ty CP XYZ",
      bank_account_id: "4",
      bank_account_name: "ACB - TK Vốn lưu động",
      branch_id: "3",
      transaction_type: "payment",
      amount: 8700000,
      description: "Thanh toán hàng tháng",
      reference_number: "REF012",
      transaction_date: "2024-01-23T15:45:00Z",
      created_by: "test-user",
      created_at: "2024-01-23T15:45:00Z",
      updated_at: "2024-01-23T15:45:00Z",
    },
    {
      id: "13",
      transaction_code: "TXN0013",
      customer_id: "3",
      customer_name: "Công ty TNHH DEF",
      bank_account_id: "5",
      bank_account_name: "MB Bank - TK Dự phòng",
      branch_id: "1",
      transaction_type: "charge",
      amount: 14300000,
      description: "Cho vay ngắn hạn",
      reference_number: "REF013",
      transaction_date: "2024-01-23T10:15:00Z",
      created_by: "test-user",
      created_at: "2024-01-23T10:15:00Z",
      updated_at: "2024-01-23T10:15:00Z",
    },
    {
      id: "14",
      transaction_code: "TXN0014",
      customer_id: "4",
      customer_name: "Công ty TNHH Global Tech",
      bank_account_id: "6",
      bank_account_name: "VPBank - TK Đầu tư",
      branch_id: "2",
      transaction_type: "payment",
      amount: 10500000,
      description: "Thanh toán đợt 2",
      reference_number: "REF014",
      transaction_date: "2024-01-22T16:30:00Z",
      created_by: "test-user",
      created_at: "2024-01-22T16:30:00Z",
      updated_at: "2024-01-22T16:30:00Z",
    },
    {
      id: "15",
      transaction_code: "TXN0015",
      customer_id: "5",
      customer_name: "Công ty CP Phát triển Đô thị",
      bank_account_id: "7",
      bank_account_name: "TPBank - TK Doanh nghiệp",
      branch_id: "3",
      transaction_type: "charge",
      amount: 17200000,
      description: "Cho vay dự án mới",
      reference_number: "REF015",
      transaction_date: "2024-01-22T11:45:00Z",
      created_by: "test-user",
      created_at: "2024-01-22T11:45:00Z",
      updated_at: "2024-01-22T11:45:00Z",
    },
  ],

  // Top customers for display - expanded to 10 customers
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
    {
      id: "4",
      customer_code: "CUST0004",
      full_name: "Công ty TNHH Global Tech",
      phone: "0912345678",
      email: "info@globaltech.com.vn",
      total_balance: -58000000, // 58M VND debt
      last_transaction_date: "2024-01-27T15:20:00Z",
    },
    {
      id: "5",
      customer_code: "CUST0005",
      full_name: "Công ty CP Phát triển Đô thị",
      phone: "0823456789",
      email: "contact@phattriendo.com.vn",
      total_balance: -52000000, // 52M VND debt
      last_transaction_date: "2024-01-27T11:45:00Z",
    },
    {
      id: "6",
      customer_code: "CUST0006",
      full_name: "Công ty TNHH Thương mại Dịch vụ XNK",
      phone: "0934567890",
      email: "info@tmxnk.com.vn",
      total_balance: -48000000, // 48M VND debt
      last_transaction_date: "2024-01-26T16:30:00Z",
    },
    {
      id: "7",
      customer_code: "CUST0007",
      full_name: "Công ty CP Đầu tư Bất động sản",
      phone: "0845678901",
      email: "contact@bds.com.vn",
      total_balance: -45000000, // 45M VND debt
      last_transaction_date: "2024-01-26T14:15:00Z",
    },
    {
      id: "8",
      customer_code: "CUST0008",
      full_name: "Công ty TNHH Sản xuất Vật liệu XD",
      phone: "0756789012",
      email: "info@vlxd.com.vn",
      total_balance: -42000000, // 42M VND debt
      last_transaction_date: "2024-01-25T10:45:00Z",
    },
    {
      id: "9",
      customer_code: "CUST0009",
      full_name: "Công ty CP Vận tải & Logistics",
      phone: "0967890123",
      email: "contact@vtlogistics.com.vn",
      total_balance: -38000000, // 38M VND debt
      last_transaction_date: "2024-01-25T09:30:00Z",
    },
    {
      id: "10",
      customer_code: "CUST0010",
      full_name: "Công ty TNHH Xuất nhập khẩu Nông sản",
      phone: "0878901234",
      email: "info@xnknongsan.com.vn",
      total_balance: -35000000, // 35M VND debt
      last_transaction_date: "2024-01-24T16:45:00Z",
    },
  ],
};
