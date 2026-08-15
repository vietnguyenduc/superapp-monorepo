---
app: inventory-operation
doc_type: OVERVIEW
generated: true
---

# inventory-operation — Overview

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Purpose

Inventory management: products, categories, stock movements, purchase orders, goods receipts, special outbound, variance reporting, and stock-check printing.

- **Local port:** 5175
- **Production domain:** `inventory.appforyou.xyz`
- **Vercel project:** `inventory-operation`

## Tech stack

- React 18 + TypeScript 5.8 + Vite 8
- Tailwind CSS (Apple-inspired design tokens from `@superapp/theme`)
- Supabase cloud (`peslmsctejmvkwzyohke`) via `@superapp/shared-utils` `createApiClient`
- Shared auth / company context from `@superapp/iam`

## Key dependencies

- @repo/types
- @repo/ui
- @supabase/supabase-js
- @superapp/iam
- @superapp/shared-utils
- react
- react-beautiful-dnd
- react-dom
- react-dropzone
- react-i18next
- react-router-dom

## Main pages

- `Auth/Login`
- `Auth/SignUp`
- `CompanySelector/CompanySelector`
- `DashboardPage`
- `DashboardPageEnhanced`
- `DataImportSettingsPage`
- `DebugTestPage`
- `EditableGridDemoPage`
- `ExcelDataDemoPage`
- `GoodsReceiptPage`
- `HelpPage`
- `ImportSettingsPage`
- `InventoryBulkImportPage`
- `InventoryEntryPage`
- `InventoryExportPage`
- `InventoryImport`
- `InventoryInputPage`
- `InventoryMRPPage`
- `InventoryRecordsPage`
- `InventoryReportPage`
- `InventoryTransactionImportPage`
- `InventoryVarianceReportPage`
- `PermissionDemoPage`
- `ProductBulkImportComplete`
- `ProductBulkImportPage`
- `ProductCatalogDemoPage`
- `ProductCatalogImportPage`
- `ProductCatalogPage`
- `ProductCatalogPageEnhanced`
- `ProductCatalogPageFull`

## Main services

- `appSettingsService`
- `authService`
- `baseService`
- `cashflowIntegrationService`
- `columnConfigService`
- `columnSettingsService`
- `databaseService`
- `excelImportService`
- `exportService`
- `exportTemplates`
- `fallbackService`
- `googleSheetsService`
- `inventoryMovementService`
- `inventoryService`
- `inventoryVarianceService`
- `mappers/googleSheetProductMapper`
- `mappers/inventoryMapper`
- `mappers/productMapper`
- `mappers/salesMapper`
- `mockService`
- `productColumnSettingsService`
- `productLookupService`
- `productService`
- `salesService`
- `specialOutboundService`
- `varianceReportingService`

## Related Supabase tables

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

## Quick links

- `apps/inventory-operation/docs/ARCHITECTURE.md` — structure & routing
- `apps/inventory-operation/docs/DATA-MODEL.md` — tables & relationships
- `apps/inventory-operation/docs/API.md` — service / API surface
- `apps/inventory-operation/docs/AI-CONTEXT.md` — agent gotchas & tasks
- `apps/inventory-operation/docs/CHANGELOG.md` — recent changes

