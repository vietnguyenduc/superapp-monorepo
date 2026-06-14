import os
import sys
import json
import re
import time
import threading
import pytest
from pathlib import Path

# Add bot directory to sys.path
BOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BOT_DIR))

# Ensure ALLOWED_TELEGRAM_USER_ID is set in env before main is imported
os.environ["ALLOWED_TELEGRAM_USER_ID"] = "55555"
os.environ["TELEGRAM_BOT_TOKEN"] = "123456789:fake_token"
os.environ["SUPABASE_URL"] = "https://fake-supabase-url.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "fake-anon-key"

import telebot
import main
import core.db as db
import core.auth_manager as auth_manager
from core.provider_registry import get_registry

# Mock typing indicator to avoid thread blocks
class MockTypingIndicator:
    def __init__(self, bot_instance, chat_id):
        pass
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

main.TelegramTypingIndicator = MockTypingIndicator

class CapturedResponse:
    def __init__(self, action_type, chat_id, text=None, reply_markup=None, parse_mode=None, extra=None):
        self.action_type = action_type
        self.chat_id = chat_id
        self.text = text
        self.reply_markup = reply_markup
        self.parse_mode = parse_mode
        self.extra = extra or {}

class BotSimulator:
    def __init__(self):
        self.bot = main.bot
        self.captured = []
        self.lock = threading.Lock()
        self._originals = {}
        
        methods = [
            "send_message",
            "reply_to",
            "edit_message_text",
            "send_photo",
            "send_media_group",
            "send_document",
            "edit_message_reply_markup",
            "answer_callback_query",
            "send_chat_action"
        ]
        
        for name in methods:
            self._originals[name] = getattr(self.bot, name)
            
        self.bot.send_message = self.mock_send_message
        self.bot.reply_to = self.mock_reply_to
        self.bot.edit_message_text = self.mock_edit_message_text
        self.bot.send_photo = self.mock_send_photo
        self.bot.send_media_group = self.mock_send_media_group
        self.bot.send_document = self.mock_send_document
        self.bot.edit_message_reply_markup = self.mock_edit_message_reply_markup
        self.bot.answer_callback_query = self.mock_answer_callback_query
        self.bot.send_chat_action = self.mock_send_chat_action

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

    def mock_send_chat_action(self, chat_id, action, **kwargs):
        return True

    def uninstall(self):
        for name, orig in self._originals.items():
            setattr(self.bot, name, orig)

    def send_user_message(self, text, chat_id=12345, user_id=12345, first_name="TestUser", message_id=1):
        chat = telebot.types.Chat(chat_id, "private")
        user = telebot.types.User(user_id, False, first_name, username="testuser")
        message = telebot.types.Message(message_id, user, None, chat, "text", {"text": text}, None)
        message.text = text
        self.bot.process_new_messages([message])
        return message

    def send_user_document(self, file_name, file_content_or_bytes, chat_id=12345, user_id=12345, first_name="TestUser", message_id=1):
        chat = telebot.types.Chat(chat_id, "private")
        user = telebot.types.User(user_id, False, first_name, username="testuser")
        document = telebot.types.Document()
        document.file_id = "doc_123"
        document.file_name = file_name
        document.mime_type = "text/csv" if file_name.endswith(".csv") else "application/octet-stream"
        document.file_size = len(file_content_or_bytes)
        message = telebot.types.Message(message_id, user, None, chat, "document", {"document": {}}, None)
        message.document = document
        
        orig_get_file = self.bot.get_file
        orig_download_file = self.bot.download_file
        
        self.bot.get_file = lambda file_id: telebot.types.File("doc_123", "doc_123", "dummy_path")
        self.bot.download_file = lambda file_path: file_content_or_bytes
        
        try:
            self.bot.process_new_messages([message])
        finally:
            self.bot.get_file = orig_get_file
            self.bot.download_file = orig_download_file
        return message

    def send_user_callback(self, data, message, user_id=12345, first_name="TestUser"):
        user = telebot.types.User(user_id, False, first_name, username="testuser")
        callback = telebot.types.CallbackQuery(
            id="cb_123",
            from_user=user,
            data=data,
            chat_instance="ci_123",
            json_string=None
        )
        callback.message = message
        self.bot.process_new_callbacks([callback])
        return callback

class MockResponse:
    def __init__(self, json_data, status_code):
        self.json_data = json_data
        self.status_code = status_code
        self.text = json.dumps(json_data)
        self.content = self.text.encode('utf-8')

    def json(self):
        return self.json_data

