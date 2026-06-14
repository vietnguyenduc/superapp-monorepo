# Original User Request

## Initial Request — 2026-06-14T03:17:52Z

# Teamwork Project Prompt

Analyze the user journey for the Telegram Business Bot Data Ingestion feature and refine the provided Implementation Plan into a complete, bulletproof version. Design a robust, convenient UX flow, identify potential user errors during file/link submission, and define the expected system behavior and final outputs. Deliver a comprehensive Markdown document containing the UX design and message templates.

Working directory: c:/Vibecoding/superapp-monorepo/apps/superapp-business-bot/docs
Integrity mode: development

## Constraints
- Focus strictly on a Telegram-native UX (text, inline buttons, document uploads/downloads).
- Do NOT design or propose WebApp or Webview interfaces.

## Reference Material: Current Implementation Plan
```markdown
# Implementation Plan: Business Bot Data Ingestion (Phase 1) - Robust Architecture
Goal: Enable superapp-business-bot to securely ingest Google Sheets and complex Excel/CSV files. Hệ thống phải đủ sức xử lý data "bẩn" (lỗi format, mixed types, typos) bằng cách Profile Data kỹ lưỡng trước khi mapping.

Khái Niệm "Robust but Minimal" (Mạnh mẽ nhưng không phình to)
Để đối phó với raw data ngoài đời thực (thường rất lộn xộn), ta không tự viết script parse file chay bằng tay (rất dễ dính bug edge-cases). Giải pháp là dùng Pandas làm Data Engine cốt lõi:
- Google Sheets: Chấp nhận setup bảo mật chuẩn. Dùng gspread + Google Service Account.
- File CSV/XLSX: Tải về qua Telegram, đọc bằng pandas và openpyxl.
- Data Profiling: Cột nào chứa nhiều data type? Bị NULL nhiều? Dấu hiệu lỗi Typo? => Cung cấp profile này cho AI quyết định chiến thuật Clean Data.

[Phase 1 & Phase 2 Technical details provided by user...]
```

## Requirements

### R1. Conversational UX Flow Design
Draft the exact back-and-forth message sequences between the User and the Bot for both happy paths (successful parsing and mapping) and human-in-the-loop interactions (e.g., confirming the mapping of "Lương" to "base_salary"). Do not write Python code; focus purely on the text/UI elements (e.g., Inline buttons) the user will see.

### R2. Edge Case & Error Handling Strategies
Identify at least 5 potential failures (e.g., locked Google Sheets, missing columns, multiple data types in a column, file too large) and design the exact fallback messages and recovery actions the bot will present to the user.

### R3. Output & Confidence Verification
Design the final success message or report the user receives once data is inserted. Explain how this output guarantees user satisfaction and confidence that the data was pushed correctly into the Supabase database.

## Acceptance Criteria

### UX Document Completeness
- [ ] The final output is a single Markdown document containing all flows, error states, and templates.
- [ ] Includes a clear, step-by-step conversational script/mockup for the Telegram interaction.
- [ ] Lists at least 5 common user or data errors with corresponding fallback messages.

## Follow-up — 2026-06-14T01:25:53Z

Build an automated "Auto-Kaizen" (Continuous Improvement) cron job system that runs daily to read agent chat and terminal history, extract lessons learned, autonomously execute test suites (visual audits, functional mock tests), self-heal code if tests fail, and verify enhancements across the monorepo.

Working directory: c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent

Integrity mode: development

## Requirements

### R1. Auto-Kaizen Cron Job
Integrate a daily cron job into the Telegram Bot's `scheduler.py`. This job must autonomously inject a specific "Self-Reflection & Audit" system prompt into the bot's message queue, effectively tricking the LLM into thinking a user commanded it to perform its daily maintenance.

### R2. Manual Trigger (`/kaizen_now`)
Implement a new Telegram command `/kaizen_now` in `main.py` that manually triggers the exact same logic as the cron job. This is necessary for immediate testing and ad-hoc validation.

### R3. Reflection Payload
The injected system prompt must explicitly command the agent to:
1. Read the past 24h from `agent_service.log`.
2. Extract and append 3 key learnings to `lessons_learned.md`.
3. Re-run `run_visual_audit` to verify UI integrity.
4. Auto-restart servers if needed to run the tests.

## Acceptance Criteria

### Integration & Triggers
- [ ] The APScheduler in `scheduler.py` registers the daily Auto-Kaizen job without errors.
- [ ] Sending `/kaizen_now` to the Telegram bot immediately triggers the workflow.

### Execution Integrity
- [ ] When triggered, the bot actually processes the injected system prompt and begins reading logs and writing to `lessons_learned.md`.
- [ ] The bot executes `run_visual_audit` as commanded by the injected prompt.

## Follow-up — 2026-06-14T01:29:43Z

UPDATE REQUIREMENTS: The user has requested an additional feature for the Auto-Kaizen system you are building.

In addition to the dynamic visual audit, the Auto-Kaizen cron job (and its payload) must also include a "Static Migration Linting" step to catch Database issues before they hit runtime.
Requirement: The workflow should scan `supabase/migrations/*.sql` files for the classic "RLS Infinite Recursion" bug (e.g., creating a policy on a table that runs a SELECT query on that exact same table within its USING clause). If this static analysis detects the vulnerability, the agent must automatically self-heal the migration file using a `SECURITY DEFINER` function or JWT claims.

Please incorporate this static analysis step into your Auto-Kaizen orchestration plan.
