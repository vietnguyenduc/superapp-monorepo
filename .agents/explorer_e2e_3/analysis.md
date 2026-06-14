# Analysis: E2E Test Harness Design for superapp-business-bot

## 1. Codebase Overview & Interactions
The `apps/superapp-business-bot` codebase implements an autonomous Telegram Business Assistant. It coordinates several components:
- **`main.py`**: Entry point using `pyTelegramBotAPI`. It defines message handlers (`@bot.message_handler`) and callback handlers (`@bot.callback_query_handler`) to manage the state machine and reply to users.
- **`core/db.py`**: Interacts with Supabase REST API via `requests` to create invoices, leave requests, sales orders, inventory records, and fetch/link Telegram IDs to user emails.
- **`core/auth_manager.py`**: Coordinates enterprise directory verification, OTP generation, session storage, and phone verification via eSMS.vn.
- **`core/ai_router.py`**: Contains rule-based classification and the multi-turn agentic loop (`run_agentic_loop`). It triggers the underlying LLM providers (Ollama, DeepSeek, Nvidia, Gemini) and supports fallback logic and cancellation.

### Key Gaps Identified
- **Missing `get_user_by_email` in `core/db.py`**: In `main.py` (line 204), the code calls `user = db.get_user_by_email(email)`. However, `core/db.py` does not contain this function. (Note: It was implemented in `apps/antigravity-telegram-agent/core/db.py` but is missing in the `superapp-business-bot` folder).
- **Asynchronous Execution**: The agent chat turn processing runs inside background threads (`threading.Thread(target=process_agent_response).start()`). The test harness must be capable of waiting for these threads to finish before asserting.

---

## 2. Test Harness Design (Python / pytest)

### 2.1 Event Simulation & Dispatch
We can simulate Telegram events by creating mock objects and passing them to the bot's internal message and callback processors.

```python
import telebot

def make_mock_message(text, chat_id=12345, user_id=12345, first_name="TestUser", message_id=1):
    chat = telebot.types.Chat(chat_id, "private")
    user = telebot.types.User(user_id, False, first_name, username="testuser")
    message = telebot.types.Message(message_id, user, None, chat, "text", {"text": text}, None)
    message.text = text
    return message

def make_mock_callback_query(data, message, user_id=12345, first_name="TestUser"):
    user = telebot.types.User(user_id, False, first_name, username="testuser")
    callback = telebot.types.CallbackQuery(
        id="cb_123",
        from_user=user,
        data=data,
        chat_instance="ci_123",
        json_string=None
    )
    callback.message = message
    return callback
```

To send these to the bot:
- **Message**: `bot.process_new_messages([mock_msg])`
- **Callback**: `bot.process_new_callbacks([mock_cb])`

### 2.2 Response Interception
We replace the bot's outgoing methods with mock implementations that append all sent messages to a thread-safe list.

