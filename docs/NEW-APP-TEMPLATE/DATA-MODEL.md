---
app: <APP_NAME>
doc_type: DATA-MODEL
---

# <APP_NAME> — Data Model

## Tenant scoping

- `company_id` FK to `companies.id`
- `branch_id` optional FK to `branches.id`
- `id` columns should be `text` with v4 UUID strings (`crypto.randomUUID()`)

## Core tables

- `<app_name>_<entity>`
- `companies`
- `users`
- `branches`

## Agent notes

- Use `.maybeSingle()` for reads that may return no row.
- Always include `company_id` in `.insert()` / `.update()`.
