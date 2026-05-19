/**
 * Standardized error handling utilities
 */

import { ERROR_CODES, ERROR_MESSAGES } from './errorCodes';

export interface AppError {
  code: ERROR_CODES;
  message: string;
  details?: any;
  timestamp: string;
  userMessage: string;
  stack?: string;
  retryable?: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ERROR_CODES[];
}

/**
 * Default retry configuration
 */
export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.NETWORK_TIMEOUT,
    ERROR_CODES.DB_TIMEOUT_ERROR,
  ],
};

/**
 * Creates a standardized application error
 */
export function createError(
  code: ERROR_CODES,
  message?: string,
  details?: any,
  userMessage?: string,
  retryable: boolean = false
): AppError {
  const baseError = new Error(message || ERROR_MESSAGES[code]);
  const error: AppError = {
    code,
    message: message || ERROR_MESSAGES[code],
    details,
    timestamp: new Date().toISOString(),
    userMessage: userMessage || ERROR_MESSAGES[code],
    stack: baseError.stack,
    retryable,
  };
  
  return error;
}

/**
 * Gets a user-friendly message for an error code
 */
export function getUserMessage(code: ERROR_CODES): string {
  return ERROR_MESSAGES[code];
}

/**
 * Check if error is retryable based on configuration
 */
export function isRetryableError(
  error: AppError,
  config: RetryConfig = defaultRetryConfig
): boolean {
  return (error.retryable || false) && config.retryableErrors.includes(error.code);
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: any): error is AppError {
  return error && typeof error === 'object' && 'code' in error && 'timestamp' in error;
}

/**
 * Converts any error to an AppError
 */
export function toAppError(error: any, defaultCode: ERROR_CODES = ERROR_CODES.UNKNOWN_ERROR): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return createError(
      defaultCode,
      error.message,
      { originalError: error },
      ERROR_MESSAGES[defaultCode]
    );
  }
  
  return createError(
    defaultCode,
    String(error),
    undefined,
    ERROR_MESSAGES[defaultCode]
  );
}

/**
 * Logs an error to the console (can be replaced with proper logging service)
 */
export function logError(error: AppError, context?: string): void {
  const prefix = context ? `[${context}]` : '';
  console.error(`${prefix} Error:`, {
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    timestamp: error.timestamp,
    details: error.details,
    stack: error.stack,
  });
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Batch operation with error handling
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T, index: number) => Promise<R>,
  options: {
    batchSize?: number;
    continueOnError?: boolean;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<{ results: R[]; errors: Array<{ item: T; error: Error; index: number }> }> {
  const {
    batchSize = 50,
    continueOnError = true,
    onProgress,
  } = options;

  const results: R[] = [];
  const errors: Array<{ item: T; error: Error; index: number }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map((item, batchIndex) => operation(item, i + batchIndex))
    );

    batchResults.forEach((result, batchIndex) => {
      const item = batch[batchIndex];
      const index = i + batchIndex;

      if (result.status === 'fulfilled') {
        results[index] = result.value;
      } else {
        errors.push({ item, error: result.reason, index });
        if (continueOnError) {
          results[index] = undefined as any;
        } else {
          throw result.reason;
        }
      }
    });

    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
  }

  return { results, errors };
}