class SupabaseStub:
    def __init__(self):
        self.users = {
            "director@superapp.com": {"id": "u1", "email": "director@superapp.com", "role": "admin", "telegram_id": None, "status": "active"},
            "trial@superapp.com": {"id": "u2", "email": "trial@superapp.com", "role": "admin", "telegram_id": None, "status": "active"},
            "accountant@superapp.com": {"id": "u3", "email": "accountant@superapp.com", "role": "accountant", "telegram_id": None, "status": "active"},
            "hr@superapp.com": {"id": "u4", "email": "hr@superapp.com", "role": "hr_manager", "telegram_id": None, "status": "active"},
            "sales@superapp.com": {"id": "u5", "email": "sales@superapp.com", "role": "sales_agent", "telegram_id": None, "status": "active"},
            "warehouse@superapp.com": {"id": "u6", "email": "warehouse@superapp.com", "role": "warehouse_keeper", "telegram_id": None, "status": "active"}
        }
        self.invoices = []
        self.leave_requests = []
        self.sales_orders = []
        self.inventory_records = []
        self.apps = [
            {"name": "accounting", "path": "apps/accounting", "port": 3001, "tech": "React", "production_url": "https://accounting.example.com"},
            {"name": "sales", "path": "apps/sales", "port": 3002, "tech": "React", "production_url": "https://sales.example.com"},
            {"name": "hr", "path": "apps/hr", "port": 3003, "tech": "React", "production_url": "https://hr.example.com"},
            {"name": "inventory", "path": "apps/inventory", "port": 3004, "tech": "React", "production_url": "https://inventory.example.com"}
        ]
        self.esms_calls = []
        self.db_fail = False

    def mock_requests_get(self, url, headers=None, timeout=None):
        if self.db_fail:
            raise Exception("Mock Database Failure")
        url_lower = url.lower()
        if "/rest/v1/users" in url_lower:
            match_tid = re.search(r"telegram_id=eq\.(\w+)", url)
            if match_tid:
                tid = match_tid.group(1)
                matching = [u for u in self.users.values() if str(u.get("telegram_id")) == str(tid)]
                return MockResponse(matching, 200)
            
            match_email = re.search(r"email=eq\.([^&]+)", url)
            if match_email:
                email = match_email.group(1).lower().strip()
                matching = [u for u in self.users.values() if u["email"].lower().strip() == email]
                return MockResponse(matching, 200)
            
            if "telegram_id=not.is.null" in url:
                matching = [u for u in self.users.values() if u.get("telegram_id") is not None]
                return MockResponse(matching, 200)
                
            return MockResponse(list(self.users.values()), 200)

        elif "/rest/v1/apps" in url_lower:
            return MockResponse(self.apps, 200)

        return MockResponse({"error": "Not Found"}, 404)

    def mock_requests_patch(self, url, json=None, headers=None, timeout=None):
        if self.db_fail:
            raise Exception("Mock Database Failure")
        url_lower = url.lower()
        if "/rest/v1/users" in url_lower:
            match_email = re.search(r"email=eq\.([^&]+)", url)
            if match_email:
                email = match_email.group(1).lower().strip()
                found_user = None
                for u in self.users.values():
                    if u["email"].lower().strip() == email:
                        found_user = u
                        break
                if found_user:
                    found_user.update(json)
                    return MockResponse([found_user], 200)
            return MockResponse({"error": "User not found"}, 404)
        return MockResponse({"error": "Not Found"}, 404)

    def mock_requests_post(self, url, json=None, headers=None, timeout=None):
        if self.db_fail:
            raise Exception("Mock Database Failure")
        url_lower = url.lower()
        if "/rest/v1/accounting_invoices" in url_lower:
            self.invoices.append(json)
            return MockResponse([json], 201)
        elif "/rest/v1/leave_requests" in url_lower:
            self.leave_requests.append(json)
            return MockResponse([json], 201)
        elif "/rest/v1/sales_orders" in url_lower:
            self.sales_orders.append(json)
            return MockResponse([json], 201)
        elif "/rest/v1/inventory_records" in url_lower:
            self.inventory_records.append(json)
            return MockResponse([json], 201)
        elif "esms.vn" in url_lower:
            self.esms_calls.append(json)
            return MockResponse({"CodeResult": "100", "SMSID": "mock_sms_123"}, 200)
        return MockResponse({"error": "Not Found"}, 404)

class MockAIRouter:
    def __init__(self):
        self.response_override = None
        self.provider_override = None
        self.tool_calls_to_simulate = []
        self.called_with = []
        self.ai_fail = False

    def mock_smart_generate(self, prompt, system=None, task_type=None, tools_schema=None, force_provider=None):
        if self.ai_fail:
            raise Exception("Mock AI Service Down")
        self.called_with.append({
            "type": "smart_generate",
            "prompt": prompt,
            "system": system,
            "task_type": task_type,
            "tools_schema": tools_schema,
            "force_provider": force_provider
        })
        if self.response_override:
            return self.response_override, self.provider_override or force_provider or "deepseek"
            
        prompt_lower = prompt.lower()
        if "tạo hóa đơn" in prompt_lower or "invoice" in prompt_lower:
            return "Routing to Accounting app.", self.provider_override or force_provider or "deepseek"
        elif "xin nghỉ phép" in prompt_lower or "leave" in prompt_lower:
            return "Routing to HR app.", self.provider_override or force_provider or "deepseek"
        elif "bán hàng" in prompt_lower or "sales" in prompt_lower:
            return "Routing to Sales app.", self.provider_override or force_provider or "deepseek"
        elif "nhập kho" in prompt_lower or "inventory" in prompt_lower:
            return "Routing to Inventory app.", self.provider_override or force_provider or "deepseek"
        return "Direct AI Response.", self.provider_override or force_provider or "deepseek"

    def mock_run_agentic_loop(self, messages, tools_schema, tool_executor, **kwargs):
        if self.ai_fail:
            raise Exception("Mock AI Service Down")
        self.called_with.append({
            "type": "run_agentic_loop",
            "messages": messages,
            "tools_schema": tools_schema,
            "kwargs": kwargs
        })
        # Execute tool calls if any are registered
        for tool_name, args in self.tool_calls_to_simulate:
            tool_executor(tool_name, args)
        return self.response_override or "Agent process completed.", self.provider_override or kwargs.get("force_provider") or "deepseek"

