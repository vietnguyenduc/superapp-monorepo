# E2E Mock Test Harness Architecture and Design

## 1. Codebase Exploration & Analysis

### 1.1 `main.py` Usage of `pyTelegramBotAPI`
In `apps/superapp-business-bot/main.py`, the `pyTelegramBotAPI` library (imported as `telebot`) is used to manage bot interaction:
- **Initialization**: Instantiated as `bot = telebot.TeleBot(BOT_TOKEN)` (Line 127).
- **Decorators**: Event routing relies heavily on decorators:
  - `@bot.message_handler(commands=[...])`: Binds handlers to specific command triggers (e.g., `/login`, `/verify`, `/apps`, `/settings`).
  - `@bot.callback_query_handler(func=...)`: Listens for inline keyboard callback actions (e.g., approving logins, switching active app workspaces, editing settings).
  - `@bot.message_handler(func=lambda message: True)`: Acts as the general free-text entry point for conversational agent turns.
- **Context Handling**:
  - `bot.register_next_step_handler(msg, callback_func, *args)` is used to register stateful multi-step interactions (e.g. prompt schemas in `/crawl2` and settings edits).
  - Outgoing communication utilizes `bot.send_message`, `bot.reply_to`, `bot.edit_message_text`, `bot.send_media_group`, and `bot.send_document`.

### 1.2 Interactions of Core Modules
The core components coordinate as follows during active chat sessions:
1. **Request Reception**: `main.py` intercepts commands or free-text.
2. **Access Control**: Handlers call `get_user_role(telegram_id)` and `check_rbac_permission(message, required_module)`.
   - `get_user_role` checks:
     1. Local UAT overrides (`UAT_ROLES`).
     2. Hardcoded Developer overrides (`ALLOWED_USER_ID`).
     3. Active session JSON cache (`telegram_sessions.json`).
     4. Database query via `db.get_user_by_telegram_id(telegram_id)`.
3. **Conversational Agent Turn**: For free-text, `main.py` calls `execute_chat_turn(message, user_text, force_provider)`, which runs `agent.run_agent_turn(user_text, history, ...)` on a background thread.
4. **AI Routing & Execution**:
   - `agent.run_agent_turn` performs rule-based classification using `ai_router.classify_task(prompt)`.
   - It queries context memories using `memory_vault.get_relevant_memories(prompt)`.
   - If planning is requested (detected via keywords or `/plan`), it initializes a `TaskState` and enters `ai_router.run_agentic_loop(..., LOCAL_TOOLS_SCHEMA, tool_executor)`.
   - The model can then call local tool scripts (e.g. db mutations like `db.create_accounting_invoice` or data profiles) via `tool_executor`.
5. **Output Feedback**: The tool output is fed back into the agentic loop, which generates the final message sent to `main.py` and subsequently delivered to the user via `bot.send_message`.

---

## 2. Mock E2E Test Harness Architecture

To perform E2E testing inside a restricted `CODE_ONLY` network environment, we must intercept network-dependent integrations. Below is the proposed architecture for a mock E2E test harness in `tests/test_e2e_harness.py`.

### 2.1 Monkeypatching `telebot.TeleBot`
Instead of attempting to run standard polling loop servers which block thread execution and hit Telegram servers, we subclass `telebot.TeleBot` and monkeypatch it *before* importing `main.py`. This captures all outgoing calls and allows us to feed messages directly to the router.

