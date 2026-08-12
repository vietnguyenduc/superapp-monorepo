import type { Transaction, ImportError, TransactionType } from "../types";
import { parseFile } from "@superapp/shared-utils";
import { parseAmount, parseDate, normalizeTransactionType } from "../services/businessLogic";

export interface RawTransactionData {
  transaction_code?: string;
  customer_code: string;
  bank_account: string;
  branch?: string;
  transaction_type: string;
  amount: string;
  transaction_date: string;
  description?: string;
  reference_number?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
}

/**
 * Parse raw text data from Google Sheets/Excel into structured data
 */
export function parseTransactionData(rawData: string): RawTransactionData[] {
  const lines = rawData.trim().split("\n");

  if (lines.length === 0) {
    throw new Error("No data provided");
  }

  // Remove empty lines and trim whitespace
  const nonEmptyLines = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (nonEmptyLines.length === 0) {
    throw new Error("No valid data found");
  }

  // Parse each line as tab or comma separated data
  return nonEmptyLines.map((line, index) => {
    const columns = parseLine(line);

    if (columns.length < 5) {
      throw new Error(
        `Row ${index + 1}: Insufficient columns. Expected at least 5 columns.`,
      );
    }

    const hasBranchColumn = columns.length >= 6 && !isTransactionTypeToken(columns[2]);
    const branch = hasBranchColumn ? columns[2]?.trim() || "" : "";
    const transactionTypeIndex = hasBranchColumn ? 3 : 2;
    const amountIndex = hasBranchColumn ? 4 : 3;
    const dateIndex = hasBranchColumn ? 5 : 4;
    const descriptionIndex = hasBranchColumn ? 6 : 5;
    const referenceIndex = hasBranchColumn ? 7 : 6;

    return {
      customer_code: columns[0]?.trim() || "",
      bank_account: columns[1]?.trim() || "",
      branch,
      transaction_type: columns[transactionTypeIndex]?.trim() || "",
      amount: columns[amountIndex]?.trim() || "",
      transaction_date: columns[dateIndex]?.trim() || "",
      description: columns[descriptionIndex]?.trim() || "",
      reference_number: columns[referenceIndex]?.trim() || "",
    };
  });
}

const VALID_TRANSACTION_TYPES: TransactionType[] = ["payment", "charge", "refund", "adjustment", "deposit"];

function isTransactionTypeToken(value?: string): boolean {
  const normalized = normalizeTransactionType(value || "");
  return VALID_TRANSACTION_TYPES.includes(normalized as TransactionType);
}

function normalizeTransactionTypeLabel(value: string): TransactionType | "" {
  const normalized = normalizeTransactionType(value);
  return VALID_TRANSACTION_TYPES.includes(normalized as TransactionType) ? (normalized as TransactionType) : "";
}

/**
 * Parse a single line of data, handling both tab and comma separators
 */
function parseLine(line: string): string[] {
  // First try to split by tabs (Excel format)
  if (line.includes("\t")) {
    return line.split("\t");
  }

  // Then try to split by commas (CSV format)
  if (line.includes(",")) {
    return parseCSVLine(line);
  }

  // If no separators found, treat as single column
  return [line];
}

/**
 * Parse CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}

/**
 * Validate transaction data and return validation results
 */
