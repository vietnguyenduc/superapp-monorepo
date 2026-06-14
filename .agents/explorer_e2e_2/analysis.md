# E2E Test Harness Design Analysis

This document outlines the detailed design of a mock E2E test harness for the `superapp-business-bot` application. It details how to test the bot's functionality offline (complying with the `CODE_ONLY` network restriction) while simulating user interactions, capturing bot responses, stubbing Supabase DB/Auth interfaces, mocking AI routing, and organizing the 49 test cases specified in `SCOPE.md`.

---

## 1. Codebase Architecture & Integration Points

Through analysis of the `apps/superapp-business-bot` codebase, we identified the following key architectural interactions:

### A. Front-end (`main.py` using `pyTelegramBotAPI`)
- **Initialization**: `bot = telebot.TeleBot(BOT_TOKEN)` is instantiated.
- **Routing**: Incoming Telegram messages/commands and callback queries are mapped using decorators:
  - `@bot.message_handler(commands=['login', 'verify', 'start', 'help', 'apps', ...])`
  - `@bot.callback_query_handler(func=lambda call: ...)` for approval workflows and app switching.
  - `@bot.message_handler(content_types=['document'])` for file ingestion.
  - `@bot.message_handler(func=lambda message: True)` to capture conversational free text and route to `execute_chat_turn()`.
- **Response Dispatch**: The bot communicates back to the user via:
  - `bot.reply_to(message, text, ...)`
  - `bot.send_message(chat_id, text, reply_markup=...)`
  - `bot.edit_message_text(text, chat_id, message_id, ...)`
  - `bot.send_document(chat_id, file, ...)`

### B. Database client (`core/db.py`)
- Direct integration with Supabase PostgREST API using python's `requests` library under `SUPABASE_URL/rest/v1/...`.
- Provides transactional operations like:
  - `get_user_by_telegram_id(telegram_id)`
  - `link_telegram_id(email, telegram_id)`
  - `create_accounting_invoice(...)`, `create_leave_request(...)`, `create_sales_order(...)`, `create_inventory_record(...)`.

### C. Authentication manager (`core/auth_manager.py`)
- Manages local session pairings, maps directory roles to UAT contexts.
- Uses `SMTP_EMAIL` for sending email OTPs and eSMS.vn HTTP requests to transmit SMS OTPs.
- Writes successful links to `config/user_mapping.json`.

### D. AI Router (`core/ai_router.py`)
- Employs zero-cost regex-based task classification (`classify_task`) returning `'simple'`, `'medium'`, or `'heavy'`.
- Invokes `smart_generate()` to run single LLM requests, and `run_agentic_loop()` for multi-turn tool calling with providers (DeepSeek, Nvidia, Gemini, Claude) registered in `core/provider_registry.py`.

---

## 2. E2E Test Harness: The `BotSimulator` Design

To achieve full E2E testing without a live Telegram connection, we can create a `BotSimulator` class that patches the registered `telebot.TeleBot` instance in `main.py`.

### A. Interactive Simulation Mechanism
Instead of running `bot.infinity_polling()`, the simulator programmatically triggers the bot's internal handlers by instantiating `telebot.types.Message` and `telebot.types.CallbackQuery` objects, and calling:
- `bot.process_new_messages([mock_message])`
- `bot.process_new_callback_query([mock_callback_query])`

This executes the exact handler paths and state changes registered in `main.py`!

### B. Capturing Outgoing Responses
By monkey-patching `bot.send_message`, `bot.reply_to`, `bot.edit_message_text`, `bot.send_document`, and `bot.edit_message_reply_markup`, we capture all outgoing actions. The messages are appended to a queue (`captured_responses`) for verification.

Here is the implementation design of the `BotSimulator`:

