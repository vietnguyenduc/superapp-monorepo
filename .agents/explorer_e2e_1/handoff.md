# Handoff Report: E2E Test Harness Design

## 1. Observation
- File `apps/superapp-business-bot/main.py`:
  - Instantiates the bot: `bot = telebot.TeleBot(BOT_TOKEN)` on line 127.
  - Handles login command: `@bot.message_handler(commands=['login'])` on line 185.
  - Handles verification: `@bot.message_handler(commands=['verify'])` on line 223.
  - Handles approval callback: `@bot.callback_query_handler(func=lambda call: call.data.startswith("approve_") or call.data.startswith("reject_"))` on line 269.
  - Handles apps list: `@bot.message_handler(commands=['apps'])` on line 841.
  - Handles app switching: `@bot.callback_query_handler(func=lambda call: call.data.startswith("switch_app:"))` on line 878.
  - Handles settings: `@bot.message_handler(commands=['settings'])` on line 2195.
  - Handles generic agent chat: `@bot.message_handler(func=lambda message: True)` on line 2269.
- File `apps/superapp-business-bot/core/db.py`:
  - Queries Supabase users table: `get_user_by_telegram_id(telegram_id: str)` on line 19.
  - Links Telegram ID: `link_telegram_id(email: str, telegram_id: str)` on line 38.
  - Business workflows (accounting, leave, sales, inventory) from line 68 to 154.
- File `apps/superapp-business-bot/core/auth_manager.py`:
  - Checks corporate email role matrix: `check_superapp_matrix(email: str)` on line 39.
  - Generates and sends OTP: `generate_and_send_otp(email: str)` on line 61.
  - Matches OTP input: `verify_otp_and_link(chat_id: str, email: str, user_otp: str)` on line 74.
- File `apps/superapp-business-bot/core/ai_router.py`:
  - Performs rule-based classification: `classify_task(message: str)` on line 42.
  - Routes single prompts: `smart_generate(...)` on line 68.
  - Coordinates agent tool loop: `run_agentic_loop(...)` on line 230.
- File `apps/superapp-business-bot/agent.py`:
  - Coordinates agent turn: `run_agent_turn(...)` on line 717.
- File `PROJECT.md`:
  - Specifies interface contracts for `main.py` ↔ `core/auth_manager.py` (`send_supabase_otp`, `verify_supabase_otp`) and `main.py` ↔ `core/db.py` (`get_user_by_telegram_id`, `get_dynamic_apps`).
- File `SCOPE.md`:
  - Outlines 49 distinct E2E test cases covering features R1 to R4, combinations, and real-world scenarios.

## 2. Logic Chain
1. **Network Independence**: The `CODE_ONLY` restriction prevents any external API calls (e.g. to Telegram Bot API, Supabase, or OpenAI/Deepseek/Gemini endpoints).
2. **TeleBot Simulation**: By monkeypatching `telebot.TeleBot` with `MockTeleBot` *before* importing `main.py`, the bot instantiation on line 127 of `main.py` is safely replaced by an in-memory mock.
3. **Response Interception**: Overriding `send_message`, `reply_to`, `edit_message_text`, `send_document`, and `send_media_group` in the mocked TeleBot records all outgoing bot responses, making them available for test assertions.
4. **User Input Simulation**: Creating custom `telebot.types.Message` and `telebot.types.CallbackQuery` objects, and feeding them to `bot.process_new_messages` and `bot.process_new_callback_query`, routes the commands/queries directly to the registered decorator handlers in `main.py` exactly as standard webhooks/polling would.
5. **Database & Auth Isolation**: Patching the modules `core.db` and `core.auth_manager` in tests redirects external database requests to a local in-memory `MockDatabaseState`, preventing DB connection attempts.
6. **AI Intent Mocking**: Monkeypatching `ai_router.run_agentic_loop` and `ai_router.smart_generate` allows returning pre-configured mock intents/responses. Under the hood, the mock `run_agentic_loop` can invoke the `tool_executor` directly to simulate the execution of business tools (e.g. database invoice creation), enabling full integration tests of the agent tool-calling pipeline.
7. **Coverage Structure**: We structure the 49 test cases defined in `SCOPE.md` across 4 targeted pytest suites, ensuring all features (R1-R4) and scenarios are validated.

## 3. Caveats
- The test harness relies on python imports and system environment variables (`TELEGRAM_BOT_TOKEN`, etc.) being defined before `main.py` runs its top-level module load.
- In-memory mock databases do not enforce real SQL constraints, triggers, or schema validations. They only mock the interface contracts.
- Stale callback query simulations rely on the exact callback data prefix mapping. If callback keys change in `main.py`, the mock click actions must be updated.

## 4. Conclusion
We proposed a robust, 100% network-free E2E test harness that integrates perfectly with `pyTelegramBotAPI` decorators. By utilizing mock decorators, message dispatches, database stubs, and AI loop bypasses, all 49 test cases from `SCOPE.md` can be implemented and executed deterministically.

## 5. Verification Method
- **Verification Command**:
  ```bash
  python -m pytest apps/superapp-business-bot/tests/ -v
  ```
- **Files to Inspect**:
  - `c:\Vibecoding\superapp-monorepo\.agents\explorer_e2e_1\analysis.md` (Detailed architectural design and harness blueprint).
  - `c:\Vibecoding\superapp-monorepo\.agents\explorer_e2e_1\progress.md` (Progress heartbeat log).
- **Invalidation Conditions**:
  - The verification will fail if `main.py` is modified to start infinity polling automatically at import time (i.e. if it is not guarded by `if __name__ == "__main__":`). Current inspection confirms it is guarded.
