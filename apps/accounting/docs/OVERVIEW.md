---
app: accounting
doc_type: OVERVIEW
generated: true
---

# accounting — Overview

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Purpose

Accounting: chart of accounts, journal entries, invoices, fixed assets, taxes, cash books, and e-invoice integration.

- **Local port:** 5178
- **Production domain:** `accounting.appforyou.xyz`
- **Vercel project:** `accounting`

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

- `Assets/Assets`
- `Auth/Login`
- `Auth/SignUp`
- `CashBook/CashBook`
- `ChartOfAccounts/ChartOfAccounts`
- `CompanySelector/CompanySelector`
- `Dashboard/Dashboard`
- `Invoices/Invoices`
- `Manual/Manual`
- `Profile/Profile`
- `Reports/Reports`
- `Settings/Settings`
- `TaxReports/TaxReports`
- `Transactions/TransactionList`
- `Transactions/Transactions`

## Main services

- `api`
- `backupHistoryService`
- `bankAccountService`
- `branchService`
- `businessLogic/calculations`
- `businessLogic/index`
- `businessLogic/transformation`
- `businessLogic/validation`
- `colorSettingsService`
- `customerService`
- `dashboardService`
- `database`
- `mockData`
- `mockDataUpdated`
- `reportService`
- `sampleData`
- `supabase`
- `transactionService`
- `transactionTypeService`
- `trialMockStore`
- `user-service`

## Related Supabase tables

- `accounting_accounts`
- `accounting_assets`
- `accounting_invoices`
- `accounting_settings`
- `accounting_transaction_lines`
- `accounting_transactions`
- `branches`
- `cash_books`
- `companies`
- `users`

## Quick links

- `apps/accounting/docs/ARCHITECTURE.md` — structure & routing
- `apps/accounting/docs/DATA-MODEL.md` — tables & relationships
- `apps/accounting/docs/API.md` — service / API surface
- `apps/accounting/docs/AI-CONTEXT.md` — agent gotchas & tasks
- `apps/accounting/docs/CHANGELOG.md` — recent changes