```python
# apps/superapp-business-bot/tests/conftest.py or harness.py
import sys
import time
import os
from unittest.mock import MagicMock
import pytest
import telebot
from telebot.types import Message, Chat, User, CallbackQuery

class CapturedMessage:
    def __init__(self, method, chat_id, text=None, reply_markup=None, document=None, **kwargs):
        self.method = method
        self.chat_id = chat_id
        self.text = text
        self.reply_markup = reply_markup
        self.document = document
        self.kwargs = kwargs

class BotSimulator:
    def __init__(self, bot_instance):
        self.bot = bot_instance
        self.captured_responses = []
        self.message_counter = 1
        self._setup_patches()

    def _setup_patches(self):
        # Backup original methods
        self._orig_send_message = self.bot.send_message
        self._orig_reply_to = self.bot.reply_to
        self._orig_edit_message_text = self.bot.edit_message_text
        self._orig_send_document = self.bot.send_document
        
        # Override with capture implementations
        self.bot.send_message = self._mock_send_message
        self.bot.reply_to = self._mock_reply_to
        self.bot.edit_message_text = self._mock_edit_message_text
        self.bot.send_document = self._mock_send_document
        self.bot.send_chat_action = MagicMock() # Suppress typing spinners

    def clear(self):
        self.captured_responses.clear()

    def _mock_send_message(self, chat_id, text, reply_markup=None, **kwargs):
        captured = CapturedMessage("send_message", chat_id, text, reply_markup, **kwargs)
        self.captured_responses.append(captured)
        # Return a mock Message object representing the sent message so edit_message works
        self.message_counter += 1
        msg = Message(self.message_counter, None, int(time.time()), Chat(chat_id, "private"), "text", {}, "")
        msg.text = text
        return msg

    def _mock_reply_to(self, message, text, reply_markup=None, **kwargs):
        captured = CapturedMessage("reply_to", message.chat.id, text, reply_markup, reply_to_message_id=message.message_id, **kwargs)
        self.captured_responses.append(captured)
        self.message_counter += 1
        msg = Message(self.message_counter, None, int(time.time()), message.chat, "text", {}, "")
        msg.text = text
        return msg

    def _mock_edit_message_text(self, text, chat_id, message_id, reply_markup=None, **kwargs):
        captured = CapturedMessage("edit_message_text", chat_id, text, reply_markup, message_id=message_id, **kwargs)
        self.captured_responses.append(captured)
        msg = Message(message_id, None, int(time.time()), Chat(chat_id, "private"), "text", {}, "")
        msg.text = text
        return msg

    def _mock_send_document(self, chat_id, data, visible_file_name=None, caption=None, **kwargs):
        captured = CapturedMessage("send_document", chat_id, text=caption, document=data, visible_file_name=visible_file_name, **kwargs)
        self.captured_responses.append(captured)
        return Message(999, None, int(time.time()), Chat(chat_id, "private"), "document", {}, "")

    # --- User Interaction Simulation Helpers ---
    def send_user_message(self, chat_id: int, text: str, from_user_id: int = None, first_name: str = "TestUser"):
        user_id = from_user_id or chat_id
        user = User(user_id, is_bot=False, first_name=first_name, username="testuser")
        chat = Chat(chat_id, "private")
        
        msg = Message(
            message_id=self.message_counter,
            from_user=user,
            date=int(time.time()),
            chat=chat,
            content_type="text",
            options={},
            json_string=""
        )
        msg.text = text
        self.message_counter += 1
        
        # Route to registered handlers
        self.bot.process_new_messages([msg])

    def click_inline_button(self, chat_id: int, callback_data: str, message_id: int = 1, from_user_id: int = None):
        user_id = from_user_id or chat_id
        user = User(user_id, is_bot=False, first_name="TestUser", username="testuser")
        chat = Chat(chat_id, "private")
        
        msg = Message(message_id, None, int(time.time()), chat, "text", {}, "")
        
        call = CallbackQuery(
            id=f"query_{int(time.time())}",
            from_user=user,
            data=callback_data,
            chat_instance="chat_inst",
            json_string="",
            message=msg
        )
        # Route to callback handlers
        self.bot.process_new_callback_query([call])

    def upload_user_document(self, chat_id: int, filename: str, content: bytes, from_user_id: int = None):
        user_id = from_user_id or chat_id
        user = User(user_id, is_bot=False, first_name="TestUser", username="testuser")
        chat = Chat(chat_id, "private")
        
        # Create telebot Document object
        from telebot.types import Document
        doc = Document()
        doc.file_name = filename
        doc.file_id = "mock_file_id"
        doc.file_size = len(content)
        
        msg = Message(
            message_id=self.message_counter,
            from_user=user,
            date=int(time.time()),
            chat=chat,
            content_type="document",
            options={},
            json_string=""
        )
        msg.document = doc
        self.message_counter += 1
        
        # Mocking telebot's file download method
        self.bot.download_file = MagicMock(return_value=content)
        
        # Route document message
        self.bot.process_new_messages([msg])
```

---

## 3. Database & Auth Stubs (Supabase Integration)

