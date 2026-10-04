---
app: <APP_NAME>
doc_type: API
---

# <APP_NAME> — API / Service Surface

## Service modules

- `src/services/<feature>Service.ts`

## Conventions

- Return `{ data, error }` shapes.
- Normalize errors to Vietnamese user messages.
- Inject `company_id` from `useCompany()`.

## Backend

- Supabase REST / RPC
- Supabase cloud for authenticated data access and RPCs
