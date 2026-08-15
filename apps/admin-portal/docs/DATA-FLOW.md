---
app: admin-portal
doc_type: DATA-FLOW
generated: true
---

# admin-portal — Data Flow

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## End-to-end flow

1. User opens `admin.appforyou.xyz` and logs in via `@superapp/iam`.
2. `CompanyProvider` resolves `company_id` / `branch_id`.
3. Components call local service modules:
   - `<service>` builds Supabase queries scoped by tenant.
4. `createApiClient` routes to local InsForge API (`localhost:3001`) if reachable, else Supabase cloud.
5. RLS policies enforce `company_id` / `branch_id` on every query.
6. Result is normalized and rendered; errors are logged via Sentry and shown with toast/inline messages in Vietnamese.

## Import / export flow

- Export: UI table view → `xlsx` / CSV with Vietnamese headers.
- Import: file → parser → validation → `bulkInsert` with `company_id` + duplicate check.

## Offline / trial mode

- Some apps use `trialMockStore.ts` and localStorage flags (`superapp_trial_mode`).
- Trial data is local-only and resets on cache clear.

