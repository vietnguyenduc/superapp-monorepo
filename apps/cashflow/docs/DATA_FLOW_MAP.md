# Data Flow Map — Transaction Types

## Single Source of Truth: `TransactionTypeContext`

| Data | Source | Consumers | Transport |
|------|--------|-----------|-----------|
| `transaction_types` (id, name, color, math_factor, impact_type, company_id, is_active) | Supabase `transaction_types` table | TransactionImport dropdown, TransactionList filters, Settings CRUD, formatting helpers, Dashboard | `databaseService.transactionTypes.getTransactionTypes()` → `TransactionTypeContext` → UI |

## Mermaid Diagram

```mermaid
flowchart LR
    DB[(Supabase<br/>transaction_types)]
    SVC[databaseService.<br/>getTransactionTypes()]
    CTX[TransactionTypeContext]
    IMP[TransactionImport<br/>dropdown]
    FIL[TransactionTypeFilter<br/>dropdown]
    LST[TransactionList<br/>filters]
    SET[Settings<br/>CRUD]
    FMT[formatting.ts<br/>helpers]

    DB -->|query| SVC
    SVC -->|dedup by name| CTX
    CTX -->|types[]| IMP
    CTX -->|types[]| FIL
    CTX -->|types[]| LST
    CTX -->|types[]| SET
    CTX -->|findById/getNameById| FMT
```

## Legacy vs New Records

| Aspect | Legacy | New |
|--------|--------|-----|
| `id` | String slug (`payment`, `charge`, `adjustment`, `refund`) | UUID v4 |
| `company_id` | `null` | `22222222-2222-2222-2222-222222222222` |
| `is_active` | `true` | `true` |
| Data integrity | Referenced by historical `transactions.transaction_type` | Used by Settings UI |

**Deduplication rule in `getTransactionTypes()`**: group by `name` (case-insensitive), prefer record with non-null `company_id` (new) over legacy.

## Consumers Detail

### `TransactionImport.tsx`
- **Before**: loaded `transactionTypeOptions` via local `useEffect` calling `getTransactionTypes()` → could receive duplicate names when legacy + new rows coexist.
- **After**: consumes `transactionTypeCtx.types.map(t => t.name)` from `TransactionTypeContext`.

### `TransactionList.tsx` & `TransactionTypeFilter.tsx`
- **Before**: each loaded its own copy via `useEffect` + `getTransactionTypes(companyId)`.
- **After**: still calls service directly (acceptable for filter pages), but benefits from deduplication in `getTransactionTypes()`.

### `Settings.tsx`
- Loads types for CRUD. Uses same service layer deduplication.

### `formatting.ts`
- **Before**: `getTransactionTypeLabel`, `getTransactionMathFactor` relied on separate `cachedTransactionTypes` global cache, risking drift.
- **After**: `TransactionTypeContext.findById()` / `getNameById()` / `getMathFactor()` are the canonical helpers.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-24 | Added deduplication in `databaseService.getTransactionTypes()`; created `TransactionTypeContext`; wired `TransactionImport.tsx` to context. | Cascade |
