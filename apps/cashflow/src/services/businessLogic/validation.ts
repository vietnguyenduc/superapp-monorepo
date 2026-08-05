// Shared Validation Functions
// Pure functions for validating data - no data source dependencies

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Customer Validation
export function validateCustomerData(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  const customerCode = data.customer_code;
  if (typeof customerCode !== "string" || customerCode.trim() === "") {
    errors.push("Mã khách hàng là bắt buộc và phải là chuỗi không rỗng");
  }

  const fullName = data.full_name;
  if (typeof fullName !== "string" || fullName.trim() === "") {
    errors.push("Họ và tên là bắt buộc và phải là chuỗi không rỗng");
  }

  const email = data.email;
  if (typeof email === "string" && email.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Email phải đúng định dạng");
    }
  }

  const phone = data.phone;
  if (typeof phone === "string" && phone.trim() !== "") {
    const phoneRegex = /^[+\d\s()-]+$/;
    const digitCount = (phone.match(/\d/g) || []).length;
    if (!phoneRegex.test(phone) || digitCount < 7) {
      errors.push("Số điện thoại phải hợp lệ (ít nhất 7 chữ số)");
    }
  }

  const openingBalance = data.opening_balance;
  if (openingBalance !== undefined && openingBalance !== null) {
    if (typeof openingBalance !== "number" || isNaN(openingBalance)) {
      errors.push("Số dư đầu kỳ phải là số hợp lệ");
    }
  }

  const totalBalance = data.total_balance;
  if (totalBalance !== undefined && totalBalance !== null) {
    if (typeof totalBalance !== "number" || isNaN(totalBalance)) {
      errors.push("Tổng số dư phải là số hợp lệ");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Transaction Validation
export function validateTransactionData(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  const transactionCode = data.transaction_code;
  if (typeof transactionCode !== "string" || transactionCode.trim() === "") {
    errors.push("Mã giao dịch là bắt buộc và phải là chuỗi không rỗng");
  }

  const transactionType = data.transaction_type;
  if (typeof transactionType !== "string") {
    errors.push("Loại giao dịch là bắt buộc");
  }

  const amount = data.amount;
  if (amount === undefined || amount === null || typeof amount !== "number" || isNaN(amount)) {
    errors.push("Số tiền là bắt buộc và phải là số hợp lệ");
  }

  const transactionDate = data.transaction_date;
  if (typeof transactionDate !== "string" || transactionDate.trim() === "") {
    errors.push("Ngày giao dịch là bắt buộc");
  }

  const validTypes = ["payment", "charge", "refund", "adjustment"];
  if (typeof transactionType === "string" && !validTypes.includes(transactionType)) {
    errors.push(`Loại giao dịch phải là một trong: ${validTypes.join(", ")}`);
  }

  const customerId = data.customer_id;
  if (customerId !== undefined && customerId !== null && typeof customerId !== "string") {
    errors.push("Mã khách hàng phải là chuỗi");
  }

  const bankAccountId = data.bank_account_id;
  if (bankAccountId !== undefined && bankAccountId !== null && typeof bankAccountId !== "string") {
    errors.push("Mã tài khoản ngân hàng phải là chuỗi");
  }

  const branchId = data.branch_id;
  if (branchId !== undefined && branchId !== null && typeof branchId !== "string") {
    errors.push("Mã chi nhánh phải là chuỗi");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Transaction Validation for partial updates (e.g. status changes or edit forms).
// Only validates the fields that are actually supplied, allowing callers to update
// a subset of the record without re-sending every required field.
export function validateTransactionUpdateData(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (data.transaction_code !== undefined) {
    const transactionCode = data.transaction_code;
    if (typeof transactionCode !== "string" || transactionCode.trim() === "") {
      errors.push("Mã giao dịch phải là chuỗi không rỗng");
    }
  }

  if (data.transaction_type !== undefined) {
    const transactionType = data.transaction_type;
    if (typeof transactionType !== "string") {
      errors.push("Loại giao dịch phải là chuỗi");
    } else {
      const validTypes = ["payment", "charge", "refund", "adjustment"];
      if (!validTypes.includes(transactionType)) {
        errors.push(`Loại giao dịch phải là một trong: ${validTypes.join(", ")}`);
      }
    }
  }

  if (data.amount !== undefined) {
    const amount = data.amount;
    if (typeof amount !== "number" || isNaN(amount)) {
      errors.push("Số tiền phải là số hợp lệ");
    }
  }

  if (data.transaction_date !== undefined) {
    const transactionDate = data.transaction_date;
    if (typeof transactionDate !== "string" || transactionDate.trim() === "") {
      errors.push("Ngày giao dịch phải là chuỗi không rỗng");
    }
  }

  if (data.customer_id !== undefined && data.customer_id !== null && typeof data.customer_id !== "string") {
    errors.push("Mã khách hàng phải là chuỗi hoặc null");
  }

  if (data.bank_account_id !== undefined && data.bank_account_id !== null && typeof data.bank_account_id !== "string") {
    errors.push("Mã tài khoản ngân hàng phải là chuỗi hoặc null");
  }

  if (data.branch_id !== undefined && data.branch_id !== null && typeof data.branch_id !== "string") {
    errors.push("Mã chi nhánh phải là chuỗi hoặc null");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Bank Account Validation
export function validateBankAccountData(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  const accountName = data.account_name;
  if (typeof accountName !== "string" || accountName.trim() === "") {
    errors.push("Tên tài khoản là bắt buộc và phải là chuỗi không rỗng");
  }

  const accountNumber = data.account_number;
  if (typeof accountNumber !== "string" || accountNumber.trim() === "") {
    errors.push("Số tài khoản là bắt buộc và phải là chuỗi không rỗng");
  }

  const bankName = data.bank_name;
  if (typeof bankName !== "string" || bankName.trim() === "") {
    errors.push("Tên ngân hàng là bắt buộc và phải là chuỗi không rỗng");
  }

  const balance = data.balance;
  if (balance !== undefined && balance !== null) {
    if (typeof balance !== "number" || isNaN(balance)) {
      errors.push("Số dư phải là số hợp lệ");
    }
  }

  const isActive = data.is_active;
  if (isActive !== undefined && isActive !== null && typeof isActive !== "boolean") {
    errors.push("Trạng thái hoạt động phải là true/false");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Branch Validation
export function validateBranchData(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  const name = data.name;
  if (typeof name !== "string" || name.trim() === "") {
    errors.push("Tên chi nhánh là bắt buộc và phải là chuỗi không rỗng");
  }

  const code = data.code;
  if (typeof code !== "string" || code.trim() === "") {
    errors.push("Mã chi nhánh là bắt buộc và phải là chuỗi không rỗng");
  }

  const isActive = data.is_active;
  if (isActive !== undefined && isActive !== null && typeof isActive !== "boolean") {
    errors.push("Trạng thái hoạt động phải là true/false");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Transaction Type Validation
export function validateTransactionTypeData(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  const name = data.name;
  if (typeof name !== "string" || name.trim() === "") {
    errors.push("Tên loại giao dịch là bắt buộc và phải là chuỗi không rỗng");
  }

  const validImpactTypes = ["increase", "decrease"];
  const impactType = data.impact_type;
  if (typeof impactType === "string" && !validImpactTypes.includes(impactType)) {
    errors.push(`Ảnh hưởng dư nợ phải là một trong: ${validImpactTypes.join(", ")}`);
  }

  const mathFactor = data.math_factor;
  if (mathFactor !== undefined && mathFactor !== null) {
    if (mathFactor !== -1 && mathFactor !== 1) {
      errors.push("Hệ số tính toán phải là -1 hoặc 1");
    }
  }

  const color = data.color;
  if (typeof color === "string" && color.trim() !== "") {
    const colorRegex = /^(#[0-9A-Fa-f]{3}|#[0-9A-Fa-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\)|rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)|[a-zA-Z]+)$/;
    if (!colorRegex.test(color)) {
      errors.push("Màu sắc phải là mã màu CSS hợp lệ");
    }
  }

  const isActive = data.is_active;
  if (isActive !== undefined && isActive !== null && typeof isActive !== "boolean") {
    errors.push("Trạng thái hoạt động phải là true/false");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Backup History Validation
export function validateBackupHistoryData(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  const backupName = data.backup_name;
  if (typeof backupName !== "string" || backupName.trim() === "") {
    errors.push("Tên bản sao lưu là bắt buộc");
  }

  const backupVersion = data.backup_version;
  if (typeof backupVersion !== "string" || backupVersion.trim() === "") {
    errors.push("Phiên bản sao lưu là bắt buộc");
  }

  const backupTimestamp = data.backup_timestamp;
  if (typeof backupTimestamp !== "string" || backupTimestamp.trim() === "") {
    errors.push("Thời gian sao lưu là bắt buộc");
  }

  const backupFormat = data.backup_format;
  if (typeof backupFormat !== "string" || backupFormat.trim() === "") {
    errors.push("Định dạng sao lưu là bắt buộc");
  }

  const backupSize = data.backup_size;
  if (backupSize !== undefined && backupSize !== null) {
    if (typeof backupSize !== "number" || isNaN(backupSize)) {
      errors.push("Dung lượng sao lưu phải là số hợp lệ");
    }
  }

  const totalCustomers = data.total_customers;
  if (totalCustomers !== undefined && totalCustomers !== null) {
    if (typeof totalCustomers !== "number" || isNaN(totalCustomers)) {
      errors.push("Tổng số khách hàng phải là số hợp lệ");
    }
  }

  const totalTransactions = data.total_transactions;
  if (totalTransactions !== undefined && totalTransactions !== null) {
    if (typeof totalTransactions !== "number" || isNaN(totalTransactions)) {
      errors.push("Tổng số giao dịch phải là số hợp lệ");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