Since we are in `CODE_ONLY` network mode, calls to Supabase through `core/db.py` and `core/auth_manager.py` must be stubbed. We design this using two layers for robustness:

### A. HTTP Mocking (Recommended)
This intercepts python's `requests` library at the socket/HTTP level. It ensures the query parameters, authorization headers, and path paths are validated properly, maintaining high E2E fidelity.

```python
# tests/mocks/supabase_mock.py
import re
from unittest.mock import Mock

class MockResponse:
    def __init__(self, json_data, status_code):
        self.json_data = json_data
        self.status_code = status_code
        self.text = str(json_data)

    def json(self):
        return self.json_data

    def raise_for_status(self):
        if self.status_code >= 400:
            raise Exception(f"HTTP Error: {self.status_code}")

class SupabaseStateMock:
    def __init__(self):
        self.users_db = {}
        self.invoices_db = []
        self.leaves_db = []
        self.sales_db = []
        self.inventory_db = []
        self.apps_db = [
            {"name": "accounting", "url": "https://accounting.vercel.app", "tech": "React", "port": 3001},
            {"name": "sales", "url": "https://sales.vercel.app", "tech": "React", "port": 3002},
            {"name": "hr", "url": "https://hr.vercel.app", "tech": "Next.js", "port": 3003},
            {"name": "inventory", "url": "https://inventory.vercel.app", "tech": "Next.js", "port": 3004}
        ]

    def mock_requests_get(self, url, headers=None, **kwargs):
        # 1. User by telegram_id
        if "/rest/v1/users?telegram_id=eq." in url:
            telegram_id = url.split("telegram_id=eq.")[1]
            user = self.users_db.get(str(telegram_id))
            return MockResponse([user] if user else [], 200)

        # 2. Dynamic apps
        if "/rest/v1/apps" in url:
            return MockResponse(self.apps_db, 200)

        # 3. User lists
        if "/rest/v1/users?telegram_id=not.is.null" in url:
            return MockResponse(list(self.users_db.values()), 200)

        return MockResponse([], 404)

    def mock_requests_post(self, url, json=None, **kwargs):
        # 1. Invoices
        if "/rest/v1/accounting_invoices" in url:
            self.invoices_db.append(json)
            return MockResponse([json], 201)

        # 2. Leaves
        if "/rest/v1/leave_requests" in url:
            self.leaves_db.append(json)
            return MockResponse([json], 201)

        # 3. Sales orders
        if "/rest/v1/sales_orders" in url:
            self.sales_db.append(json)
            return MockResponse([json], 201)

        # 4. Inventory records
        if "/rest/v1/inventory_records" in url:
            self.inventory_db.append(json)
            return MockResponse([json], 201)

        # 5. eSMS.vn SMS gateway mock
        if "rest.esms.vn" in url:
            return MockResponse({"CodeResult": "100", "SMSID": "mock_sms_id_123"}, 200)

        return MockResponse({}, 400)

    def mock_requests_patch(self, url, json=None, **kwargs):
        # 1. link telegram id to email
        if "/rest/v1/users?email=eq." in url:
            email = url.split("email=eq.")[1]
            telegram_id = json.get("telegram_id")
            # Update local mock database state
            for uid, user_data in list(self.users_db.items()):
                if user_data.get("email") == email:
                    user_data["telegram_id"] = telegram_id
            return MockResponse([], 204)

        return MockResponse({}, 400)
```

We apply this mock via `unittest.mock.patch` over python's standard `requests` module:
```python
@pytest.fixture
def mock_supabase():
    mock_state = SupabaseStateMock()
    # Inject initial test data
    mock_state.users_db["12345"] = {
        "id": "u1", "email": "director@superapp.com", 
        "role": "admin", "telegram_id": "12345", "status": "active"
    }
    mock_state.users_db["67890"] = {
        "id": "u2", "email": "sales@superapp.com", 
        "role": "sales_agent", "telegram_id": "67890", "status": "active"
    }
    
    with unittest.mock.patch('requests.get', side_effect=mock_state.mock_requests_get), \
         unittest.mock.patch('requests.post', side_effect=mock_state.mock_requests_post), \
         unittest.mock.patch('requests.patch', side_effect=mock_state.mock_requests_patch):
        yield mock_state
```

---

## 4. AI Router & Provider Mocking

The AI router needs to be mocked so that tests do not invoke external endpoints (Gemini, DeepSeek, etc.) and complete instantly.

