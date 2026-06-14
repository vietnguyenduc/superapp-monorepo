# Original User Request

## 2026-06-14T01:25:53Z

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

## 2026-06-14T01:29:43Z

UPDATE REQUIREMENTS: The user has requested an additional feature for the Auto-Kaizen system you are building.

In addition to the dynamic visual audit, the Auto-Kaizen cron job (and its payload) must also include a "Static Migration Linting" step to catch Database issues before they hit runtime.
Requirement: The workflow should scan `supabase/migrations/*.sql` files for the classic "RLS Infinite Recursion" bug (e.g., creating a policy on a table that runs a SELECT query on that exact same table within its USING clause). If this static analysis detects the vulnerability, the agent must automatically self-heal the migration file using a `SECURITY DEFINER` function or JWT claims.

Please incorporate this static analysis step into your Auto-Kaizen orchestration plan.
