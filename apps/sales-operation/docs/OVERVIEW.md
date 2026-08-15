---
app: sales-operation
doc_type: OVERVIEW
generated: true
---

# sales-operation — Overview

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Purpose

Sales orders + POS for F&B (fruit, dry goods, drinks): customers, sales orders, commissions, marketing costs, inventory, and special outbound.

- **Local port:** 5176
- **Production domain:** `sales.appforyou.xyz`
- **Vercel project:** `sales-operation`

## Tech stack

- React 18 + TypeScript 5.8 + Vite 8
- Tailwind CSS (Apple-inspired design tokens from `@superapp/theme`)
- Supabase cloud (`peslmsctejmvkwzyohke`) via `@superapp/shared-utils` `createApiClient`
- Shared auth / company context from `@superapp/iam`

## Key dependencies

- @repo/types
- @repo/ui
- @supabase/supabase-js
- @superapp/einvoice
- @superapp/iam
- @superapp/shared-utils
- @superapp/trial-client
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
- `CustomerManagementPage`
- `DashboardPage`
- `DashboardPageEnhanced`
- `DataImportSettingsPage`
- `DebugTestPage`
- `EditableGridDemoPage`
- `ExcelDataDemoPage`
- `HelpPage`
- `ImportSettingsPage`
- `InventoryBulkImportPage`
- `InventoryEntryPage`
- `InventoryExportPage`
- `InventoryImport`
- `InventoryInputPage`
- `InventoryRecordsPage`
- `InventoryReportPage`
- `InventoryTransactionImportPage`
- `InventoryVarianceReportPage`
- `InvoiceManagementPage`
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

## Quick links

- `apps/sales-operation/docs/ARCHITECTURE.md` — structure & routing
- `apps/sales-operation/docs/DATA-MODEL.md` — tables & relationships
- `apps/sales-operation/docs/API.md` — service / API surface
- `apps/sales-operation/docs/AI-CONTEXT.md` — agent gotchas & tasks
- `apps/sales-operation/docs/CHANGELOG.md` — recent changes

