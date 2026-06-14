# Handoff Report: Auto-Kaizen System Integration (Milestone 1)

## 1. Observation

- **Project Requirements**: In `.agents/orchestrator_kaizen/PROJECT.md`, lines 6-16, the contract specifies:
  > "1. **Scheduler** (`scheduler.py`): Uses `APScheduler` to run a daily cron job that mimics a user command by injecting the reflection prompt."
  > "2. **Telegram CLI** (`main.py`): Register command `/kaizen_now` to immediately invoke the exact same reflection loop."
  > "We call `agent.run_agent_turn` with a mock or real chat message containing the specific system prompt so the agent processes it agentically..."
- **Mock Message Pattern**: In `apps/antigravity-telegram-agent/main.py` lines 1838-1847, the `/schedule` command uses a mock message structure to call `execute_chat_turn`:
  ```python
  class MockMessage:
      def __init__(self, cid, txt):
          class MockChat:
              def __init__(self, _id):
                  self.id = _id
          self.chat = MockChat(cid)
          self.text = txt
          self.message_id = 0
          self.from_user = type('obj', (object,), {'id': cid})
  execute_chat_turn(MockMessage(chat_id, f"/schedule {text}"), f"/schedule {text}")
  ```
- **Existing Scheduler Pattern**: In `apps/antigravity-telegram-agent/scheduler.py` lines 79-109:
  - `setup_scheduler(bot, chat_id, report_time_str)` schedules the daily report via `cron` trigger:
    ```python
    scheduler.add_job(
        send_daily_report_job,
        'cron',
        hour=hour,
        minute=minute,
        id='daily_report_job'
    )
    ```
- **Active Project & Settings**: 
  - `apps/antigravity-telegram-agent/active_project.json` stores the current active project name (e.g. `"active_project": "accounting"`).
  - `apps/antigravity-telegram-agent/config/settings.json` lines 38-49 lists the application ports and tech stacks:
    ```json
    "apps": [
      {"name": "accounting", "path": "apps/accounting", "port": 3001, "tech": "React"},
      ...
    ]
    ```
- **Lessons Learned Storage**: The root file `vaults/lessons_learned.md` contains a section `## Daily Learnings` on line 26.

---

## 2. Logic Chain

- **Avoiding Circular Dependencies**: Since `main.py` imports `scheduler` and handles bot context, we cannot directly import `main.py` functions in `scheduler.py`. Therefore, passing a callback `kaizen_callback` from `main.py` into `scheduler.setup_scheduler` allows the scheduler to trigger the agentic loop cleanly without any circular references.
- **Mocking the Inbound Message**: Mimicking a user trigger is best achieved by instantiating a custom `MockMessage` with the `/goal <prompt>` command, which ensures that `execute_chat_turn` will run the agent with autonomous goal-seeking capabilities.
- **Designing the Prompt**: The prompt must guide the agent to perform the sequential tasks agentically.
  - Specifying the absolute log path (`c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/agent_service.log`) guarantees the agent reads the correct file.
  - Instructing the agent to look up `active_project.json` and `settings.json` dynamically allows the prompt to be generic and work for any active workspace.
  - Instructing the agent to check the port status and start the dev server via PowerShell's background `Start-Process ... -WindowStyle Hidden` ensures local server responsiveness before running `run_visual_audit`.

---

## 3. Caveats

- We assume that the environment where the bot runs has permissions to start processes and check ports via PowerShell.
- We assume that `run_visual_audit` tool works on `http://localhost:<port>` without requiring external web access, which complies with the `CODE_ONLY` network restriction.
- The logs in `agent_service.log` could be very large; we instruct the agent to use lines reading or outlines to avoid token overflow.

---

## 4. Conclusion

The designed Auto-Kaizen system can be fully implemented by:
1. Adding a `daily_kaizen_job` to `scheduler.py` triggered via a callback argument passed from `main.py`.
2. Registering the `/kaizen_now` handler in `main.py` that invokes the mock-message agent execution.
3. Supplying the agent with the designed `[KAIZEN_AUTO_AUDIT]` prompt, forcing it to run the self-reflection and audit pipeline autonomously.

---

## 5. Verification Method

To verify the integration, the implementer should:
1. Start the bot locally: `python main.py`.
2. Run `/kaizen_now` via Telegram or a test script.
3. Check the console and Telegram chat outputs for status logs starting with `🤖 Kaizen Daily Reflection & Audit Kích Hoạt`.
4. Inspect `vaults/lessons_learned.md` to verify that 3 new learnings are appended.
5. Check if the local development server for the active app starts/restarts correctly, and verify that `run_visual_audit` is invoked and outputs visual verification logs.
