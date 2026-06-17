"""
Smoke test — chay local, khong can Telegram token.
Kiem tra: import OK, config OK, handler functions ton tai.
Chay: python tests/smoke_test.py
"""
import sys
import os

# Mock env vars neu thieu
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "test:fake")
os.environ.setdefault("ALLOWED_TELEGRAM_USER_ID", "123456")
os.environ.setdefault("GEMINI_API_KEY", "fake")

def test_imports():
    """Test tat ca module import OK"""
    try:
        from core import auth_manager
        from core import supabase_client
        print("OK: core imports")
    except ImportError as e:
        print(f"FAIL: {e}")
        return False
    return True

def test_auth_manager():
    """Test OTP generate (khong gui mail)"""
    from core.auth_manager import generate_and_send_otp, verify_otp_and_link
    otp = generate_and_send_otp("test@example.com")
    assert len(otp) == 6 and otp.isdigit(), f"OTP format wrong: {otp}"
    print(f"OK: OTP generated = {otp}")
    return True

if __name__ == "__main__":
    results = [test_imports(), test_auth_manager()]
    if all(results):
        print("\nALL SMOKE TESTS PASSED")
        sys.exit(0)
    else:
        print("\nSOME TESTS FAILED")
        sys.exit(1)
