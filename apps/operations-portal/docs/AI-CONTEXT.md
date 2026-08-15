---
app: operations-portal
doc_type: AI-CONTEXT
generated: true
---

# operations-portal — AI Context

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## One-line summary

Operations portal: shift check-ins, documents, chat groups, tickets, assets, consumables, emergency contacts, training courses/materials/questions/progress.

## Read this first

- `apps/operations-portal/docs/OVERVIEW.md` — what the app does
- `apps/operations-portal/docs/DATA-MODEL.md` — tables and tenant scoping
- `apps/operations-portal/docs/ROLES-PERMISSIONS.md` — who can do what
- `apps/operations-portal/docs/CHANGELOG.md` — recent changes and gotchas

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

- `src/pages/AssetsPage`
- `src/pages/ChatPage`
- `src/pages/CheckInPage`
- `src/pages/Dashboard`
- `src/pages/DocumentsPage`
- `src/pages/EmergencyPage`
- `src/pages/Manual/Manual`
- `src/pages/TicketsPage`
- `src/pages/TrainingPage`
- Services in `src/services/`

## Tables this app touches

- `branches`
- `companies`
- `operation_assets`
- `operation_chat_groups`
- `operation_chat_members`
- `operation_chat_messages`
- `operation_checkins`
- `operation_consumables`
- `operation_documents`
- `operation_emergency_contacts`
- `operation_tickets`
- `operation_training_courses`
- `operation_training_materials`
- `operation_training_progress`
- `operation_training_questions`
- `users`

