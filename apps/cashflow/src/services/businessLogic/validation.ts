// Shared Validation Functions
// Pure functions for validating data - no data source dependencies

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Customer Validation
export function validateCustomerData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.customer_code || typeof data.customer_code !== "string" || data.customer_code.trim() === "") {
    errors.push("customer_code is required and must be a non-empty string");
  }
  
  if (!data.full_name || typeof data.full_name !== "string" || data.full_name.trim() === "") {
    errors.push("full_name is required and must be a non-empty string");
  }
  
  // Optional fields with format validation
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("email must be a valid email address");
    }
  }
  
  // Numeric fields
  if (data.opening_balance !== undefined && data.opening_balance !== null) {
    if (typeof data.opening_balance !== "number" || isNaN(data.opening_balance)) {
      errors.push("opening_balance must be a valid number");
    }
  }
  
  if (data.total_balance !== undefined && data.total_balance !== null) {
    if (typeof data.total_balance !== "number" || isNaN(data.total_balance)) {
      errors.push("total_balance must be a valid number");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Transaction Validation
export function validateTransactionData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.transaction_code || typeof data.transaction_code !== "string" || data.transaction_code.trim() === "") {
    errors.push("transaction_code is required and must be a non-empty string");
  }
  
  if (!data.transaction_type || typeof data.transaction_type !== "string") {
    errors.push("transaction_type is required and must be a string");
  }
  
  if (data.amount === undefined || data.amount === null || typeof data.amount !== "number" || isNaN(data.amount)) {
    errors.push("amount is required and must be a valid number");
  }
  
  if (!data.transaction_date || typeof data.transaction_date !== "string") {
    errors.push("transaction_date is required and must be a string");
  }
  
  // Valid transaction types
  const validTypes = ["payment", "charge", "refund", "adjustment"];
  if (data.transaction_type && !validTypes.includes(data.transaction_type)) {
    errors.push(`transaction_type must be one of: ${validTypes.join(", ")}`);
  }
  
  // Optional fields
  if (data.customer_id && typeof data.customer_id !== "string") {
    errors.push("customer_id must be a string if provided");
  }
  
  if (data.bank_account_id && typeof data.bank_account_id !== "string") {
    errors.push("bank_account_id must be a string if provided");
  }
  
  if (data.branch_id && typeof data.branch_id !== "string") {
    errors.push("branch_id must be a string if provided");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Bank Account Validation
export function validateBankAccountData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.account_name || typeof data.account_name !== "string" || data.account_name.trim() === "") {
    errors.push("account_name is required and must be a non-empty string");
  }
  
  if (!data.account_number || typeof data.account_number !== "string" || data.account_number.trim() === "") {
    errors.push("account_number is required and must be a non-empty string");
  }
  
  if (!data.bank_name || typeof data.bank_name !== "string" || data.bank_name.trim() === "") {
    errors.push("bank_name is required and must be a non-empty string");
  }
  
  // Numeric fields
  if (data.balance !== undefined && data.balance !== null) {
    if (typeof data.balance !== "number" || isNaN(data.balance)) {
      errors.push("balance must be a valid number");
    }
  }
  
  // Boolean fields
  if (data.is_active !== undefined && typeof data.is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Branch Validation
export function validateBranchData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push("name is required and must be a non-empty string");
  }
  
  if (!data.code || typeof data.code !== "string" || data.code.trim() === "") {
    errors.push("code is required and must be a non-empty string");
  }
  
  // Boolean fields
  if (data.is_active !== undefined && typeof data.is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Transaction Type Validation
export function validateTransactionTypeData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push("name is required and must be a non-empty string");
  }
  
  // Valid impact types
  const validImpactTypes = ["increase", "decrease"];
  if (data.impact_type && !validImpactTypes.includes(data.impact_type)) {
    errors.push(`impact_type must be one of: ${validImpactTypes.join(", ")}`);
  }
  
  // Math factor must be -1 or 1
  if (data.math_factor !== undefined && data.math_factor !== null) {
    if (data.math_factor !== -1 && data.math_factor !== 1) {
      errors.push("math_factor must be either -1 or 1");
    }
  }
  
  // Color validation (basic CSS color check)
  if (data.color) {
    const colorRegex = /^(#[0-9A-Fa-f]{3}|#[0-9A-Fa-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\)|rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)|[a-zA-Z]+)$/;
    if (!colorRegex.test(data.color)) {
      errors.push("color must be a valid CSS color");
    }
  }
  
  // Boolean fields
  if (data.is_active !== undefined && typeof data.is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Backup History Validation
export function validateBackupHistoryData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.backup_name || typeof data.backup_name !== "string" || data.backup_name.trim() === "") {
    errors.push("backup_name is required and must be a non-empty string");
  }
  
  if (!data.backup_version || typeof data.backup_version !== "string" || data.backup_version.trim() === "") {
    errors.push("backup_version is required and must be a non-empty string");
  }
  
  if (!data.backup_timestamp || typeof data.backup_timestamp !== "string") {
    errors.push("backup_timestamp is required and must be a string");
  }
  
  if (!data.backup_format || typeof data.backup_format !== "string") {
    errors.push("backup_format is required and must be a string");
  }
  
  // Numeric fields
  if (data.backup_size !== undefined && data.backup_size !== null) {
    if (typeof data.backup_size !== "number" || isNaN(data.backup_size)) {
      errors.push("backup_size must be a valid number");
    }
  }
  
  // Numeric metadata fields
  if (data.total_customers !== undefined && data.total_customers !== null) {
    if (typeof data.total_customers !== "number" || isNaN(data.total_customers)) {
      errors.push("total_customers must be a valid number");
    }
  }
  
  if (data.total_transactions !== undefined && data.total_transactions !== null) {
    if (typeof data.total_transactions !== "number" || isNaN(data.total_transactions)) {
      errors.push("total_transactions must be a valid number");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
