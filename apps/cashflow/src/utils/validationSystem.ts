import { ImportError } from "../types";
import {
  cleanTransactionType,
  cleanAmount,
  cleanPhoneNumber,
  cleanEmail,
} from "./dataCleaning";

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?:
    | "string"
    | "number"
    | "date"
    | "email"
    | "phone"
    | "transaction_type"
    | "amount";
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: RegExp;
  customValidator?: (value: any, row: any, rowIndex: number) => string | null;
  allowedValues?: string[];
  unique?: boolean;
  dependsOn?: string;
  conditional?: (row: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    errorsByField: Record<string, number>;
    errorsByRow: Record<number, number>;
  };
}

export interface ValidationContext {
  existingData?: any[];
  branchId?: string;
  userId?: string;
  customValidators?: Record<
    string,
    (value: any, row: any, rowIndex: number) => string | null
  >;
}

/**
 * Validate a single value against a rule
 */
function validateValue(
  value: any,
  rule: ValidationRule,
  row: any,
  rowIndex: number,
  context?: ValidationContext,
): string | null {
  const {
    field,
    required,
    type,
    minLength,
    maxLength,
    minValue,
    maxValue,
    pattern,
    customValidator,
    allowedValues,
    unique,
    dependsOn,
    conditional,
  } = rule;

  // Check if validation should be skipped based on conditional
  if (conditional && !conditional(row)) {
    return null;
  }

  // Check dependencies
  if (dependsOn && !row[dependsOn]) {
    return null; // Skip validation if dependency is not met
  }

  // Required field validation
  if (
    required &&
    (!value || (typeof value === "string" && value.trim() === ""))
  ) {
    return `${field} is required`;
  }

  // Skip further validation if value is empty and not required
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return null;
  }

  // Type validation
  if (type) {
    const typeError = validateType(value, type, field);
    if (typeError) return typeError;
  }

  // Length validation
  if (typeof value === "string") {
    if (minLength && value.length < minLength) {
      return `${field} must be at least ${minLength} characters`;
    }
    if (maxLength && value.length > maxLength) {
      return `${field} must be no more than ${maxLength} characters`;
    }
  }

  // Numeric value validation
  if (typeof value === "number" || !isNaN(Number(value))) {
    const numValue = typeof value === "number" ? value : Number(value);
    if (minValue !== undefined && numValue < minValue) {
      return `${field} must be at least ${minValue}`;
    }
    if (maxValue !== undefined && numValue > maxValue) {
      return `${field} must be no more than ${maxValue}`;
    }
  }

  // Pattern validation
  if (pattern && typeof value === "string" && !pattern.test(value)) {
    return `${field} format is invalid`;
  }

  // Allowed values validation
  if (allowedValues && !allowedValues.includes(value)) {
    return `${field} must be one of: ${allowedValues.join(", ")}`;
  }

  // Custom validator
  if (customValidator) {
    const customError = customValidator(value, row, rowIndex);
    if (customError) return customError;
  }

  // Context custom validators
  if (context?.customValidators?.[field]) {
    const contextError = context.customValidators[field](value, row, rowIndex);
    if (contextError) return contextError;
  }

  // Uniqueness validation
  if (unique && context?.existingData) {
    const isDuplicate = context.existingData.some(
      (existingRow, existingIndex) =>
        existingIndex !== rowIndex && existingRow[field] === value,
    );
    if (isDuplicate) {
      return `${field} must be unique`;
    }
  }

  return null;
}

/**
 * Validate value type
 */
function validateType(value: any, type: string, field: string): string | null {
  switch (type) {
    case "string":
      if (typeof value !== "string") {
        return `${field} must be a string`;
      }
      break;

    case "number":
      if (isNaN(Number(value))) {
        return `${field} must be a number`;
      }
      break;

    case "date":
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return `${field} must be a valid date`;
      }
      if (date > new Date()) {
        return `${field} cannot be in the future`;
      }
      break;

    case "email":
      if (typeof value === "string") {
        const email = cleanEmail(value);
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          return `${field} must be a valid email address`;
        }
      }
      break;

    case "phone":
      if (typeof value === "string") {
        const phone = cleanPhoneNumber(value);
        if (phone.length < 10 || phone.length > 15) {
          return `${field} must be a valid phone number`;
        }
      }
      break;

    case "transaction_type":
      if (typeof value === "string") {
        const cleanedType = cleanTransactionType(value);
        if (!cleanedType) {
          return `${field} must be a valid transaction type (payment, charge, adjustment, refund)`;
        }
      }
      break;

    case "amount":
      if (typeof value === "string") {
        const cleanedAmount = cleanAmount(value);
        if (cleanedAmount === null) {
          return `${field} must be a valid amount`;
        }
        if (cleanedAmount <= 0) {
          return `${field} must be greater than 0`;
        }
      }
      break;
  }

  return null;
}

/**
 * Validate entire dataset against rules
 */