```python
import threading

class CapturedResponse:
    def __init__(self, action_type, chat_id, text=None, reply_markup=None, parse_mode=None, extra=None):
        self.action_type = action_type
        self.chat_id = chat_id
        self.text = text
        self.reply_markup = reply_markup
        self.parse_mode = parse_mode
        self.extra = extra or {}

class CaptureBot:
    def __init__(self, bot_instance):
        self.bot = bot_instance
        self.captured = []
        self.lock = threading.Lock()
        
        self._mocks = {
            "send_message": bot_instance.send_message,
            "reply_to": bot_instance.reply_to,
            "edit_message_text": bot_instance.edit_message_text,
            "send_photo": bot_instance.send_photo,
            "send_media_group": bot_instance.send_media_group,
            "send_document": bot_instance.send_document,
            "edit_message_reply_markup": bot_instance.edit_message_reply_markup,
            "answer_callback_query": bot_instance.answer_callback_query,
        }
        
        # Override bot methods
        bot_instance.send_message = self.mock_send_message
        bot_instance.reply_to = self.mock_reply_to
        bot_instance.edit_message_text = self.mock_edit_message_text
        bot_instance.send_photo = self.mock_send_photo
        bot_instance.send_media_group = self.mock_send_media_group
        bot_instance.send_document = self.mock_send_document
        bot_instance.edit_message_reply_markup = self.mock_edit_message_reply_markup
        bot_instance.answer_callback_query = self.mock_answer_callback_query

    def clear(self):
        with self.lock:
            self.captured.clear()

    def _add(self, response):
        with self.lock:
            self.captured.append(response)

    def mock_send_message(self, chat_id, text, reply_markup=None, parse_mode=None, **kwargs):
        self._add(CapturedResponse("send_message", chat_id, text, reply_markup, parse_mode, kwargs))
        msg = telebot.types.Message(999, None, None, telebot.types.Chat(chat_id, "private"), "text", {}, None)
        msg.text = text
        return msg

    def mock_reply_to(self, message, text, reply_markup=None, parse_mode=None, **kwargs):
        self._add(CapturedResponse("reply_to", message.chat.id, text, reply_markup, parse_mode, {"reply_to_message_id": message.message_id, **kwargs}))
        msg = telebot.types.Message(999, None, None, message.chat, "text", {}, None)
        msg.text = text
        return msg

    def mock_edit_message_text(self, text, chat_id, message_id, reply_markup=None, parse_mode=None, **kwargs):
        self._add(CapturedResponse("edit_message_text", chat_id, text, reply_markup, parse_mode, {"message_id": message_id, **kwargs}))
        msg = telebot.types.Message(message_id, None, None, telebot.types.Chat(chat_id, "private"), "text", {}, None)
        msg.text = text
        return msg

    def mock_send_photo(self, chat_id, photo, caption=None, reply_markup=None, **kwargs):
        self._add(CapturedResponse("send_photo", chat_id, caption, reply_markup, None, {"photo": photo, **kwargs}))
        return telebot.types.Message(999, None, None, telebot.types.Chat(chat_id, "private"), "photo", {}, None)

    def mock_send_media_group(self, chat_id, media, **kwargs):
        self._add(CapturedResponse("send_media_group", chat_id, None, None, None, {"media": media, **kwargs}))
        return [telebot.types.Message(999, None, None, telebot.types.Chat(chat_id, "private"), "photo", {}, None)]

    def mock_send_document(self, chat_id, document, visible_file_name=None, caption=None, **kwargs):
        self._add(CapturedResponse("send_document", chat_id, caption, None, None, {"document": document, "visible_file_name": visible_file_name, **kwargs}))
        return telebot.types.Message(999, None, None, telebot.types.Chat(chat_id, "private"), "document", {}, None)

    def mock_edit_message_reply_markup(self, chat_id, message_id, reply_markup=None, **kwargs):
        self._add(CapturedResponse("edit_message_reply_markup", chat_id, None, reply_markup, None, {"message_id": message_id, **kwargs}))
        return telebot.types.Message(message_id, None, None, telebot.types.Chat(chat_id, "private"), "text", {}, None)

    def mock_answer_callback_query(self, callback_query_id, text=None, show_alert=False, **kwargs):
        self._add(CapturedResponse("answer_callback_query", None, text, None, None, {"callback_query_id": callback_query_id, "show_alert": show_alert, **kwargs}))
        return True

    def uninstall(self):
        for name, orig_method in self._mocks.items():
            setattr(self.bot, name, orig_method)
```

### 2.3 Supabase & Auth Mocking
We mock database queries and HTTP API requests using `unittest.mock` to intercept `requests.get`, `requests.post`, and `requests.patch`, or by mocking the functions in `core.db` directly.

