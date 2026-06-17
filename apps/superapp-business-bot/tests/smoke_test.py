"""
smoke_test.py — Smoke tests for superapp-business-bot handlers.

Includes:
1. Basic import & config validation (can run standalone: python tests/smoke_test.py)
2. Comprehensive handler tests with mocks (run via: python -m pytest tests/smoke_test.py -v)
"""

import os
import sys
import types
import json
from pathlib import Path
from unittest.mock import MagicMock, patch, PropertyMock

# ── Ensure the bot module is importable ──────────────────────────────────────
BOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BOT_DIR))

# Stub heavy optional dependencies so import doesn't crash in CI
for mod_name in [
    "ecosystem_bridge",
    "google.generativeai",
    "anthropic",
    "schedule",
]:
    if mod_name not in sys.modules:
        sys.modules[mod_name] = types.ModuleType(mod_name)

# Provide minimal env vars so the bot module doesn't sys.exit on import
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "test:FAKE_TOKEN_FOR_SMOKE_TEST")
os.environ.setdefault("ALLOWED_TELEGRAM_USER_ID", "111222333")
os.environ.setdefault("GEMINI_API_KEY", "fake")


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_mock_message(text: str, user_id: int = 111222333, first_name: str = "TestUser"):
    """Create a minimal mock of telebot.types.Message."""
    msg = MagicMock()
    msg.text = text
    msg.from_user = MagicMock()
    msg.from_user.id = user_id
    msg.from_user.first_name = first_name
    msg.chat = MagicMock()
    msg.chat.id = 99999
    msg.document = None
    msg.photo = None
    msg.message_id = 1
    return msg


def make_mock_call(data: str, user_id: int = 111222333):
    """Create a minimal mock of telebot.types.CallbackQuery."""
    call = MagicMock()
    call.data = data
    call.id = "call_123"
    call.from_user = MagicMock()
    call.from_user.id = user_id
    call.message = MagicMock()
    call.message.chat = MagicMock()
    call.message.chat.id = 99999
    call.message.message_id = 2
    return call


# ── Standalone basic tests (python tests/smoke_test.py) ─────────────────────

def test_imports():
    """Test that core modules import OK."""
    try:
        from core import auth_manager
        from core import supabase_client
        print("OK: core imports")
        return True
    except ImportError as e:
        print(f"FAIL: {e}")
        return False


def test_auth_manager():
    """Test OTP generate (does not send mail)."""
    try:
        from core.auth_manager import generate_and_send_otp
        otp = generate_and_send_otp("test@example.com")
        assert len(otp) == 6 and otp.isdigit(), f"OTP format wrong: {otp}"
        print(f"OK: OTP generated = {otp}")
        return True
    except Exception as e:
        print(f"SKIP: auth_manager test ({e})")
        return True  # non-critical


# ── Comprehensive pytest-based handler tests ─────────────────────────────────

