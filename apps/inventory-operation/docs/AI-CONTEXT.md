---
app: inventory-operation
doc_type: AI-CONTEXT
generated: true
---

# inventory-operation — AI Context

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## One-line summary

Inventory management: products, categories, stock movements, purchase orders, goods receipts, special outbound, variance reporting, and stock-check printing.

## Read this first

- `apps/inventory-operation/docs/OVERVIEW.md` — what the app does
- `apps/inventory-operation/docs/DATA-MODEL.md` — tables and tenant scoping
- `apps/inventory-operation/docs/ROLES-PERMISSIONS.md` — who can do what
- `apps/inventory-operation/docs/CHANGELOG.md` — recent changes and gotchas

## Common tasks

| Task | Start here |
|------|------------|
| Add a new page | `src/pages/` + route in `App.tsx` |
| Add a new service | `src/services/<feature>Service.ts` |
| Change a DB query | `src/services/<feature>Service.ts` and `supabase/migrations/` |
| Add a permission | `src/types/UserRole.ts` + route/component guards |
| Fix Vietnamese label | `src/i18n/` or hardcoded JSX; update test snapshots |
| Add import/export | `src/services/excelImportService.ts` / `exportService.ts` patterns |

## Key gotchas

- `id` columns (`customers`, `transactions`, `bank_accounts`, `branches`, etc.) are `text` containing v4 UUID strings, not `uuid` type.
- Always include `company_id` in mutations. Use `maybeSingle()` for reads that may return zero rows.
- Do **not** use `.single()` on RLS-scoped selects unless the row is guaranteed to exist and the user has access.
- Do **not** build schema-per-tenant; this project uses `company_id` + RLS.
- Cashflow sign convention: positive amount = increase, negative = decrease; math factor is `+1` or `-1`. Use `getCustomerBalanceDelta()` rather than `Math.abs()` when deciding whether a transaction reduces debt.

## Useful source files

- `src/pages/Auth/Login`
- `src/pages/Auth/SignUp`
- `src/pages/CompanySelector/CompanySelector`
- `src/pages/DashboardPage`
- `src/pages/DashboardPageEnhanced`
- `src/pages/DataImportSettingsPage`
- `src/pages/DebugTestPage`
- `src/pages/EditableGridDemoPage`
- `src/pages/ExcelDataDemoPage`
- `src/pages/GoodsReceiptPage`
- `src/pages/HelpPage`
- `src/pages/ImportSettingsPage`
- `src/pages/InventoryBulkImportPage`
- `src/pages/InventoryEntryPage`
- `src/pages/InventoryExportPage`
- `src/services/appSettingsService`
- `src/services/authService`
- `src/services/baseService`
- `src/services/cashflowIntegrationService`
- `src/services/columnConfigService`
- `src/services/columnSettingsService`
- `src/services/databaseService`
- `src/services/excelImportService`
- `src/services/exportService`
- `src/services/exportTemplates`
- `src/services/fallbackService`
- `src/services/googleSheetsService`
- `src/services/inventoryMovementService`
- `src/services/inventoryService`
- `src/services/inventoryVarianceService`

## Tables this app touches

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

