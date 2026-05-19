// Error Handling Utilities for Inventory Operation
// Using shared utilities from @superapp/shared-utils

import {
  ERROR_CODES as SharedErrorCodes,
  createError as sharedCreateError,
  getUserMessage as sharedGetUserMessage,
} from "@superapp/shared-utils";

// Re-export shared error codes
export { ERROR_CODES as SharedErrorCodes };

// Inventory-specific error codes (extend shared codes)
export const ERROR_CODES = {
  ...SharedErrorCodes,
  // Inventory-specific codes
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  MOVEMENT_NOT_FOUND: 'MOVEMENT_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
} as const;

/**
 * Create a standardized application error (wrapper around shared function)
 */
export interface AppError extends Error {
  name: string;
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userMessage?: string;
  stack?: string;
  retryable?: boolean;
}

/**
 * Create a standardized application error (wrapper around shared function)
 */
export function createError(
  code: string,
  message: string,
  details?: any,
  userMessage?: string
): AppError {
  const sharedError = sharedCreateError(
    code as any,
    message,
    details,
    userMessage
  );
  return {
    name: 'AppError',
    ...sharedError,
    timestamp: new Date(sharedError.timestamp),
  };
}

/**
 * Get user-friendly message for error code (wrapper around shared function)
 */
export function getUserMessage(code: string): string {
  return sharedGetUserMessage(code as any);
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: any): error is AppError {
  return error && typeof error === 'object' && 'code' in error && 'timestamp' in error;
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: any, defaultCode: string = SharedErrorCodes.UNKNOWN_ERROR): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  const message = error?.message || 'Unknown error';
  const code = defaultCode;
  
  return createError(code, message, error);
}

/**
 * Log error for debugging
 */
export function logError(error: AppError, context?: string): void {
  const logData = {
    timestamp: error.timestamp,
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    details: error.details,
    context,
  };
  
  console.error('AppError:', JSON.stringify(logData, null, 2));
}

/**
 * Handle error and return user-friendly response
 */
export function handleError(error: any, context?: string): {
  error: string;
  code: ERROR_CODES;
  userMessage: string;
} {
  const appError = toAppError(error);
  logError(appError, context);
  
  return {
    error: appError.message,
    code: appError.code,
    userMessage: appError.userMessage || appError.message,
  };
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends any[]>(
  fn: (...args: T) => Promise<any>,
  context?: string
) {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      const handled = handleError(error, context);
      throw new Error(handled.userMessage);
    }
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Validate error code
 */
export function isValidErrorCode(code: string): code is string {
  return Object.values(ERROR_CODES).includes(code as any);
}

/**
 * Get error severity
 */
export function getErrorSeverity(code: string): 'low' | 'medium' | 'high' | 'critical' {
  const criticalCodes = [
    ERROR_CODES.DATABASE_CONNECTION_ERROR,
    ERROR_CODES.AUTHENTICATION_ERROR,
    ERROR_CODES.AUTHORIZATION_ERROR,
  ];

  const highCodes = [
    ERROR_CODES.PRODUCT_NOT_FOUND,
    ERROR_CODES.MOVEMENT_NOT_FOUND,
  ];

  const mediumCodes = [
    ERROR_CODES.INSUFFICIENT_STOCK,
    ERROR_CODES.INVALID_QUANTITY,
  ];

  if (criticalCodes.includes(code as any)) return 'critical';
  if (highCodes.includes(code as any)) return 'high';
  if (mediumCodes.includes(code as any)) return 'medium';
  return 'low';
}

/**
 * Create error response object
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    userMessage: string;
    timestamp: string;
  };
}

export function createErrorResponse(
  error: AppError
): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage || error.message,
      timestamp: error.timestamp.toISOString(),
    },
  };
}
