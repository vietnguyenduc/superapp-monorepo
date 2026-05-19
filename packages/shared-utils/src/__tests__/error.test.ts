import { describe, it, expect } from 'vitest';
import { createError, getUserMessage, isAppError, toAppError, ERROR_CODES } from '../error';

describe('Error Handling', () => {
  it('should create an error with correct structure', () => {
    const error = createError(ERROR_CODES.NETWORK_ERROR, 'Network failed');
    
    expect(error.code).toBe(ERROR_CODES.NETWORK_ERROR);
    expect(error.message).toBe('Network failed');
    expect(error.timestamp).toBeDefined();
    expect(error.userMessage).toBeDefined();
  });

  it('should get user-friendly message for error code', () => {
    const message = getUserMessage(ERROR_CODES.NETWORK_ERROR);
    expect(message).toBeDefined();
    expect(typeof message).toBe('string');
  });

  it('should identify AppError correctly', () => {
    const appError = createError(ERROR_CODES.NETWORK_ERROR, 'Test error');
    expect(isAppError(appError)).toBe(true);
    
    const regularError = new Error('Regular error');
    expect(isAppError(regularError)).toBe(false);
  });

  it('should convert regular error to AppError', () => {
    const regularError = new Error('Test');
    const appError = toAppError(regularError);
    
    expect(isAppError(appError)).toBe(true);
    expect(appError.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
  });
});
