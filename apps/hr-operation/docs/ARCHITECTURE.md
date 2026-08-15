---
app: hr-operation
doc_type: ARCHITECTURE
generated: true
---

# hr-operation — Architecture

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Directory layout

```
apps/hr-operation/
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

- `AttendancePage`
- `EmployeeDirectory`
- `HRSettings`
- `LeaveManagement`
- `Manual/Manual`
- `PayrollManagement`
- `PerformanceDashboard`
- `ShiftManagement`

## Service layer

- `hrService`

## Shared packages used

- `@superapp/iam` — auth, company/branch context, `useAuth`, `useCompany`
- `@superapp/shared-utils` — `BaseService`, `createApiClient`, `createSupabaseClient`
- `@repo/ui` — `DataTable`, `Button`, modal / grid components
- `@superapp/theme` — Tailwind tokens, Apple-inspired spacing/color scale

## Multi-tenancy

All data access is scoped by `company_id` (and usually `branch_id`). RLS policies enforce tenant isolation in Supabase. The app must never build queries that bypass `company_id`.

## Build flow

```bash
npx turbo run build --filter=hr-operation
npx turbo run check-types --filter=hr-operation
npx turbo run test --filter=hr-operation
npx turbo run lint --filter=hr-operation
```

