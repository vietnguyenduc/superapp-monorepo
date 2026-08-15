---
app: accounting
doc_type: API
generated: true
---

# accounting — API / Service Surface

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Service modules

- `api` — see implementation in `apps/accounting/src/services/api.ts`
- `backupHistoryService` — see implementation in `apps/accounting/src/services/backupHistoryService.ts`
- `bankAccountService` — see implementation in `apps/accounting/src/services/bankAccountService.ts`
- `branchService` — see implementation in `apps/accounting/src/services/branchService.ts`
- `businessLogic/calculations` — see implementation in `apps/accounting/src/services/businessLogic/calculations.ts`
- `businessLogic/index` — see implementation in `apps/accounting/src/services/businessLogic/index.ts`
- `businessLogic/transformation` — see implementation in `apps/accounting/src/services/businessLogic/transformation.ts`
- `businessLogic/validation` — see implementation in `apps/accounting/src/services/businessLogic/validation.ts`
- `colorSettingsService` — see implementation in `apps/accounting/src/services/colorSettingsService.ts`
- `customerService` — see implementation in `apps/accounting/src/services/customerService.ts`
- `dashboardService` — see implementation in `apps/accounting/src/services/dashboardService.ts`
- `database` — see implementation in `apps/accounting/src/services/database.ts`
- `mockData` — see implementation in `apps/accounting/src/services/mockData.ts`
- `mockDataUpdated` — see implementation in `apps/accounting/src/services/mockDataUpdated.ts`
- `reportService` — see implementation in `apps/accounting/src/services/reportService.ts`
- `sampleData` — see implementation in `apps/accounting/src/services/sampleData.ts`
- `supabase` — see implementation in `apps/accounting/src/services/supabase.ts`
- `transactionService` — see implementation in `apps/accounting/src/services/transactionService.ts`
- `transactionTypeService` — see implementation in `apps/accounting/src/services/transactionTypeService.ts`
- `trialMockStore` — see implementation in `apps/accounting/src/services/trialMockStore.ts`
- `user-service` — see implementation in `apps/accounting/src/services/user-service.ts`

## Supabase tables accessed

This app uses `createApiClient` / `supabase.from(...)` to read and write the tables listed in `DATA-MODEL.md`.

## Conventions

- Service functions return `{ data, error }` shapes.
- Errors are normalized to a user-facing Vietnamese message and an `originalError` for Sentry.
- `company_id` is always injected from `useCompany()` or the current user.

## Backend Fastify API

Cross-app utilities (trial seeds, query proxy) live in `packages/api` (Fastify, port 3001). Not Express.

