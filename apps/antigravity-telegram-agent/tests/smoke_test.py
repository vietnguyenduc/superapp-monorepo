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
os.environ.setdefault("DEVIN_API_KEY", "fake")

def test_imports():
    """Test tat ca module import OK"""
    try:
        from core import ai_router
        from core import session_manager
        print("OK: core imports")
    except ImportError as e:
        print(f"FAIL: {e}")
        return False
    return True

def test_config_exists():
    """Test config files ton tai"""
    config_dir = os.path.join(os.path.dirname(__file__), "..", "config")
    if os.path.isdir(config_dir):
        print(f"OK: config dir exists at {config_dir}")
        return True
    else:
        print(f"FAIL: config dir not found at {config_dir}")
        return False

def test_main_syntax():
    """Test main.py compiles OK"""
    main_path = os.path.join(os.path.dirname(__file__), "..", "main.py")
    try:
        with open(main_path, "r", encoding="utf-8") as f:
            source = f.read()
        compile(source, main_path, "exec")
        print("OK: main.py syntax valid")
        return True
    except SyntaxError as e:
        print(f"FAIL: main.py syntax error: {e}")
        return False

if __name__ == "__main__":
    results = [test_imports(), test_config_exists(), test_main_syntax()]
    if all(results):
        print("\nALL SMOKE TESTS PASSED")
        sys.exit(0)
    else:
        print("\nSOME TESTS FAILED")
        sys.exit(1)
