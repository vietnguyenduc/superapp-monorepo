// REMOVE all original Supabase-based service exports above this line
// Only export the mocked services below for testing

export const customerService = {
  async getCustomers(_filters?: any) {
    return {
      data: [
        {
          id: "1",
          customer_code: "CUST0001",
          full_name: "Công ty TNHH ABC",
          phone: "0123456789",
          email: "info@abc.com.vn",
          address: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
          branch_id: null,
          total_balance: -85000000, // Nợ 85 triệu VND
          last_transaction_date: "2024-01-28T14:30:00Z",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          customer_code: "CUST0002",
          full_name: "Công ty CP XYZ",
          phone: "0987654321",
          email: "contact@xyz.com.vn",
          address: "456 Đường Lê Lợi, Quận 3, TP.HCM",
          branch_id: null,
          total_balance: -72000000, // Nợ 72 triệu VND
          last_transaction_date: "2024-01-28T10:15:00Z",
          is_active: true,
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
        {
          id: "3",
          customer_code: "CUST0003",
          full_name: "Công ty TNHH DEF",
          phone: "0369852147",
          email: "hello@def.com.vn",
          address: "789 Đường Võ Văn Tần, Quận 7, TP.HCM",
          branch_id: null,
          total_balance: -65000000, // Nợ 65 triệu VND
          last_transaction_date: "2024-01-28T09:45:00Z",
          is_active: true,
          created_at: "2024-01-03T00:00:00Z",
          updated_at: "2024-01-03T00:00:00Z",
        },
        {
          id: "4",
          customer_code: "CUST0004",
          full_name: "Công ty CP GHI",
          phone: "0521478963",
          email: "info@ghi.com.vn",
          address: "321 Đường Trần Hưng Đạo, Quận 1, TP.HCM",
          branch_id: null,
          total_balance: -58000000, // Nợ 58 triệu VND
          last_transaction_date: "2024-01-27T16:20:00Z",
          is_active: true,
          created_at: "2024-01-04T00:00:00Z",
          updated_at: "2024-01-04T00:00:00Z",
        },
        {
          id: "5",
          customer_code: "CUST0005",
          full_name: "Công ty TNHH JKL",
          phone: "0741236985",
          email: "contact@jkl.com.vn",
          address: "654 Đường Hai Bà Trưng, Quận 1, TP.HCM",
          branch_id: null,
          total_balance: -52000000, // Nợ 52 triệu VND
          last_transaction_date: "2024-01-27T13:10:00Z",
          is_active: false,
          created_at: "2024-01-05T00:00:00Z",
          updated_at: "2024-01-05T00:00:00Z",
        },
        {
          id: "6",
          customer_code: "CUST0006",
          full_name: "Công ty CP MNO",
          phone: "0963258741",
          email: "hello@mno.com.vn",
          address: "987 Đường Pasteur, Quận 3, TP.HCM",
          branch_id: null,
          total_balance: -45000000, // Nợ 45 triệu VND
          last_transaction_date: "2024-01-26T11:30:00Z",
          is_active: true,
          created_at: "2024-01-06T00:00:00Z",
          updated_at: "2024-01-06T00:00:00Z",
        },
        {
          id: "7",
          customer_code: "CUST0007",
          full_name: "Công ty TNHH PQR",
          phone: "0147852369",
          email: "info@pqr.com.vn",
          address: "147 Đường Điện Biên Phủ, Quận 7, TP.HCM",
          branch_id: null,
          total_balance: -38000000, // Nợ 38 triệu VND
          last_transaction_date: "2024-01-26T09:15:00Z",
          is_active: true,
          created_at: "2024-01-07T00:00:00Z",
          updated_at: "2024-01-07T00:00:00Z",
        },
        {
          id: "8",
          customer_code: "CUST0008",
          full_name: "Công ty CP STU",
          phone: "0321654987",
          email: "contact@stu.com.vn",
          address: "258 Đường Cách Mạng Tháng 8, Quận 1, TP.HCM",
          branch_id: null,
          total_balance: -32000000, // Nợ 32 triệu VND
          last_transaction_date: "2024-01-25T15:45:00Z",
          is_active: true,
          created_at: "2024-01-08T00:00:00Z",
          updated_at: "2024-01-08T00:00:00Z",
        },
      ],
      error: null,
      count: 8,
    };
  },
  async getCustomerById(id: string) {
    // Mock data for different customers
    const customers = {
      "1": {
        id: "1",
        customer_code: "CUST0001",
        full_name: "Công ty TNHH ABC",
        phone: "0123456789",
        email: "info@abc.com.vn",
        address: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
        branch_id: null,
        total_balance: -85000000, // Nợ 85 triệu VND
        last_transaction_date: "2024-01-28T14:30:00Z",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      "2": {
        id: "2",
        customer_code: "CUST0002",
        full_name: "Công ty CP XYZ",
        phone: "0987654321",
        email: "contact@xyz.com.vn",
        address: "456 Đường Lê Lợi, Quận 3, TP.HCM",
        branch_id: null,
        total_balance: -72000000, // Nợ 72 triệu VND
        last_transaction_date: "2024-01-28T10:15:00Z",
        is_active: true,
        created_at: "2024-01-02T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      },
      "3": {
        id: "3",
        customer_code: "CUST0003",
        full_name: "Công ty TNHH DEF",
        phone: "0369852147",
        email: "hello@def.com.vn",
        address: "789 Đường Võ Văn Tần, Quận 7, TP.HCM",
        branch_id: null,
        total_balance: -65000000, // Nợ 65 triệu VND
        last_transaction_date: "2024-01-28T09:45:00Z",
        is_active: true,
        created_at: "2024-01-03T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      },
      "4": {
        id: "4",
        customer_code: "CUST0004",
        full_name: "Công ty CP GHI",
        phone: "0521478963",
        email: "info@ghi.com.vn",
        address: "321 Đường Trần Hưng Đạo, Quận 1, TP.HCM",
        branch_id: null,
        total_balance: -58000000, // Nợ 58 triệu VND
        last_transaction_date: "2024-01-27T16:20:00Z",
        is_active: true,
        created_at: "2024-01-04T00:00:00Z",
        updated_at: "2024-01-04T00:00:00Z",
      },
      "5": {
        id: "5",
        customer_code: "CUST0005",
        full_name: "Công ty TNHH JKL",
        phone: "0741236985",
        email: "contact@jkl.com.vn",
        address: "654 Đường Hai Bà Trưng, Quận 1, TP.HCM",
        branch_id: null,
        total_balance: -52000000, // Nợ 52 triệu VND
        last_transaction_date: "2024-01-27T13:10:00Z",
        is_active: false,
        created_at: "2024-01-05T00:00:00Z",
        updated_at: "2024-01-05T00:00:00Z",
      },
      "6": {
        id: "6",
        customer_code: "CUST0006",
        full_name: "Công ty CP MNO",
        phone: "0963258741",
        email: "hello@mno.com.vn",
        address: "987 Đường Pasteur, Quận 3, TP.HCM",
        branch_id: null,
        total_balance: -45000000, // Nợ 45 triệu VND
        last_transaction_date: "2024-01-26T11:30:00Z",
        is_active: true,
        created_at: "2024-01-06T00:00:00Z",
        updated_at: "2024-01-06T00:00:00Z",
      },
      "7": {
        id: "7",
        customer_code: "CUST0007",
        full_name: "Công ty TNHH PQR",
        phone: "0147852369",
        email: "info@pqr.com.vn",
        address: "147 Đường Điện Biên Phủ, Quận 7, TP.HCM",
        branch_id: null,
        total_balance: -38000000, // Nợ 38 triệu VND
        last_transaction_date: "2024-01-26T09:15:00Z",
        is_active: true,
        created_at: "2024-01-07T00:00:00Z",
        updated_at: "2024-01-07T00:00:00Z",
      },
      "8": {
        id: "8",
        customer_code: "CUST0008",
        full_name: "Công ty CP STU",
        phone: "0321654987",
        email: "contact@stu.com.vn",
        address: "258 Đường Cách Mạng Tháng 8, Quận 1, TP.HCM",
        branch_id: null,
        total_balance: -32000000, // Nợ 32 triệu VND
        last_transaction_date: "2024-01-25T15:45:00Z",
        is_active: true,
        created_at: "2024-01-08T00:00:00Z",
        updated_at: "2024-01-08T00:00:00Z",
      },
    };

    const customer = customers[id as keyof typeof customers];

    if (!customer) {
      return {
        data: null,
        error: "Customer not found",
      };
    }

    return {
      data: customer,
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

export const transactionService = {
  async getTransactions(_filters?: any) {
    return {
      data: [
        {
          id: "1",
          transaction_code: "TXN0001",
          customer_id: "1",
          customer_name: "Công ty TNHH ABC",
          bank_account_id: "1",
          bank_account_name: "Vietcombank - TK Chính",
          branch_id: "1",
          transaction_type: "payment" as const,
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
          transaction_type: "charge" as const,
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
          transaction_type: "payment" as const,
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
          customer_name: "Công ty CP GHI",
          bank_account_id: "1",
          bank_account_name: "Vietcombank - TK Chính",
          branch_id: "1",
          transaction_type: "charge" as const,
          amount: 18000000,
          description: "Cho vay mua nguyên liệu",
          reference_number: "REF004",
          transaction_date: "2024-01-27T16:20:00Z",
          created_by: "test-user",
          created_at: "2024-01-27T16:20:00Z",
          updated_at: "2024-01-27T16:20:00Z",
        },
        {
          id: "5",
          transaction_code: "TXN0005",
          customer_id: "5",
          customer_name: "Công ty TNHH JKL",
          bank_account_id: "4",
          bank_account_name: "ACB - TK Vốn lưu động",
          branch_id: "1",
          transaction_type: "payment" as const,
          amount: 12000000,
          description: "Thanh toán nợ cũ",
          reference_number: "REF005",
          transaction_date: "2024-01-27T13:10:00Z",
          created_by: "test-user",
          created_at: "2024-01-27T13:10:00Z",
          updated_at: "2024-01-27T13:10:00Z",
        },
        {
          id: "6",
          transaction_code: "TXN0006",
          customer_id: "6",
          customer_name: "Công ty CP MNO",
          bank_account_id: "2",
          bank_account_name: "BIDV - TK Thanh toán",
          branch_id: "1",
          transaction_type: "adjustment" as const,
          amount: -5000000,
          description: "Điều chỉnh lãi suất",
          reference_number: "REF006",
          transaction_date: "2024-01-26T11:30:00Z",
          created_by: "test-user",
          created_at: "2024-01-26T11:30:00Z",
          updated_at: "2024-01-26T11:30:00Z",
        },
        {
          id: "7",
          transaction_code: "TXN0007",
          customer_id: "7",
          customer_name: "Công ty TNHH PQR",
          bank_account_id: "3",
          bank_account_name: "Techcombank - TK Tiết kiệm",
          branch_id: "1",
          transaction_type: "refund" as const,
          amount: 3000000,
          description: "Hoàn tiền phí dịch vụ",
          reference_number: "REF007",
          transaction_date: "2024-01-26T09:15:00Z",
          created_by: "test-user",
          created_at: "2024-01-26T09:15:00Z",
          updated_at: "2024-01-26T09:15:00Z",
        },
        {
          id: "8",
          transaction_code: "TXN0008",
          customer_id: "8",
          customer_name: "Công ty CP STU",
          bank_account_id: "1",
          bank_account_name: "Vietcombank - TK Chính",
          branch_id: "1",
          transaction_type: "charge" as const,
          amount: 22000000,
          description: "Cho vay mở rộng kinh doanh",
          reference_number: "REF008",
          transaction_date: "2024-01-25T15:45:00Z",
          created_by: "test-user",
          created_at: "2024-01-25T15:45:00Z",
          updated_at: "2024-01-25T15:45:00Z",
        },
        {
          id: "9",
          transaction_code: "TXN0009",
          customer_id: "9",
          customer_name: "Công ty TNHH VWX",
          bank_account_id: "4",
          bank_account_name: "ACB - TK Vốn lưu động",
          branch_id: "1",
          transaction_type: "payment" as const,
          amount: 9500000,
          description: "Thanh toán định kỳ",
          reference_number: "REF009",
          transaction_date: "2024-01-25T12:20:00Z",
          created_by: "test-user",
          created_at: "2024-01-25T12:20:00Z",
          updated_at: "2024-01-25T12:20:00Z",
        },
        {
          id: "10",
          transaction_code: "TXN0010",
          customer_id: "10",
          customer_name: "Công ty CP YZA",
          bank_account_id: "2",
          bank_account_name: "BIDV - TK Thanh toán",
          branch_id: "1",
          transaction_type: "charge" as const,
          amount: 16000000,
          description: "Cho vay mua thiết bị",
          reference_number: "REF010",
          transaction_date: "2024-01-24T14:10:00Z",
          created_by: "test-user",
          created_at: "2024-01-24T14:10:00Z",
          updated_at: "2024-01-24T14:10:00Z",
        },
      ],
      error: null,
      count: 10,
    };
  },
  async getTransactionById(_id: string) {
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

export const bankAccountService = {
  async getBankAccounts(_filters?: any) {
    return {
      data: [
        {
          id: "1",
          account_number: "1234567890",
          account_name: "Tài khoản chính",
          bank_name: "Vietcombank",
          branch_id: "1",
          balance: 150000000, // 150 triệu VND
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          account_number: "0987654321",
          account_name: "Tài khoản thanh toán",
          bank_name: "BIDV",
          branch_id: "1",
          balance: 85000000, // 85 triệu VND
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "3",
          account_number: "1122334455",
          account_name: "Tài khoản tiết kiệm",
          bank_name: "Techcombank",
          branch_id: "1",
          balance: 200000000, // 200 triệu VND
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "4",
          account_number: "5566778899",
          account_name: "Tài khoản vốn lưu động",
          bank_name: "ACB",
          branch_id: "2",
          balance: 75000000, // 75 triệu VND
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "5",
          account_number: "9988776655",
          account_name: "Tài khoản dự phòng",
          bank_name: "MB Bank",
          branch_id: "3",
          balance: 50000000, // 50 triệu VND
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
      error: null,
    };
  },
  async getBankAccountById(_id: string) {
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
  },
};

export const branchService = {
  async getBranches() {
    return {
      data: [
        {
          id: "1",
          name: "Chi nhánh chính",
          code: "MB001",
          address: "123 Đường chính, Quận 1, TP.HCM",
          phone: "0123456789",
          email: "main@branch.com",
          manager_id: "test-user",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          name: "Chi nhánh Bắc",
          code: "NB001",
          address: "456 Đường Bắc, Quận 3, TP.HCM",
          phone: "0123456790",
          email: "north@branch.com",
          manager_id: "test-user",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "3",
          name: "Chi nhánh Nam",
          code: "SB001",
          address: "789 Đường Nam, Quận 7, TP.HCM",
          phone: "0123456791",
          email: "south@branch.com",
          manager_id: "test-user",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
      error: null,
    };
  },
  async getBranchById(_id: string) {
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
  },
};

export const dashboardService = {
  async getDashboardMetrics(
    _branchId?: string,
    timeRange: "day" | "week" | "month" | "quarter" | "year" = "month",
  ) {
    // Mock different transaction counts based on time range
    const transactionCounts = {
      day: 5,
      week: 25,
      month: 100,
      quarter: 300,
      year: 1200,
    };

    // Mock previous period transaction counts (same period last time)
    const previousTransactionCounts = {
      day: 3, // 3 giao dịch ngày hôm trước
      week: 20, // 20 giao dịch tuần trước
      month: 85, // 85 giao dịch tháng trước
      quarter: 250, // 250 giao dịch quý trước
      year: 1000, // 1000 giao dịch năm trước
    };

    // Calculate changes based on previous period
    const transactionChanges = {
      day: transactionCounts.day - previousTransactionCounts.day,
      week: transactionCounts.week - previousTransactionCounts.week,
      month: transactionCounts.month - previousTransactionCounts.month,
      quarter: transactionCounts.quarter - previousTransactionCounts.quarter,
      year: transactionCounts.year - previousTransactionCounts.year,
    };

    // Mock different transaction amounts based on time range (in VND)
    const transactionAmounts = {
      day: 7500000, // 7.5 triệu VND (2 + 5.5)
      week: 37500000, // 37.5 triệu VND (10 + 27.5)
      month: 150000000, // 150 triệu VND (40 + 110)
      quarter: 450000000, // 450 triệu VND (120 + 330)
      year: 1800000000, // 1.8 tỷ VND (480 + 1320)
    };

    // Mock income amounts (tiền thu được)
    const incomeAmounts = {
      day: 2000000, // 2 triệu VND thu
      week: 10000000, // 10 triệu VND thu
      month: 40000000, // 40 triệu VND thu
      quarter: 120000000, // 120 triệu VND thu
      year: 480000000, // 480 triệu VND thu
    };

    // Mock debt amounts (tiền cho nợ)
    const debtAmounts = {
      day: 5500000, // 5.5 triệu VND cho nợ
      week: 27500000, // 27.5 triệu VND cho nợ
      month: 110000000, // 110 triệu VND cho nợ
      quarter: 330000000, // 330 triệu VND cho nợ
      year: 1320000000, // 1.32 tỷ VND cho nợ
    };

    // Mock previous period transaction amounts
    const previousTransactionAmounts = {
      day: 4500000, // 4.5 triệu VND ngày hôm trước (1.2 + 3.3)
      week: 22500000, // 22.5 triệu VND tuần trước (6 + 16.5)
      month: 90000000, // 90 triệu VND tháng trước (24 + 66)
      quarter: 270000000, // 270 triệu VND quý trước (72 + 198)
      year: 1080000000, // 1.08 tỷ VND năm trước (288 + 792)
    };

    // Mock previous period income amounts
    const previousIncomeAmounts = {
      day: 1200000, // 1.2 triệu VND thu ngày hôm trước
      week: 6000000, // 6 triệu VND thu tuần trước
      month: 24000000, // 24 triệu VND thu tháng trước
      quarter: 72000000, // 72 triệu VND thu quý trước
      year: 288000000, // 288 triệu VND thu năm trước
    };

    // Mock previous period debt amounts
    const previousDebtAmounts = {
      day: 3300000, // 3.3 triệu VND cho nợ ngày hôm trước
      week: 16500000, // 16.5 triệu VND cho nợ tuần trước
      month: 66000000, // 66 triệu VND cho nợ tháng trước
      quarter: 198000000, // 198 triệu VND cho nợ quý trước
      year: 792000000, // 792 triệu VND cho nợ năm trước
    };

    // Calculate amount changes based on previous period
    const transactionAmountChanges = {
      day: transactionAmounts.day - previousTransactionAmounts.day,
      week: transactionAmounts.week - previousTransactionAmounts.week,
      month: transactionAmounts.month - previousTransactionAmounts.month,
      quarter: transactionAmounts.quarter - previousTransactionAmounts.quarter,
      year: transactionAmounts.year - previousTransactionAmounts.year,
    };

    // Calculate income changes based on previous period
    const incomeChanges = {
      day: incomeAmounts.day - previousIncomeAmounts.day,
      week: incomeAmounts.week - previousIncomeAmounts.week,
      month: incomeAmounts.month - previousIncomeAmounts.month,
      quarter: incomeAmounts.quarter - previousIncomeAmounts.quarter,
      year: incomeAmounts.year - previousIncomeAmounts.year,
    };

    // Calculate debt changes based on previous period
    const debtChanges = {
      day: debtAmounts.day - previousDebtAmounts.day,
      week: debtAmounts.week - previousDebtAmounts.week,
      month: debtAmounts.month - previousDebtAmounts.month,
      quarter: debtAmounts.quarter - previousDebtAmounts.quarter,
      year: debtAmounts.year - previousDebtAmounts.year,
    };

    // Mock outstanding balance by time range (tổng công nợ hiện tại)
    const outstandingBalances = {
      day: 150000000, // 150 triệu VND (tổng nợ hiện tại)
      week: 180000000, // 180 triệu VND
      month: 220000000, // 220 triệu VND
      quarter: 280000000, // 280 triệu VND
      year: 350000000, // 350 triệu VND
    };

    // Mock previous period outstanding balances
    const previousOutstandingBalances = {
      day: 145000000, // 145 triệu VND ngày hôm trước
      week: 170000000, // 170 triệu VND tuần trước
      month: 210000000, // 210 triệu VND tháng trước
      quarter: 260000000, // 260 triệu VND quý trước
      year: 320000000, // 320 triệu VND năm trước
    };

    // Calculate outstanding changes based on previous period
    const outstandingChanges = {
      day: outstandingBalances.day - previousOutstandingBalances.day,
      week: outstandingBalances.week - previousOutstandingBalances.week,
      month: outstandingBalances.month - previousOutstandingBalances.month,
      quarter:
        outstandingBalances.quarter - previousOutstandingBalances.quarter,
      year: outstandingBalances.year - previousOutstandingBalances.year,
    };

    // Mock active customers by time range (số khách hàng unique có giao dịch trong kỳ)
    const activeCustomers = {
      day: 3, // 3 khách hàng có giao dịch trong ngày
      week: 6, // 6 khách hàng có giao dịch trong tuần
      month: 8, // 8 khách hàng có giao dịch trong tháng
      quarter: 8, // 8 khách hàng có giao dịch trong quý
      year: 8, // 8 khách hàng có giao dịch trong năm
    };

    // Mock previous period active customers
    const previousActiveCustomers = {
      day: 2, // 2 khách hàng ngày hôm trước
      week: 5, // 5 khách hàng tuần trước
      month: 7, // 7 khách hàng tháng trước
      quarter: 7, // 7 khách hàng quý trước
      year: 7, // 7 khách hàng năm trước
    };

    // Calculate active customers changes based on previous period
    const activeCustomersChanges = {
      day: activeCustomers.day - previousActiveCustomers.day,
      week: activeCustomers.week - previousActiveCustomers.week,
      month: activeCustomers.month - previousActiveCustomers.month,
      quarter: activeCustomers.quarter - previousActiveCustomers.quarter,
      year: activeCustomers.year - previousActiveCustomers.year,
    };

    // Mock transaction amounts by branch based on time range
    const transactionAmountsByBranchData = {
      day: [
        {
          branch_id: "1",
          branch_name: "Chi nhánh Hà Nội",
          incomeAmount: 800000, // 0.8 triệu VND thu
          debtAmount: 2200000, // 2.2 triệu VND cho nợ
        },
        {
          branch_id: "2",
          branch_name: "Chi nhánh TP.HCM",
          incomeAmount: 1000000, // 1 triệu VND thu
          debtAmount: 2500000, // 2.5 triệu VND cho nợ
        },
        {
          branch_id: "3",
          branch_name: "Chi nhánh Đà Nẵng",
          incomeAmount: 200000, // 0.2 triệu VND thu
          debtAmount: 800000, // 0.8 triệu VND cho nợ
        },
      ],
      week: [
        {
          branch_id: "1",
          branch_name: "Chi nhánh Hà Nội",
          incomeAmount: 4000000, // 4 triệu VND thu
          debtAmount: 11000000, // 11 triệu VND cho nợ
        },
        {
          branch_id: "2",
          branch_name: "Chi nhánh TP.HCM",
          incomeAmount: 5000000, // 5 triệu VND thu
          debtAmount: 12500000, // 12.5 triệu VND cho nợ
        },
        {
          branch_id: "3",
          branch_name: "Chi nhánh Đà Nẵng",
          incomeAmount: 1000000, // 1 triệu VND thu
          debtAmount: 4000000, // 4 triệu VND cho nợ
        },
      ],
      month: [
        {
          branch_id: "1",
          branch_name: "Chi nhánh Hà Nội",
          incomeAmount: 16000000, // 16 triệu VND thu
          debtAmount: 44000000, // 44 triệu VND cho nợ
        },
        {
          branch_id: "2",
          branch_name: "Chi nhánh TP.HCM",
          incomeAmount: 20000000, // 20 triệu VND thu
          debtAmount: 50000000, // 50 triệu VND cho nợ
        },
        {
          branch_id: "3",
          branch_name: "Chi nhánh Đà Nẵng",
          incomeAmount: 4000000, // 4 triệu VND thu
          debtAmount: 16000000, // 16 triệu VND cho nợ
        },
      ],
      quarter: [
        {
          branch_id: "1",
          branch_name: "Chi nhánh Hà Nội",
          incomeAmount: 48000000, // 48 triệu VND thu
          debtAmount: 132000000, // 132 triệu VND cho nợ
        },
        {
          branch_id: "2",
          branch_name: "Chi nhánh TP.HCM",
          incomeAmount: 60000000, // 60 triệu VND thu
          debtAmount: 150000000, // 150 triệu VND cho nợ
        },
        {
          branch_id: "3",
          branch_name: "Chi nhánh Đà Nẵng",
          incomeAmount: 12000000, // 12 triệu VND thu
          debtAmount: 48000000, // 48 triệu VND cho nợ
        },
      ],
      year: [
        {
          branch_id: "1",
          branch_name: "Chi nhánh Hà Nội",
          incomeAmount: 192000000, // 192 triệu VND thu
          debtAmount: 528000000, // 528 triệu VND cho nợ
        },
        {
          branch_id: "2",
          branch_name: "Chi nhánh TP.HCM",
          incomeAmount: 240000000, // 240 triệu VND thu
          debtAmount: 600000000, // 600 triệu VND cho nợ
        },
        {
          branch_id: "3",
          branch_name: "Chi nhánh Đà Nẵng",
          incomeAmount: 48000000, // 48 triệu VND thu
          debtAmount: 192000000, // 192 triệu VND cho nợ
        },
      ],
    };

    // Verify sum matches transactionAmountsInPeriod
    const branchIncomeSum = transactionAmountsByBranchData[timeRange].reduce(
      (sum, branch) => sum + branch.incomeAmount,
      0,
    );
    const branchDebtSum = transactionAmountsByBranchData[timeRange].reduce(
      (sum, branch) => sum + branch.debtAmount,
      0,
    );
    const branchTotalSum = branchIncomeSum + branchDebtSum;

    console.log(
      `Branch income sum for ${timeRange}: ${branchIncomeSum}, Income amount: ${incomeAmounts[timeRange]}`,
    );
    console.log(
      `Branch debt sum for ${timeRange}: ${branchDebtSum}, Debt amount: ${debtAmounts[timeRange]}`,
    );
    console.log(
      `Branch total sum for ${timeRange}: ${branchTotalSum}, Transaction amount: ${transactionAmounts[timeRange]}`,
    );

    // Ensure the sums match exactly
    if (branchIncomeSum !== incomeAmounts[timeRange]) {
      console.warn(
        `Income sum mismatch for ${timeRange}: branch sum = ${branchIncomeSum}, income amount = ${incomeAmounts[timeRange]}`,
      );
    }
    if (branchDebtSum !== debtAmounts[timeRange]) {
      console.warn(
        `Debt sum mismatch for ${timeRange}: branch sum = ${branchDebtSum}, debt amount = ${debtAmounts[timeRange]}`,
      );
    }
    if (branchTotalSum !== transactionAmounts[timeRange]) {
      console.warn(
        `Total sum mismatch for ${timeRange}: branch sum = ${branchTotalSum}, transaction amount = ${transactionAmounts[timeRange]}`,
      );
    }

    // Mock số lượng giao dịch thu và cho nợ
    const transactionPaymentCounts = {
      day: 2,
      week: 10,
      month: 40,
      quarter: 120,
      year: 480,
    };
    const transactionChargeCounts = {
      day: 3,
      week: 15,
      month: 60,
      quarter: 180,
      year: 720,
    };

    // Mock số lượng giao dịch thu và cho nợ kỳ trước
    const previousTransactionPaymentCounts = {
      day: 1,
      week: 8,
      month: 24,
      quarter: 72,
      year: 288,
    };
    const previousTransactionChargeCounts = {
      day: 2,
      week: 12,
      month: 36,
      quarter: 108,
      year: 432,
    };

    // Tính chênh lệch
    const transactionPaymentChange =
      transactionPaymentCounts[timeRange] -
      previousTransactionPaymentCounts[timeRange];
    const transactionChargeChange =
      transactionChargeCounts[timeRange] -
      previousTransactionChargeCounts[timeRange];

    return {
      data: {
        totalOutstanding: outstandingBalances[timeRange],
        totalOutstandingChange: outstandingChanges[timeRange],
        activeCustomers: activeCustomers[timeRange],
        activeCustomersChange: activeCustomersChanges[timeRange],
        transactionsInPeriod: transactionCounts[timeRange],
        transactionsInPeriodChange: transactionChanges[timeRange],
        transactionPaymentCount: transactionPaymentCounts[timeRange],
        transactionChargeCount: transactionChargeCounts[timeRange],
        transactionPaymentChange,
        transactionChargeChange,
        transactionAmountsInPeriod: transactionAmounts[timeRange],
        transactionAmountsInPeriodChange: transactionAmountChanges[timeRange],
        transactionIncomeInPeriod: incomeAmounts[timeRange],
        transactionDebtInPeriod: debtAmounts[timeRange],
        transactionIncomeChange: incomeChanges[timeRange],
        transactionDebtChange: debtChanges[timeRange],
        totalTransactions: 1,
        totalTransactionsChange: 0,
        transactionAmountsByBranch: transactionAmountsByBranchData[timeRange],
        balanceByBankAccount: [
          {
            bank_account_id: "1",
            account_name: "Vietcombank - TK Chính",
            account_number: "1234567890",
            balance: 250000000,
          },
          {
            bank_account_id: "2",
            account_name: "BIDV - TK Thanh toán",
            account_number: "0987654321",
            balance: 180000000,
          },
          {
            bank_account_id: "3",
            account_name: "Techcombank - TK Tiết kiệm",
            account_number: "1122334455",
            balance: 320000000,
          },
          {
            bank_account_id: "4",
            account_name: "ACB - TK Vốn lưu động",
            account_number: "5566778899",
            balance: 95000000,
          },
          {
            bank_account_id: "5",
            account_name: "MB Bank - TK Dự phòng",
            account_number: "9988776655",
            balance: 150000000,
          },
          {
            bank_account_id: "6",
            account_name: "VPBank - TK Đầu tư",
            account_number: "4433221100",
            balance: 280000000,
          },
        ],
        cashFlowData: (() => {
          const baseData = {
            day: [
              {
                date: "2024-01-01T08:00:00Z",
                inflow: 2500000,
                outflow: 800000,
                netFlow: 1700000,
              },
              {
                date: "2024-01-01T10:00:00Z",
                inflow: 1800000,
                outflow: 3200000,
                netFlow: -1400000,
              },
              {
                date: "2024-01-01T12:00:00Z",
                inflow: 4200000,
                outflow: 1500000,
                netFlow: 2700000,
              },
              {
                date: "2024-01-01T14:00:00Z",
                inflow: 1200000,
                outflow: 2800000,
                netFlow: -1600000,
              },
              {
                date: "2024-01-01T16:00:00Z",
                inflow: 3500000,
                outflow: 1200000,
                netFlow: 2300000,
              },
              {
                date: "2024-01-01T18:00:00Z",
                inflow: 900000,
                outflow: 2500000,
                netFlow: -1600000,
              },
              {
                date: "2024-01-01T20:00:00Z",
                inflow: 2800000,
                outflow: 1800000,
                netFlow: 1000000,
              },
            ],
            week: [
              {
                date: "2024-01-01T00:00:00Z",
                inflow: 5000000,
                outflow: 12000000,
                netFlow: -7000000,
              }, // Thu ít, cho nợ nhiều
              {
                date: "2024-01-02T00:00:00Z",
                inflow: 15000000,
                outflow: 8000000,
                netFlow: 7000000,
              }, // Thu nhiều, cho nợ ít
              {
                date: "2024-01-03T00:00:00Z",
                inflow: 8000000,
                outflow: 18000000,
                netFlow: -10000000,
              }, // Thu ít, cho nợ nhiều
              {
                date: "2024-01-04T00:00:00Z",
                inflow: 12000000,
                outflow: 6000000,
                netFlow: 6000000,
              }, // Thu nhiều, cho nợ ít
              {
                date: "2024-01-05T00:00:00Z",
                inflow: 7000000,
                outflow: 15000000,
                netFlow: -8000000,
              }, // Thu ít, cho nợ nhiều
              {
                date: "2024-01-06T00:00:00Z",
                inflow: 14000000,
                outflow: 9000000,
                netFlow: 5000000,
              }, // Thu nhiều, cho nợ ít
              {
                date: "2024-01-07T00:00:00Z",
                inflow: 6000000,
                outflow: 11000000,
                netFlow: -5000000,
              }, // Thu ít, cho nợ nhiều
            ],
            month: [
              {
                date: "2024-01-01T00:00:00Z",
                inflow: 20000000,
                outflow: 45000000,
                netFlow: -25000000,
              }, // Thu ít, cho nợ nhiều
              {
                date: "2024-01-08T00:00:00Z",
                inflow: 50000000,
                outflow: 30000000,
                netFlow: 20000000,
              }, // Thu nhiều, cho nợ ít
              {
                date: "2024-01-15T00:00:00Z",
                inflow: 25000000,
                outflow: 60000000,
                netFlow: -35000000,
              }, // Thu ít, cho nợ nhiều
              {
                date: "2024-01-22T00:00:00Z",
                inflow: 45000000,
                outflow: 20000000,
                netFlow: 25000000,
              }, // Thu nhiều, cho nợ ít
              {
                date: "2024-01-29T00:00:00Z",
                inflow: 30000000,
                outflow: 55000000,
                netFlow: -25000000,
              }, // Thu ít, cho nợ nhiều
            ],
            quarter: [
              {
                date: "2024-01-01T00:00:00Z",
                inflow: 60000000,
                outflow: 140000000,
                netFlow: -80000000,
              }, // Thu ít, cho nợ nhiều
              {
                date: "2024-02-01T00:00:00Z",
                inflow: 150000000,
                outflow: 90000000,
                netFlow: 60000000,
              }, // Thu nhiều, cho nợ ít
              {
                date: "2024-03-01T00:00:00Z",
                inflow: 80000000,
                outflow: 180000000,
                netFlow: -100000000,
              }, // Thu ít, cho nợ nhiều
            ],
            year: [
              {
                date: "2024-01-01T00:00:00Z",
                inflow: 240000000,
                outflow: 560000000,
                netFlow: -320000000,
              }, // Thu ít, cho nợ nhiều
              {
                date: "2024-04-01T00:00:00Z",
                inflow: 600000000,
                outflow: 360000000,
                netFlow: 240000000,
              }, // Thu nhiều, cho nợ ít
              {
                date: "2024-07-01T00:00:00Z",
                inflow: 320000000,
                outflow: 720000000,
                netFlow: -400000000,
              }, // Thu ít, cho nợ nhiều
              {
                date: "2024-10-01T00:00:00Z",
                inflow: 480000000,
                outflow: 240000000,
                netFlow: 240000000,
              }, // Thu nhiều, cho nợ ít
            ],
          };
          return baseData[timeRange] || baseData.month;
        })(),
        recentTransactions: [
          {
            id: "1",
            transaction_code: "TXN0001",
            customer_id: "1",
            customer_name: "Công ty TNHH ABC",
            bank_account_id: "1",
            bank_account_name: "Vietcombank - TK Chính",
            branch_id: "2",
            transaction_type: "payment" as const,
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
            transaction_type: "charge" as const,
            amount: 25000000,
            description: "Cho vay mua hàng",
            reference_number: "REF002",
            transaction_date: "2024-01-28T11:15:00Z",
            created_by: "test-user",
            created_at: "2024-01-28T11:15:00Z",
            updated_at: "2024-01-28T11:15:00Z",
          },
          {
            id: "3",
            transaction_code: "TXN0003",
            customer_id: "3",
            customer_name: "Công ty TNHH DEF",
            bank_account_id: "3",
            bank_account_name: "Techcombank - TK Tiết kiệm",
            branch_id: "2",
            transaction_type: "payment" as const,
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
            customer_name: "Công ty CP GHI",
            bank_account_id: "1",
            bank_account_name: "Vietcombank - TK Chính",
            branch_id: "1",
            transaction_type: "charge" as const,
            amount: 18000000,
            description: "Cho vay mua nguyên liệu",
            reference_number: "REF004",
            transaction_date: "2024-01-27T16:20:00Z",
            created_by: "test-user",
            created_at: "2024-01-27T16:20:00Z",
            updated_at: "2024-01-27T16:20:00Z",
          },
          {
            id: "5",
            transaction_code: "TXN0005",
            customer_id: "5",
            customer_name: "Công ty TNHH JKL",
            bank_account_id: "4",
            bank_account_name: "ACB - TK Vốn lưu động",
            branch_id: "1",
            transaction_type: "payment" as const,
            amount: 12000000,
            description: "Thanh toán nợ cũ",
            reference_number: "REF005",
            transaction_date: "2024-01-27T13:10:00Z",
            created_by: "test-user",
            created_at: "2024-01-27T13:10:00Z",
            updated_at: "2024-01-27T13:10:00Z",
          },
          {
            id: "6",
            transaction_code: "TXN0006",
            customer_id: "6",
            customer_name: "Công ty CP MNO",
            bank_account_id: "2",
            bank_account_name: "BIDV - TK Thanh toán",
            branch_id: "2",
            transaction_type: "charge" as const,
            amount: 30000000,
            description: "Cho vay mua thiết bị",
            reference_number: "REF006",
            transaction_date: "2024-01-27T11:20:00Z",
            created_by: "test-user",
            created_at: "2024-01-27T11:20:00Z",
            updated_at: "2024-01-27T11:20:00Z",
          },
          {
            id: "7",
            transaction_code: "TXN0007",
            customer_id: "7",
            customer_name: "Công ty TNHH PQR",
            bank_account_id: "3",
            bank_account_name: "Techcombank - TK Tiết kiệm",
            branch_id: "2",
            transaction_type: "payment" as const,
            amount: 22000000,
            description: "Thanh toán nợ tháng 12",
            reference_number: "REF007",
            transaction_date: "2024-01-27T09:30:00Z",
            created_by: "test-user",
            created_at: "2024-01-27T09:30:00Z",
            updated_at: "2024-01-27T09:30:00Z",
          },
          {
            id: "8",
            transaction_code: "TXN0008",
            customer_id: "8",
            customer_name: "Công ty CP STU",
            bank_account_id: "1",
            bank_account_name: "Vietcombank - TK Chính",
            branch_id: "3",
            transaction_type: "charge" as const,
            amount: 15000000,
            description: "Cho vay mua nguyên liệu",
            reference_number: "REF008",
            transaction_date: "2024-01-26T15:45:00Z",
            created_by: "test-user",
            created_at: "2024-01-26T15:45:00Z",
            updated_at: "2024-01-26T15:45:00Z",
          },
          {
            id: "9",
            transaction_code: "TXN0009",
            customer_id: "9",
            customer_name: "Công ty TNHH VWX",
            bank_account_id: "4",
            bank_account_name: "ACB - TK Vốn lưu động",
            branch_id: "3",
            transaction_type: "payment" as const,
            amount: 18000000,
            description: "Thanh toán một phần",
            reference_number: "REF009",
            transaction_date: "2024-01-26T13:15:00Z",
            created_by: "test-user",
            created_at: "2024-01-26T13:15:00Z",
            updated_at: "2024-01-26T13:15:00Z",
          },
          {
            id: "10",
            transaction_code: "TXN0010",
            customer_id: "10",
            customer_name: "Công ty CP YZA",
            bank_account_id: "2",
            bank_account_name: "BIDV - TK Thanh toán",
            branch_id: "1",
            transaction_type: "charge" as const,
            amount: 25000000,
            description: "Cho vay mua hàng",
            reference_number: "REF010",
            transaction_date: "2024-01-26T10:00:00Z",
            created_by: "test-user",
            created_at: "2024-01-26T10:00:00Z",
            updated_at: "2024-01-26T10:00:00Z",
          },
          {
            id: "11",
            transaction_code: "TXN0011",
            customer_id: "1",
            customer_name: "Công ty TNHH ABC",
            bank_account_id: "1",
            bank_account_name: "Vietcombank - TK Chính",
            branch_id: "1",
            transaction_type: "payment" as const,
            amount: 5000000,
            description: "Thanh toán nợ cũ",
            reference_number: "REF011",
            transaction_date: "2024-01-25T16:30:00Z",
            created_by: "test-user",
            created_at: "2024-01-25T16:30:00Z",
            updated_at: "2024-01-25T16:30:00Z",
          },
          {
            id: "12",
            transaction_code: "TXN0012",
            customer_id: "2",
            customer_name: "Công ty CP XYZ",
            bank_account_id: "2",
            bank_account_name: "BIDV - TK Thanh toán",
            branch_id: "2",
            transaction_type: "charge" as const,
            amount: 20000000,
            description: "Cho vay mua thiết bị",
            reference_number: "REF012",
            transaction_date: "2024-01-25T14:20:00Z",
            created_by: "test-user",
            created_at: "2024-01-25T14:20:00Z",
            updated_at: "2024-01-25T14:20:00Z",
          },
          {
            id: "13",
            transaction_code: "TXN0013",
            customer_id: "3",
            customer_name: "Công ty TNHH DEF",
            bank_account_id: "3",
            bank_account_name: "Techcombank - TK Tiết kiệm",
            branch_id: "3",
            transaction_type: "payment" as const,
            amount: 12000000,
            description: "Thanh toán nợ tháng 11",
            reference_number: "REF013",
            transaction_date: "2024-01-25T11:45:00Z",
            created_by: "test-user",
            created_at: "2024-01-25T11:45:00Z",
            updated_at: "2024-01-25T11:45:00Z",
          },
          {
            id: "14",
            transaction_code: "TXN0014",
            customer_id: "4",
            customer_name: "Công ty CP GHI",
            bank_account_id: "1",
            bank_account_name: "Vietcombank - TK Chính",
            branch_id: "1",
            transaction_type: "charge" as const,
            amount: 35000000,
            description: "Cho vay mua hàng",
            reference_number: "REF014",
            transaction_date: "2024-01-25T09:15:00Z",
            created_by: "test-user",
            created_at: "2024-01-25T09:15:00Z",
            updated_at: "2024-01-25T09:15:00Z",
          },
          {
            id: "15",
            transaction_code: "TXN0015",
            customer_id: "5",
            customer_name: "Công ty TNHH JKL",
            bank_account_id: "4",
            bank_account_name: "ACB - TK Vốn lưu động",
            branch_id: "2",
            transaction_type: "payment" as const,
            amount: 8000000,
            description: "Thanh toán một phần",
            reference_number: "REF015",
            transaction_date: "2024-01-24T17:00:00Z",
            created_by: "test-user",
            created_at: "2024-01-24T17:00:00Z",
            updated_at: "2024-01-24T17:00:00Z",
          },
        ],
        topCustomers: [
          {
            id: "1",
            customer_code: "CUST0001",
            full_name: "Công ty TNHH ABC",
            phone: "0123456789",
            email: "abc@company.com",
            address: "123 Nguyễn Huệ, Q1, TP.HCM",
            branch_id: "2",
            total_balance: 85000000,
            last_transaction_date: "2024-01-28T00:00:00Z",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-28T00:00:00Z",
          },
          {
            id: "2",
            customer_code: "CUST0002",
            full_name: "Công ty CP XYZ",
            phone: "0987654321",
            email: "xyz@company.com",
            address: "456 Lê Lợi, Q3, TP.HCM",
            branch_id: "2",
            total_balance: 72000000,
            last_transaction_date: "2024-01-27T00:00:00Z",
            is_active: true,
            created_at: "2024-01-02T00:00:00Z",
            updated_at: "2024-01-27T00:00:00Z",
          },
          {
            id: "3",
            customer_code: "CUST0003",
            full_name: "Công ty TNHH DEF",
            phone: "0111222333",
            email: "def@company.com",
            address: "789 Trần Hưng Đạo, Q5, TP.HCM",
            branch_id: "2",
            total_balance: 65000000,
            last_transaction_date: "2024-01-26T00:00:00Z",
            is_active: true,
            created_at: "2024-01-03T00:00:00Z",
            updated_at: "2024-01-26T00:00:00Z",
          },
          {
            id: "4",
            customer_code: "CUST0004",
            full_name: "Công ty CP GHI",
            phone: "0444555666",
            email: "ghi@company.com",
            address: "321 Hai Bà Trưng, Q1, TP.HCM",
            branch_id: "1",
            total_balance: 58000000,
            last_transaction_date: "2024-01-25T00:00:00Z",
            is_active: true,
            created_at: "2024-01-04T00:00:00Z",
            updated_at: "2024-01-25T00:00:00Z",
          },
          {
            id: "5",
            customer_code: "CUST0005",
            full_name: "Công ty TNHH JKL",
            phone: "0777888999",
            email: "jkl@company.com",
            address: "654 Điện Biên Phủ, Q3, TP.HCM",
            branch_id: "1",
            total_balance: 52000000,
            last_transaction_date: "2024-01-24T00:00:00Z",
            is_active: true,
            created_at: "2024-01-05T00:00:00Z",
            updated_at: "2024-01-24T00:00:00Z",
          },
          {
            id: "6",
            customer_code: "CUST0006",
            full_name: "Công ty CP MNO",
            phone: "0123456788",
            email: "mno@company.com",
            address: "987 Võ Văn Tần, Q3, TP.HCM",
            branch_id: "3",
            total_balance: 45000000,
            last_transaction_date: "2024-01-23T00:00:00Z",
            is_active: true,
            created_at: "2024-01-06T00:00:00Z",
            updated_at: "2024-01-23T00:00:00Z",
          },
          {
            id: "7",
            customer_code: "CUST0007",
            full_name: "Công ty TNHH PQR",
            phone: "0987654320",
            email: "pqr@company.com",
            address: "147 Nguyễn Thị Minh Khai, Q1, TP.HCM",
            branch_id: "3",
            total_balance: 38000000,
            last_transaction_date: "2024-01-22T00:00:00Z",
            is_active: true,
            created_at: "2024-01-07T00:00:00Z",
            updated_at: "2024-01-22T00:00:00Z",
          },
          {
            id: "8",
            customer_code: "CUST0008",
            full_name: "Công ty CP STU",
            phone: "0111222334",
            email: "stu@company.com",
            address: "258 Cách Mạng Tháng 8, Q10, TP.HCM",
            branch_id: "1",
            total_balance: 32000000,
            last_transaction_date: "2024-01-21T00:00:00Z",
            is_active: true,
            created_at: "2024-01-08T00:00:00Z",
            updated_at: "2024-01-21T00:00:00Z",
          },
          {
            id: "9",
            customer_code: "CUST0009",
            full_name: "Công ty TNHH VWX",
            phone: "0444555667",
            email: "vwx@company.com",
            address: "369 Sư Vạn Hạnh, Q10, TP.HCM",
            branch_id: "2",
            total_balance: 28000000,
            last_transaction_date: "2024-01-20T00:00:00Z",
            is_active: true,
            created_at: "2024-01-09T00:00:00Z",
            updated_at: "2024-01-20T00:00:00Z",
          },
          {
            id: "10",
            customer_code: "CUST0010",
            full_name: "Công ty CP YZA",
            phone: "0777888998",
            email: "yza@company.com",
            address: "741 3/2, Q10, TP.HCM",
            branch_id: "3",
            total_balance: 25000000,
            last_transaction_date: "2024-01-19T00:00:00Z",
            is_active: true,
            created_at: "2024-01-10T00:00:00Z",
            updated_at: "2024-01-19T00:00:00Z",
          },
        ],
      },
      error: null,
    };
  },
};

// Export all services
export const databaseService = {
  customers: customerService,
  transactions: transactionService,
  bankAccounts: bankAccountService,
  branches: branchService,
  dashboard: dashboardService,
};
