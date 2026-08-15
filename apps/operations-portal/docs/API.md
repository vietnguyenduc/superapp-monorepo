---
app: operations-portal
doc_type: API
generated: true
---

# operations-portal — API / Service Surface

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Service modules

- Add service API descriptions here.

## Supabase tables accessed

This app uses `createApiClient` / `supabase.from(...)` to read and write the tables listed in `DATA-MODEL.md`.

## Conventions

- Service functions return `{ data, error }` shapes.
- Errors are normalized to a user-facing Vietnamese message and an `originalError` for Sentry.
- `company_id` is always injected from `useCompany()` or the current user.

## Backend Fastify API

Cross-app utilities (trial seeds, query proxy) live in `packages/api` (Fastify, port 3001). Not Express.

