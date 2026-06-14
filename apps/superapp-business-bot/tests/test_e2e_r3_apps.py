import json
import pytest
import main
from pathlib import Path
from tests.conftest import wait_until_idle

# 21. test_r3_apps_list
def test_r3_apps_list(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    # Send /apps command
    simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Vibe-Gate Switchboard" in reply.text
    assert reply.reply_markup is not None
    # Verify inline keyboard has buttons for apps
    buttons = reply.reply_markup.keyboard
    # Flatten buttons
    flat_btns = [btn for row in buttons for btn in row]
    assert len(flat_btns) == 4
    assert flat_btns[0].text == "📁 accounting (React)"
    assert flat_btns[0].callback_data == "switch_app:accounting"

# 22. test_r3_app_button_click
def test_r3_app_button_click(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    # 1. Run /apps to get inline keyboard message
    msg = simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    
    # 2. Click switch_app:accounting
    simulator.send_user_callback("switch_app:accounting", message=msg, user_id=12345)
    
    # Check that it switches focus and returns the URL info
    assert len(simulator.captured) > 0
    edit_msg = simulator.captured[-1]
    assert edit_msg.action_type == "edit_message_text"
    assert "ĐÃ CHUYỂN TIÊU ĐIỂM DỰ ÁN THÀNH CÔNG" in edit_msg.text
    assert "accounting" in edit_msg.text.lower()
    
    # Check that active_project.json is updated
    state_file = Path(main.__file__).parent / "active_project.json"
    assert state_file.exists()
    state = json.loads(state_file.read_text(encoding="utf-8"))
    assert state["active_project"] == "accounting"

# 23. test_r3_multiple_apps_display
def test_r3_multiple_apps_display(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    # Update settings to have only 2 apps
    import core.settings as settings
    s = settings.load_settings()
    s["apps"] = [
        {"name": "accounting", "path": "apps/accounting", "port": 3001, "tech": "React"},
        {"name": "hr", "path": "apps/hr", "port": 3003, "tech": "React"}
    ]
    settings.save_settings(s)
    
    # Trigger /apps
    simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    
    reply = simulator.captured[-1]
    flat_btns = [btn for row in reply.reply_markup.keyboard for btn in row]
    assert len(flat_btns) == 2
    assert flat_btns[0].text == "📁 accounting (React)"
    assert flat_btns[1].text == "📁 hr (React)"

# 24. test_r3_company_app_separation
def test_r3_company_app_separation(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Setup company apps in settings
    import core.settings as settings
    s = settings.load_settings()
    s["apps"] = [
        {"name": "accounting", "path": "apps/accounting", "port": 3001, "tech": "React", "company": "Company A"},
        {"name": "sales", "path": "apps/sales", "port": 3002, "tech": "React", "company": "Company B"}
    ]
    settings.save_settings(s)
    
    # 1. Company A user
    db_stub.users["userA"] = {"id": "ua", "email": "a@compA.com", "role": "admin", "telegram_id": "111", "company": "Company A"}
    main.save_session("111", "a@compA.com")
    simulator.send_user_message("/apps", chat_id=111, user_id=111)
    replyA = simulator.captured[-1]
    flat_btnsA = [btn for row in replyA.reply_markup.keyboard for btn in row]
    assert len(flat_btnsA) == 1
    assert flat_btnsA[0].text == "📁 accounting (React)"
    
    # 2. Company B user
    db_stub.users["userB"] = {"id": "ub", "email": "b@compB.com", "role": "admin", "telegram_id": "222", "company": "Company B"}
    main.save_session("222", "b@compB.com")
    simulator.send_user_message("/apps", chat_id=222, user_id=222)
    replyB = simulator.captured[-1]
    flat_btnsB = [btn for row in replyB.reply_markup.keyboard for btn in row]
    assert len(flat_btnsB) == 1
    assert flat_btnsB[0].text == "📁 sales (React)"

# 25. test_r3_walkthrough_flow
def test_r3_walkthrough_flow(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    # Send /walkthrough or /tutorial
    simulator.send_user_message("/walkthrough", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "HƯỚNG DẪN TỪNG BƯỚC CHO THÀNH VIÊN MỚI" in reply.text
    assert "Bước 1" in reply.text
    assert "Bước 2" in reply.text
    assert "Bước 3" in reply.text

# 26. test_r3_no_apps_configured
def test_r3_no_apps_configured(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    # Setup empty apps in settings
    import core.settings as settings
    s = settings.load_settings()
    s["apps"] = []
    settings.save_settings(s)
    
    simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "No applications mapped" in reply.text

# 27. test_r3_malformed_app_url
def test_r3_malformed_app_url(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    # Update settings to have app with malformed URL (e.g. empty or invalid scheme)
    import core.settings as settings
    s = settings.load_settings()
    s["apps"] = [
        {"name": "accounting", "path": "apps/accounting", "port": 3001, "tech": "React", "production_url": "invalid-url"}
    ]
    settings.save_settings(s)
    
    msg = simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    simulator.send_user_callback("switch_app:accounting", message=msg, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "URL Production cấu hình không hợp lệ." in reply.text

# 28. test_r3_unauthenticated_apps_access
def test_r3_unauthenticated_apps_access(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Unlogged user runs /apps
    simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "YÊU CẦU LIÊN KẾT TÀI KHOẢN" in reply.text

# 29. test_r3_apps_db_query_failure
def test_r3_apps_db_query_failure(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    # Mock settings.json loading to raise an exception
    import core.settings as settings
    orig_load = settings.load_settings
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setattr(settings, "load_settings", lambda: Exception("Failed to read settings"))
    
    try:
        simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    finally:
        monkeypatch.undo()
        
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    # Handled gracefully, returns error warning
    assert "No applications mapped" in reply.text or "Không có ứng dụng" in reply.text

# 30. test_r3_stale_callback_query
def test_r3_stale_callback_query(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    # Simulate old stale callback ID execution
    msg = simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    # sending arbitrary data callback
    simulator.send_user_callback("switch_app:unknown_app", message=msg, user_id=12345)
    
    # Stale callback query query ignored or reported safely
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Không tìm thấy thông tin App" in reply.text or "answer_callback_query" in reply.action_type
