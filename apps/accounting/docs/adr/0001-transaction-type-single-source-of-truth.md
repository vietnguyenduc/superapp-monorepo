# ADR 0001 — Transaction Type Single Source of Truth

## Status

**Accepted**

## Context

Transaction type dropdowns across the Cashflow app have repeatedly shown **duplicate items** (each type appearing twice). Root-cause investigation revealed:

1. **Database duplicates**: the `transaction_types` table contains both:
   - **Legacy records** (string IDs: `payment`, `charge`, `adjustment`, `refund`; `company_id = null`)
   - **New records** (UUID IDs; `company_id = <tenant-uuid>`)
   Both sets share the same Vietnamese `name` values (e.g., `"Điều chỉnh giảm"`).

2. **Multiple loaders**: `TransactionImport.tsx`, `TransactionList.tsx`, `TransactionTypeFilter.tsx`, and `Settings.tsx` each independently fetched the full list via `databaseService.transactionTypes.getTransactionTypes()`. Without deduplication, the UI rendered every `name` twice.

3. **Drifting caches**: `formatting.ts` maintained its own `cachedTransactionTypes` global, separate from component state, causing inconsistent labels/colors across pages.

## Decision

1. **Service-layer deduplication**: `getTransactionTypes()` in `databaseService` now groups by `name` (case-insensitive) and prefers the **new record** (non-null `company_id`) over the legacy row. This fixes the symptom for all existing consumers without requiring DB mutations (legacy rows are still referenced by historical `transactions`).

2. **React Context as canonical source**: a new `TransactionTypeContext` loads the deduplicated list once at app bootstrap and exposes:
   - `types: TransactionTypeItem[]`
   - `findById(id)` / `findByName(name)` / `getNameById(id)` / `getMathFactor(id)`

3. **Component migration**: `TransactionImport.tsx` (the page where the bug was reported) now reads from `useTransactionTypes()` instead of a local `useEffect` + state. Other pages may migrate incrementally; they still benefit from service-layer deduplication.

4. **Formatting helpers deprecation**: new UI code should prefer `useTransactionTypes().getNameById()` / `.getMathFactor()` over `formatting.ts` global-cache helpers. `formatting.ts` is retained for backward compatibility but should not be extended.

## Consequences

### Positive
- Duplicate dropdown items eliminated everywhere `getTransactionTypes()` is consumed.
- No data migration required; legacy transaction rows remain intact.
- One authoritative in-memory cache per browser session (`TransactionTypeContext`).
- Adding a new transaction type in Settings instantly reflects in all context consumers.

### Negative / Trade-offs
- Slightly more boilerplate: components must import `useTransactionTypes()` instead of a plain string array.
- Context is loaded eagerly at app mount; negligible cost (< 4 rows), but worth monitoring if the table grows.
- Filter pages (`TransactionList`, `TransactionTypeFilter`) still load via service directly. Full single-source-of-truth requires incremental migration to the context (acceptable for now because deduplication is already handled in the service).

## Related

- `src/contexts/TransactionTypeContext.tsx`
- `src/services/database.ts` — `transactionTypeService.getTransactionTypes()`
- `src/pages/DataImport/TransactionImport.tsx`
- `docs/DATA_FLOW_MAP.md`
