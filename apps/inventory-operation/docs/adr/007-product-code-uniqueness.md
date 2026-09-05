# ADR 007 — Product Code Uniqueness (business_code)

## Status

**Updated (2026-09-05)** — `business_code` is now **optional** (nullable).
Unique constraint still enforced for non-null values.

## Context

Product codes (`business_code`) must be unique within a company to prevent
duplicate inventory entries and reporting errors.

**User rule (2026-09-05):** Only `name` and `input_unit` are required for
product import. `business_code` is optional — many F&B businesses don't
use product codes.

## Decision

### Database constraint

```sql
UNIQUE (company_id, business_code)
```

- Enforced at DB level
- Multiple NULL values allowed (Postgres semantics: NULL != NULL)
- Non-null values must be unique within `company_id`

### Service layer

- `bulkInsertProducts()` / `importProducts()` use `.upsert()` with
  `onConflict: 'company_id,business_code'` — duplicates update existing rows
- Input is deduplicated by `business_code` before upsert (Postgres throws
  "affect row a second time" if same batch has 2+ rows with same code)
- Rows without `business_code` are kept as separate products (not merged)

### Mapper

- `ProductMapper.mapProductToDb()`: empty string → `null`
  (so Postgres treats missing code as NULL, not as a conflicting empty value)

## Consequences

### Positive
- Users can import products without codes (common in F&B)
- Products with codes are still deduplicated/updated on re-import
- No silent fallback — DB errors surface to user

### Negative
- Products without codes can't be deduplicated on re-import
  (each import creates a new row)
- Must use `upsert` instead of `insert` to handle re-imports

## Validation Rules (current)

| Field | Required? | Notes |
|-------|-----------|-------|
| `name` | Yes | Product name |
| `input_unit` | Yes | Unit of measurement |
| `business_code` | No | If provided, must be unique within company |
| `category` | No | Defaults to `other`; valid: fruit, dry_goods, processed, finished, beverage, tobacco, other |
| `status` | No | Defaults to `active` |
| `output_unit` | No | Defaults to `input_unit` |

## Related

- `apps/inventory-operation/docs/AI_CONTEXT.md` — Data Integrity Rules
- Migration: `20260905000001_add_product_category_enum_values.sql`
- Commit `76b64cd2` (fix: allow import without business_code)
