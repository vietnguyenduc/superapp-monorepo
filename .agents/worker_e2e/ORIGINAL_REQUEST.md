## 2026-06-15T01:18:53Z
Task request:
Design, implement, and run the comprehensive E2E test suite for `superapp-business-bot` in `apps/superapp-business-bot/tests/`.
Requirements:
1. Check `apps/superapp-business-bot/core/db.py` for `get_user_by_email` and implement it if missing.
2. In `apps/superapp-business-bot/tests/`, create `conftest.py` with `BotSimulator` monkeypatching `telebot.TeleBot`, database / auth HTTP requests stubs, and AI router stubs.
3. In `apps/superapp-business-bot/tests/`, create 6 test files to implement all 49 test cases defined in `c:\Vibecoding\superapp-monorepo\.agents\orch_e2e_testing\SCOPE.md`.
4. Run the complete E2E test suite using pytest inside the `apps/superapp-business-bot` directory and ensure all 49 tests pass.
5. Publish `TEST_INFRA.md` and `TEST_READY.md` at the project root.
