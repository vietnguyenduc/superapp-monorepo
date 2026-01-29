import { render } from "@testing-library/react";
import { vi } from "vitest";
import {
  createError,
  normalizeError,
  handleDatabaseError,
  handleImportError,
  batchOperation,
  createErrorBoundary,
  ERROR_CODES,
  defaultRetryConfig,
} from "../errorHandling";

describe("createError", () => {
  it("creates a custom error object", () => {
    const error = createError(
      "test_code",
      "Test message",
      { foo: "bar" },
      true,
    );
    expect(error.code).toBe("test_code");
    expect(error.message).toBe("Test message");
    expect(error.details).toEqual({ foo: "bar" });
    expect(error.retryable).toBe(true);
  });
});

describe("normalizeError", () => {
  it("normalizes Error objects", () => {
    const err = new Error("Something went wrong");
    const normalized = normalizeError(err);
    expect(normalized.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    expect(normalized.message).toBe("Something went wrong");
    expect(normalized.details?.originalError).toBe(err);
    expect(normalized.retryable).toBe(false);
  });

  it("normalizes string errors", () => {
    const normalized = normalizeError("String error");
    expect(normalized.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    expect(normalized.message).toBe("String error");
    expect(normalized.details?.originalError).toBe("String error");
    expect(normalized.retryable).toBe(false);
  });

  it("normalizes unknown error types", () => {
    const unknownError = { custom: "error" };
    const normalized = normalizeError(unknownError);
    expect(normalized.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    expect(normalized.message).toBe("An unknown error occurred");
    expect(normalized.details?.originalError).toBe(unknownError);
    expect(normalized.retryable).toBe(false);
  });
});

describe("handleDatabaseError", () => {
  it("handles connection errors", () => {
    const originalError = new Error("connection failed");
    const result = handleDatabaseError(originalError, "query");
    expect(result.code).toBe(ERROR_CODES.DATABASE_CONNECTION_FAILED);
    expect(result.message).toContain("Database connection failed during query");
    expect(result.retryable).toBe(true);
  });

  it("handles timeout errors", () => {
    const originalError = new Error("operation timeout");
    const result = handleDatabaseError(originalError, "insert");
    expect(result.code).toBe(ERROR_CODES.TIMEOUT);
    expect(result.message).toContain(
      "Database operation timed out during insert",
    );
    expect(result.retryable).toBe(true);
  });

  it("handles constraint violation errors", () => {
    const originalError = new Error("constraint violation");
    const result = handleDatabaseError(originalError, "update");
    expect(result.code).toBe(ERROR_CODES.DATABASE_CONSTRAINT_VIOLATION);
    expect(result.message).toContain(
      "Database constraint violation during update",
    );
    expect(result.retryable).toBe(false);
  });

  it("handles unknown database errors", () => {
    const originalError = new Error("unknown database error");
    const result = handleDatabaseError(originalError, "delete");
    expect(result.code).toBe(ERROR_CODES.DATABASE_QUERY_FAILED);
    expect(result.message).toContain("Database operation failed during delete");
    expect(result.retryable).toBe(true);
  });
});

describe("handleImportError", () => {
  it("creates import error with row and column info", () => {
    const originalError = new Error("Invalid data");
    const result = handleImportError(originalError, 5, "email");
    expect(result.row).toBe(5);
    expect(result.column).toBe("email");
    expect(result.message).toBe("Invalid data");
    expect(result.value).toBe(originalError);
  });

  it("creates import error without row and column info", () => {
    const originalError = new Error("File read error");
    const result = handleImportError(originalError);
    expect(result.row).toBe(0);
    expect(result.column).toBe("general");
    expect(result.message).toBe("File read error");
  });

  it("handles string errors", () => {
    const result = handleImportError("Validation failed", 1, "name");
    expect(result.row).toBe(1);
    expect(result.column).toBe("name");
    expect(result.message).toBe("Validation failed");
  });
});

describe("batchOperation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("processes all items successfully", async () => {
    const items = [1, 2, 3, 4, 5];
    const operation = vi
      .fn()
      .mockImplementation((item) => Promise.resolve(item * 2));
    const result = await batchOperation(items, operation, 2);
    expect(result.results).toEqual([2, 4, 6, 8, 10]);
    expect(result.errors).toHaveLength(0);
    expect(operation).toHaveBeenCalledTimes(5);
  });

  it("handles errors in batch", async () => {
    const items = [1, 2, 3, 4, 5];
    const operation = vi.fn().mockImplementation((item) => {
      if (item === 3) {
        return Promise.reject(new Error("Item 3 failed"));
      }
      return Promise.resolve(item * 2);
    });
    const result = await batchOperation(items, operation, 2);
    expect(result.results).toEqual([2, 4, undefined, 8, 10]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].index).toBe(2); // 0-based index
    expect(result.errors[0].error.message).toBe("Item 3 failed");
  });

  it("respects batch size", async () => {
    const items = [1, 2, 3, 4, 5];
    const operation = vi
      .fn()
      .mockImplementation((item) => Promise.resolve(item * 2));
    await batchOperation(items, operation, 2);
    // Should process in batches of 2
    expect(operation).toHaveBeenCalledTimes(5);
  });

  it("handles empty items array", async () => {
    const operation = vi.fn();
    const result = await batchOperation([], operation);
    expect(result.results).toEqual([]);
    expect(result.errors).toHaveLength(0);
    expect(operation).not.toHaveBeenCalled();
  });
});

