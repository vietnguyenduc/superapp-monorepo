---
app: inventory-operation
doc_type: DATA-MODEL
generated: true
---

# inventory-operation — Data Model

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Tenant scoping

- `company_id` is required on most tables (FK to `companies.id`).
- `branch_id` is used when data belongs to a specific branch.
- `id` columns for `customers`, `transactions`, `bank_accounts`, `branches` are `text` type containing a v4 UUID string (`crypto.randomUUID()`). Do not use `uuid` type in docs or code comments.

## Core tables for this app

- `approval_logs`
- `branches`
- `companies`
- `goods_receipt_items`
- `goods_receipts`
- `inventory_balance_snapshots`
- `inventory_movements`
- `inventory_records`
- `inventory_settings`
- `inventory_variance_reports`
- `po_items`
- `product_conversions`
- `products`
- `purchase_orders`
- `special_outbound_records`
- `stock_check_items`
- `stock_check_prints`
- `stock_count_entries`
- `supplier_products`
- `supplier_returns`
- `suppliers`
- `users`

## Notes for AI agents

- Use `crypto.randomUUID()` for new `text` `id` values.
- Always include `company_id` (and `branch_id` when relevant) in `.insert()` / `.update()`.
- Use `.maybeSingle()` for read-one queries to avoid RLS `406` errors when no row matches.
- Bulk imports should validate `customer_code` / `product_code` uniqueness within `company_id`.

## Product import rules (user-defined, 2026-09-05)

- **Required fields:** `name`, `input_unit` only.
- **Optional fields:** `business_code` (nullable, unique if provided),
  `category` (default `other`), `status` (default `active`), all others.
- **`product_category` enum values:** `fruit`, `dry_goods`, `processed`,
  `finished`, `beverage`, `tobacco`, `other`.
- **`business_code` constraint:** `UNIQUE(company_id, business_code)` —
  multiple NULLs allowed (Postgres semantics).
- **Import behavior:** `.upsert()` with `onConflict: 'company_id,business_code'`.
  Input deduplicated by `business_code` before upsert.
- **No row limit** — imports chunk internally into batches of 200.

## Service architecture (2026-09-05 refactor)

- Pages/hooks → specialized services (`ProductService`, `InventoryService`,
  `SalesService`, `SupplierService`) → `BaseService.execute()` → Supabase
- Trial mode: `BaseService.execute()` uses `fallbackService` (localStorage)
- Real mode: DB errors surface to user — NO silent fallback
- `trialMockData.ts` = seed data only, not a runtime data layer

## See also

- `docs/SUPABASE_SCHEMA_HEALTH_REPORT.md`
- `supabase/migrations/`

