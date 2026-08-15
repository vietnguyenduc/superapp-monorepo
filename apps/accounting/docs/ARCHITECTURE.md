---
app: accounting
doc_type: ARCHITECTURE
generated: true
---

# accounting — Architecture

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Directory layout

```
apps/accounting/
├── src/
│   ├── main.tsx          # entry point; wraps AuthProvider + CompanyProvider
│   ├── App.tsx           # router + layout
│   ├── pages/            # route-level screens
│   ├── services/         # Supabase / API business logic
│   ├── components/       # reusable app components
│   ├── hooks/            # local React hooks
│   ├── types/            # TypeScript definitions
│   └── utils/            # helpers, validators, formatters
├── docs/                 # this doc set
└── package.json
```

## Routing / screens

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

## Service layer

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

## Shared packages used

- `@superapp/iam` — auth, company/branch context, `useAuth`, `useCompany`
- `@superapp/shared-utils` — `BaseService`, `createApiClient`, `createSupabaseClient`
- `@repo/ui` — `DataTable`, `Button`, modal / grid components
- `@superapp/theme` — Tailwind tokens, Apple-inspired spacing/color scale

## Multi-tenancy

All data access is scoped by `company_id` (and usually `branch_id`). RLS policies enforce tenant isolation in Supabase. The app must never build queries that bypass `company_id`.

## Build flow

```bash
npx turbo run build --filter=accounting
npx turbo run check-types --filter=accounting
npx turbo run test --filter=accounting
npx turbo run lint --filter=accounting
```

