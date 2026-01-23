import React from "react";
import { ImportError } from "../types";

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// Default retry configuration
export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    "network_error",
    "timeout",
    "rate_limit_exceeded",
    "service_unavailable",
    "connection_failed",
  ],
};

// Error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: "network_error",
  TIMEOUT: "timeout",
  CONNECTION_FAILED: "connection_failed",

  // Database errors
  DATABASE_CONNECTION_FAILED: "database_connection_failed",
  DATABASE_QUERY_FAILED: "database_query_failed",
  DATABASE_CONSTRAINT_VIOLATION: "database_constraint_violation",

  // Authentication errors
  AUTHENTICATION_FAILED: "authentication_failed",
  UNAUTHORIZED: "unauthorized",
  TOKEN_EXPIRED: "token_expired",

  // Validation errors
  VALIDATION_ERROR: "validation_error",
  INVALID_DATA: "invalid_data",

  // Import errors
  IMPORT_FAILED: "import_failed",
  FILE_READ_ERROR: "file_read_error",
  PARSE_ERROR: "parse_error",

  // Business logic errors
  CUSTOMER_NOT_FOUND: "customer_not_found",
  BANK_ACCOUNT_NOT_FOUND: "bank_account_not_found",
  INSUFFICIENT_PERMISSIONS: "insufficient_permissions",

  // Generic errors
  UNKNOWN_ERROR: "unknown_error",
  INTERNAL_SERVER_ERROR: "internal_server_error",
} as const;

// Create application error
export function createError(
  code: string,
  message: string,
  details?: any,
  retryable: boolean = false,
): AppError {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
    retryable,
  };
}

// Check if error is retryable
export function isRetryableError(
  error: AppError,
  config: RetryConfig = defaultRetryConfig,
): boolean {
  return error.retryable && config.retryableErrors.includes(error.code);
}

// Calculate delay for retry with exponential backoff
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = defaultRetryConfig,
): number {
  const delay =
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

// Retry function with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig,
  onRetry?: (attempt: number, error: AppError, delay: number) => void,
): Promise<T> {
  let lastError: AppError;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const appError = normalizeError(error);
      lastError = appError;

      // Don't retry if error is not retryable or we've reached max attempts
      if (
        !isRetryableError(appError, config) ||
        attempt === config.maxAttempts
      ) {
        throw appError;
      }

      // Calculate delay and wait
      const delay = calculateRetryDelay(attempt, config);

      if (onRetry) {
        onRetry(attempt, appError, delay);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Normalize different error types to AppError
export function normalizeError(error: any): AppError {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error
  ) {
    return error as AppError;
  }

  if (error instanceof Error) {
    return createError(
      ERROR_CODES.UNKNOWN_ERROR,
      error.message,
      { originalError: error },
      false,
    );
  }

  if (typeof error === "string") {
    return createError(
      ERROR_CODES.UNKNOWN_ERROR,
      error,
      { originalError: error },
      false,
    );
  }

  return createError(
    ERROR_CODES.UNKNOWN_ERROR,
    "An unknown error occurred",
    { originalError: error },
    false,
  );
}

// Error handler for database operations
export function handleDatabaseError(error: any, operation: string): AppError {
  const normalizedError = normalizeError(error);

  // Check for specific database error patterns
  if (normalizedError.message.includes("connection")) {
    return createError(
      ERROR_CODES.DATABASE_CONNECTION_FAILED,
      `Database connection failed during ${operation}`,
      normalizedError.details,
      true,
    );
  }

  if (normalizedError.message.includes("timeout")) {
    return createError(
      ERROR_CODES.TIMEOUT,
      `Database operation timed out during ${operation}`,
      normalizedError.details,
      true,
    );
  }

  if (normalizedError.message.includes("constraint")) {
    return createError(
      ERROR_CODES.DATABASE_CONSTRAINT_VIOLATION,
      `Database constraint violation during ${operation}`,
      normalizedError.details,
      false,
    );
  }

  return createError(
    ERROR_CODES.DATABASE_QUERY_FAILED,
    `Database operation failed during ${operation}`,
    normalizedError.details,
    true,
  );
}

// Error handler for import operations
export function handleImportError(
  error: any,
  rowIndex?: number,
  column?: string,
): ImportError {
  const normalizedError = normalizeError(error);

  return {
    row: rowIndex || 0,
    column: column || "general",
    message: normalizedError.message,
    value: normalizedError.details?.originalError || error,
  };
}

// Batch operation with error handling
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T, index: number) => Promise<R>,
  batchSize: number = 10,
  retryConfig: RetryConfig = defaultRetryConfig,
): Promise<{
  results: R[];
  errors: Array<{ index: number; error: AppError }>;
}> {
  const results: R[] = [];
  const errors: Array<{ index: number; error: AppError }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = i + batchIndex;

      try {
        const result = await retryWithBackoff(
          () => operation(item, globalIndex),
          retryConfig,
        );
        return { index: globalIndex, result, error: null };
      } catch (error) {
        const appError = normalizeError(error);
        return { index: globalIndex, result: null, error: appError };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    batchResults.forEach(({ index, result, error }) => {
      if (error) {
        errors.push({ index, error });
      } else if (result !== null) {
        results[index] = result;
      }
    });
  }

  return { results, errors };
}

