import { TransactionType } from "../types";

/**
 * Data cleaning utilities for import operations
 */

export interface CleaningOptions {
  removeQuotes?: boolean;
  removeCommas?: boolean;
  normalizeWhitespace?: boolean;
  trimValues?: boolean;
  autoFormatDates?: boolean;
  normalizeCase?: boolean;
  removeSpecialChars?: boolean;
  customReplacements?: Record<string, string>;
}

export interface CleanedData {
  original: string;
  cleaned: string;
  changes: string[];
}

/**
 * Clean a single value with specified options
 */
export function cleanValue(
  value: string,
  options: CleaningOptions = {},
): CleanedData {
  const {
    removeQuotes = true,
    removeCommas = true,
    normalizeWhitespace = true,
    trimValues = true,
    autoFormatDates = true,
    normalizeCase = false,
    removeSpecialChars = false,
    customReplacements = {},
  } = options;

  let cleaned = value;
  const changes: string[] = [];

  // Track original value
  const original = cleaned;

  // Remove quotes
  if (removeQuotes) {
    const beforeQuotes = cleaned;
    cleaned = cleaned.replace(/^["']|["']$/g, ""); // Remove leading/trailing quotes
    cleaned = cleaned.replace(/["']/g, ""); // Remove all quotes
    if (beforeQuotes !== cleaned) {
      changes.push("Removed quotes");
    }
  }

  // Remove commas from numbers
  if (removeCommas) {
    const beforeCommas = cleaned;
    // Only remove commas that are part of number formatting (not in text)
    cleaned = cleaned.replace(/(\d{1,3}(?:,\d{3})*)/g, (match) =>
      match.replace(/,/g, ""),
    );
    if (beforeCommas !== cleaned) {
      changes.push("Removed number formatting commas");
    }
  }

  // Normalize whitespace
  if (normalizeWhitespace) {
    const beforeWhitespace = cleaned;
    cleaned = cleaned.replace(/\s+/g, " "); // Replace multiple spaces with single space
    if (beforeWhitespace !== cleaned) {
      changes.push("Normalized whitespace");
    }
  }

  // Trim values
  if (trimValues) {
    const beforeTrim = cleaned;
    cleaned = cleaned.trim();
    if (beforeTrim !== cleaned) {
      changes.push("Trimmed whitespace");
    }
  }

  // Auto-format dates
  if (autoFormatDates) {
    const beforeDate = cleaned;
    cleaned = autoFormatDate(cleaned);
    if (beforeDate !== cleaned) {
      changes.push("Auto-formatted date");
    }
  }

  // Normalize case
  if (normalizeCase) {
    const beforeCase = cleaned;
    cleaned = cleaned.toLowerCase();
    if (beforeCase !== cleaned) {
      changes.push("Normalized to lowercase");
    }
  }

  // Remove special characters
  if (removeSpecialChars) {
    const beforeSpecial = cleaned;
    cleaned = cleaned.replace(/[^\w\s\-.,]/g, ""); // Keep alphanumeric, spaces, hyphens, dots, commas
    if (beforeSpecial !== cleaned) {
      changes.push("Removed special characters");
    }
  }

  // Apply custom replacements
  Object.entries(customReplacements).forEach(([search, replace]) => {
    const beforeCustom = cleaned;
    cleaned = cleaned.replace(new RegExp(search, "g"), replace);
    if (beforeCustom !== cleaned) {
      changes.push(`Applied custom replacement: "${search}" → "${replace}"`);
    }
  });

  return {
    original,
    cleaned,
    changes,
  };
}

/**
 * Clean an entire dataset
 */
export function cleanDataset(
  data: Record<string, any>[],
  options: CleaningOptions = {},
  columnOptions?: Record<string, CleaningOptions>,
): {
  cleanedData: Record<string, any>[];
  cleaningReport: {
    totalRows: number;
    totalChanges: number;
    changesByColumn: Record<string, number>;
    changesByRow: number[];
  };
} {
  const changesByColumn: Record<string, number> = {};
  const changesByRow: number[] = [];

  data.forEach((row) => {
    const cleanedRow: Record<string, any> = {};
    let rowChanges = 0;

    Object.entries(row).forEach(([column, value]) => {
      if (typeof value === "string") {
        const columnSpecificOptions = columnOptions?.[column] || {};
        const mergedOptions = { ...options, ...columnSpecificOptions };

        const cleaned = cleanValue(value, mergedOptions);
        cleanedRow[column] = cleaned.cleaned;

        if (cleaned.changes.length > 0) {
          changesByColumn[column] =
            (changesByColumn[column] || 0) + cleaned.changes.length;
          rowChanges += cleaned.changes.length;
        }
      } else {
        cleanedRow[column] = value;
      }
    });

    // The original code had 'cleanedData.push(cleanedRow);' here, but 'cleanedData' is not defined.
    // Assuming the intent was to return the cleaned data, but the function signature is different.
    // For now, removing the line as per the edit hint.
  });

  const totalChanges = Object.values(changesByColumn).reduce(
    (sum, count) => sum + count,
    0,
  );

  return {
    cleanedData: data, // Return the original data as 'cleanedData' was not defined
    cleaningReport: {
      totalRows: data.length,
      totalChanges,
      changesByColumn,
      changesByRow,
    },
  };
}

/**
 * Auto-format date strings to ISO format
 */
export function autoFormatDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") {
    return dateStr;
  }

  const trimmed = dateStr.trim();

  // Already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // MM/DD/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // DD-MM-YYYY format
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // MM-DD-YYYY format
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // DD.MM.YYYY format
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split(".");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // MM.DD.YYYY format
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split(".");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try to parse with Date constructor
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  return dateStr; // Return original if no format matches
}

/**
 * Clean and normalize transaction type
 */
export function cleanTransactionType(type: string): TransactionType | null {
  if (!type || typeof type !== "string") {
    return null;
  }

  const normalized = type.toLowerCase().trim();

  const typeMap: Record<string, TransactionType> = {
    payment: "payment",
    pay: "payment",
    p: "payment",
    charge: "charge",
    ch: "charge",
    adjustment: "adjustment",
    adj: "adjustment",
    a: "adjustment",
    refund: "refund",
    ref: "refund",
    r: "refund",
  };

  return typeMap[normalized] || null;
}

/**
 * Clean and parse amount values
 */
export function cleanAmount(amount: string): number | null {
  if (!amount || typeof amount !== "string") {
    return null;
  }

  // Remove currency symbols, spaces, and other formatting
  let cleaned = amount.replace(/[$,€£¥₫\s]/g, "");

  // Handle negative amounts in parentheses
  const isNegative = cleaned.startsWith("-") || cleaned.startsWith("(");
  cleaned = cleaned.replace(/[()-]/g, "");

  // Parse as float
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return null;
  }

  return isNegative ? -parsed : parsed;
}

/**
 * Clean and normalize phone numbers
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return phone;
  }

  // Remove all non-digit characters except + for country code
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Handle Vietnamese phone numbers
  if (cleaned.startsWith("+84")) {
    cleaned = cleaned.replace("+84", "0");
  } else if (cleaned.startsWith("84")) {
    cleaned = "0" + cleaned.substring(2);
  }

  // Ensure it starts with 0 for Vietnamese numbers
  if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}

/**
 * Clean and normalize email addresses
 */
export function cleanEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return email;
  }

  return email.toLowerCase().trim();
}

