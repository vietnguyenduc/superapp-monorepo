# ADR 007 — Product Code Uniqueness (businessCode)

## Status

**Accepted**

## Context

Product codes (`businessCode`) must be unique within a company to prevent duplicate inventory entries and reporting errors. No database-level unique constraint exists yet.

## Decision

**Enforce product code uniqueness at service layer immediately; add database unique constraint as migration when feasible.**

Service-layer validation:
1. Before insert: query `products` table for existing `businessCode` within same `company_id`
2. If exists, reject with error: "Product code X already exists"
3. Normalize code (trim, uppercase) before comparison

## Consequences

### Positive
- Prevents duplicate product entries
- Clear error messages for users
- Can be implemented without database migration

### Negative
- Race condition possible between check and insert (mitigated by retry logic)
- Slightly slower insert due to pre-check query
- Database constraint still needed for true guarantee

## Related

- `apps/inventory-operation/docs/AI_CONTEXT.md` — Data Integrity Rules