```python
import os
import sys
import time
import unittest.mock as mock
import pytest
import telebot
from telebot import types

class CapturedResponse:
    def __init__(self, action, chat_id, text=None, reply_markup=None, media=None, document=None, **kwargs):
        self.action = action
        self.chat_id = chat_id
        self.text = text
        self.reply_markup = reply_markup
        self.media = media
        self.document = document
        self.kwargs = kwargs

class MockTeleBot(telebot.TeleBot):
    def __init__(self, token, *args, **kwargs):
        # Do not initialize parent network components
        self.token = token
        self.captured_responses = []
        self.next_step_handlers = {}  # Mock step registration

    def send_message(self, chat_id, text, *args, **kwargs):
        self.captured_responses.append(
            CapturedResponse("send_message", chat_id, text=text, reply_markup=kwargs.get("reply_markup"))
        )
        msg = mock.Mock(spec=types.Message)
        msg.message_id = len(self.captured_responses)
        msg.text = text
        msg.chat = types.Chat(id=chat_id, type="private")
        return msg

    def reply_to(self, message, text, *args, **kwargs):
        self.captured_responses.append(
            CapturedResponse("reply_to", message.chat.id, text=text, reply_markup=kwargs.get("reply_markup"), reply_to_id=message.message_id)
        )
        msg = mock.Mock(spec=types.Message)
        msg.message_id = len(self.captured_responses)
        msg.text = text
        msg.chat = message.chat
        return msg

    def edit_message_text(self, text, chat_id=None, message_id=None, *args, **kwargs):
        self.captured_responses.append(
            CapturedResponse("edit_message_text", chat_id, text=text, message_id=message_id, reply_markup=kwargs.get("reply_markup"))
        )
        msg = mock.Mock(spec=types.Message)
        msg.text = text
        return msg

    def edit_message_reply_markup(self, chat_id=None, message_id=None, reply_markup=None, *args, **kwargs):
        self.captured_responses.append(
            CapturedResponse("edit_reply_markup", chat_id, message_id=message_id, reply_markup=reply_markup)
        )

    def send_document(self, chat_id, data, *args, **kwargs):
        self.captured_responses.append(
            CapturedResponse("send_document", chat_id, document=data, caption=kwargs.get("caption"))
        )
        return mock.Mock(spec=types.Message)

    def send_media_group(self, chat_id, media, *args, **kwargs):
        self.captured_responses.append(
            CapturedResponse("send_media_group", chat_id, media=media)
        )
        return [mock.Mock(spec=types.Message)]

    def send_chat_action(self, chat_id, action, *args, **kwargs):
        pass

    def answer_callback_query(self, callback_query_id, text=None, *args, **kwargs):
        pass

    def register_next_step_handler(self, message, callback, *args, **kwargs):
        # Record the registered callback step for stateful command flow simulations
        self.next_step_handlers[message.chat.id] = (callback, args, kwargs)

# Inject mock class into namespace before main imports it
telebot.TeleBot = MockTeleBot
```

### 2.2 Simulating User Inputs
With `MockTeleBot` in place, we can instantiate a helper bot simulator that builds valid objects and triggers the registered handlers programmatically:

```python
class BotSimulator:
    def __init__(self, bot_instance):
        self.bot = bot_instance

    def send_user_message(self, text: str, chat_id: int, user_id: int, username: str = "testuser"):
        """Feeds a simulated text message or command directly to registered handlers."""
        # 1. Build types.Message
        user = types.User(id=user_id, is_bot=False, first_name=username, username=username)
        chat = types.Chat(id=chat_id, type="private")
        msg = types.Message(
            message_id=int(time.time() * 1000) % 1000000,
            from_user=user,
            date=int(time.time()),
            chat=chat,
            content_type="text",
            options={},
            json_string=""
        )
        msg.text = text

        # 2. Check if there is a pending register_next_step_handler
        if chat_id in self.bot.next_step_handlers:
            callback, args, kwargs = self.bot.next_step_handlers.pop(chat_id)
            callback(msg, *args, **kwargs)
        else:
            # 3. Else let TeleBot dispatch to regular message_handlers
            self.bot.process_new_messages([msg])

    def click_callback_button(self, data: str, chat_id: int, user_id: int, message_id: int):
        """Simulates clicking an inline keyboard button."""
        user = types.User(id=user_id, is_bot=False, first_name="testuser")
        chat = types.Chat(id=chat_id, type="private")
        msg = mock.Mock(spec=types.Message)
        msg.message_id = message_id
        msg.chat = chat
        
        cb_query = types.CallbackQuery(
            id=str(int(time.time() * 1000)),
            from_user=user,
            data=data,
            chat_instance="1",
            message=msg,
            json_string=""
        )
        self.bot.process_new_callback_query([cb_query])

    def clear(self):
        self.bot.captured_responses.clear()
        self.bot.next_step_handlers.clear()
```