**HTTP API Request Stubbing (using a mock handler class):**
```python
class MockResponse:
    def __init__(self, json_data, status_code):
        self.json_data = json_data
        self.status_code = status_code
        self.text = json.dumps(json_data)

    def json(self):
        return self.json_data

class SupabaseStub:
    def __init__(self):
        self.users = {}
        self.invoices = []
        self.leave_requests = []
        self.sales_orders = []
        self.inventory_records = []
        self.apps = [
            {"name": "accounting", "url": "https://accounting.example.com"},
            {"name": "sales", "url": "https://sales.example.com"},
            {"name": "hr", "url": "https://hr.example.com"},
            {"name": "inventory", "url": "https://inventory.example.com"}
        ]

    def mock_requests(self, method, url, **kwargs):
        import re
        
        # Route requests based on URL
        if "/rest/v1/users" in url:
            if method.upper() == "GET":
                # Check query
                match = re.search(r"telegram_id=eq\.(\d+)", url)
                if match:
                    tid = match.group(1)
                    user = next((u for u in self.users.values() if u.get("telegram_id") == tid), None)
                    return MockResponse([user] if user else [], 200)
                
                match_email = re.search(r"email=eq\.([^&]+)", url)
                if match_email:
                    email = match_email.group(1).lower()
                    user = self.users.get(email)
                    return MockResponse([user] if user else [], 200)
                
                return MockResponse(list(self.users.values()), 200)
                
            elif method.upper() == "PATCH":
                match_email = re.search(r"email=eq\.([^&]+)", url)
                if match_email:
                    email = match_email.group(1).lower()
                    payload = kwargs.get("json", {})
                    if email in self.users:
                        self.users[email].update(payload)
                        return MockResponse([self.users[email]], 200)
                return MockResponse({"error": "User not found"}, 404)
                
        elif "/rest/v1/accounting_invoices" in url:
            if method.upper() == "POST":
                invoice = kwargs.get("json", {})
                self.invoices.append(invoice)
                return MockResponse([invoice], 201)
                
        elif "/rest/v1/leave_requests" in url:
            if method.upper() == "POST":
                req = kwargs.get("json", {})
                self.leave_requests.append(req)
                return MockResponse([req], 201)

        elif "/rest/v1/apps" in url:
            return MockResponse(self.apps, 200)
            
        return MockResponse({"error": "Not Found"}, 404)
```

### 2.4 AI Routing Mocking
We intercept calls to `smart_generate` and `run_agentic_loop` inside `core.ai_router` to return mock text completions or simulate tool calling sequence.

```python
class MockAIRouter:
    def __init__(self):
        self.classification_override = None
        self.response_override = None
        self.tool_calls_to_simulate = []

    def mock_smart_generate(self, prompt, system=None, task_type=None, tools_schema=None, force_provider=None):
        if self.response_override:
            return self.response_override, "deepseek"
            
        # Default behavior based on keywords
        prompt_lower = prompt.lower()
        if "tạo hóa đơn" in prompt_lower:
            return "Routing to Accounting app.", "deepseek"
        elif "xin nghỉ phép" in prompt_lower:
            return "Routing to HR app.", "deepseek"
        elif "bán hàng" in prompt_lower:
            return "Routing to Sales app.", "deepseek"
        elif "nhập kho" in prompt_lower:
            return "Routing to Inventory app.", "deepseek"
        return "Direct AI Response.", "deepseek"

    def mock_run_agentic_loop(self, messages, tools_schema, tool_executor, **kwargs):
        # Simulate execution of tools
        for tool_name, args in self.tool_calls_to_simulate:
            tool_executor(tool_name, args)
        return self.response_override or "Agent process completed.", "deepseek"
```

---

## 3. The Test Harness Boilerplate (`tests/test_e2e.py`)

Here is the complete template structure for the test suite utilizing `pytest`:

```python
import pytest
import time
import threading
from unittest.mock import patch, MagicMock
import telebot

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main
from core import db, auth_manager, ai_router

# Mock indicator to prevent loop block
class MockTypingIndicator:
    def __init__(self, bot_instance, chat_id): pass
    def __enter__(self): return self
    def __exit__(self, exc_type, exc_val, exc_tb): pass

@pytest.fixture(autouse=True)
def setup_mocks(monkeypatch):
    # Mock typing indicator
    monkeypatch.setattr(main, "TelegramTypingIndicator", MockTypingIndicator)
    
    # Setup CaptureBot
    capture_bot = CaptureBot(main.bot)
    
    # Setup Supabase Stub
    db_stub = SupabaseStub()
    monkeypatch.setattr("requests.get", lambda url, **k: db_stub.mock_requests("GET", url, **k))
    monkeypatch.setattr("requests.post", lambda url, **k: db_stub.mock_requests("POST", url, **k))
    monkeypatch.setattr("requests.patch", lambda url, **k: db_stub.mock_requests("PATCH", url, **k))
    
    # Setup AI Router Stub
    ai_stub = MockAIRouter()
    monkeypatch.setattr(ai_router, "smart_generate", ai_stub.mock_smart_generate)
    monkeypatch.setattr(ai_router, "run_agentic_loop", ai_stub.mock_run_agentic_loop)
    
    yield capture_bot, db_stub, ai_stub
    
    # Uninstall mocks
    capture_bot.uninstall()

def wait_until_idle(chat_id, timeout=5):
    """Helper to wait until the agent background thread finishes processing."""
    start = time.time()
    while time.time() - start < timeout:
        if chat_id not in main._active_cancel_events:
            return
        time.sleep(0.02)
    raise TimeoutError("Agent background thread did not complete in time.")
```

