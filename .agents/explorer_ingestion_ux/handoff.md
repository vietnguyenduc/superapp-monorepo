# Handoff Report - Data Ingestion UX Exploration

## 1. Observation
- **Codebase File Structures**: Located and inspected files in `apps/superapp-business-bot`, including `main.py` and `core/db.py`.
- **Existing Document Handler**: Viewed `apps/superapp-business-bot/main.py:1070`:
  ```python
  @bot.message_handler(content_types=['document'])
  def handle_document(message):
      # ...
      filename = message.document.file_name
      active_project = agent.get_active_project() or "default"
      path = agent.add_to_vault(filename, downloaded_file, active_project)
  ```
- **Supabase REST Queries**: Inspected `apps/superapp-business-bot/core/db.py:25` showing direct PostgREST calls:
  ```python
  url = f"{SUPABASE_URL}/rest/v1/users?telegram_id=eq.{telegram_id}"
  ```
- **Database Schema**: Viewed `supabase/migrations/032_hr_payroll_schema.sql` which defines the target schemas `employees` (lines 16-29) and `payroll_items` (lines 103-117).
  - Columns for `employees` include: `company_id`, `employee_code`, `full_name`, `base_salary`, `status`, `join_date`.
  - Column constraint: `UNIQUE(company_id, employee_code)`.
- **Target Analysis File**: Successfully drafted and wrote the UX flow and backend plan into `c:/Vibecoding/superapp-monorepo/.agents/explorer_ingestion_ux/analysis.md`.

## 2. Logic Chain
1. **Source Schema Constraints**: The `employees` table has a `UNIQUE(company_id, employee_code)` constraint (from `032_hr_payroll_schema.sql:28`). Any ingestion process must respect this unique constraint and prompt the user to either skip or overwrite (upsert) matching codes to avoid database insertion crashes.
2. **PostgREST Architecture**: The current database client in `core/db.py` uses HTTP requests directly to Supabase REST endpoints rather than a stateful database driver. Therefore, bulk imports should be formatted into single-request batch payloads to maximize performance and ensure atomic database operations (all-or-nothing writes).
3. **Telegram Limitations**: Since Telegram WebApps/Webviews are explicitly disallowed by the user constraints, a text-and-button state machine is needed. By utilizing Telegram's callback queries and inline keyboards, we can step the user through mapping columns and resolving ambiguities (e.g., mapping column "Lương" to field `base_salary` vs `allowances`).
4. **Data Engine Integration**: Raw spreadsheet data is frequently dirty or inconsistently typed. Using Pandas inside the backend enables programmatic profiling (counting null values, checking formatting, and coercing types) before committing rows, preventing database crashes and building confidence.
5. **Reconciliation Checks**: Verification through numeric totals comparison (e.g., matching sum of salaries imported vs source sheet salary sum) and a database preview table allows the user to immediately verify data integrity.

## 3. Caveats
- Direct CSV/XLSX imports might hit network performance/timeout limits if files are large. A file limit of 10MB was chosen to safeguard bot performance.
- Google Sheets access requires manual sharing with the Google Service Account email, which depends on user cooperation. Clear visual instructions are crucial.
- We assume the PostgREST backend supports bulk UPSERT via the `Prefer: resolution=merge-duplicates` header, which is standard for Supabase.

## 4. Conclusion
The UX flow and implementation plan for the Data Ingestion feature are detailed and documented in `c:/Vibecoding/superapp-monorepo/.agents/explorer_ingestion_ux/analysis.md`. The design leverages a text-and-button interface to select schemas, profile data, resolve mapping conflicts, handle failures gracefully, and output confidence verification metrics.

## 5. Verification Method
- **File Integrity**: Inspect `c:/Vibecoding/superapp-monorepo/.agents/explorer_ingestion_ux/analysis.md` to verify it contains sections:
  1. Telegram-Native UX Flow
  2. Edge Cases & Error Handling Strategies
  3. Output & Confidence Verification Report
  4. Refined Backend Implementation Plan
- **Verification Commands**: Since this is a read-only investigation and design document, no code execution is required. Verification can be done by checking formatting and coverage of the 5 requested edge cases.