export function validateDataset(
  data: any[],
  rules: ValidationRule[],
  context?: ValidationContext,
): ValidationResult {
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [];
  const errorsByField: Record<string, number> = {};
  const errorsByRow: Record<number, number> = {};

  data.forEach((row, rowIndex) => {
    let rowErrors = 0;

    rules.forEach((rule) => {
      const value = row[rule.field];
      const error = validateValue(value, rule, row, rowIndex, context);

      if (error) {
        const importError: ImportError = {
          row: rowIndex,
          column: rule.field,
          message: error,
          value: value,
        };

        // Determine if it's an error or warning based on rule severity
        if (rule.required || rule.type) {
          errors.push(importError);
          errorsByField[rule.field] = (errorsByField[rule.field] || 0) + 1;
          rowErrors++;
        } else {
          warnings.push(importError);
        }
      }
    });

    if (rowErrors > 0) {
      errorsByRow[rowIndex] = rowErrors;
    }
  });

  const totalErrors = errors.length;
  const totalWarnings = warnings.length;

  return {
    isValid: totalErrors === 0,
    errors,
    warnings,
    summary: {
      totalErrors,
      totalWarnings,
      errorsByField,
      errorsByRow,
    },
  };
}

/**
 * Predefined validation rules for common scenarios
 */
export const ValidationRules = {
  // Transaction validation rules
  transaction: [
    {
      field: "customer_name",
      required: true,
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    {
      field: "bank_account",
      required: true,
      type: "string",
      minLength: 1,
      maxLength: 50,
    },
    {
      field: "transaction_type",
      required: true,
      type: "transaction_type",
    },
    {
      field: "amount",
      required: true,
      type: "amount",
      minValue: 0.01,
    },
    {
      field: "transaction_date",
      required: true,
      type: "date",
    },
    {
      field: "description",
      type: "string",
      maxLength: 500,
    },
    {
      field: "reference_number",
      type: "string",
      maxLength: 100,
    },
  ],

  // Customer validation rules
  customer: [
    {
      field: "full_name",
      required: true,
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    {
      field: "phone",
      type: "phone",
    },
    {
      field: "email",
      type: "email",
    },
    {
      field: "address",
      type: "string",
      maxLength: 200,
    },
    {
      field: "customer_code",
      required: true,
      type: "string",
      minLength: 3,
      maxLength: 20,
      unique: true,
    },
  ],

  // Bank account validation rules
  bankAccount: [
    {
      field: "account_number",
      required: true,
      type: "string",
      minLength: 5,
      maxLength: 30,
    },
    {
      field: "account_name",
      required: true,
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    {
      field: "bank_name",
      required: true,
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    {
      field: "balance",
      type: "number",
      minValue: 0,
    },
  ],
};

/**
 * Real-time validation for single field
 */
export function validateField(
  value: any,
  field: string,
  rules: ValidationRule[],
  row: any,
  rowIndex: number,
  context?: ValidationContext,
): string | null {
  const rule = rules.find((r) => r.field === field);
  if (!rule) return null;

  return validateValue(value, rule, row, rowIndex, context);
}

/**
 * Get validation status for a specific cell
 */
export function getCellValidationStatus(
  rowIndex: number,
  column: string,
  errors: ImportError[],
): "valid" | "error" | "warning" {
  const cellErrors = errors.filter(
    (error) => error.row === rowIndex && error.column === column,
  );

  if (cellErrors.length === 0) return "valid";

  // Check if any are actual errors (not warnings)
  const hasErrors = cellErrors.some(
    (error) =>
      error.message.includes("required") ||
      error.message.includes("must be") ||
      error.message.includes("invalid"),
  );

  return hasErrors ? "error" : "warning";
}

/**
 * Generate validation summary for display
 */
export function generateValidationSummary(result: ValidationResult): {
  status: "valid" | "warning" | "error";
  message: string;
  details: string[];
} {
  const { errors, warnings, summary } = result;

  if (errors.length === 0 && warnings.length === 0) {
    return {
      status: "valid",
      message: "All data is valid",
      details: [],
    };
  }

  if (errors.length === 0 && warnings.length > 0) {
    return {
      status: "warning",
      message: `Data has ${warnings.length} warnings but is valid for import`,
      details: [
        `Total warnings: ${warnings.length}`,
        `Most common issue: ${getMostCommonError(warnings)}`,
      ],
    };
  }

  return {
    status: "error",
    message: `Data has ${errors.length} errors that must be fixed`,
    details: [
      `Total errors: ${errors.length}`,
      `Total warnings: ${warnings.length}`,
      `Most common error: ${getMostCommonError(errors)}`,
      `Rows with errors: ${Object.keys(summary.errorsByRow).length}`,
    ],
  };
}

/**
 * Get most common error message
 */
function getMostCommonError(errors: ImportError[]): string {
  const errorCounts: Record<string, number> = {};

  errors.forEach((error) => {
    const key = error.message;
    errorCounts[key] = (errorCounts[key] || 0) + 1;
  });

  const mostCommon = Object.entries(errorCounts).sort(
    ([, a], [, b]) => b - a,
  )[0];

  return mostCommon
    ? `${mostCommon[0]} (${mostCommon[1]} times)`
    : "Unknown error";
}