---

## 4. Structuring the 49 Test Cases

Each test should be structured into one of the following groups, testing explicit conditions defined in `SCOPE.md`.

### Group 1: Feature R1 — Onboarding & Email OTP Auth

| ID | Test Name | Setup / Input | Expected Assertions |
|---|---|---|---|
| 1 | `test_r1_start_onboarding` | Message: `/start` | Captured output asks user to link account. |
| 2 | `test_r1_login_prompt` | Message: `/login` | Captured output asks user to provide email. |
| 3 | `test_r1_valid_email_otp_sent` | DB: `users` has `admin@superapp.com`<br>Message: `/login admin@superapp.com` | OTP generated, email sent, status "Đang gửi mã OTP..." returned. |
| 4 | `test_r1_otp_verification_success` | DB: `users` has `admin@superapp.com` pending verification.<br>Message: `/verify <correct_otp>` | DB linked `telegram_id` to user, session marked active, approve request sent to primary admin. |
| 5 | `test_r1_multiple_logins` | Multiple `/login` calls for different email roles. | Users created with respective roles (`admin`, `accountant`). |
| 6 | `test_r1_invalid_email_format` | Message: `/login malformed_email` | Captured output shows error message on email formatting. |
| 7 | `test_r1_unknown_email` | DB: Empty.<br>Message: `/login stranger@superapp.com` | Returns access denied response. |
| 8 | `test_r1_incorrect_otp` | DB: Pending login.<br>Message: `/verify incorrect_otp` | Returns OTP incorrect warning. |
| 9 | `test_r1_expired_otp` | Setup: Pending login with expired time.<br>Message: `/verify otp` | Returns OTP expired warning, login entry deleted. |
| 10 | `test_r1_otp_max_attempts` | Setup: Attempt OTP verification 5 times with wrong codes. | Account blocked/OTP request reset. |

### Group 2: Feature R2 — User Roles & Access Handling

| ID | Test Name | Setup / Input | Expected Assertions |
|---|---|---|---|
| 11 | `test_r2_trial_user_onboarding` | Link user with trial parameters. | User assigned role `trial` / guest limits active. |
| 12 | `test_r2_trial_user_apps` | Trial user runs `/apps`. | Returns limited apps with contact admin notice. |
| 13 | `test_r2_company_member_welcome` | DB: Member in Company A.<br>Message: `/start` | Personalized welcome message with Company A name. |
| 14 | `test_r2_admin_settings` | DB: Admin role.<br>Message: `/settings` | Displays settings inline keyboard config. |
| 15 | `test_r2_non_admin_settings_denied` | DB: Staff role.<br>Message: `/settings` | Returns "Access Denied" response. |
| 16 | `test_r2_trial_session_expiration` | Session age > 30 days. | Clears cached credentials; prompts login. |
| 17 | `test_r2_dynamic_role_update` | Run action -> update role in DB -> run action. | Second action blocks/allows dynamically based on update. |
| 18 | `test_r2_inactive_user_blocked` | DB: User is marked inactive. | Commands return account blocked warning. |
| 19 | `test_r2_unauthorized_command_execution` | Staff user runs `/run` cmd. | Returns RBAC denied warning. |
| 20 | `test_r2_multiple_overlapping_roles` | User with mixed roles runs actions. | Permissions resolve correctly based on roles registry. |

### Group 3: Feature R3 — Dynamic App Walkthrough

