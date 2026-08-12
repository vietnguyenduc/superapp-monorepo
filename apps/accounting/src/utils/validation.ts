// Validation utility functions

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Customer data interface for validation
export interface CustomerValidationData {
  full_name?: string;
  email?: string;
  phone?: string;
  branch_id?: string | null;
}

// Transaction data interface for validation
export interface TransactionValidationData {
  customer_id?: string | null;
  bank_account_id?: string | null;
  amount?: number | string;
  transaction_type?: string;
  transaction_date?: string;
}

// Email validation
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email là bắt buộc";
  if (!emailRegex.test(email)) return "Email không đúng định dạng";
  return null;
};

// Password validation
export const validatePassword = (password: string): string | null => {
  if (!password) return "Mật khẩu là bắt buộc";
  if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
  return null;
};

// Phone validation
export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (phone && !phoneRegex.test(phone.replace(/\s/g, ""))) {
    return "Số điện thoại không đúng định dạng";
  }
  return null;
};

// Amount validation
export const validateAmount = (amount: number | string): string | null => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "Số tiền không đúng định dạng";
  if (numAmount < 0) return "Số tiền không được âm";
  if (numAmount > 999999999.99) return "Số tiền quá lớn";
  return null;
};

// Required field validation
export const validateRequired = (
  value: unknown,
  fieldName: string,
): string | null => {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return `${fieldName} là bắt buộc`;
  }
  return null;
};

// Length validation
export const validateLength = (
  value: string,
  min: number,
  max: number,
  fieldName: string,
): string | null => {
  if (value.length < min)
    return `${fieldName} phải có ít nhất ${min} ký tự`;
  if (value.length > max)
    return `${fieldName} không được vượt quá ${max} ký tự`;
  return null;
};

// Date validation
export const validateDate = (date: string): string | null => {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "Ngày không đúng định dạng";
  if (dateObj > new Date()) return "Ngày không được trong tương lai";
  return null;
};

// Customer validation
export const validateCustomer = (customer: CustomerValidationData): ValidationResult => {
  const errors: string[] = [];

  const nameError = validateRequired(customer.full_name, "Full name");
  if (nameError) errors.push(nameError);

  if (customer.email) {
    const emailError = validateEmail(customer.email);
    if (emailError) errors.push(emailError);
  }

  if (customer.phone) {
    const phoneError = validatePhone(customer.phone);
    if (phoneError) errors.push(phoneError);
  }

  const branchError = validateRequired(customer.branch_id, "Branch");
  if (branchError) errors.push(branchError);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Transaction validation
export const validateTransaction = (transaction: TransactionValidationData): ValidationResult => {
  const errors: string[] = [];

  const customerError = validateRequired(transaction.customer_id, "Customer");
  if (customerError) errors.push(customerError);

  const bankAccountError = validateRequired(
    transaction.bank_account_id,
    "Bank account",
  );
  if (bankAccountError) errors.push(bankAccountError);

  const amountError = transaction.amount !== undefined ? validateAmount(transaction.amount) : "Số tiền là bắt buộc";
  if (amountError) errors.push(amountError);

  const typeError = validateRequired(
    transaction.transaction_type,
    "Transaction type",
  );
  if (typeError) errors.push(typeError);

  if (transaction.transaction_date) {
    const dateError = validateDate(transaction.transaction_date);
    if (dateError) errors.push(dateError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Generic field validation
export const validateField = (
  value: unknown,
  rules: ValidationRule,
  fieldName: string,
): string | null => {
  // Required validation
  if (rules.required) {
    const requiredError = validateRequired(value, fieldName);
    if (requiredError) return requiredError;
  }

  // Skip other validations if value is empty and not required
  if (!value && !rules.required) return null;

  // Length validation
  if (typeof value === "string") {
    if (rules.minLength) {
      const minError = validateLength(
        value,
        rules.minLength,
        Infinity,
        fieldName,
      );
      if (minError) return minError;
    }
    if (rules.maxLength) {
      const maxError = validateLength(value, 0, rules.maxLength, fieldName);
      if (maxError) return maxError;
    }
  }

  // Pattern validation
  if (rules.pattern && typeof value === "string") {
    if (!rules.pattern.test(value)) {
      return `${fieldName} không đúng định dạng`;
    }
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) return customError;
  }

  return null;
};

// Form validation helper
export const validateForm = (
  data: Record<string, unknown>,
  rules: Record<string, ValidationRule>,
): ValidationResult => {
  const errors: string[] = [];

  Object.keys(rules).forEach((fieldName) => {
    const fieldRules = rules[fieldName];
    const fieldValue = data[fieldName];
    const fieldError = validateField(fieldValue, fieldRules, fieldName);
    if (fieldError) errors.push(fieldError);
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Import data validation
export const validateImportData = (
  data: unknown[],
  requiredColumns: string[],
): ValidationResult => {
  const errors: string[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: ["Không có dữ liệu để kiểm tra"],
    };
  }

  // Check required columns
  const firstRow = data[0];
  const missingColumns = requiredColumns.filter((col) => !(col in firstRow));
  if (missingColumns.length > 0) {
    errors.push(`Thiếu các cột bắt buộc: ${missingColumns.join(", ")}`);
  }

  // Validate each row
  data.forEach((row, index) => {
    requiredColumns.forEach((column) => {
      if (
        row[column] === undefined ||
        row[column] === null ||
        row[column] === ""
      ) {
        errors.push(`Dòng ${index + 1}: ${column} là bắt buộc`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
