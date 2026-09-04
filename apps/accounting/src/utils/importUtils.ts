import type { Transaction, ImportError, TransactionType } from "../types";
import { parseFile } from "@superapp/shared-utils";

export interface RawTransactionData {
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
    throw new Error("Không có dữ liệu để nhập. Vui lòng dán hoặc chọn file dữ liệu.");
  }

  // Remove empty lines and trim whitespace
  const nonEmptyLines = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (nonEmptyLines.length === 0) {
    throw new Error("Không tìm thấy dòng dữ liệu hợp lệ trong file. Vui lòng kiểm tra định dạng.");
  }

  // Parse each line as tab or comma separated data
  return nonEmptyLines.map((line, index) => {
    const columns = parseLine(line);

    if (columns.length < 5) {
      throw new Error(
        `Dòng ${index + 1}: Thiếu cột dữ liệu. Cần ít nhất 5 cột (Mã khách hàng, Tài khoản ngân hàng, Loại giao dịch, Số tiền, Ngày giao dịch).`,
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

function isTransactionTypeToken(value?: string): boolean {
  const normalized = normalizeTransactionTypeLabel(value || "");
  return Boolean(normalized);
}

function normalizeTransactionTypeLabel(value: string): TransactionType | "" {
  const normalized = value.trim().toLowerCase();
  if (["thu", "điều chỉnh giảm", "dieu chinh giam", "tiền vào", "tien vao", "payment", "thanh toán", "thanh toan"].includes(normalized)) return "payment";
  if (["chi", "điều chỉnh tăng", "dieu chinh tang", "tiền ra", "tien ra", "charge", "cho nợ", "cho no"].includes(normalized)) return "charge";
  if (normalized === "điều chỉnh" || normalized === "dieu chinh" || normalized === "adjustment") {
    return "adjustment";
  }
  if (normalized === "hoàn tiền" || normalized === "hoan tien" || normalized === "refund") {
    return "refund";
  }
  return "";
}

/**
 * Parse a clipboard row into cell values, handling tab-separated (Excel),
 * comma-separated (CSV), and numbers with comma thousand separators.
 *
 * When a row has no tabs but has commas, and every comma segment is
 * number-like (digits/dots only), the row is treated as a single value
 * (e.g. "1,000,002") instead of being split into multiple cells.
 */
export function parseClipboardRow(row: string): string[] {
  // Excel format: tab-separated
  if (row.includes("\t")) {
    return row.split("\t");
  }
  // No tabs but has commas: detect numbers with comma thousand separators
  if (row.includes(",")) {
    const segments = row.split(",");
    if (
      segments.length > 1 &&
      segments.every((seg) => /^[\d.\s]+$/.test(seg.trim()))
    ) {
      return [row];
    }
    return row.split(",");
  }
  return [row];
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

  // Build lookup sets from DB-provided types (fallback to legacy hardcoded if none provided)
  const validTypeIds = validTransactionTypes ? new Set(validTransactionTypes.map((t) => t.id.toLowerCase().trim())) : null;
  const validTypeNames = validTransactionTypes ? new Set(validTransactionTypes.map((t) => t.name.toLowerCase().trim())) : null;

  data.forEach((row, index) => {
    const normalizedType = normalizeTransactionTypeLabel(row.transaction_type || "");

    // Validate customer code (required)
    const rawCustomerCode = (row.customer_code || "").trim();
    if (!rawCustomerCode) {
      errors.push({
        row: index,
        column: "customer_code",
        message: "Mã khách hàng là bắt buộc. Vui lòng nhập mã khách hàng.",
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
          message: `Mã khách hàng "${rawCustomerCode}" không tồn tại. Vui lòng kiểm tra danh sách khách hàng.`,
          value: row.customer_code,
        });
      }
    }

    // Bank account is optional in this flow

    // Validate transaction type
    if (!row.transaction_type || row.transaction_type.trim().length === 0) {
      errors.push({
        row: index,
        column: "transaction_type",
        message: "Loại giao dịch là bắt buộc",
        value: row.transaction_type,
      });
    } else {
      const rawInput = row.transaction_type.trim().toLowerCase();
      let isValid = false;

      if (validTypeIds && validTypeNames) {
        // DB-driven validation: match by normalized legacy id, type id, or type name
        if (validTypeIds.has(rawInput) || validTypeNames.has(rawInput)) {
          isValid = true;
        } else if (normalizedType && (validTypeIds.has(normalizedType) || validTypeNames.has(normalizedType))) {
          isValid = true;
        }
      } else {
        // Legacy fallback (should not happen when DB is reachable)
        const validTypes: TransactionType[] = ["payment", "charge", "adjustment", "refund"];
        isValid = validTypes.includes(normalizedType as TransactionType);
      }

      if (!isValid) {
        const allowedList = validTransactionTypes
          ? validTransactionTypes.map((t) => t.name).join(", ")
          : "payment, charge, adjustment, refund";
        errors.push({
          row: index,
          column: "transaction_type",
          message: `Loại giao dịch "${row.transaction_type}" không hợp lệ. Các loại được hỗ trợ: ${allowedList}.`,
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
        message: "Số tiền là bắt buộc. Vui lòng nhập số tiền.",
        value: row.amount,
      });
    } else {
      const amount = parseAmount(amountRaw);
      const isAdjustment = normalizedType === "adjustment";
      const isPayment = normalizedType === "payment";
      const isCharge = normalizedType === "charge";

      if (isNaN(amount) || amount === 0) {
        errors.push({
          row: index,
          column: "amount",
          message: isAdjustment
            ? "Số tiền điều chỉnh phải khác 0"
            : "Số tiền phải khác 0. Vui lòng nhập số tiền hợp lệ.",
          value: row.amount,
        });
      } else {
        if ((isPayment || isCharge) && amount < 0) {
          errors.push({
            row: index,
            column: "amount",
            message: isPayment
              ? "Số tiền thu phải là số dương"
              : "Số tiền chi phải là số dương",
            value: row.amount,
          });
        }
      }
    }

    // Validate transaction date
    if (!row.transaction_date || row.transaction_date.trim().length === 0) {
      errors.push({
        row: index,
        column: "transaction_date",
        message: "Ngày giao dịch là bắt buộc. Vui lòng nhập ngày theo định dạng DD/MM/YYYY.",
        value: row.transaction_date,
      });
    } else {
      const date = parseDate(row.transaction_date);
      if (!date || isNaN(date.getTime())) {
        errors.push({
          row: index,
          column: "transaction_date",
          message: "Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY hoặc YYYY-MM-DD.",
          value: row.transaction_date,
        });
      } else if (date > new Date()) {
        errors.push({
          row: index,
          column: "transaction_date",
          message: "Ngày giao dịch không được trong tương lai. Vui lòng chọn ngày hợp lệ.",
          value: row.transaction_date,
        });
      }
    }

    // Validate description (optional but if provided, check length)
    if (row.description && row.description.trim().length > 500) {
      errors.push({
        row: index,
        column: "description",
        message: "Nội dung giao dịch phải dưới 500 ký tự.",
        value: row.description,
      });
    }

    // Validate reference number (optional but if provided, check format)
    if (row.reference_number && row.reference_number.trim().length > 100) {
      errors.push({
        row: index,
        column: "reference_number",
        message: "Số tham chiếu phải dưới 100 ký tự.",
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

  // Try DD/MM/YYYY or DD/MM/YY
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) {
    const [day, month, yearRaw] = trimmed.split("/");
    const yearNum = yearRaw.length === 2 ? 2000 + parseInt(yearRaw, 10) : parseInt(yearRaw, 10);
    return new Date(yearNum, parseInt(month, 10) - 1, parseInt(day, 10));
  }

  // Try MM/DD/YYYY or MM/DD/YY
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) {
    const [month, day, yearRaw] = trimmed.split("/");
    const yearNum = yearRaw.length === 2 ? 2000 + parseInt(yearRaw, 10) : parseInt(yearRaw, 10);
    return new Date(yearNum, parseInt(month, 10) - 1, parseInt(day, 10));
  }

  // Try DD-MM-YYYY or DD-MM-YY format
  if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(trimmed)) {
    const [day, month, yearRaw] = trimmed.split("-");
    const yearNum = yearRaw.length === 2 ? 2000 + parseInt(yearRaw, 10) : parseInt(yearRaw, 10);
    return new Date(yearNum, parseInt(month, 10) - 1, parseInt(day, 10));
  }

  // Try MM-DD-YYYY or MM-DD-YY format
  if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(trimmed)) {
    const [month, day, yearRaw] = trimmed.split("-");
    const yearNum = yearRaw.length === 2 ? 2000 + parseInt(yearRaw, 10) : parseInt(yearRaw, 10);
    return new Date(yearNum, parseInt(month, 10) - 1, parseInt(day, 10));
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
  }));
}
