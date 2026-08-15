---
app: inventory-operation
doc_type: API
generated: true
---

# inventory-operation — API / Service Surface

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Service modules

- `appSettingsService` — see implementation in `apps/inventory-operation/src/services/appSettingsService.ts`
- `authService` — see implementation in `apps/inventory-operation/src/services/authService.ts`
- `baseService` — see implementation in `apps/inventory-operation/src/services/baseService.ts`
- `cashflowIntegrationService` — see implementation in `apps/inventory-operation/src/services/cashflowIntegrationService.ts`
- `columnConfigService` — see implementation in `apps/inventory-operation/src/services/columnConfigService.ts`
- `columnSettingsService` — see implementation in `apps/inventory-operation/src/services/columnSettingsService.ts`
- `databaseService` — see implementation in `apps/inventory-operation/src/services/databaseService.ts`
- `excelImportService` — see implementation in `apps/inventory-operation/src/services/excelImportService.ts`
- `exportService` — see implementation in `apps/inventory-operation/src/services/exportService.ts`
- `exportTemplates` — see implementation in `apps/inventory-operation/src/services/exportTemplates.ts`
- `fallbackService` — see implementation in `apps/inventory-operation/src/services/fallbackService.ts`
- `googleSheetsService` — see implementation in `apps/inventory-operation/src/services/googleSheetsService.ts`
- `inventoryMovementService` — see implementation in `apps/inventory-operation/src/services/inventoryMovementService.ts`
- `inventoryService` — see implementation in `apps/inventory-operation/src/services/inventoryService.ts`
- `inventoryVarianceService` — see implementation in `apps/inventory-operation/src/services/inventoryVarianceService.ts`
- `mappers/googleSheetProductMapper` — see implementation in `apps/inventory-operation/src/services/mappers/googleSheetProductMapper.ts`
- `mappers/inventoryMapper` — see implementation in `apps/inventory-operation/src/services/mappers/inventoryMapper.ts`
- `mappers/productMapper` — see implementation in `apps/inventory-operation/src/services/mappers/productMapper.ts`
- `mappers/salesMapper` — see implementation in `apps/inventory-operation/src/services/mappers/salesMapper.ts`
- `mockService` — see implementation in `apps/inventory-operation/src/services/mockService.ts`
- `productColumnSettingsService` — see implementation in `apps/inventory-operation/src/services/productColumnSettingsService.ts`
- `productLookupService` — see implementation in `apps/inventory-operation/src/services/productLookupService.ts`
- `productService` — see implementation in `apps/inventory-operation/src/services/productService.ts`
- `salesService` — see implementation in `apps/inventory-operation/src/services/salesService.ts`
- `specialOutboundService` — see implementation in `apps/inventory-operation/src/services/specialOutboundService.ts`
- `varianceReportingService` — see implementation in `apps/inventory-operation/src/services/varianceReportingService.ts`

## Supabase tables accessed

This app uses `createApiClient` / `supabase.from(...)` to read and write the tables listed in `DATA-MODEL.md`.

## Conventions

- Service functions return `{ data, error }` shapes.
- Errors are normalized to a user-facing Vietnamese message and an `originalError` for Sentry.
- `company_id` is always injected from `useCompany()` or the current user.

## Backend Fastify API

Cross-app utilities (trial seeds, query proxy) live in `packages/api` (Fastify, port 3001). Not Express.

