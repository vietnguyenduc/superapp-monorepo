## Challenge Summary

**Overall risk assessment**: MEDIUM

While the Data Ingestion UX document is highly robust, it contains implicit architectural assumptions regarding bot state management, execution concurrency, and API behavior that could lead to system lockups, data corruption, or session loss in production environments.

---

## Challenges

### [High] Challenge 1: Local File Session Storage in Stateless Environments
- **Assumption challenged**: Bot session state can be stored safely in local JSON files (`projects/<project_name>/ingest_<session_id>.json`).
- **Attack scenario**: The bot is deployed in a serverless infrastructure (e.g., Supabase Edge Functions or Vercel Serverless) or a load-balanced VPS group. The user uploads a file which is cached on Instance A. When the user clicks "Approve & Import" 10 seconds later, the request is routed to Instance B, which has no record of the session. The import fails silently or prompts the user to upload the file again.
- **Blast radius**: Complete breakdown of the ingestion flow for users under load-balanced or serverless environments.
- **Mitigation**: Move state persistence from the local filesystem to a Postgres-backed table (`temp_ingestion_sessions`) or a Redis cache with a 30-minute TTL.

### [Medium] Challenge 2: Transactional Dry-Run Capabilities in PostgREST
- **Assumption challenged**: Database transactions can be run as a "dry-run" dynamically via standard Supabase client libraries to catch database unique violations before committing.
- **Attack scenario**: A user initiates a transaction. The bot makes a REST POST request to verify entries. In PostgREST, there is no stateful HTTP transaction where a client can do `BEGIN`, perform multiple queries, analyze the results, and then issue `ROLLBACK`. The insert will either commit immediately (causing partial dirty writes if subsequent rows fail) or fail the entire request without returning detailed per-row warnings.
- **Blast radius**: Inability to show specific constraint violation lists to the user without writing dirty data to the DB.
- **Mitigation**: Implement a custom PostgreSQL RPC function `check_ingest_constraints(payload jsonb)` which performs insertions inside a `SAVEPOINT` or exception block, catches codes like `23505` (unique_violation) and returns a list of conflicts, and then rolls back the operations.

### [Medium] Challenge 3: Synchronous Event Loop Blocking
- **Assumption challenged**: The bot can run Pandas file parsing, Jaro-Winkler string similarity calculations, and dirty data regex cleaning synchronously within standard Telegram callback handlers.
- **Attack scenario**: A user uploads a 9.9 MB CSV file with 100,000 rows. The Python bot thread processes the file. The Pandas CPU-bound parsing and similarity calculations block the Python single-threaded `asyncio` event loop for 10–15 seconds. During this time, the bot becomes completely unresponsive to message inputs or buttons from *all* other active users.
- **Blast radius**: Complete denial of service (DoS) for all bot users whenever a large ingestion task is processed.
- **Mitigation**: Run all parser and profiling methods (`core/ingestion/files.py`, `core/ingestion/profiler.py`) inside a separate thread using `asyncio.to_thread` or `loop.run_in_executor`.

### [Low] Challenge 4: Enterprise Google Drive Link Access Restrictions
- **Assumption challenged**: Sharing Google Sheets with the bot's service account email is always possible.
- **Attack scenario**: A business user operates inside a corporate Google Workspace account with strict domain sharing policies. When they try to add the bot's service account (`superapp-bot@vibecoding-project.iam.gserviceaccount.com`), Google Drive rejects it with "Sharing outside of your organization is disabled by your administrator".
- **Blast radius**: Corporate users are permanently blocked from using the Google Sheets import path.
- **Mitigation**: Update Case 1's error message to explicitly prompt: "If your organization restricts external sharing, please export the sheet as a `.xlsx` or `.csv` file and upload it directly here."

---

## Stress Test Results

- **Stateless Load Balancing Scenario** ➔ Upload session on Instance A, transition on Instance B ➔ **FAIL** (Session data is missing).
- **Large File Profiling Scenario** ➔ Upload 10MB CSV with 100k rows ➔ **FAIL** (Blocks event loop, causing timeouts for other bot requests).
- **PostgREST Dry Run Scenario** ➔ Validate row-level unique constraint via standard HTTP client ➔ **FAIL** (Requires custom RPC function, otherwise writes are committed).

---

## Unchallenged Areas

- **Telegram Markdown Layout** — reason: Output formatting and Markdown tables are fully supported by standard Telegram clients.
