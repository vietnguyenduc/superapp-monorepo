import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

// Currency formatting
export const formatCurrency = (amount: number, currency = "VND"): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currencyDisplay: "symbol",
  }).format(amount);
};

// Compact currency formatting (for small spaces)
export const formatCompactCurrency = (amount: number): string => {
  // For large numbers, use compact notation
  if (Math.abs(amount) >= 1000000000) {
    const billions = amount / 1000000000;
    return `${billions.toFixed(1)}B đ`;
  } else if (Math.abs(amount) >= 1000000) {
    const millions = amount / 1000000;
    return `${millions.toFixed(1)}M đ`;
  } else if (Math.abs(amount) >= 1000) {
    const thousands = amount / 1000;
    return `${thousands.toFixed(1)}K đ`;
  }
  
  // For smaller numbers, use regular formatting but more compact
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " đ";
};

// Compact number formatting without currency (for tight layouts)
export const formatCompactNumber = (amount: number): string => {
  const abs = Math.abs(amount);
  if (abs >= 1000000000) {
    return `${(amount / 1000000000).toFixed(0)}B`;
  }
  if (abs >= 1000000) {
    return `${(amount / 1000000).toFixed(0)}M`;
  }
  if (abs >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return formatNumber(amount, 0);
};

// Format number changes compactly (for +/- indicators)
export const formatCompactChange = (amount: number): string => {
  // For large numbers, use compact notation
  if (Math.abs(amount) >= 1000000000) {
    const billions = amount / 1000000000;
    return `${billions.toFixed(1)}B`;
  } else if (Math.abs(amount) >= 1000000) {
    const millions = amount / 1000000;
    return `${millions.toFixed(1)}M`;
  } else if (Math.abs(amount) >= 1000) {
    const thousands = amount / 1000;
    return `${thousands.toFixed(1)}K`;
  }
  
  // For smaller numbers, use regular formatting with thousand separators
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Date formatting
export const formatDate = (
  date: string | Date,
  formatString = "dd/MM/yyyy",
): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatString, { locale: vi });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Ngày không hợp lệ";
  }
};

// Date and time formatting
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, "dd/MM/yyyy HH:mm");
};

// Time formatting
export const formatTime = (date: string | Date): string => {
  return formatDate(date, "HH:mm");
};

// Number formatting with thousand separators
export const formatNumber = (number: number, decimals = 0): string => {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

// Smart number formatting with K/M/B suffixes based on magnitude
export const formatSmartNumber = (number: number, decimals = 1): string => {
  if (Math.abs(number) >= 1000000000) {
    return `${(number / 1000000000).toFixed(decimals)}B`;
  } else if (Math.abs(number) >= 1000000) {
    return `${(number / 1000000).toFixed(decimals)}M`;
  } else if (Math.abs(number) >= 1000) {
    return `${(number / 1000).toFixed(decimals)}K`;
  } else {
    return formatNumber(number, decimals);
  }
};

// Percentage formatting
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone; // Return original if can't format
};

// Credit card number formatting
export const formatCreditCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, "");
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cardNumber;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

// Capitalize first letter
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Title case
export const titleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

// Format relative time
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - dateObj.getTime()) / 1000,
    );

    if (diffInSeconds < 60) {
      return "Vừa xong";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    } else {
      return formatDate(dateObj);
    }
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Ngày không hợp lệ";
  }
};

// Transaction type formatting
export const formatTransactionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    payment: "Phát sinh giảm",
    charge: "Phát sinh tăng",
    adjustment: "Điều chỉnh",
    refund: "Hoàn tiền",
  };
  return typeMap[type] || capitalize(type);
};

// User role formatting
export const formatUserRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    admin: "Quản trị viên",
    branch_manager: "Quản lý văn phòng",
    staff: "Nhân viên",
  };
  return roleMap[role] || capitalize(role.replace("_", " "));
};

// Status formatting
export const formatStatus = (status: boolean | string): string => {
  if (typeof status === "boolean") {
    return status ? "Hoạt động" : "Không hoạt động";
  }
  return capitalize(status);
};