### A. Mocking classification vs generation
- **Task Complexity Classification**: We keep the original regex-based classifier `classify_task` since it is fully local and deterministic.
- **Provider Mocking**: We mock the `get_registry()` returns so that the registry exposes mocked providers returning predictable text or JSON responses.

```python
# tests/mocks/ai_mock.py
from unittest.mock import MagicMock
from core.provider_registry import ProviderRegistry

class MockAIProvider:
    def __init__(self, name, preset_responses=None):
        self.NAME = name
        self.preset_responses = preset_responses or {}

    def health_check(self):
        return True

    def generate(self, prompt, system=None, tools_schema=None):
        for keyword, response in self.preset_responses.items():
            if keyword in prompt.lower():
                return response
        return "Chào bạn, tôi là trợ lý ảo doanh nghiệp. Tôi có thể giúp gì cho bạn?"

    def generate_with_tools(self, messages, tools_schema):
        # Default mock tool invocation
        user_message = messages[-1].get("content", "")
        # Mocking tool invocation if the prompt triggers specific entities
        if "hóa đơn" in user_message or "invoice" in user_message:
            return {
                "role": "assistant",
                "content": "Đang tạo hóa đơn...",
                "tool_calls": [{
                    "id": "call_inv_01",
                    "type": "function",
                    "function": {
                        "name": "create_accounting_invoice",
                        "arguments": '{"amount": 5000000, "supplier_name": "Công ty ABC", "invoice_date": "2026-06-15"}'
                    }
                }]
            }
        return {
            "role": "assistant",
            "content": "Tôi đã nhận thông tin. Tôi có thể xử lý hành động tiếp theo không?"
        }

@pytest.fixture
def mock_ai_registry():
    mock_reg = ProviderRegistry()
    
    # Pre-populate custom responses to match dynamic E2E scenarios
    presets = {
        "tạo hóa đơn": "Tôi đã hoàn thành việc tạo hoá đơn cho nhà cung cấp.",
        "bán hàng": "Chuyển hướng bạn đến phân hệ Sales.",
        "xin nghỉ phép": "Đã ghi nhận đơn xin nghỉ phép của bạn.",
        "nhập kho": "Đã lưu phiếu nhập kho.",
        "mơ hồ": "Bạn muốn thực hiện hành động này ở phân hệ nào? Kế toán hay Nhân sự?"
    }
    
    mock_reg.deepseek = MockAIProvider("deepseek", presets)
    mock_reg.gemini = MockAIProvider("gemini", presets)
    mock_reg.nvidia = MockAIProvider("nvidia", presets)
    mock_reg.claude = MockAIProvider("claude", presets)
    
    with unittest.mock.patch('core.ai_router.get_registry', return_value=mock_reg):
        yield mock_reg
```

---

## 5. Structuring the 49 Test Cases in `SCOPE.md`

We organize the 49 test cases systematically within `apps/superapp-business-bot/tests/test_e2e.py` or separate files by partitions to maintain neatness and scalability.

```
apps/superapp-business-bot/tests/
├── conftest.py               # Shared harness, Supabase mocks, AI mocks fixtures
├── test_e2e_r1_onboarding.py # Tests 1-10 (Authentication & Onboarding)
├── test_e2e_r2_roles.py      # Tests 11-20 (RBAC & Session Permissions)
├── test_e2e_r3_apps.py       # Tests 21-30 (Dynamic App Walkthroughs)
├── test_e2e_r4_ai_route.py   # Tests 31-40 (AI Intent Routing & fallbacks)
├── test_e2e_t3_cross.py      # Tests 41-44 (Cross-Feature Integrations)
└── test_e2e_t4_scenarios.py  # Tests 45-49 (Complex Real-World Flows)
```

Below is the blueprint outline of test case code structures:

