# ADR 005 — Bulk Import Limit (200 Rows)

## Status

**Superseded (2026-09-05)** — Row limit removed. Bulk imports now chunk
internally (BATCH_SIZE=200) and send multiple batches to Supabase, so users
can import files of any size without manual splitting.

See commit `5b29b11f` (feat: remove bulk import 500-row limit + add unit
management in Settings).

## Context

Large bulk imports cause timeouts, memory issues, and poor UX. Cashflow app
experienced performance degradation with imports > 500 rows.

## Original Decision (superseded)

Maximum 200 rows per bulk import operation.

Implementation:
- UI: Split large files into chunks before sending
- Service layer: Reject batches > 200 rows with clear error
- Progress indicator for multi-batch imports

## Current Behavior

- No row limit — users can import files of any size
- `bulkInsertProducts()` chunks internally into batches of 200 rows
- Each batch is sent as a separate Supabase upsert call
- Errors on any batch stop the import (no partial duplicates)

## Related

- `apps/inventory-operation/docs/PROJECT_RULES.md` — Import / Export Rules
