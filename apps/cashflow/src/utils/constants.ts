// Application constants

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  ALLOWED_EXTENSIONS: [".xlsx", ".xls", ".csv"],
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
  },
  PASSWORD: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  },
  CUSTOMER_NAME: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  TRANSACTION_AMOUNT: {
    required: true,
    min: 0.01,
    max: 999999999.99,
  },
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  PAYMENT: "payment",
  CHARGE: "charge",
  ADJUSTMENT: "adjustment",
  REFUND: "refund",
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  BRANCH_MANAGER: "branch_manager",
  STAFF: "staff",
} as const;

// Status Values
export const STATUS = {
  ACTIVE: true,
  INACTIVE: false,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  DATETIME: "MMM dd, yyyy HH:mm",
  TIME: "HH:mm",
} as const;

// Currency
export const CURRENCY = {
  DEFAULT: "VND",
  SUPPORTED: ["VND", "USD", "EUR", "GBP", "JPY"] as const,
  SYMBOLS: {
    VND: "₫",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_PREFERENCES: "user_preferences",
  THEME: "theme",
  LANGUAGE: "language",
} as const;

// Route Paths
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  CUSTOMERS: "/customers",
  TRANSACTIONS: "/transactions",
  IMPORT_TRANSACTIONS: "/import/transactions",
  IMPORT_CUSTOMERS: "/import/customers",
  LOGIN: "/login",
  LOGOUT: "/logout",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access denied.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "An unexpected error occurred. Please try again.",
  FILE_TOO_LARGE: "File size exceeds the maximum limit.",
  INVALID_FILE_TYPE: "Invalid file type. Please upload a valid file.",
  REQUIRED_FIELD: "This field is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PHONE: "Please enter a valid phone number.",
  INVALID_AMOUNT: "Please enter a valid amount.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  DATA_SAVED: "Data saved successfully.",
  DATA_DELETED: "Data deleted successfully.",
  DATA_IMPORTED: "Data imported successfully.",
  DATA_EXPORTED: "Data exported successfully.",
  LOGIN_SUCCESS: "Login successful.",
  LOGOUT_SUCCESS: "Logout successful.",
  PASSWORD_CHANGED: "Password changed successfully.",
  PROFILE_UPDATED: "Profile updated successfully.",
} as const;

// Notification Durations
export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 10000,
} as const;

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: "#3b82f6",
  SUCCESS: "#22c55e",
  WARNING: "#f59e0b",
  DANGER: "#ef4444",
  INFO: "#06b6d4",
  GRAY: "#6b7280",
  LIGHT_GRAY: "#9ca3af",
} as const;

// Table Configuration
export const TABLE_CONFIG = {
  DEFAULT_SORT_DIRECTION: "asc" as const,
  DEFAULT_PAGE_SIZE: 20,
  LOADING_DELAY: 300,
} as const;

// Export Configuration
export const EXPORT_CONFIG = {
  DEFAULT_FORMAT: "xlsx" as const,
  MAX_ROWS_PER_EXPORT: 10000,
  FILENAME_PREFIX: "debt-repayment-export",
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  SEARCH_DELAY: 300,
  MAX_SEARCH_RESULTS: 100,
} as const;

// Responsive Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const;

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Z-Index Values
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
} as const;