| ID | Test Name | Setup / Input | Expected Assertions |
|---|---|---|---|
| 21 | `test_r3_apps_list` | Message: `/apps` | Inline keyboard returned listing active apps. |
| 22 | `test_r3_app_button_click` | Callback data: `switch_app:accounting` | Updates message showing Accounting status and Ngrok/Vercel URL. |
| 23 | `test_r3_multiple_apps_display` | DB returns 4 apps. `/apps` run. | Keyboards generated dynamically with 4 buttons. |
| 24 | `test_r3_company_app_separation` | Company A user lists apps vs Company B user. | Lists display only respective company apps. |
| 25 | `test_r3_walkthrough_flow` | First execution for new user. | Outputs step-by-step walkthrough interactive guide. |
| 26 | `test_r3_no_apps_configured` | DB: Company has 0 apps. `/apps` run. | Shows "No apps configured" warning message. |
| 27 | `test_r3_malformed_app_url` | DB: App url is blank/invalid. | Shows URL malformed warnings. |
| 28 | `test_r3_unauthenticated_apps_access` | Unlogged user runs `/apps`. | Redirects user to login flow. |
| 29 | `test_r3_apps_db_query_failure` | DB throws exception on apps. | Handles error gracefully, displaying friendly warning. |
| 30 | `test_r3_stale_callback_query` | Send old callback ID. | Ignored or logged safely. |

### Group 4: Feature R4 — AI Intent Routing

| ID | Test Name | Setup / Input | Expected Assertions |
|---|---|---|---|
| 31 | `test_r4_route_accounting` | Message: "Tôi muốn tạo hóa đơn" | AI Router matches accounting; launches walkthrough or command. |
| 32 | `test_r4_route_sales` | Message: "Xem danh sách đơn bán hàng" | Router redirects to Sales application. |
| 33 | `test_r4_route_hr` | Message: "Tạo đơn xin nghỉ phép" | Router redirects to HR application. |
| 34 | `test_r4_route_inventory` | Message: "Kiểm tra hàng tồn nhập kho" | Router redirects to Inventory application. |
| 35 | `test_r4_direct_conversational_response` | Message: "Bạn là ai?" | Router returns direct conversational response. |
| 36 | `test_r4_empty_prompt` | Message: "   " | Message ignored or returns help command suggestion. |
| 37 | `test_r4_ambiguous_routing` | Message: "lấy dữ liệu" | AI asks user to clarify which module they are referring to. |
| 38 | `test_r4_exceed_length_limit` | Message: Character string > 10,000 characters. | Handled safely, truncated or warning returned. |
| 39 | `test_r4_ai_service_down` | Mock AI Router throwing exception. | Falls back to system templates or next available provider. |
| 40 | `test_r4_malicious_prompt_injection` | Prompt containing SQL injection or role prompt. | Safely sanitized, ignored, or executed with normal role limits. |

### Group 5: Tier 3 — Cross-Feature Combinations

| ID | Test Name | Setup / Input | Expected Assertions |
|---|---|---|---|
| 41 | `test_t3_login_role_app_sync` | Login -> approve -> /apps. | Apps rendered matching the verified role's permissions. |
| 42 | `test_t3_free_text_auth_interruption` | Message: "Tạo hóa đơn" (not logged in). | Asks for auth; once auth completed, action triggered. |
| 43 | `test_t3_settings_change_app_effect` | Toggle app availability in settings -> `/apps`. | Disabled apps immediately disappear from keyboard. |
| 44 | `test_t3_ai_route_permission_gate` | Staff user inputs "Tạo hóa đơn" -> AI routes. | RBAC intercepts execution, returning access denied. |

### Group 6: Tier 4 — Real-World Scenarios

| ID | Test Name | Setup / Input | Expected Assertions |
|---|---|---|---|
| 45 | `test_t4_employee_full_onboarding_and_invoice` | Complete end-to-end flow: `/start` -> login -> verify OTP -> approve -> AI route invoice. | Invoice record created in Supabase DB, success message sent. |
| 46 | `test_t4_trial_user_exploration_limit` | Guest login -> view walkthrough -> runs `/run` -> ask pricing. | Allowed walkthrough, blocked on terminal commands. |
| 47 | `test_t4_revoked_credentials_mid_session` | User logged in. In DB: disable user. Send command. | Blocked instantly. |
| 48 | `test_t4_admin_dynamic_url_update_and_use` | Admin logs in, updates settings URL -> users open walkthrough. | Users receive the updated target URL. |
| 49 | `test_t4_ingestion_and_cleaning_pipeline` | Upload document -> trigger analysis -> trigger clean. | Document downloaded, cleaning rules generated, data saved to DB. |
