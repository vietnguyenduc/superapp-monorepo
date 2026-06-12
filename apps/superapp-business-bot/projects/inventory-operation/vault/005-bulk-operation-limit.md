# ADR 005: Enforce 200-Row Limit for Bulk Operations

## Status
Accepted

## Context
Bulk import/export operations can handle large datasets. Need to decide on row limits.

Options considered:
1. No limit (unlimited bulk operations)
2. Small limit (50 rows)
3. Medium limit (200 rows)
4. Large limit (1000 rows)
5. Dynamic limit based on data size

## Decision
Enforce 200-row limit for bulk operations.

## Rationale

### Why 200 Rows

**Performance Considerations:**
- **Database Transactions:** 200 rows completes within transaction timeout
- **Memory Usage:** Fits comfortably in browser memory
- **Network Transfer:** Reasonable payload size for HTTP requests
- **Processing Time:** Completes in acceptable time (< 10 seconds)

**User Experience:**
- **Error Recovery:** Easier to identify and fix errors in smaller batches
- **Progress Feedback:** More granular progress updates
- **Retry Strategy:** Failed batches can be retried independently
- **Validation:** Easier to validate and correct data

**System Stability:**
- **Timeout Prevention:** Avoids browser and server timeouts
- **Resource Management:** Prevents resource exhaustion
- **Concurrent Operations:** Allows multiple users to import simultaneously
- **Database Load:** Prevents database overload

### Why Not Other Options

**No Limit:**
- Risk of timeouts
- Memory exhaustion
- Poor error recovery
- System instability

**Small Limit (50):**
- Too restrictive for legitimate use cases
- Forces users to split valid imports
- Poor user experience

**Large Limit (1000):**
- Increased timeout risk
- Memory pressure
- Slower error recovery
- Harder to validate

**Dynamic Limit:**
- Complex to implement
- Unpredictable behavior
- Hard to communicate to users

## Consequences

### Positive
- Predictable performance
- Better error recovery
- Improved system stability
- Clear user expectations

### Negative
- Users must split larger imports
- Additional manual effort for large datasets
- Potential user frustration

### Mitigation
- Provide clear error messages explaining limit
- Offer template download for proper formatting
- Document best practices for bulk operations
- Consider increasing limit in future if needed

## Implementation

```typescript
const MAX_BULK_ROWS = 200;

async bulkInsertProducts(products: Product[]): Promise<DatabaseResponse<Product[]>> {
  if (products.length > MAX_BULK_ROWS) {
    return { 
      data: null, 
      error: `Maximum ${MAX_BULK_ROWS} rows allowed per import` 
    };
  }
  // Proceed with bulk insert
}
```

## Alternatives Considered
- **No Limit:** Rejected due to stability risks
- **50 Rows:** Rejected as too restrictive
- **1000 Rows:** Rejected due to performance risks
- **Dynamic Limit:** Rejected due to complexity

## References
- Supabase Performance Guide: https://supabase.com/docs/guides/platform/performance
