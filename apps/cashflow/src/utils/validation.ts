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

// Email validation
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Invalid email format";
  return null;
};

// Password validation
export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

// Phone validation
export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (phone && !phoneRegex.test(phone.replace(/\s/g, ""))) {
    return "Invalid phone number format";
  }
  return null;
};

// Amount validation
export const validateAmount = (amount: number | string): string | null => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "Amount must be a valid number";
  if (numAmount < 0) return "Amount cannot be negative";
  if (numAmount > 999999999.99) return "Amount is too large";
  return null;
};

// Required field validation
export const validateRequired = (
  value: any,
  fieldName: string,
): string | null => {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return `${fieldName} is required`;
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
    return `${fieldName} must be at least ${min} characters`;
  if (value.length > max)
    return `${fieldName} must be no more than ${max} characters`;
  return null;
};

// Date validation
export const validateDate = (date: string): string | null => {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "Invalid date format";
  if (dateObj > new Date()) return "Date cannot be in the future";
  return null;
};

// Customer validation
export const validateCustomer = (customer: any): ValidationResult => {
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
export const validateTransaction = (transaction: any): ValidationResult => {
  const errors: string[] = [];

  const customerError = validateRequired(transaction.customer_id, "Customer");
  if (customerError) errors.push(customerError);

  const bankAccountError = validateRequired(
    transaction.bank_account_id,
    "Bank account",
  );
  if (bankAccountError) errors.push(bankAccountError);

  const amountError = validateAmount(transaction.amount);
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
  value: any,
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
      return `${fieldName} format is invalid`;
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
  data: Record<string, any>,
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
  data: any[],
  requiredColumns: string[],
): ValidationResult => {
  const errors: string[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: ["No data to validate"],
    };
  }

  // Check required columns
  const firstRow = data[0];
  const missingColumns = requiredColumns.filter((col) => !(col in firstRow));
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  // Validate each row
  data.forEach((row, index) => {
    requiredColumns.forEach((column) => {
      if (
        row[column] === undefined ||
        row[column] === null ||
        row[column] === ""
      ) {
        errors.push(`Row ${index + 1}: ${column} is required`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