export function validateTransactionData(
  data: RawTransactionData[],
  validTransactionTypes?: Array<{ id: string; name: string }>,
  validCustomerCodes?: Set<string>,
): ValidationResult {
  const errors: ImportError[] = [];
  const seenCodes = new Map<string, number>();

  // Build lookup sets from DB-provided types (fallback to legacy hardcoded if none provided)
  const validTypeIds = validTransactionTypes ? new Set(validTransactionTypes.map((t) => t.id.toLowerCase().trim())) : null;
  const validTypeNames = validTransactionTypes ? new Set(validTransactionTypes.map((t) => t.name.toLowerCase().trim())) : null;
  const validTypeCanonicals = validTransactionTypes ? new Set(validTransactionTypes.map((t) => (t.canonical || t.name).toLowerCase().trim())) : null;

  data.forEach((row, index) => {
    const normalizedType = normalizeTransactionTypeLabel(row.transaction_type || "");

    // Validate customer code (required)
    const rawCustomerCode = (row.customer_code || "").trim();
    if (!rawCustomerCode) {
      errors.push({
        row: index,
        column: "customer_code",
        message: "Customer code is required",
        value: row.customer_code,
      });
    } else if (validCustomerCodes && validCustomerCodes.size > 0) {
      // Extract code before " - " or first space (handles "CODE - Name" format)
      let parsedCode = rawCustomerCode.toLowerCase();
      const dashIndex = parsedCode.indexOf(" - ");
      if (dashIndex > 0) {
        parsedCode = parsedCode.substring(0, dashIndex).trim();
      } else {
        const spaceIndex = parsedCode.indexOf(" ");
        if (spaceIndex > 0) {
          parsedCode = parsedCode.substring(0, spaceIndex).trim();
        }
      }
      if (!validCustomerCodes.has(parsedCode)) {
        errors.push({
          row: index,
          column: "customer_code",
          message: `Customer code "${rawCustomerCode}" does not exist. Please check existing customers.`,
          value: row.customer_code,
        });
      }
    }

    // Validate transaction code (optional, but must be unique within the import if provided)
    const txnCode = (row.transaction_code || "").trim();
    if (txnCode) {
      if (txnCode.length > 50) {
        errors.push({
          row: index,
          column: "transaction_code",
          message: "Số chứng từ quá dài (tối đa 50 ký tự)",
          value: row.transaction_code,
        });
      } else if (seenCodes.has(txnCode)) {
        const firstRow = seenCodes.get(txnCode)!;
        errors.push({
          row: index,
          column: "transaction_code",
          message: `Số chứng từ "${txnCode}" bị trùng với dòng ${firstRow + 1}`,
          value: row.transaction_code,
        });
      } else {
        seenCodes.set(txnCode, index);
      }
    }

    // Bank account is optional in this flow

    // Validate transaction type
    if (!row.transaction_type || row.transaction_type.trim().length === 0) {
      errors.push({
        row: index,
        column: "transaction_type",
        message: "Transaction type is required",
        value: row.transaction_type,
      });
    } else {
      const rawInput = row.transaction_type.trim().toLowerCase();
      let isValid = false;

      if (validTypeIds && validTypeNames) {
        // DB-driven validation: match by normalized legacy id, type id, type name, or canonical id
        const allValid = [validTypeIds, validTypeNames, validTypeCanonicals];
        if (allValid.some((set) => set?.has(rawInput))) {
          isValid = true;
        } else if (normalizedType && allValid.some((set) => set?.has(normalizedType))) {
          isValid = true;
        }
      } else {
        // Legacy fallback (should not happen when DB is reachable)
        const validTypes: TransactionType[] = ["payment", "charge", "adjustment", "refund", "deposit"];
        isValid = validTypes.includes(normalizedType as TransactionType);
      }

      if (!isValid) {
        const allowedList = validTransactionTypes
          ? validTransactionTypes.map((t) => t.name).join(", ")
          : "payment, charge, adjustment, refund";
        errors.push({
          row: index,
          column: "transaction_type",
          message: `Invalid transaction type. Must be one of: ${allowedList}`,
          value: row.transaction_type,
        });
      }
    }

    // Validate amount
    const amountRaw = String(row.amount ?? "").trim();
    if (!amountRaw) {
      errors.push({
        row: index,
        column: "amount",
        message: "Amount is required",
        value: row.amount,
      });
    } else {
      const amount = parseAmount(amountRaw);
      const isAdjustment = normalizedType === "adjustment";

      if (isNaN(amount) || amount === 0) {
        errors.push({
          row: index,
          column: "amount",
          message: isAdjustment
            ? "Amount must be a non-zero number for adjustment"
            : "Amount must be a non-zero number",
          value: row.amount,
        });
      }
    }

    // Validate transaction date
    if (!row.transaction_date || row.transaction_date.trim().length === 0) {
      errors.push({
        row: index,
        column: "transaction_date",
        message: "Transaction date is required",
        value: row.transaction_date,
      });
    } else {
      const date = parseDate(row.transaction_date);
      if (!date || isNaN(date.getTime())) {
        errors.push({
          row: index,
          column: "transaction_date",
          message: "Định dạng ngày không hợp lệ. Dùng DD/MM/YYYY",
          value: row.transaction_date,
        });
      } else if (date > new Date()) {
        errors.push({
          row: index,
          column: "transaction_date",
          message: "Transaction date cannot be in the future",
          value: row.transaction_date,
        });
      }
    }

    // Validate description (optional but if provided, check length)
    if (row.description && row.description.trim().length > 500) {
      errors.push({
        row: index,
        column: "description",
        message: "Description must be less than 500 characters",
        value: row.description,
      });
    }

    // Validate reference number (optional but if provided, check format)
    if (row.reference_number && row.reference_number.trim().length > 100) {
      errors.push({
        row: index,
        column: "reference_number",
        message: "Reference number must be less than 100 characters",
        value: row.reference_number,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Convert raw transaction data to Transaction objects
 */
export function convertToTransactions(
  rawData: RawTransactionData[],
  branchId: string,
  createdBy: string,
): Partial<Transaction>[] {
  return rawData.map((row) => ({
    id: "", // Will be generated during import
    transaction_code: row.transaction_code?.trim() || "",
    customer_id: "", // Will be resolved during import
    bank_account_id: "", // Will be resolved during import
    branch_id: branchId,
    transaction_type: (normalizeTransactionTypeLabel(row.transaction_type || "") || "payment") as TransactionType,
    amount: parseAmount(row.amount),
    description: row.description?.trim() || "",
    reference_number: row.reference_number?.trim() || "",
    transaction_date:
      parseDate(row.transaction_date)?.toISOString() ||
      new Date().toISOString(),
    created_by: createdBy,
  }));
}

/**
 * Clean and normalize data for import
 */
export function cleanTransactionData(
  data: RawTransactionData[],
): RawTransactionData[] {
  return data.map((row) => ({
    customer_code: row.customer_code.trim(),
    bank_account: row.bank_account.trim(),
    branch: row.branch?.trim() || "",
    transaction_type: normalizeTransactionTypeLabel(row.transaction_type || "") || row.transaction_type.trim().toLowerCase(),
    amount: row.amount.trim(),
    transaction_date: row.transaction_date.trim(),
    description: row.description?.trim() || "",
    reference_number: row.reference_number?.trim() || "",
    ...(row.transaction_code !== undefined ? { transaction_code: row.transaction_code.trim() } : {}),
  }));
}
