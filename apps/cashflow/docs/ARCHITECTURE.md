---
app: cashflow
doc_type: ARCHITECTURE
generated: true
---

# cashflow — Architecture

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Directory layout

```
apps/cashflow/
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

## Service layer

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

## Shared packages used

- `@superapp/iam` — auth, company/branch context, `useAuth`, `useCompany`
- `@superapp/shared-utils` — `BaseService`, `createApiClient`, `createSupabaseClient`
- `@repo/ui` — `DataTable`, `Button`, modal / grid components
- `@superapp/theme` — Tailwind tokens, Apple-inspired spacing/color scale

## Multi-tenancy

All data access is scoped by `company_id` (and usually `branch_id`). RLS policies enforce tenant isolation in Supabase. The app must never build queries that bypass `company_id`.

## Build flow

```bash
npx turbo run build --filter=cashflow
npx turbo run check-types --filter=cashflow
npx turbo run test --filter=cashflow
npx turbo run lint --filter=cashflow
```