### 2.3 Stubbing Database (Supabase) and Settings Configurations
We stub the database functions and configure memory files for sessions and settings, ensuring zero filesystem pollution and zero network activity:

```python
class MockDatabaseState:
    def __init__(self):
        self.users = {}
        self.apps = []
        self.invoices = []
        self.leave_requests = []
        self.sales_orders = []
        self.inventory_records = []

    def reset(self):
        self.users.clear()
        self.apps.clear()
        self.invoices.clear()
        self.leave_requests.clear()
        self.sales_orders.clear()
        self.inventory_records.clear()

db_state = MockDatabaseState()

def mock_db_get_user_by_telegram_id(telegram_id):
    return db_state.users.get(str(telegram_id))

def mock_db_get_user_by_email(email):
    for user in db_state.users.values():
        if user.get("email") == email:
            return user
    return None

def mock_db_link_telegram_id(email, telegram_id):
    for user in db_state.users.values():
        if user.get("email") == email:
            user["telegram_id"] = str(telegram_id)
            return True
    return False

def mock_db_create_invoice(amount, supplier_name, invoice_date, status="pending"):
    record = {"amount": amount, "supplier_name": supplier_name, "invoice_date": invoice_date, "status": status}
    db_state.invoices.append(record)
    return record
```

We patch these in `sys.modules["core.db"]` or inside the test file using `@mock.patch('core.db.get_user_by_telegram_id', mock_db_get_user_by_telegram_id)`.

### 2.4 Mocking the AI Intent Router
To stub `run_agentic_loop` and `smart_generate` so they return deterministic choices and trigger local tool calls without requesting external LLM APIs:

```python
def mock_run_agentic_loop(messages, tools_schema, tool_executor, task_type="medium", **kwargs):
    user_prompt = messages[-1]["content"] if messages else ""
    
    # 1. Simulate tool routing for Accounting
    if "tạo hóa đơn" in user_prompt.lower() or "invoice" in user_prompt.lower():
        # Execute the accounting tool from the schema
        tool_args = {"amount": 10000000.0, "supplier_name": "Công ty Cổ phần ABC", "invoice_date": "2026-06-15"}
        res = tool_executor("create_accounting_invoice", tool_args)
        return f"✅ Đã tạo hóa đơn kế toán thành công. Kết quả tool: {res}", "deepseek"
        
    # 2. Simulate tool routing for HR
    elif "nghỉ phép" in user_prompt.lower() or "leave" in user_prompt.lower():
        tool_args = {"telegram_id": "99999", "days": 2.0, "start_date": "2026-06-20", "reason": "Nghỉ mát"}
        res = tool_executor("create_leave_request", tool_args)
        return f"✅ Đã gửi đơn xin nghỉ phép thành công. Kết quả tool: {res}", "deepseek"

    # 3. Simulate tool routing for Sales
    elif "bán hàng" in user_prompt.lower() or "sales" in user_prompt.lower():
        tool_args = {"customer_phone": "0987654321", "product_sku": "SKU-SALES-99", "quantity": 5, "discount": "10%"}
        res = tool_executor("create_sales_order", tool_args)
        return f"✅ Đã tạo đơn hàng thành công. Kết quả tool: {res}", "deepseek"

    # 4. Simulate tool routing for Inventory
    elif "nhập kho" in user_prompt.lower() or "inventory" in user_prompt.lower():
        tool_args = {"product_sku": "SKU-INV-88", "quantity": 100, "location": "Warehouse A", "record_type": "inbound"}
        res = tool_executor("create_inventory_record", tool_args)
        return f"✅ Đã cập nhật kho thành công. Kết quả tool: {res}", "deepseek"
        
    # 5. Direct conversation responses
    return "Tôi có thể hỗ trợ gì cho bạn về các phân hệ Kế toán, Nhân sự, Bán hàng hoặc Kho bãi?", "gemini"
```

---

## 3. Scope Partition & 49 Test Cases Blueprint

To verify complete E2E compliance according to `SCOPE.md`, we partition the suite into 4 pytest file scopes:

### 3.1 `tests/test_e2e_auth_onboarding.py` (Feature R1)
Focuses on authentication, email validation, OTP flows, and admin approval limits.

