# Handoff Report - E2E Mock Test Harness Design

## 1. Observation
- `apps/superapp-business-bot/main.py`:
  - Instantiates `bot = telebot.TeleBot(BOT_TOKEN)` (line 127).
  - Registers commands via `@bot.message_handler(commands=['login'])` (line 185), `@bot.message_handler(commands=['apps'])` (line 841), etc.
  - Registers callback queries via `@bot.callback_query_handler(func=lambda call: call.data.startswith("switch_app:"))` (line 878) and others.
  - Implements chat turns via `execute_chat_turn(message, user_text, force_provider=None)` (line 1348) which calls `agent.run_agent_turn(...)` (line 1515).
- `apps/superapp-business-bot/core/db.py`:
  - Queries Supabase using direct REST queries to `${SUPABASE_URL}/rest/v1/...` using `requests.get`/`post`/`patch` (e.g. line 27: `res = requests.get(url, headers=get_headers(), timeout=10)`).
- `apps/superapp-business-bot/core/auth_manager.py`:
  - Contains phone OTP verification using eSMS.vn API via `requests.post` (line 128).
  - Maps users locally to `config/user_mapping.json`.
- `apps/superapp-business-bot/core/ai_router.py`:
  - Classifies tasks via `classify_task` (line 42).
  - Runs agentic loops via `run_agentic_loop(...)` (line 230).
  - Resolves providers via `get_registry()` (line 91).
- `PROJECT.md`:
  - Lays out the project's architecture, data flows, milestones, and interface contracts.
- `.agents/orch_e2e_testing/SCOPE.md`:
  - Declares the 49 test cases covering Features R1-R4, Tier 3 (Cross-feature), and Tier 4 (Real-world scenarios).

## 2. Logic Chain
1. To test the bot E2E without live Telegram network polling, we can import `main.py`'s `bot` object and mock its polling methods.
2. Incoming user interaction (commands, callback buttons, document uploads) can be simulated by instantiating `telebot.types.Message` / `telebot.types.CallbackQuery` and calling `bot.process_new_messages([msg])` / `bot.process_new_callback_query([call])`.
3. Outgoing bot responses can be captured by monkey-patching `bot.send_message`, `bot.reply_to`, `bot.edit_message_text`, and `bot.send_document` to append arguments into an in-memory queue.
4. Supabase DB and Auth HTTP calls can be stubbed by patching python's `requests` library calls (`requests.get`, `requests.post`, `requests.patch`) that target `SUPABASE_URL` or `esms.vn`.
5. AI router calls can be mocked by patching `get_registry()` to return mock providers (`MockAIProvider`) that supply predefined responses.
6. Combining these stubs creates a fully offline, deterministic, mock E2E test harness (`tests/test_e2e.py`) capable of implementing the 49 test cases.

## 3. Caveats
- Setting `os.environ["TELEGRAM_BOT_TOKEN"]` to a dummy value (e.g., `"123456:mock_token"`) is required before importing `main.py` to prevent `sys.exit(1)` initialization failure.
- Milestone 3 (Supabase Auth OTP) is currently `IN_PROGRESS`. The E2E tests should stub the planned contracts (e.g., `send_supabase_otp`, `verify_supabase_otp`) as described in `PROJECT.md`.

## 4. Conclusion
We have designed a mock E2E test harness (`BotSimulator` + `SupabaseStateMock` + `MockAIProvider`) that intercepts bot responses, simulates inputs, stubs Supabase network calls, and stubs AI provider outputs. This design allows writing clean, offline-compatible test suites for the 49 test cases in `SCOPE.md`.

## 5. Verification Method
- **Verification Commands**: 
  Once implemented by the next agent, the tests can be executed via:
  ```powershell
  pytest apps/superapp-business-bot/tests/ -v
  ```
- **Inspect Design Files**: 
  Review the complete design and test layouts in `c:\Vibecoding\superapp-monorepo\.agents\explorer_e2e_2\analysis.md`.
