# Handoff Report: E2E Test Suite Design

## 1. Observation
We have inspected the files in the `apps/superapp-business-bot` codebase:
- `apps/superapp-business-bot/main.py`:
  - Utilizes `pyTelegramBotAPI` decorators for routing commands and messages, such as `@bot.message_handler(commands=['login'])` (line 185) and `@bot.callback_query_handler` (line 269).
  - Employs background threads for handling conversation turns via `threading.Thread(target=process_agent_response).start()` (line 1594).
  - Invokes `db.get_user_by_email(email)` at line 204:
    ```python
    204:     user = db.get_user_by_email(email)
    ```
- `apps/superapp-business-bot/core/db.py`:
  - Interacts with Supabase REST API endpoints via `requests.get`, `requests.post`, and `requests.patch` (e.g. lines 25, 46, 74).
  - Contains no implementation of `get_user_by_email(email)` (only `get_user_by_telegram_id`, `link_telegram_id`, etc. are defined).
- `apps/superapp-business-bot/core/auth_manager.py`:
  - Contains OTP generation, verification, eSMS.vn API integration, and corporate role mappings (`check_superapp_matrix` at line 39).
- `apps/superapp-business-bot/core/ai_router.py`:
  - Manages AI provider health, task type classification (`classify_task` at line 42), and the multi-turn agentic loop (`run_agentic_loop` at line 230).
- `c:\Vibecoding\superapp-monorepo\PROJECT.md`:
  - Lays out the project milestones, including Milestone 2 (E2E Testing Track) and Milestone 3 (Onboarding & OTP Auth).
- `c:\Vibecoding\superapp-monorepo\.agents\orch_e2e_testing\SCOPE.md`:
  - Defines the scope for the E2E test suite, specifying 49 test cases spanning 4 partitions across Tiers 1-4.

## 2. Logic Chain
1. To test the bot's behaviors offline (CODE_ONLY) and deterministically, we cannot make external requests to Supabase or Live LLMs. Thus, the database, auth manager, and AI router must be stubbed or mocked.
2. In `main.py`, Telegram events are routed to handlers registered using `pyTelegramBotAPI`. Rather than calling internal handler functions directly (which bypasses decorators, parsing logic, and state guards), we can simulate real Telegram interactions by instantiating mock message/callback objects and feeding them to `bot.process_new_messages([msg])` and `bot.process_new_callbacks([cb])`.
3. Outgoing responses from the bot (such as `send_message`, `reply_to`, `send_photo`, etc.) can be intercepted and verified by monkeypatching the respective methods on the `bot` instance to record responses in a thread-safe captured queue.
4. Because turn executions run in separate background threads, the test harness must poll the thread mapping (`main._active_cancel_events`) or the captured queue until the processing is idle, preventing tests from finishing prematurely.
5. In `main.py` line 204, `db.get_user_by_email(email)` is called, but it is missing in `core/db.py`. To allow login testing, we must either mock this function or have the implementer implement it first. Both options are supported by the mock design.

## 3. Caveats
- **Asynchronous timing**: Tests must ensure a proper polling timeout is used to wait for background processing. If the host machine runs slowly, tests may require adjustment of polling frequency and timeouts.
- **Planned features**: Several interfaces (like `send_supabase_otp` and `verify_supabase_otp`) outlined in `PROJECT.md` are planned for Milestone 3 but not yet implemented in `main.py` or `core/auth_manager.py`. The mock design accounts for these functions so they can be easily integrated once implemented.

## 4. Conclusion
We have designed a Python E2E test harness using `pytest` that:
- Simulates Telegram user events (`/start`, `/login`, `/apps`, callbacks, text).
- Intercepts outgoing bot responses (messages, inline buttons, documents, photos).
- Stubs HTTP calls to Supabase REST endpoints to manage user data, invoices, and app lists.
- Stubs AI routing completions and agentic loops to run tests deterministically offline.
- Structures and maps all 49 test cases defined in `SCOPE.md`.

## 5. Verification Method
1. Inspect the detailed design and implementation templates in `analysis.md`.
2. Once the test script is written by the Implementer in `tests/test_e2e.py` (or similar), it can be run using the standard project test command:
   ```powershell
   pytest apps/superapp-business-bot/tests/test_e2e.py
   ```
3. To invalidate the mock and ensure it catches errors, temporarily change the expected response in a test and verify that `pytest` registers a failure.
