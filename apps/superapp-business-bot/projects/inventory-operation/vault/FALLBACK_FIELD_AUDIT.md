# Fallback Field Audit for Phase 5

## Overview
This document tracks the usage of old fallback fields that need to be replaced with the canonical inventory model in Phase 5.

## Old Fallback Fields
- `inputQuantity` - Used to infer "Nhập" (inbound)
- `finishedProductStock` - Used to infer "Tồn sổ" (book inventory)
- `rawMaterialStock` - Used to infer "Tồn thật" (actual inventory)

## Files Using These Fields

### Pages (High Priority for Phase 5)
- `InventoryRecordsPage.tsx` - Infers Xuất, Tồn sổ, Tồn thật from fallback fields
- `InventoryEntryPage.tsx` - Uses fallback fields in forms
- `InventoryInputPage.tsx` - Uses fallback fields
- `InventoryImport.tsx` - Uses fallback fields for import
- `InventoryBulkImportPage.tsx` - Uses fallback fields for bulk import
- `DashboardPageEnhanced.tsx` - Uses fallback fields for dashboard metrics

### Components (High Priority for Phase 5)
- `InventoryTable.tsx` - Displays fallback fields
- `InventoryInputForm.tsx` - Form uses fallback fields
- `ProductCatalogForm.tsx` - Product form uses fallback fields
- `ProductCatalogTable.tsx` - Product table displays fallback fields
- `ImportExport/ImportExportPage.tsx` - Import/export uses fallback fields
- `Import/ProductBulkImportEnhanced.tsx` - Bulk import uses fallback fields
- `Form/InventoryEntryForm.tsx` - Entry form uses fallback fields
- `Form/ProductEntryForm.tsx` - Product entry uses fallback fields

### Services (Medium Priority for Phase 5)
- `databaseService.ts` - Database operations use fallback fields
- `fallbackService.ts` - Fallback service uses fallback fields
- `excelImportService.ts` - Excel import uses fallback fields
- `googleSheetsService.ts` - Google Sheets import uses fallback fields
- `columnConfigService.ts` - Column config references fallback fields

### Types (Low Priority - just definitions)
- `types/Product.ts` - Product type definitions
- `types/product-catalog.ts` - Product catalog types
- `types/InventoryRecord.ts` - Inventory record types

### Utils (Low Priority)
- `utils/validation.ts` - Validation uses fallback fields
- `utils/importUtils.ts` - Import utilities use fallback fields

### Data Files (Low Priority - mock data)
- `data/realInventoryData.ts` - Mock data uses fallback fields
- `data/realInventoryTransactions.ts` - Mock transactions use fallback fields
- `data/realProductsData.ts` - Mock products use fallback fields
- `data/realProductsData_old.ts` - Old mock products use fallback fields
- `data/simpleMockData.ts` - Simple mock data uses fallback fields
- `data/mockData.ts` - Mock data uses fallback fields

### Hooks (Medium Priority for Phase 5)
- `hooks/useProductCatalog.ts` - Product catalog hook uses fallback fields

## Phase 5 Migration Strategy

When implementing Phase 5 (Inventory data model redesign), replace fallback fields with:
- `inventory_movements` table for transaction records
- `inventory_balance_snapshots` for balance tracking
- Explicit `transaction_type` (Nhập/Xuất)
- Explicit `source` field (sales, purchase, stock_count, adjustment)
- Explicit `running_balance` after each movement

## Current State (Phase 1)
- Database tables `inventory_variance_reports` and `export_logs` exist with proper schema
- Services already query these tables
- `useInventory.ts` updated to DB-first with fallback as safety net
- Old fallback field usage is documented for Phase 5 migration