// Error boundary for React components
export function createErrorBoundary(
  fallback: React.ComponentType<{ error: AppError; resetError: () => void }>,
) {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: AppError | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
      return {
        hasError: true,
        error: normalizeError(error),
      };
    }

    componentDidCatch(error: any, errorInfo: any) {
      console.error("Error caught by boundary:", error, errorInfo);

      // Log error to monitoring service
      this.logError(error, errorInfo);
    }

    resetError = () => {
      this.setState({ hasError: false, error: null });
    };

    logError = (error: any, errorInfo: any) => {
      // TODO: Implement error logging to monitoring service
      console.error("Error logged:", {
        error: normalizeError(error),
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    };

    render(): React.ReactNode {
      if (this.state.hasError && this.state.error) {
        const FallbackComponent = fallback;
        return React.createElement(FallbackComponent, {
          error: this.state.error,
          resetError: this.resetError,
        });
      }

      return this.props.children;
    }
  };
}

// Error notification system
export interface ErrorNotification {
  id: string;
  error: AppError;
  timestamp: Date;
  dismissed: boolean;
}

class ErrorNotificationManager {
  private notifications: ErrorNotification[] = [];
  private listeners: Array<(notifications: ErrorNotification[]) => void> = [];

  addError(error: AppError): string {
    const notification: ErrorNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      error,
      timestamp: new Date(),
      dismissed: false,
    };

    this.notifications.unshift(notification);
    this.notifyListeners();

    // Auto-dismiss non-critical errors after 10 seconds
    if (!error.retryable) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, 10000);
    }

    return notification.id;
  }

  dismissNotification(id: string): void {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.notifications[index].dismissed = true;
      this.notifyListeners();
    }
  }

  clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  getNotifications(): ErrorNotification[] {
    return this.notifications.filter((n) => !n.dismissed);
  }

  subscribe(
    listener: (notifications: ErrorNotification[]) => void,
  ): () => void {
    this.listeners.push(listener);
    listener(this.getNotifications());

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const notifications = this.getNotifications();
    this.listeners.forEach((listener) => listener(notifications));
  }
}

export const errorNotificationManager = new ErrorNotificationManager();

// Utility functions for common error scenarios
export const errorUtils = {
  // Handle network errors
  handleNetworkError: (error: any): AppError => {
    if (error.message?.includes("fetch")) {
      return createError(
        ERROR_CODES.NETWORK_ERROR,
        "Network request failed. Please check your connection.",
        error,
        true,
      );
    }
    return normalizeError(error);
  },

  // Handle validation errors
  handleValidationError: (errors: ImportError[]): AppError => {
    return createError(
      ERROR_CODES.VALIDATION_ERROR,
      `Validation failed with ${errors.length} errors`,
      { validationErrors: errors },
      false,
    );
  },

  // Handle authentication errors
  handleAuthError: (error: any): AppError => {
    if (error.message?.includes("token")) {
      return createError(
        ERROR_CODES.TOKEN_EXPIRED,
        "Your session has expired. Please log in again.",
        error,
        false,
      );
    }
    return createError(
      ERROR_CODES.AUTHENTICATION_FAILED,
      "Authentication failed",
      error,
      false,
    );
  },

  // Format error for display
  formatErrorForDisplay: (error: AppError): string => {
    switch (error.code) {
      case ERROR_CODES.NETWORK_ERROR:
        return "Network connection error. Please check your internet connection and try again.";

      case ERROR_CODES.TIMEOUT:
        return "Request timed out. Please try again.";

      case ERROR_CODES.DATABASE_CONNECTION_FAILED:
        return "Database connection failed. Please try again later.";

      case ERROR_CODES.AUTHENTICATION_FAILED:
        return "Authentication failed. Please log in again.";

      case ERROR_CODES.VALIDATION_ERROR:
        return "Data validation failed. Please check your input and try again.";

      case ERROR_CODES.IMPORT_FAILED:
        return "Import failed. Please check your data and try again.";

      default:
        return error.message || "An unexpected error occurred.";
    }
  },
};

// Export all error handling utilities
export default {
  createError,
  normalizeError,
  retryWithBackoff,
  batchOperation,
  handleDatabaseError,
  handleImportError,
  createErrorBoundary,
  errorNotificationManager,
  errorUtils,
  ERROR_CODES,
  defaultRetryConfig,
};