| Test Case ID | Test Name | Setup & Action | Assertion |
|---|---|---|---|
| **1** | `test_r1_start_onboarding` | Unregistered user sends `/start` | Captured message asks for email registration. |
| **2** | `test_r1_login_prompt` | User sends `/login` without arg, then `/login director@superapp.com` | First check returns syntax warning; second outputs loading indicator. |
| **3** | `test_r1_valid_email_otp_sent` | User submits valid email | Mock OTP generated and sent; check message says "Đã gửi mã OTP". |
| **4** | `test_r1_otp_verification_success` | User sends correct OTP; Primary admin approves | Links telegram_id in DB, session updates, target user gets approved. |
| **5** | `test_r1_multiple_logins` | Multiple users login with different roles (Admin, Accountant) | Respective roles successfully updated in DB and session. |
| **6** | `test_r1_invalid_email_format` | User sends `/login malformed@@gmail.com` | Prompt indicates invalid format error. |
| **7** | `test_r1_unknown_email` | User sends `/login notinmatrix@gmail.com` | Return code states access denied / email not found. |
| **8** | `test_r1_incorrect_otp` | User enters wrong OTP | Message shows incorrect OTP verification error. |
| **9** | `test_r1_expired_otp` | User enters OTP after expiration interval | Prompt states code expired. |
| **10** | `test_r1_otp_max_attempts` | Enter incorrect OTP 5 times | Rate limiter triggers, blocks subsequent logins. |

### 3.2 `tests/test_e2e_roles_access.py` (Feature R2)
Verifies role-based access control, settings permissions, and session expiration boundaries.

| Test Case ID | Test Name | Setup & Action | Assertion |
|---|---|---|---|
| **11** | `test_r2_trial_user_onboarding` | User logs in using guest/trial email | Trial role assigned to user account. |
| **12** | `test_r2_trial_user_apps` | Trial user triggers `/apps` | Shows trial-limited Vercel URLs and manager contact info. |
| **13** | `test_r2_company_member_welcome` | Staff member sends `/start` | Returns welcome message matching company name. |
| **14** | `test_r2_admin_settings` | Admin user runs `/settings` | Settings inline keyboard panel is presented. |
| **15** | `test_r2_non_admin_settings_denied` | Sales agent runs `/settings` | Returns "Access Denied" permission block. |
| **16** | `test_r2_trial_session_expiration` | Session file modified to expired | Commands request user to re-authenticate. |
| **17** | `test_r2_dynamic_role_update` | User role changes in DB from Staff to Admin | Subsequent access to `/settings` shifts from denied to allowed. |
| **18** | `test_r2_inactive_user_blocked` | DB status updated to `inactive` | All commands return blocked access notification. |
| **19** | `test_r2_unauthorized_command_execution` | Member attempts admin command (`/awake`) | Interceptor blocks and returns permission warning. |
| **20** | `test_r2_multiple_overlapping_roles` | Mock user having admin permissions | Checks and matches permission scopes correctly. |

### 3.3 `tests/test_e2e_app_walkthrough.py` (Feature R3)
Verifies the dynamic app lists, keyboard configurations, and separation filters.

| Test Case ID | Test Name | Setup & Action | Assertion |
|---|---|---|---|
| **21** | `test_r3_apps_list` | Run `/apps` | Renders inline switchboard keys matching settings apps list. |
| **22** | `test_r3_app_button_click` | Click inline button `switch_app:accounting` | Focus shifts to accounting; returns Dev and Vercel links. |
| **23** | `test_r3_multiple_apps_display` | Change settings configuration to 5 apps | The inline keyboard expands to 5 buttons dynamically. |
| **24** | `test_r3_company_app_separation` | User A (Company A) and User B (Company B) trigger `/apps` | User A sees Company A's apps; User B sees Company B's apps. |
| **25** | `test_r3_walkthrough_flow` | First-time user logs in | Launches walkthrough tour sequence. |
| **26** | `test_r3_no_apps_configured` | Empty settings apps array | Returns warning indicating no active applications mapped. |
| **27** | `test_r3_malformed_app_url` | Mapped app has missing Vercel URL | Shows warnings next to the respective app switch actions. |
| **28** | `test_r3_unauthenticated_apps_access` | Unregistered user requests `/apps` | Prompts with account linking redirection. |
| **29** | `test_r3_apps_db_query_failure` | DB throws exception during user profile lookup | Responds with elegant warning. |
| **30** | `test_r3_stale_callback_query` | Send outdated callback command | Query answered safely without crash. |

