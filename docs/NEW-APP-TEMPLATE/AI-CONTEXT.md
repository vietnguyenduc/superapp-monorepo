---
app: <APP_NAME>
doc_type: AI-CONTEXT
---

# <APP_NAME> — AI Context

## One-line summary

<!-- What does this app do? -->

## Read this first

- `apps/<APP_NAME>/docs/OVERVIEW.md`
- `apps/<APP_NAME>/docs/DATA-MODEL.md`
- `apps/<APP_NAME>/docs/ROLES-PERMISSIONS.md`
- `apps/<APP_NAME>/docs/CHANGELOG.md`

## Common tasks

| Task | Start here |
|------|------------|
| Add a page | `src/pages/` + `App.tsx` route |
| Add a service | `src/services/<feature>Service.ts` |
| Change DB query | service + `supabase/migrations/` |
| Add permission | `src/types/UserRole.ts` |

## Key gotchas

- `id` columns are `text` with v4 UUID strings, not `uuid` type.
- Always scope mutations by `company_id`.
- Use `.maybeSingle()` for read-one queries.
- No schema-per-tenant.