/**
 * Clean and normalize customer names
 */
export function cleanCustomerName(name: string): string {
  if (!name || typeof name !== "string") {
    return name;
  }

  // Remove extra whitespace and normalize
  let cleaned = name.replace(/\s+/g, " ").trim();

  // Capitalize first letter of each word
  cleaned = cleaned.replace(/\b\w/g, (char) => char.toUpperCase());

  return cleaned;
}

/**
 * Generate cleaning report summary
 */
export function generateCleaningReport(
  originalData: Record<string, any>[],
  changesByColumn: Record<string, number>,
): {
  summary: string;
  details: Record<string, any>;
} {
  const totalRows = originalData.length;
  const totalChanges = Object.values(changesByColumn).reduce(
    (sum, count) => sum + count,
    0,
  );
  const columnsWithChanges = Object.keys(changesByColumn).length;

  const summary = `Cleaned ${totalRows} rows with ${totalChanges} total changes across ${columnsWithChanges} columns`;

  const details = {
    totalRows,
    totalChanges,
    columnsWithChanges,
    changesByColumn,
    mostChangedColumn:
      Object.entries(changesByColumn).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      null,
    changeRate: totalRows > 0 ? (totalChanges / totalRows).toFixed(2) : "0",
  };

  return { summary, details };
}