### 3.4 `tests/test_e2e_ai_router.py` (Feature R4)
Tests task classification, intent parsing, AI routing fallbacks, and security boundaries.

| Test Case ID | Test Name | Setup & Action | Assertion |
|---|---|---|---|
| **31** | `test_r4_route_accounting` | Free-text: "tạo hóa đơn" | Intent correctly routed to Accounting tool; invoice logged. |
| **32** | `test_r4_route_sales` | Free-text: "bán hàng" | Intent routed to Sales tool; order logged. |
| **33** | `test_r4_route_hr` | Free-text: "xin nghỉ phép" | Intent routed to HR tool; leave request logged. |
| **34** | `test_r4_route_inventory` | Free-text: "nhập kho" | Intent routed to Inventory tool; stock record logged. |
| **35** | `test_r4_direct_conversational_response` | Free-text: "Xin chào" | Bypasses tools; returns conversational greeting. |
| **36** | `test_r4_empty_prompt` | User sends spaces or empty messages | Message is ignored or handled cleanly without starting loop. |
| **37** | `test_r4_ambiguous_routing` | Free-text: "xử lý dữ liệu" | Returns clarifying question rather than executing random tool. |
| **38** | `test_r4_exceed_length_limit` | User sends > 10,000 character prompt | Truncates/handles cleanly without hitting system stack overflows. |
| **39** | `test_r4_ai_service_down` | Mock all registry models as offline | Returns warning with manual instructions fallback. |
| **40** | `test_r4_malicious_prompt_injection` | Prompt injection input | Sanitized cleanly; no context leak. |

### 3.5 Tiers 3 & 4: Integration and Real-World Scenarios
Tests cross-feature synchronizations (Pairwise Coverage) and user workflow scripts.

| Test Case ID | Test Name | Setup & Action | Assertion |
|---|---|---|---|
| **41** | `test_t3_login_role_app_sync` | Login -> Check role -> Click `/apps` switchboard | Switched app displays permissions specific to role. |
| **42** | `test_t3_free_text_auth_interruption` | Guest asks "tạo hóa đơn" -> Login -> Approve -> Process | Prompts authentication first; executes invoice tool post-login. |
| **43** | `test_t3_settings_change_app_effect` | Admin adjusts app port in settings -> Check app | The `/apps` link is modified instantly. |
| **44** | `test_t3_ai_route_permission_gate` | Staff requests "xóa database" via AI | AI attempts task but RBAC blocks execution. |
| **45** | `test_t4_employee_full_onboarding_and_invoice` | Complete employee lifecycle walkthrough | All transitions from unauth -> login -> verify -> app check -> tool success pass cleanly. |
| **46** | `test_t4_trial_user_exploration_limit` | Guest logs in -> tests admin settings -> asks pricing | Walkthrough shown; `/settings` blocked; returns contact details. |
| **47** | `test_t4_revoked_credentials_mid_session` | Mid-session, user marked inactive in DB | Next message immediately yields blocked account message. |
| **48** | `test_t4_admin_dynamic_url_update_and_use` | Admin modifies Vercel URL -> asks AI to route | AI routes using updated target URL metadata. |
| **49** | `test_t4_ingestion_and_cleaning_pipeline` | Upload dirty Excel spreadsheet data | Parses file, runs Profiler, outputs profile summary table. |

---

## 4. Verification and Execution Method
To independently execute and verify the E2E test suite:
1. Ensure the workspace path contains the mock tests under `apps/superapp-business-bot/tests/`.
2. Run tests using `pytest`:
   ```bash
   python -m pytest apps/superapp-business-bot/tests/ -v
   ```
3. Since all external APIs and databases are stubbed via standard monkeypatching, this suite can be safely run under `CODE_ONLY` mode without internet access.
