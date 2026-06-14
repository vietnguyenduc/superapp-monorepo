# Test Infrastructure: superapp-business-bot E2E Test Suite

This document outlines the test architecture, testing philosophy, and execution commands for the E2E Test Suite of `superapp-business-bot`.

---

## 1. Test Architecture

The test suite is structured as a deterministic, network-isolated validation harness using `pytest`. The architecture is comprised of the following key components:

### 1.1 Thread-Safe Bot Simulator (`BotSimulator`)
- **Location**: Defined in `apps/superapp-business-bot/tests/conftest.py`.
- **Purpose**: Monkeypatches the outgoing methods of `telebot.TeleBot` (`send_message`, `reply_to`, `edit_message_text`, `send_photo`, `send_media_group`, `send_document`, `edit_message_reply_markup`, `answer_callback_query`, `send_chat_action`) to capture outbound traffic in a thread-safe list.
- **Simulation Methods**:
  - `send_user_message`: Dispatches simulated user text messages directly to the bot's internal message processor.
  - `send_user_document`: Dispatches simulated file uploads (CSV, Excel) to the bot's document handler.
  - `send_user_callback`: Dispatches simulated inline button callback clicks to the bot's callback query handler.

### 1.2 Database & HTTP API Request Stubbing
- **Location**: Defined in `apps/superapp-business-bot/tests/conftest.py` as a monkeypatched interceptor for the `requests` library.
- **Interceptions**:
  - Intercepts **PostgREST** calls targeting `users`, `apps`, `accounting_invoices`, `leave_requests`, `sales_orders`, and `inventory_records`.
  - Intercepts **eSMS.vn** calls for SMS OTP transmission, returning a successful `100` code result without performing network requests.
- **State Management**: Maintains a mutable database state dictionary (`SupabaseStub`) in memory, allowing test cases to inspect insertions, assert modifications, or dynamically revoke user access.

### 1.3 In-Process Tool Execution Mock
- **Location**: Defined in `apps/superapp-business-bot/tests/conftest.py`.
- **Purpose**: Intercepts `tools.execute_command` PowerShell invocations. When the AI router simulates calling python commands for database updates (like `create_accounting_invoice` or `create_leave_request`), the mock interceptor parses the command parameters and runs them in-process. This ensures lightning-fast execution and 100% deterministic results without spawning subprocesses.

### 1.4 AI Router Provider Mocking
- **Location**: Defined in `apps/superapp-business-bot/tests/conftest.py`.
- **Purpose**: Mocks calls to `smart_generate` and `run_agentic_loop` inside `core.ai_router` as well as the provider registry classes. Allows test cases to override completions, specify simulated tool execution lists, and simulate LLM provider failures to verify fallback logic.

---

## 2. Test Philosophy

- **Zero Hardcoding**: Expected test outcomes are verified by asserting actual side effects (such as records written to the database stub, session files updated on disk, or user roles modified in the state cache).
- **Network Isolation**: Operating in `CODE_ONLY` mode, all external REST, Auth, and AI providers are mocked to prevent dependencies on external APIs or live keys.
- **Concurrency & Threads**: Because the bot spawns background worker threads (`threading.Thread`) for conversational AI turns, the test harness monitors `_active_cancel_events` and utilizes a dynamic polling wait loop (`wait_until_idle`) to ensure background tasks complete before assertions execute.

---

## 3. Running Commands

To execute the test suite, navigate to the `apps/superapp-business-bot` directory and run:

```powershell
# 1. Install pytest prerequisites if needed
pip install pytest pytest-asyncio

# 2. Run the complete E2E test suite
pytest tests/ -v

# 3. Run a specific test category (e.g., onboarding)
pytest tests/test_e2e_r1_onboarding.py -v
```