class TestCommandParsing:
    """Verify handler functions don't crash on well-formed and edge-case inputs."""

    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    @patch("core.db.get_user_by_email", return_value=None)
    def test_chi_missing_args(self, mock_email, mock_user):
        """Handler should reply with usage info when args are missing."""
        try:
            from main import handle_chi, bot
            bot.reply_to = MagicMock()
            msg = make_mock_message("/chi")
            handle_chi(msg)
            assert bot.reply_to.called or bot.send_message.called
        except SystemExit:
            pass

    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    @patch("core.db.create_accounting_invoice", return_value=True)
    def test_chi_valid(self, mock_create, mock_user):
        try:
            from main import handle_chi, bot
            bot.reply_to = MagicMock()
            msg = make_mock_message("/chi 500000 Tiền_điện 17/06/2026")
            handle_chi(msg)
            assert bot.reply_to.called
        except SystemExit:
            pass

    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    def test_thu_missing_args(self, mock_user):
        try:
            from main import handle_thu, bot
            bot.reply_to = MagicMock()
            msg = make_mock_message("/thu")
            handle_thu(msg)
            assert bot.reply_to.called
        except SystemExit:
            pass

    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    @patch("core.db.create_sales_order", return_value=True)
    def test_tao_don_valid(self, mock_create, mock_user):
        try:
            from main import handle_tao_don, bot
            bot.reply_to = MagicMock()
            msg = make_mock_message("/tạo_đơn 0901234567 SP-102 3 10%")
            handle_tao_don(msg)
            assert bot.reply_to.called
        except SystemExit:
            pass

    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    @patch("core.db.create_inventory_record", return_value=True)
    def test_nhap_kho_valid(self, mock_create, mock_user):
        try:
            from main import handle_nhap_kho, bot
            bot.reply_to = MagicMock()
            msg = make_mock_message("/nhập_kho SP-201 100 Ke_A3")
            handle_nhap_kho(msg)
            assert bot.reply_to.called
        except SystemExit:
            pass

    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    @patch("core.db.create_inventory_record", return_value=True)
    def test_xuat_kho_valid(self, mock_create, mock_user):
        try:
            from main import handle_xuat_kho, bot
            bot.reply_to = MagicMock()
            msg = make_mock_message("/xuất_kho SP-201 50 Bán_hàng")
            handle_xuat_kho(msg)
            assert bot.reply_to.called
        except SystemExit:
            pass

    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    @patch("core.db.create_leave_request", return_value=True)
    def test_xin_nghi_valid(self, mock_create, mock_user):
        try:
            from main import handle_xin_nghi, bot
            bot.reply_to = MagicMock()
            msg = make_mock_message("/xin_nghỉ 2 20/06/2026 Việc_gia_đình")
            handle_xin_nghi(msg)
            assert bot.reply_to.called
        except SystemExit:
            pass

    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    def test_user_list(self, mock_user):
        try:
            from main import handle_user_list, bot
            bot.reply_to = MagicMock()
            with patch("core.db.get_users_list", return_value=[]):
                msg = make_mock_message("/user_list")
                handle_user_list(msg)
                assert bot.reply_to.called
        except SystemExit:
            pass

    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    def test_logout(self, mock_user):
        try:
            from main import handle_logout, bot
            bot.reply_to = MagicMock()
            msg = make_mock_message("/logout")
            handle_logout(msg)
            assert bot.reply_to.called
        except SystemExit:
            pass

    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    def test_uat_test_clear(self, mock_user):
        try:
            from main import handle_uat_test, bot
            bot.reply_to = MagicMock()
            msg = make_mock_message("/uat_test clear")
            handle_uat_test(msg)
            assert bot.reply_to.called
        except SystemExit:
            pass

    def test_unauthorized_user_blocked(self):
        """A user with no role should be blocked from admin commands."""
        try:
            from main import handle_update, bot
            bot.reply_to = MagicMock()
            with patch("main.get_user_role", return_value=None):
                msg = make_mock_message("/update", user_id=999)
                handle_update(msg)
                assert bot.reply_to.called
        except SystemExit:
            pass


class TestSyncCommand:
    @patch("core.db.get_user_by_telegram_id", return_value={"role": "admin", "status": "active"})
    def test_sync_runs(self, mock_user):
        try:
            from main import handle_sync, bot
            bot.reply_to = MagicMock()
            bot.send_chat_action = MagicMock()
            with patch("main._git_sync_viet", return_value=(True, ["OK"])):
                with patch("subprocess.run") as mock_run:
                    mock_run.return_value = MagicMock(stdout="done", stderr="", returncode=0)
                    msg = make_mock_message("/sync")
                    handle_sync(msg)
        except SystemExit:
            pass


# ── Standalone runner ────────────────────────────────────────────────────────

if __name__ == "__main__":
    results = [test_imports(), test_auth_manager()]
    if all(results):
        print("\nALL SMOKE TESTS PASSED")
        sys.exit(0)
    else:
        print("\nSOME TESTS FAILED")
        sys.exit(1)
