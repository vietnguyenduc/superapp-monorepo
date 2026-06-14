## Review Summary

**Verdict**: APPROVE

The Data Ingestion UX and Implementation Plan document at `c:/Vibecoding/superapp-monorepo/apps/superapp-business-bot/docs/data_ingestion_ux.md` is complete, highly detailed, and satisfies all requirements specified in the project guidelines. It demonstrates a strong understanding of Telegram-native UI capabilities, database constraint handling, and the transactional mechanics of the HR/Payroll schema.

We approve the document, subject to addressing the critical/major architectural risks and implementation gaps identified in the accompanying Challenge Report.

---

## Findings

### [Major] Finding 1: File-based Session State Storage
- **What**: The plan proposes storing session state in local JSON files (`projects/<project_name>/ingest_<session_id>.json`).
- **Where**: Section 6.1 (State Management & Session Lifecycle) and Section 6.3.1 (Ingestion Session Manager).
- **Why**: Storing session state on the local filesystem fails in multi-instance, containerized, or serverless deployments (such as Supabase Edge Functions or load-balanced VPS instances) where subsequent user requests can be routed to different nodes.
- **Suggestion**: Transition to a centralized stateless session store, such as a database-backed table in Supabase (e.g., `temp_ingestion_sessions` with automatic Postgres TTL/cron cleanup) or Redis.

### [Major] Finding 2: Transaction Dry-Run in PostgREST
- **What**: The plan states: "Validates inserts by running dry-runs inside a transaction, catching Postgres unique violation error."
- **Where**: Section 4 (Case 5) and Section 6.3.3 (Database Execution Engine).
- **Why**: Supabase's PostgREST API does not expose direct SQL transactional endpoints (`BEGIN` / `ROLLBACK`) across separate HTTP requests. A standard REST client cannot initiate a transaction, test writing, check for conflicts, and abort.
- **Suggestion**: Implement the dry-run validation using a custom PostgreSQL PL/pgSQL function (RPC) that receives the JSON payload, executes the operations inside a subtransaction block, catches violations, compiles validation feedback, and rolls back the inserts before returning.

### [Minor] Finding 3: Missing Explicit `on_conflict` Parameter
- **What**: The database engine specifies utilizing the `Prefer: resolution=merge-duplicates` header for upsert.
- **Where**: Section 6.3.3 (Database Execution Engine).
- **Why**: For upsert operations in PostgREST, if the primary key is generated (UUID `id`), standard upsert without an explicit `on_conflict` parameter will fail to resolve duplicate natural keys like `employee_code`.
- **Suggestion**: Explicitly specify the unique constraint query parameter in the API call: `?on_conflict=company_id,employee_code`.

---

## Verified Claims

- **Vietnam Database Targets** ➔ Verified via Section 3.1 & 3.2 ➔ PASS
  - *Details*: The document uses standard Vietnamese headers (`"Mã NV"`, `"Họ tên"`, `"Lương cứng"`, `"Ngày vào"`) and maps them to database fields. Sample data contains Vietnamese names and amounts in `VND`.
- **At least 5 Edge Cases Covered** ➔ Verified via Section 4 ➔ PASS
  - *Details*: Covers Private Google Sheets, Missing columns, Dirty data types, Unsupported file size/format, and Unique database constraint violations.
- **Output & Confidence Verification** ➔ Verified via Section 5 ➔ PASS
  - *Details*: Correctly details hash totals reconciliation, a markdown DB preview, and audit trail metadata.
- **Telegram-Native UX** ➔ Verified via Section 1 & 3 ➔ PASS
  - *Details*: Only uses text messages, inline keyboards, and native file transfers. Explicitly avoids WebApps/Webviews.

---

## Coverage Gaps

- **Horizontal Scaling & Concurrency** — risk level: **Medium** — recommendation: Investigate transitioning session state to Supabase table or Redis cache.
- **Async Thread Execution** — risk level: **Low** — recommendation: Accept risk but document in execution module that Pandas operations should run in thread pools.

---

## Unverified Items

- **Actual performance under load** — reason: The implementation does not yet exist; this is a design document review.
