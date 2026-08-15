---
app: sales-operation
doc_type: AI-CONTEXT
generated: true
---

# sales-operation — AI Context

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## One-line summary

Sales orders + POS for F&B (fruit, dry goods, drinks): customers, sales orders, commissions, marketing costs, inventory, and special outbound.

## Read this first

- `apps/sales-operation/docs/OVERVIEW.md` — what the app does
- `apps/sales-operation/docs/DATA-MODEL.md` — tables and tenant scoping
- `apps/sales-operation/docs/ROLES-PERMISSIONS.md` — who can do what
- `apps/sales-operation/docs/CHANGELOG.md` — recent changes and gotchas

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
- `src/pages/CustomerManagementPage`
- `src/pages/DashboardPage`
- `src/pages/DashboardPageEnhanced`
- `src/pages/DataImportSettingsPage`
- `src/pages/DebugTestPage`
- `src/pages/EditableGridDemoPage`
- `src/pages/ExcelDataDemoPage`
- `src/pages/HelpPage`
- `src/pages/ImportSettingsPage`
- `src/pages/InventoryBulkImportPage`
- `src/pages/InventoryEntryPage`
- `src/pages/InventoryExportPage`
- `src/services/appSettingsService`
- `src/services/authService`
- `src/services/baseService`
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
- `src/services/mappers/googleSheetProductMapper`

## Tables this app touches

- `branches`
- `commission_settings`
- `companies`
- `inventory_records`
- `marketing_costs`
- `products`
- `sales_channels`
- `sales_order_items`
- `sales_orders`
- `sales_targets`
- `special_outbound_records`
- `supplier_products`
- `users`