// Table cell formatting helpers
export const formatTableCell = (
  value: any,
  type:
    | "text"
    | "number"
    | "currency"
    | "date"
    | "datetime"
    | "phone"
    | "status"
    | "type"
    | "role",
): string => {
  if (value === null || value === undefined) return "-";

  switch (type) {
    case "number":
      return formatNumber(Number(value));
    case "currency":
      return formatCurrency(Number(value));
    case "date":
      return formatDate(value);
    case "datetime":
      return formatDateTime(value);
    case "phone":
      return formatPhoneNumber(String(value));
    case "status":
      return formatStatus(value);
    case "type":
      return formatTransactionType(String(value));
    case "role":
      return formatUserRole(String(value));
    default:
      return String(value);
  }
};

// CSV/Excel data formatting
export const formatForExport = (
  data: Record<string, unknown>[],
  columns: Array<{ key: string; label: string; type?: string }>,
): Record<string, unknown>[] => {
  return data.map((row) => {
    const formattedRow: Record<string, unknown> = {};
    columns.forEach((column) => {
      const value = row[column.key];
      if (column.type) {
        formattedRow[column.label] = formatTableCell(value, column.type as any);
      } else {
        formattedRow[column.label] = value;
      }
    });
    return formattedRow;
  });
};

// Color utility functions for consistent UI theming
// Concept: Phát sinh tăng (tăng công nợ) = red, Phát sinh giảm (giảm công nợ) = green, Điều chỉnh = blue

// Cache for color settings
let cachedTransactionColors: any = null;
let cachedBalanceColors: any = null;
let cachedTransactionTypes: any = null;
let colorsLoaded = false;
let colorLoadPromise: Promise<void> | null = null;

// Function to fetch and cache colors from database
export async function fetchColorSettings() {
  if (colorsLoaded) return; // Don't reload if already loaded
  
  if (colorLoadPromise) return colorLoadPromise; // Return existing promise if loading
  
  colorLoadPromise = (async () => {
    try {
      const { databaseService } = await import("../services/database");

      const [txColorsResult, balanceColorsResult, txTypesResult] = await Promise.all([
        databaseService.colorSettings.getTransactionTypeColors(),
        databaseService.colorSettings.getCustomerBalanceColors(),
        databaseService.transactionTypes.getTransactionTypes(),
      ]);

      // The service returns { data: colors, error: null }
      // Handle both cases: if it has .data property use it, otherwise use the result directly
      const txColors = (txColorsResult as any)?.data || txColorsResult;
      const balanceColors = (balanceColorsResult as any)?.data || balanceColorsResult;
      const txTypes = (txTypesResult as any)?.data || txTypesResult;

      if (txColors) {
        cachedTransactionColors = txColors;
      }
      if (balanceColors) {
        cachedBalanceColors = balanceColors;
      }
      if (txTypes) {
        cachedTransactionTypes = txTypes;
      }

      colorsLoaded = true;
    } catch (err) {
      console.error("Failed to fetch color settings, using defaults", err);
    } finally {
      colorLoadPromise = null;
    }
  })();
  
  return colorLoadPromise;
}

export function getCustomerListBalanceColor(balance: number): string {
  const colors = cachedBalanceColors;
  if (!colors || !colors.customer_list) {
    // Fallback to hardcoded colors if not loaded yet
    return balance > 0 ? "text-black dark:text-white" : "text-green-600 dark:text-green-400";
  }

  const listColors = colors.customer_list;
  return balance > 0 ? listColors.positive_balance_color : listColors.zero_or_negative_color;
}

export function getCustomerDetailBalanceColor(balance: number): string {
  const colors = cachedBalanceColors;
  if (!colors || !colors.customer_detail) {
    // Fallback to hardcoded colors if not loaded yet
    return balance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";
  }

  const detailColors = colors.customer_detail;
  return balance > 0 ? detailColors.positive_balance_color : detailColors.zero_or_negative_color;
}

/**
 * Gets the text/bg color class for a transaction type.
 * NOTE: Uses cachedTransactionColors from color_settings table (separate from transaction_types table).
 * This is intentional per ADR-0001 - color settings are a separate concern from transaction type names.
 * The cache is populated by fetchColorSettings() calls.
 */
export const getTransactionTypeColor = (
  type: string,
): string => {
  const colors = cachedTransactionColors;
  
  if (!colors) {
    // Fallback to hardcoded colors if not loaded yet
    switch (type) {
      case "payment":
        return "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900";
      case "charge":
        return "text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900";
      case "adjustment":
        return "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900";
      case "refund":
        return "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900";
    }
  }

  const typeColors = colors[type];
  if (!typeColors) {
    return "text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900";
  }

  const colorClass = `${typeColors.text_color} ${typeColors.bg_color} ${typeColors.dark_text_color} ${typeColors.dark_bg_color}`;
  return colorClass;
};

