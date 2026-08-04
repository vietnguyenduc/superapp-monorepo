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
    errors.push("customer_code is required and must be a non-empty string");
  }

  const fullName = data.full_name;
  if (typeof fullName !== "string" || fullName.trim() === "") {
    errors.push("full_name is required and must be a non-empty string");
  }

  const email = data.email;
  if (typeof email === "string" && email.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("email must be a valid email address");
    }
  }

  const phone = data.phone;
  if (typeof phone === "string" && phone.trim() !== "") {
    const phoneRegex = /^[+\d\s()-]+$/;
    const digitCount = (phone.match(/\d/g) || []).length;
    if (!phoneRegex.test(phone) || digitCount < 7) {
      errors.push("phone must be a valid phone number");
    }
  }

  const openingBalance = data.opening_balance;
  if (openingBalance !== undefined && openingBalance !== null) {
    if (typeof openingBalance !== "number" || isNaN(openingBalance)) {
      errors.push("opening_balance must be a valid number");
    }
  }

  const totalBalance = data.total_balance;
  if (totalBalance !== undefined && totalBalance !== null) {
    if (typeof totalBalance !== "number" || isNaN(totalBalance)) {
      errors.push("total_balance must be a valid number");
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
    errors.push("transaction_code is required and must be a non-empty string");
  }

  const transactionType = data.transaction_type;
  if (typeof transactionType !== "string") {
    errors.push("transaction_type is required and must be a string");
  }

  const amount = data.amount;
  if (amount === undefined || amount === null || typeof amount !== "number" || isNaN(amount)) {
    errors.push("amount is required and must be a valid number");
  }

  const transactionDate = data.transaction_date;
  if (typeof transactionDate !== "string" || transactionDate.trim() === "") {
    errors.push("transaction_date is required and must be a string");
  }

  const validTypes = ["payment", "charge", "refund", "adjustment"];
  if (typeof transactionType === "string" && !validTypes.includes(transactionType)) {
    errors.push(`transaction_type must be one of: ${validTypes.join(", ")}`);
  }

  const customerId = data.customer_id;
  if (customerId !== undefined && customerId !== null && typeof customerId !== "string") {
    errors.push("customer_id must be a string if provided");
  }

  const bankAccountId = data.bank_account_id;
  if (bankAccountId !== undefined && bankAccountId !== null && typeof bankAccountId !== "string") {
    errors.push("bank_account_id must be a string if provided");
  }

  const branchId = data.branch_id;
  if (branchId !== undefined && branchId !== null && typeof branchId !== "string") {
    errors.push("branch_id must be a string if provided");
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
      errors.push("transaction_code must be a non-empty string");
    }
  }

  if (data.transaction_type !== undefined) {
    const transactionType = data.transaction_type;
    if (typeof transactionType !== "string") {
      errors.push("transaction_type must be a string");
    } else {
      const validTypes = ["payment", "charge", "refund", "adjustment"];
      if (!validTypes.includes(transactionType)) {
        errors.push(`transaction_type must be one of: ${validTypes.join(", ")}`);
      }
    }
  }

  if (data.amount !== undefined) {
    const amount = data.amount;
    if (typeof amount !== "number" || isNaN(amount)) {
      errors.push("amount must be a valid number");
    }
  }

  if (data.transaction_date !== undefined) {
    const transactionDate = data.transaction_date;
    if (typeof transactionDate !== "string" || transactionDate.trim() === "") {
      errors.push("transaction_date must be a non-empty string");
    }
  }

  if (data.customer_id !== undefined && data.customer_id !== null && typeof data.customer_id !== "string") {
    errors.push("customer_id must be a string or null");
  }

  if (data.bank_account_id !== undefined && data.bank_account_id !== null && typeof data.bank_account_id !== "string") {
    errors.push("bank_account_id must be a string or null");
  }

  if (data.branch_id !== undefined && data.branch_id !== null && typeof data.branch_id !== "string") {
    errors.push("branch_id must be a string or null");
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
    errors.push("account_name is required and must be a non-empty string");
  }

  const accountNumber = data.account_number;
  if (typeof accountNumber !== "string" || accountNumber.trim() === "") {
    errors.push("account_number is required and must be a non-empty string");
  }

  const bankName = data.bank_name;
  if (typeof bankName !== "string" || bankName.trim() === "") {
    errors.push("bank_name is required and must be a non-empty string");
  }

  const balance = data.balance;
  if (balance !== undefined && balance !== null) {
    if (typeof balance !== "number" || isNaN(balance)) {
      errors.push("balance must be a valid number");
    }
  }

  const isActive = data.is_active;
  if (isActive !== undefined && isActive !== null && typeof isActive !== "boolean") {
    errors.push("is_active must be a boolean");
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
    errors.push("name is required and must be a non-empty string");
  }

  const code = data.code;
  if (typeof code !== "string" || code.trim() === "") {
    errors.push("code is required and must be a non-empty string");
  }

  const isActive = data.is_active;
  if (isActive !== undefined && isActive !== null && typeof isActive !== "boolean") {
    errors.push("is_active must be a boolean");
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
    errors.push("name is required and must be a non-empty string");
  }

  const validImpactTypes = ["increase", "decrease"];
  const impactType = data.impact_type;
  if (typeof impactType === "string" && !validImpactTypes.includes(impactType)) {
    errors.push(`impact_type must be one of: ${validImpactTypes.join(", ")}`);
  }

  const mathFactor = data.math_factor;
  if (mathFactor !== undefined && mathFactor !== null) {
    if (mathFactor !== -1 && mathFactor !== 1) {
      errors.push("math_factor must be either -1 or 1");
    }
  }

  const color = data.color;
  if (typeof color === "string" && color.trim() !== "") {
    const colorRegex = /^(#[0-9A-Fa-f]{3}|#[0-9A-Fa-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\)|rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)|[a-zA-Z]+)$/;
    if (!colorRegex.test(color)) {
      errors.push("color must be a valid CSS color");
    }
  }

  const isActive = data.is_active;
  if (isActive !== undefined && isActive !== null && typeof isActive !== "boolean") {
    errors.push("is_active must be a boolean");
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
    errors.push("backup_name is required and must be a non-empty string");
  }

  const backupVersion = data.backup_version;
  if (typeof backupVersion !== "string" || backupVersion.trim() === "") {
    errors.push("backup_version is required and must be a non-empty string");
  }

  const backupTimestamp = data.backup_timestamp;
  if (typeof backupTimestamp !== "string" || backupTimestamp.trim() === "") {
    errors.push("backup_timestamp is required and must be a string");
  }

  const backupFormat = data.backup_format;
  if (typeof backupFormat !== "string" || backupFormat.trim() === "") {
    errors.push("backup_format is required and must be a string");
  }

  const backupSize = data.backup_size;
  if (backupSize !== undefined && backupSize !== null) {
    if (typeof backupSize !== "number" || isNaN(backupSize)) {
      errors.push("backup_size must be a valid number");
    }
  }

  const totalCustomers = data.total_customers;
  if (totalCustomers !== undefined && totalCustomers !== null) {
    if (typeof totalCustomers !== "number" || isNaN(totalCustomers)) {
      errors.push("total_customers must be a valid number");
    }
  }

  const totalTransactions = data.total_transactions;
  if (totalTransactions !== undefined && totalTransactions !== null) {
    if (typeof totalTransactions !== "number" || isNaN(totalTransactions)) {
      errors.push("total_transactions must be a valid number");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
