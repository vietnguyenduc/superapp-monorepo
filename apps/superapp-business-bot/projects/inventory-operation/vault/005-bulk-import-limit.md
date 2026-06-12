# ADR 005 — Bulk Import Limit (200 Rows)

## Status

**Accepted**

## Context

Large bulk imports cause timeouts, memory issues, and poor UX. Cashflow app experienced performance degradation with imports > 500 rows.

## Decision

**Maximum 200 rows per bulk import operation.**

Implementation:
- UI: Split large files into chunks before sending
- Service layer: Reject batches > 200 rows with clear error
- Progress indicator for multi-batch imports

## Consequences

### Positive
- Prevents browser timeout and memory issues
- Better UX with progress feedback
- Easier to debug failed imports (smaller batches)
- Server-side rejection protects backend

### Negative
- User must split very large files
- Multiple round-trips for large datasets
- Need queue system for very large imports (future enhancement)

## Related

- `apps/inventory-operation/docs/PROJECT_RULES.md` — Import / Export Rules