/**
 * Gets the amount color class for a transaction type.
 * NOTE: Uses cachedTransactionColors from color_settings table (separate from transaction_types table).
 * This is intentional per ADR-0001 - color settings are a separate concern from transaction type names.
 * The cache is populated by fetchColorSettings() calls.
 */
export const getTransactionTypeAmountColor = (
  type: string,
): string => {
  const colors = cachedTransactionColors;
  
  if (!colors) {
    // Fallback to hardcoded amount colors if not loaded yet
    switch (type) {
      case "payment":
        return "text-green-600 dark:text-green-400";
      case "charge":
        return "text-red-600 dark:text-red-400";
      case "adjustment":
        return "text-blue-600 dark:text-blue-400";
      case "refund":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  }

  const typeColors = colors[type];
  if (!typeColors) {
    return "text-gray-600 dark:text-gray-400";
  }

  const amountColorClass = `${typeColors.amount_color} ${typeColors.dark_amount_color}`;
  return amountColorClass;
};

/**
 * Gets the text color class for a transaction type amount.
 * NOTE: Uses cachedTransactionColors from color_settings table (separate from transaction_types table).
 * This is intentional per ADR-0001 - color settings are a separate concern from transaction type names.
 * The cache is populated by fetchColorSettings() calls.
 */
export const getTransactionTypeTextColor = (type: string): string => {
  const colors = cachedTransactionColors;
  if (!colors) {
    // Fallback to hardcoded colors if not loaded yet
    switch (type) {
      case "payment":
        return "text-green-600";
      case "charge":
        return "text-red-600";
      case "adjustment":
        return "text-blue-600";
      case "refund":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  }

  const typeColors = colors[type];
  if (!typeColors) {
    return "text-gray-600";
  }

  return typeColors.amount_color;
};

// Helper function to get math_factor from transaction type
export const getTransactionMathFactor = (type: string): number => {
  if (!cachedTransactionTypes) {
    // Fallback to hardcoded math factors if not loaded yet
    switch (type) {
      case "payment":
        return -1;
      case "charge":
        return 1;
      case "adjustment":
        return 1;
      case "refund":
        return -1;
      default:
        return 1;
    }
  }

  const txType = cachedTransactionTypes.find((t: any) => t.id === type);
  if (!txType) {
    return 1; // Default to 1 if not found
  }

  return txType.math_factor || 1;
};

/**
 * @deprecated Use `useTransactionTypes().getNameById()` from
 * `contexts/TransactionTypeContext` instead. See ADR-0001 and
 * `docs/transaction-type-lessons-learned.md`. This helper relies on a private
 * cache hydrated by `fetchColorSettings()` and is prone to race conditions
 * causing raw IDs (e.g. "payment") to render before the cache is populated.
 *
 * Kept temporarily for any non-React contexts; emits a one-time console warning
 * when the cache is empty so any remaining caller is visible during dev.
 */
let _txTypeNameCacheMissWarned = false;
export const getTransactionTypeNameFromDB = (typeId: string, cachedTypes?: any[]): string => {
  const types = cachedTypes || cachedTransactionTypes;
  if (!types || types.length === 0) {
    if (!_txTypeNameCacheMissWarned && typeof console !== "undefined") {
      _txTypeNameCacheMissWarned = true;
      console.warn(
        "[getTransactionTypeNameFromDB] cache miss — returning raw typeId. " +
          "Migrate caller to useTransactionTypes().getNameById() (see ADR-0001)."
      );
    }
    return typeId;
  }

  const txType = types.find((t: any) => t.id === typeId);
  return txType?.name || typeId;
};

export const getBalanceColor = (balance: number): string => {
  if (balance < 0) {
    return "text-red-600";
  } else if (balance > 0) {
    return "text-green-600";
  }
  return "text-gray-600";
};

export const getStatusColor = (isActive: boolean): string => {
  return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
};

// Dynamic class generation utilities
export const combineClasses = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(" ");
};

export const getConditionalClass = (
  condition: boolean,
  trueClass: string,
  falseClass: string = "",
): string => {
  return condition ? trueClass : falseClass;
};

export const getResponsiveClass = (
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string,
): string => {
  return combineClasses(
    base,
    sm && `sm:${sm}`,
    md && `md:${md}`,
    lg && `lg:${lg}`,
    xl && `xl:${xl}`,
  );
};