describe("createErrorBoundary", () => {
  it("creates error boundary component", () => {
    const FallbackComponent = vi.fn().mockReturnValue(<div>Error</div>);
    const ErrorBoundary = createErrorBoundary(FallbackComponent);
    expect(ErrorBoundary).toBeDefined();
    expect(typeof ErrorBoundary).toBe("function");
  });

  it("renders children when no error", () => {
    const FallbackComponent = vi.fn().mockReturnValue(<div>Error</div>);
    const ErrorBoundary = createErrorBoundary(FallbackComponent);
    const { container } = render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>,
    );
    expect(container.textContent).toContain("Content");
  });

  it("renders fallback when error occurs", () => {
    const FallbackComponent = vi
      .fn()
      .mockReturnValue(<div>Error occurred</div>);
    const ErrorBoundary = createErrorBoundary(FallbackComponent);
    const TestComponent = () => {
      throw new Error("Test error");
    };
    const { container } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>,
    );
    expect(container.textContent).toContain("Error occurred");
    expect(FallbackComponent).toHaveBeenCalled();
  });
});

describe("ERROR_CODES", () => {
  it("contains all expected error codes", () => {
    expect(ERROR_CODES.NETWORK_ERROR).toBe("network_error");
    expect(ERROR_CODES.DATABASE_CONNECTION_FAILED).toBe(
      "database_connection_failed",
    );
    expect(ERROR_CODES.AUTHENTICATION_FAILED).toBe("authentication_failed");
    expect(ERROR_CODES.VALIDATION_ERROR).toBe("validation_error");
    expect(ERROR_CODES.IMPORT_FAILED).toBe("import_failed");
    expect(ERROR_CODES.UNKNOWN_ERROR).toBe("unknown_error");
  });
});

describe("defaultRetryConfig", () => {
  it("has correct default values", () => {
    expect(defaultRetryConfig.maxAttempts).toBe(3);
    expect(defaultRetryConfig.baseDelay).toBe(1000);
    expect(defaultRetryConfig.maxDelay).toBe(10000);
    expect(defaultRetryConfig.backoffMultiplier).toBe(2);
    expect(defaultRetryConfig.retryableErrors).toContain("network_error");
    expect(defaultRetryConfig.retryableErrors).toContain("timeout");
  });
});
