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
  formatString = "dd MMM, yyyy",
): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatString, { locale: vi });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

// Date and time formatting
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, "dd MMM, yyyy HH:mm");
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
    return "Invalid Date";
  }
};

// Transaction type formatting
export const formatTransactionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    payment: "Tiền vào",
    charge: "Tiền ra",
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
  data: any[],
  columns: Array<{ key: string; label: string; type?: string }>,
): any[] => {
  return data.map((row) => {
    const formattedRow: any = {};
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
export const getTransactionTypeColor = (type: string): string => {
  switch (type) {
    case "payment":
      return "bg-green-100 text-green-800";
    case "charge":
      return "bg-red-100 text-red-800";
    case "adjustment":
      return "bg-yellow-100 text-yellow-800";
    case "refund":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getTransactionTypeTextColor = (type: string): string => {
  switch (type) {
    case "payment":
      return "text-green-600";
    case "charge":
      return "text-red-600";
    case "adjustment":
      return "text-yellow-600";
    case "refund":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
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