### Feature R1: Conversational Onboarding & Email OTP Auth
```python
# test_e2e_r1_onboarding.py
import pytest

def test_r1_start_onboarding(simulator):
    """1. /start starts the conversational onboarding."""
    simulator.send_user_message(chat_id=999, text="/start")
    last_resp = simulator.captured_responses[-1]
    assert "YÊU CẦU LIÊN KẾT TÀI KHOẢN" in last_resp.text or "TELEGRAM BUSINESS ASSISTANT" in last_resp.text

def test_r1_login_prompt(simulator):
    """2. /login asks the user for their business email."""
    simulator.send_user_message(chat_id=999, text="/login")
    assert "Cú pháp: `/login <email_trong_supabase>`" in simulator.captured_responses[-1].text

def test_r1_valid_email_otp_sent(simulator, mock_supabase):
    """3. Submitting a valid corporate email triggers OTP generation."""
    # Pre-add user to mock database matrix
    mock_supabase.users_db["999"] = {"email": "director@superapp.com", "role": "admin"}
    
    simulator.send_user_message(chat_id=999, text="/login director@superapp.com")
    assert "Đã gửi mã OTP 6 số đến" in simulator.captured_responses[-1].text

def test_r1_otp_verification_success(simulator, mock_supabase):
    """4. Submitting the correct 6-digit OTP completes authentication."""
    # Simulate pending OTP verification sequence
    # 1. User sends /login
    mock_supabase.users_db["999"] = {"email": "director@superapp.com", "role": "admin"}
    simulator.send_user_message(chat_id=999, text="/login director@superapp.com")
    
    # 2. Capture generated OTP from internal state
    from main import PENDING_LOGINS
    otp = PENDING_LOGINS[999]["otp"]
    
    # 3. Submit OTP verify command
    simulator.send_user_message(chat_id=999, text=f"/verify {otp}")
    assert "Xác thực email thành công! Đang chờ Admin chính phê duyệt..." in simulator.captured_responses[-1].text

# Outlines for remaining R1 tests (5-10):
# - test_r1_multiple_logins: Verify multi-session role mapping context.
# - test_r1_invalid_email_format: Verify validation block on bad email addresses.
# - test_r1_unknown_email: Assert access denial on emails missing from the directory.
# - test_r1_incorrect_otp: Test verification failure on wrong digits.
# - test_r1_expired_otp: Force expiration trigger and assert login retry requirement.
# - test_r1_otp_max_attempts: Assert email lock-out after 5 failed OTP codes.
```

### Feature R2: User Roles & Access Handling
```python
# test_e2e_r2_roles.py
import pytest

def test_r2_trial_user_onboarding(simulator, mock_supabase):
    """11. Log in as a guest/trial user and receive a trial role."""
    # Trigger /login with guest keyword
    simulator.send_user_message(chat_id=888, text="/login guest")
    # Verify trial configuration assignment
    from main import PENDING_LOGINS
    assert PENDING_LOGINS[888]["email"] == "guest"

# Outlines for remaining R2 tests (12-20):
# - test_r2_trial_user_apps: Verify trial roles restrict users to demo/trial URLs and display registration contact info.
# - test_r2_company_member_welcome: Verify that logging in with standard member email yields customized company name welcomes.
# - test_r2_admin_settings: Ensure admin telegram_ids successfully execute the /settings commands.
# - test_r2_non_admin_settings_denied: Ensure staff/sales roles get permission denied responses on /settings commands.
# - test_r2_trial_session_expiration: Mock session timeout and ensure commands fail until re-login.
# - test_r2_dynamic_role_update: Change user role in mock database during session, verify next bot command reflects the change instantly.
# - test_r2_inactive_user_blocked: Set user active status to False in DB and assert immediate blockage.
# - test_r2_unauthorized_command_execution: Try executing app-restricted command and assert deniability response.
# - test_r2_multiple_overlapping_roles: Ensure authorization permits actions when a user holds overlapping/multiple roles.
```

### Feature R3: Dynamic App Walkthrough
```python
# test_e2e_r3_apps.py
import pytest

def test_r3_apps_list(simulator, mock_supabase):
    """21. Running /apps displays all active apps for the user's company."""
    # Set user role to Admin to pass check_rbac_permission
    from main import UAT_ROLES
    UAT_ROLES[777] = "admin"
    
    simulator.send_user_message(chat_id=777, text="/apps")
    last_resp = simulator.captured_responses[-1]
    assert "Vibe-Gate Switchboard" in last_resp.text
    # Inline markup contains buttons matching mock apps_db
    assert len(last_resp.reply_markup.keyboard) > 0

# Outlines for remaining R3 tests (22-30):
# - test_r3_app_button_click: Simulate click callback query for 'switch_app:accounting' and assert status returns.
# - test_r3_multiple_apps_display: Verify button placement adapts correctly depending on quantity of apps retrieved from DB.
# - test_r3_company_app_separation: Mock two users in separate companies, verify Company A cannot see Company B's dynamic apps list.
# - test_r3_walkthrough_flow: First-time logins display interactive tutorial step guides.
# - test_r3_no_apps_configured: Return 0 apps from Supabase, assert bot replies with clean "no apps mapped" notifications.
# - test_r3_malformed_app_url: Mock app record with null/broken URL and assert warning message output.
# - test_r3_unauthenticated_apps_access: Run /apps without session, assert redirect response to /login.
# - test_r3_apps_db_query_failure: Simulate Supabase query throw error, assert graceful fallback exception screen.
# - test_r3_stale_callback_query: Execute callback switch with invalid transaction id, ensure it ignores safely.
```