@pytest.fixture
def test_env(monkeypatch, tmp_path):
    # Initialize simulator
    simulator = BotSimulator()
    
    # Initialize DB stub
    db_stub = SupabaseStub()
    monkeypatch.setattr("requests.get", db_stub.mock_requests_get)
    monkeypatch.setattr("requests.post", db_stub.mock_requests_post)
    monkeypatch.setattr("requests.patch", db_stub.mock_requests_patch)
    
    # Mock tools.execute_command to handle simulated python calls in-process
    import tools
    def mock_execute_command(command, on_line=None, cancellation_event=None):
        cmd = command.strip()
        if "create_accounting_invoice" in cmd:
            import core.db as db
            m = re.search(r"create_accounting_invoice\(\s*([\d\._]+)\s*,\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)", cmd)
            if m:
                amount = float(m.group(1).replace("_", ""))
                supplier = m.group(2)
                date = m.group(3)
                db.create_accounting_invoice(amount, supplier, date)
                return "Successfully created invoice."
        elif "create_leave_request" in cmd:
            import core.db as db
            m = re.search(r"create_leave_request\(\s*['\"]([^'\"]+)['\"]\s*,\s*([\d\._]+)\s*,\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)", cmd)
            if m:
                tid = m.group(1)
                days = float(m.group(2).replace("_", ""))
                date = m.group(3)
                reason = m.group(4)
                db.create_leave_request(tid, days, date, reason)
                return "Successfully created leave request."
        return "Command completed successfully with no output."
        
    monkeypatch.setattr(tools, "execute_command", mock_execute_command)
    
    # Initialize AI router stub
    ai_stub = MockAIRouter()
    import core.ai_router as ai_router
    monkeypatch.setattr(ai_router, "smart_generate", ai_stub.mock_smart_generate)
    monkeypatch.setattr(ai_router, "run_agentic_loop", ai_stub.mock_run_agentic_loop)
    
    # Mock individual provider methods in provider_registry to preserve fallback path logic
    registry = get_registry()
    
    def make_mock_health(name):
        return lambda: not ai_stub.ai_fail and (name != "ollama")
        
    def make_mock_generate(name):
        return lambda prompt, system=None, tools_schema=None: ai_stub.mock_smart_generate(
            prompt, system, None, tools_schema, force_provider=name
        )[0]
        
    for provider in registry._chain:
        monkeypatch.setattr(provider, "health_check", make_mock_health(provider.NAME))
        monkeypatch.setattr(provider, "generate", make_mock_generate(provider.NAME))
    
    # Patch mapping file path to be a clean temporary file per test
    tmp_mapping = tmp_path / "user_mapping.json"
    monkeypatch.setattr(auth_manager, "MAPPING_FILE", tmp_mapping)
    
    # Force settings config to be clean
    tmp_settings = tmp_path / "settings.json"
    # Create empty settings.json structure
    settings_data = {
        "apps": db_stub.apps,
        "fallback_order": ["deepseek", "gemini", "claude", "nvidia"]
    }
    tmp_settings.write_text(json.dumps(settings_data, indent=2), encoding="utf-8")
    
    import core.settings as settings
    monkeypatch.setattr(settings, "SETTINGS_FILE", tmp_settings)
    
    # Mock ALLOWED_USER_ID in main
    monkeypatch.setattr(main, "ALLOWED_USER_ID", "55555")
    
    # Clear active cancel events
    main._active_cancel_events.clear()
    # Reset PENDING_LOGINS
    main.PENDING_LOGINS.clear()
    main.LOGIN_ATTEMPTS.clear()
    
    # Reset UAT_ROLES
    main.UAT_ROLES.clear()
    
    # Mock session file
    tmp_sessions = tmp_path / "telegram_sessions.json"
    monkeypatch.setattr(main, "SESSION_FILE", tmp_sessions)
    if tmp_sessions.exists():
        tmp_sessions.unlink()
        
    yield simulator, db_stub, ai_stub
    
    simulator.uninstall()

def wait_until_idle(chat_id=12345, timeout=5):
    """Wait for process_agent_response thread to finish."""
    start = time.time()
    while time.time() - start < timeout:
        with main._cancel_events_lock:
            if chat_id not in main._active_cancel_events:
                return
        time.sleep(0.01)
    raise TimeoutError("Agent background thread did not complete in time.")
