import { Transaction, ImportError, TransactionType } from "../types";

export interface RawTransactionData {
  customer_name: string;
  bank_account: string;
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

    return {
      customer_name: columns[0]?.trim() || "",
      bank_account: columns[1]?.trim() || "",
      transaction_type: columns[2]?.trim() || "",
      amount: columns[3]?.trim() || "",
      transaction_date: columns[4]?.trim() || "",
      description: columns[5]?.trim() || "",
      reference_number: columns[6]?.trim() || "",
    };
  });
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
): ValidationResult {
  const errors: ImportError[] = [];

  data.forEach((row, index) => {
    // Validate customer name
    if (!row.customer_name || row.customer_name.trim().length === 0) {
      errors.push({
        row: index,
        column: "customer_name",
        message: "Customer name is required",
        value: row.customer_name,
      });
    } else if (row.customer_name.trim().length < 2) {
      errors.push({
        row: index,
        column: "customer_name",
        message: "Customer name must be at least 2 characters",
        value: row.customer_name,
      });
    }

    // Validate bank account
    if (!row.bank_account || row.bank_account.trim().length === 0) {
      errors.push({
        row: index,
        column: "bank_account",
        message: "Bank account is required",
        value: row.bank_account,
      });
    }

    // Validate transaction type
    if (!row.transaction_type || row.transaction_type.trim().length === 0) {
      errors.push({
        row: index,
        column: "transaction_type",
        message: "Transaction type is required",
        value: row.transaction_type,
      });
    } else {
      const validTypes: TransactionType[] = [
        "payment",
        "charge",
        "adjustment",
        "refund",
      ];
      const normalizedType = row.transaction_type.toLowerCase().trim();

      if (!validTypes.includes(normalizedType as TransactionType)) {
        errors.push({
          row: index,
          column: "transaction_type",
          message: `Invalid transaction type. Must be one of: ${validTypes.join(", ")}`,
          value: row.transaction_type,
        });
      }
    }

    // Validate amount
    if (!row.amount || row.amount.trim().length === 0) {
      errors.push({
        row: index,
        column: "amount",
        message: "Amount is required",
        value: row.amount,
      });
    } else {
      const amount = parseAmount(row.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push({
          row: index,
          column: "amount",
          message: "Amount must be a positive number",
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
          message: "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY",
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
 * Parse amount string to number, handling various formats
 */
function parseAmount(amountStr: string): number {
  // Remove currency symbols, commas, and spaces
  const cleaned = amountStr.replace(/[$,€£¥₫\s]/g, "");

  // Handle negative amounts
  const isNegative = cleaned.startsWith("-") || cleaned.startsWith("(");
  const positiveAmount = cleaned.replace(/[()-]/g, "");

  // Parse as float
  const amount = parseFloat(positiveAmount);

  return isNegative ? -amount : amount;
}

/**
 * Parse date string to Date object, handling various formats
 */
function parseDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim();

  // Try ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  // Try DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Try MM/DD/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Try DD-MM-YYYY format
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Try MM-DD-YYYY format
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Try DD.MM.YYYY format
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split(".");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  return null;
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
    customer_id: "", // Will be resolved during import
    bank_account_id: "", // Will be resolved during import
    branch_id: branchId,
    transaction_type: row.transaction_type
      .toLowerCase()
      .trim() as TransactionType,
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
    customer_name: row.customer_name.trim(),
    bank_account: row.bank_account.trim(),
    transaction_type: row.transaction_type.trim().toLowerCase(),
    amount: row.amount.trim(),
    transaction_date: row.transaction_date.trim(),
    description: row.description?.trim() || "",
    reference_number: row.reference_number?.trim() || "",
  }));
}
