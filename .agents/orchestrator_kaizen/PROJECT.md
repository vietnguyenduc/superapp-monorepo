# Project: Auto-Kaizen System Integration

## Architecture
The Auto-Kaizen system integrates a scheduled daily background maintenance task and a manual command into the Telegram Bot (`antigravity-telegram-agent`).
- **Trigger Channels**:
  1. **Scheduler** (`scheduler.py`): Uses `APScheduler` to run a daily cron job that mimics a user command by injecting the reflection prompt.
  2. **Telegram CLI** (`main.py`): Register command `/kaizen_now` to immediately invoke the exact same reflection loop.
- **Payload Core Logic**:
  - The agent is prompted to:
    - Scan `supabase/migrations/*.sql` files for the RLS Infinite Recursion bug (e.g. policy on a table referencing itself in SELECT/USING).
    - If detected, automatically self-heal the migration file using a `SECURITY DEFINER` function or JWT claims.
    - Read `agent_service.log` for the past 24h.
    - Extract and append 3 key learnings to `lessons_learned.md`.
    - Run the native tool `run_visual_audit` to check UI/UX integrity.
    - Auto-restart background servers (e.g. `npm run dev`, `npx vite`, etc.) if needed.
- **Workflow**:
  - We call `agent.run_agent_turn` with a mock or real chat message containing the specific system prompt so the agent processes it agentically, calling its own tools to read files, run visual audits, and update markdown/migration documents.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| 1 | Discovery & Exploration | Analyze `scheduler.py`, `main.py`, and how agent commands are routed | None | DONE |
| 2 | Cron Job implementation | Register the daily cron job in `scheduler.py` | M1 | DONE |
| 3 | Command implementation | Implement `/kaizen_now` command in `main.py` | M1, M2 | DONE |
| 4 | Verification & Hardening | Run manual/automated tests to confirm logs are read, lessons written, migrations audited, and visual audit runs | M3 | DONE |

## Interface Contracts
### Scheduler ↔ Agent
- `scheduler.py` invokes the agent turn processing engine.
- Since `execute_chat_turn` runs in a separate thread and expects a `message` object, we will design a robust execution wrapper or mock message object that allows both scheduled cron and `/kaizen_now` commands to initiate a chat turn with the specific "Self-Reflection & Audit" prompt.
