# Data Flow Map — Inventory Operation System

> **Pattern copied from cashflow app (`apps/cashflow/docs/DATA_FLOW_MAP.md`)**

## Product Catalog Data Flow

### Single Source of Truth
- **Database table:** `products`
- **Service layer:** `databaseService.ts` — `getProducts()`, `createProduct()`, `updateProduct()`
- **Global cache:** Loaded at app init, refreshed after mutations

### Data Flow
```
Database (products table)
    ?
databaseService.getProducts()
    ?
Global product cache (in-memory / context)
    ?
ProductCatalogPage.tsx (display)
ProductImportPage.tsx (reference for import)
InventoryInputPage.tsx (dropdown selection)
```

### Legacy vs New Records
- **Legacy:** Products created before multi-tenancy may lack `company_id`
- **Migration:** Gradually assign `company_id` via admin settings
- **Filter:** All queries now include `company_id` and `branch_id` filters

## Inventory Records Data Flow

### Single Source of Truth
- **Database table:** `inventory_records`
- **Service layer:** `databaseService.ts` — `getInventoryRecords()`, `createInventoryRecord()`
- **Unique constraint:** `(productCode + date)` per branch

### Data Flow
```
Database (inventory_records table)
    ?
databaseService.getInventoryRecords(filters)
    ?
InventoryInputPage.tsx (entry)
InventoryReportPage.tsx (reporting)
InventoryVarianceReportPage.tsx (variance analysis)
```

### Consumers
| Component | Uses |
|-----------|------|
| `InventoryInputPage.tsx` | Create/edit inventory records |
| `InventoryReportPage.tsx` | Aggregate by product, date range |
| `InventoryVarianceReportPage.tsx` | Compare actual vs expected stock |
| `DashboardPage.tsx` | Summary metrics |

## Sales Records Data Flow

### Single Source of Truth
- **Database table:** `sales_records`
- **Service layer:** `databaseService.ts` — `getSalesRecords()`, `createSalesRecord()`

### Data Flow
```
Database (sales_records table)
    ?
databaseService.getSalesRecords(dateRange)
    ?
SalesReportPage.tsx (reporting)
DashboardPage.tsx (summary metrics)
```

## Import Data Flow

### CSV Import ? Database
```
User uploads CSV
    ?
Parse CSV ? Validate rows
    ?
Check product codes exist in `products`
    ?
Validate quantities >= 0
    ?
Reject entire batch if any row fails
    ?
Insert into `inventory_records` or `products`
    ?
Invalidate global cache
    ?
Refresh UI
```

### Import Templates
- Located in `docs/import-templates/`
- Standard CSV format with headers matching database columns

## Anti-Patterns to Avoid

### 1. Dual Data Sources
? **Don't:** Load products from global cache AND from component-level filtered query for the same display logic.
? **Do:** Use global cache for display; component state only for filter dropdowns.

### 2. Missing Validation
? **Don't:** Allow negative quantities or duplicate `businessCode`.
? **Do:** Validate server-side before database write.

### 3. Stale Cache
? **Don't:** Display old data after import without refreshing cache.
? **Do:** Invalidate and reload cache after any mutation.

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-05-01 | Added multi-tenancy (`company_id`, `branch_id`) | All queries now require company/branch filter |
| 2026-05-01 | Added `app_permissions` gating | Shared Supabase project with cashflow app |