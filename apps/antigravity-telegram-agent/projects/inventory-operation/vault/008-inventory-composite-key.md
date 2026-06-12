# ADR 008 — Inventory Record Composite Key

## Status

**Accepted**

## Context

Each inventory record tracks stock for a product on a specific date. Multiple records for the same product on the same date cause confusion in reports and stock calculations.

## Decision

**Enforce unique combination of `(productCode + date + branch_id)` per inventory record.**

Implementation:
1. Service layer: check existing record before insert
2. If exists, update quantity instead of creating new record
3. Normalize date to YYYY-MM-DD format before comparison

## Consequences

### Positive
- One record per product per day per branch
- Simpler stock calculation logic
- Prevents accidental duplicate entries

### Negative
- Cannot track multiple stock movements on same day for same product
- Must aggregate movements before saving (or use separate "stock movements" table in future)

## Related

- `apps/inventory-operation/docs/AI_CONTEXT.md` — Data Integrity Rules