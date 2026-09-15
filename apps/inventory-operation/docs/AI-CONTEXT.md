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

- **Tenant isolation migration pending application:** `20260912230438_inventory_tenant_branch_security.sql` replaces permissive legacy Inventory policies. `admin_company` must match the protected row's `company_id`; non-company admins also require a matching non-null `branch_id`. Apply and run two-tenant verification before real-data pilot.

- **Warehouse scope:** operational lists and reports follow the user's selected or assigned branch. The product catalog remains company-wide.
- **Supplier matching:** `import_export_config.supplierMatchField` chooses `customer_code` or `full_name` for bulk inbound files. The bulk grid and downloaded template follow that choice; duplicate supplier names are rejected before import.
- **Pilot safety math:** use `src/utils/inventoryPilotMath.ts`. Stock is `Σ input - Σ output`, negative stock remains visible, zero-sales DOH is `null`, and variance thresholds use percentage points (`5`, not `0.05`).
- **Atomic write boundary:** live goods-receipt completion calls `inventory_complete_goods_receipt`; live inbound/outbound bulk import calls `inventory_import_batch`; Sales sync calls `inventory_sync_sales_record`. These RPCs are introduced by `20260911162323_inventory_pilot_safety.sql` and must exist before deploying the matching frontend.
- **Manual movement identity:** product autocomplete fields must carry the selected product ID to services. Free text is only a search query and must never be treated as a resolved product. `20260915120000_inventory_batch_canonical_product_selection.sql` lets the batch RPC prefer this canonical ID while keeping code/name matching for spreadsheet rows.
- **Inbound workflow safety:** the consolidated Nhập hàng page currently enables only Nhận hàng (GR). PO must not increase stock, and supplier returns must be outbound, so those cards stay disabled until their separate workflows are implemented.
- **Pilot XNT source:** `InventoryRecordsPage` derives opening/inbound/outbound/closing rows from `inventory_records` through `buildInventoryTransactionReport`; do not switch it back to `inventory_variance_reports`, because bulk movements are written to the transaction ledger.
- **Bulk traceability:** both import pages show recent server-backed batch history by grouping `inventory_records` with `source_type=bulk_import` and the same `reference_id`. Trial history remains in browser storage. Live retries use the batch ID as the idempotency key in `inventory_import_batch`.
- **Branch-safe writes:** use `getCurrentInventoryScope()` for direct Inventory writers. Migration `20260913013000_inventory_branch_unit_count_hardening.sql` also derives and validates branch ownership at the database boundary.
- **Canonical transaction unit:** `inventory_records.unit` must equal the product `input_unit`. Convert before writing; reports and stock counts never add quantities in incompatible units.
- **Stock counts:** sessions snapshot one company/branch ledger, lock book quantities, require every physical count and an explanation for every variance, then create linked `stock_count_adjustment` records on approval.
- **Multi-warehouse:** the hardening migration introduces atomic paired transfers. Only companies with at least two active branches see the transfer UI; single-warehouse companies stay on the simpler workflow.
- **Adaptive warehouse workspace:** `WarehouseWorkspaceProvider` handles zero/one/many active branches. Zero shows first-warehouse setup to `admin_company`; creating the first branch adopts unassigned users and history. One is selected silently; many show the working-warehouse picker and transfer navigation. Staff never switch their assigned branch.
- **Stock-count workflow:** `/stock-counts` creates an immutable book snapshot in `inventory_count_sessions`/`inventory_count_lines`. Every differing physical count requires an explanation. Approval atomically creates a linked `stock_count_adjustment` record for each variance.
- **Canonical units:** stock-count snapshots reject historical rows whose unit differs from the product `input_unit`. Product units cannot change after the first inventory transaction. Conversion rates must be positive and internally consistent; report totals stay grouped by unit.
- **Dashboard/MRP source:** current stock, top-stock rows, MRP and recent balances must use `buildProductLedgerBalances` over active `inventory_records` up to the as-of time, never the latest row's legacy stock fields. Cancelled and future-dated movements are excluded. Quantity charts stop when multiple units would be combined. Category charts count stocked products instead of summing unlike units.
- **Demand rate:** MRP uses `calculateDailyOutput`; preserve fractional daily demand and exclude future-dated records. Do not round demand before calculating DOH or suggested purchase quantity.

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