### Feature R4: AI Intent Routing
```python
# test_e2e_r4_ai_route.py
import pytest

def test_r4_route_accounting(simulator, mock_ai_registry):
    """31. Free text "tạo hóa đơn" is routed to the Accounting app."""
    from main import UAT_ROLES
    UAT_ROLES[555] = "admin"
    
    simulator.send_user_message(chat_id=555, text="tạo hóa đơn bán hàng 500k")
    # Verify response indicates routing to Accounting or invoking create_accounting_invoice tool
    assert any("hoàn thành" in str(msg.text).lower() or "hóa đơn" in str(msg.text).lower() for msg in simulator.captured_responses)

# Outlines for remaining R4 tests (32-40):
# - test_r4_route_sales: Verify free text for sales ("bán hàng") resolves to the Sales app.
# - test_r4_route_hr: Verify free text for HR ("xin nghỉ phép") resolves to the HR app.
# - test_r4_route_inventory: Verify free text for inventory ("nhập kho") resolves to the Inventory app.
# - test_r4_direct_conversational_response: Send general conversation ("xin chào"), verify direct conversational response is returned.
# - test_r4_empty_prompt: Verify empty/whitespace texts are ignored safely.
# - test_r4_ambiguous_routing: Send ambiguous request, verify clarification prompts are returned.
# - test_r4_exceed_length_limit: Send extremely long message (e.g. 10,000 chars) and assert safe handling.
# - test_r4_ai_service_down: Simulate all AI registry providers raising errors, verify fallback screen instructions.
# - test_r4_malicious_prompt_injection: Test inputting escape characters or code sequences, assert safe string escaping.
```

### Tier 3: Cross-Feature Combinations (Pairwise Coverage)
```python
# test_e2e_t3_cross.py
import pytest

# Outlines for Tier 3 tests (41-44):
# - test_t3_login_role_app_sync: Perform login flow (R1) -> session resolves role (R2) -> dynamic apps list immediately updates (R3).
# - test_t3_free_text_auth_interruption: User sends free text request (R4) -> bot interrupts asking to authenticate (R1) -> user authenticates -> bot completes original action.
# - test_t3_settings_change_app_effect: Change config settings via settings callback (R2) -> immediately impacts active /apps view (R3).
# - test_t3_ai_route_permission_gate: AI router attempts to route to Accounting (R4), but role checks block request as user has Sales-only role (R2).
```

### Tier 4: Real-World Application Scenarios
```python
# test_e2e_t4_scenarios.py
import pytest

# Outlines for Tier 4 tests (45-49):
# - test_t4_employee_full_onboarding_and_invoice: Happy-path E2E scenario: user starts, logins, queries apps, triggers "tạo hóa đơn" to insert Supabase invoice.
# - test_t4_trial_user_exploration_limit: Guest logs in trial session, views tutorial, runs admin command (blocked), and requests contact options.
# - test_t4_revoked_credentials_mid_session: Active authenticated user has telegram_id removed or disabled in mock database mid-session, assert next message immediately blocks them.
# - test_t4_admin_dynamic_url_update_and_use: Admin logs in, modifies company app URL inside dynamic config, runs /apps, and AI route handles using the new URL.
# - test_t4_ingestion_and_cleaning_pipeline: User uploads a CSV file, bot intercepts document, routes it to the ingestion tool, and outputs profiles.
```

---

## 6. Verification & Running Instructions

### Pre-Requisites
Ensure `pytest` and `pytest-asyncio` are installed in the workspace.
```powershell
pip install pytest pytest-asyncio
```

### Executing E2E Tests
To run the E2E test suite:
```powershell
pytest apps/superapp-business-bot/tests/ -v
```

This harness executes the tests entirely offline, satisfying all network restrictions and providing rapid validation of the entire project scope.
