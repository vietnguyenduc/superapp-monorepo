---
app: cashflow
doc_type: API
generated: true
---

# cashflow — API / Service Surface

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Service modules

- `approvalService` — see implementation in `apps/cashflow/src/services/approvalService.ts`
- `backupHistoryService` — see implementation in `apps/cashflow/src/services/backupHistoryService.ts`
- `bankAccountService` — see implementation in `apps/cashflow/src/services/bankAccountService.ts`
- `branchService` — see implementation in `apps/cashflow/src/services/branchService.ts`
- `businessLogic/balanceMath` — see implementation in `apps/cashflow/src/services/businessLogic/balanceMath.ts`
- `businessLogic/index` — see implementation in `apps/cashflow/src/services/businessLogic/index.ts`
- `businessLogic/parsers` — see implementation in `apps/cashflow/src/services/businessLogic/parsers.ts`
- `businessLogic/transformation` — see implementation in `apps/cashflow/src/services/businessLogic/transformation.ts`
- `businessLogic/validation` — see implementation in `apps/cashflow/src/services/businessLogic/validation.ts`
- `colorSettingsService` — see implementation in `apps/cashflow/src/services/colorSettingsService.ts`
- `customerService` — see implementation in `apps/cashflow/src/services/customerService.ts`
- `dashboardService` — see implementation in `apps/cashflow/src/services/dashboardService.ts`
- `database` — see implementation in `apps/cashflow/src/services/database.ts`
- `mockData` — see implementation in `apps/cashflow/src/services/mockData.ts`
- `reportService` — see implementation in `apps/cashflow/src/services/reportService.ts`
- `supabase` — see implementation in `apps/cashflow/src/services/supabase.ts`
- `transactionService` — see implementation in `apps/cashflow/src/services/transactionService.ts`
- `transactionTypeService` — see implementation in `apps/cashflow/src/services/transactionTypeService.ts`
- `trialMockStore` — see implementation in `apps/cashflow/src/services/trialMockStore.ts`
- `updateHelpers` — see implementation in `apps/cashflow/src/services/updateHelpers.ts`
- `user-service` — see implementation in `apps/cashflow/src/services/user-service.ts`

## Supabase tables accessed

This app uses `createApiClient` / `supabase.from(...)` to read and write the tables listed in `DATA-MODEL.md`.

## Conventions

- Service functions return `{ data, error }` shapes.
- Errors are normalized to a user-facing Vietnamese message and an `originalError` for Sentry.
- `company_id` is always injected from `useCompany()` or the current user.

## Backend Fastify API

Cross-app utilities (trial seeds, query proxy) live in `packages/api` (Fastify, port 3001). Not Express.

