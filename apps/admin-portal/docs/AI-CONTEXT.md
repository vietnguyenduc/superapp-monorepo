---
app: admin-portal
doc_type: AI-CONTEXT
generated: true
---

# admin-portal — AI Context

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## One-line summary

Multi-company management, user/role admin, trial seed editor, and app switcher.

## Read this first

- `apps/admin-portal/docs/OVERVIEW.md` — what the app does
- `apps/admin-portal/docs/DATA-MODEL.md` — tables and tenant scoping
- `apps/admin-portal/docs/ROLES-PERMISSIONS.md` — who can do what
- `apps/admin-portal/docs/CHANGELOG.md` — recent changes and gotchas

## Common tasks

| Task | Start here |
|------|------------|
| Add a new page | `src/pages/` + route in `App.tsx` |
| Add a new service | `src/services/<feature>Service.ts` |
| Change a DB query | `src/services/<feature>Service.ts` and `supabase/migrations/` |
| Add a permission | `src/types/UserRole.ts` + route/component guards |
| Fix Vietnamese label | `src/i18n/` or hardcoded JSX; update test snapshots |
| Add import/export | `src/services/excelImportService.ts` / `exportService.ts` patterns |

## Key gotchas

- `id` columns (`customers`, `transactions`, `bank_accounts`, `branches`, etc.) are `text` containing v4 UUID strings, not `uuid` type.
- Always include `company_id` in mutations. Use `maybeSingle()` for reads that may return zero rows.
- Do **not** use `.single()` on RLS-scoped selects unless the row is guaranteed to exist and the user has access.
- Do **not** build schema-per-tenant; this project uses `company_id` + RLS.
- Cashflow sign convention: positive amount = increase, negative = decrease; math factor is `+1` or `-1`. Use `getCustomerBalanceDelta()` rather than `Math.abs()` when deciding whether a transaction reduces debt.

## Useful source files

- `src/pages/CompanyManagement`
- `src/pages/ConsolidatedReports`
- `src/pages/DataLifecycle`
- `src/pages/GlobalSettings`
- `src/pages/IdentityManagement`
- `src/pages/Manual`
- `src/pages/TrialSeedEditor`
- Services in `src/services/`

## Tables this app touches

- `branches`
- `companies`
- `permissions`
- `roles`
- `trial_seed`
- `users`

