---
app: <APP_NAME>
doc_type: DATA-FLOW
---

# <APP_NAME> — Data Flow

1. User logs in via `@superapp/iam`.
2. `CompanyProvider` resolves `company_id` / `branch_id`.
3. Components call `src/services/<feature>Service.ts`.
4. Service uses `createApiClient` → Supabase cloud.
5. RLS validates `company_id` / `branch_id`.
6. UI renders result; errors shown in Vietnamese.

## Import / export

- Export: table view → `xlsx` with Vietnamese headers.
- Import: file → parser → validation → bulk insert with `company_id`.
