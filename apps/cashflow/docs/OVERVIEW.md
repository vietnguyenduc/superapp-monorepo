---
app: cashflow
doc_type: OVERVIEW
generated: true
---

# cashflow — Overview

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Purpose

Cash-flow management: customers, transactions, bank accounts, transaction types, branches, reports, and opening balance.

- **Local port:** 5174
- **Production domain:** `cashflow.appforyou.xyz`
- **Vercel project:** `cashflow`

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
- react-dom
- react-i18next
- react-icons
- react-router-dom

## Main pages

- `Approvals/ApprovalsPage`
- `Auth/Login`
- `Auth/ResetPassword`
- `Auth/SignUp`
- `CompanySelector/CompanySelector`
- `Customers/CustomerDetail`
- `Customers/CustomerList`
- `Customers/OpeningBalanceExport`
- `Dashboard/Dashboard`
- `DataImport/CustomerImport`
- `DataImport/TransactionImport`
- `Manual/Manual`
- `Profile/Profile`
- `Reports/Reports`
- `Settings/Settings`
- `Settings/SettingsContext`
- `Transactions/TransactionList`

## Main services

- `approvalService`
- `backupHistoryService`
- `bankAccountService`
- `branchService`
- `businessLogic/balanceMath`
- `businessLogic/index`
- `businessLogic/parsers`
- `businessLogic/transformation`
- `businessLogic/validation`
- `colorSettingsService`
- `customerService`
- `dashboardService`
- `database`
- `mockData`
- `reportService`
- `supabase`
- `transactionService`
- `transactionTypeService`
- `trialMockStore`
- `updateHelpers`
- `user-service`

## Related Supabase tables

- `accounting_transactions`
- `backup_history`
- `bank_accounts`
- `branches`
- `color_settings`
- `companies`
- `customers`
- `inventory_backup_history`
- `transaction_types`
- `transactions`
- `users`

## Quick links

- `apps/cashflow/docs/ARCHITECTURE.md` — structure & routing
- `apps/cashflow/docs/DATA-MODEL.md` — tables & relationships
- `apps/cashflow/docs/API.md` — service / API surface
- `apps/cashflow/docs/AI-CONTEXT.md` — agent gotchas & tasks
- `apps/cashflow/docs/CHANGELOG.md` — recent changes

