# ADR 003 — Server-Side Validation

## Status

**Accepted**

## Context

Client-side validation can be bypassed. Critical bug in cashflow app: mass update set wrong `customer_id` for all transactions because form validation was incomplete and server-side validation was missing.

## Decision

**All data mutations must pass server-side validation in the service layer before database write.**

Validation rules for inventory:
- Product `businessCode` must be unique per company
- `inventory_records` composite key: `(productCode + date)` per branch
- All quantities must be >= 0
- Foreign keys must exist before insert
- Bulk imports: max 200 rows, reject entire batch on any error

## Consequences

### Positive
- Data integrity guaranteed regardless of client state
- Prevents corrupted data from bypassed client validation
- Single validation logic reusable across all entry points (form, import, API)

### Negative
- More code in service layer
- Slightly slower response for bulk operations
- Need to keep client and server validation rules in sync

## Related

- `docs/PROMPT_GUIDELINES_DATA_OPS.md` — Data integrity lessons from cashflow
- `apps/inventory-operation/docs/PROJECT_RULES.md` — Database Rules