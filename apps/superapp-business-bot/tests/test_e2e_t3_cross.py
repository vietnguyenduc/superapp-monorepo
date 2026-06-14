import pytest
import main
import core.settings as settings
from tests.conftest import wait_until_idle

# 41. test_t3_login_role_app_sync
def test_t3_login_role_app_sync(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # 1. User performs onboarding login
    simulator.send_user_message("/login accountant@superapp.com", chat_id=12345, user_id=12345)
    otp = main.PENDING_LOGINS[12345]["otp"]
    simulator.send_user_message(f"/verify {otp}", chat_id=12345, user_id=12345)
    
    admin_msg = [msg for msg in simulator.captured if msg.chat_id == 55555][-1]
    simulator.send_user_callback("approve_12345", message=admin_msg, user_id=55555)
    
    # 2. Run /apps command
    simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    
    # 3. Verify they only see accountant permitted apps (accounting)
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Vibe-Gate Switchboard" in reply.text
    buttons = reply.reply_markup.keyboard
    flat_btns = [btn for row in buttons for btn in row]
    assert len(flat_btns) == 1
    assert flat_btns[0].text == "📁 accounting (React)"

# 42. test_t3_free_text_auth_interruption
def test_t3_free_text_auth_interruption(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # 1. User is not logged in, sends free-text "tạo hóa đơn"
    simulator.send_user_message("Tạo hóa đơn 15 triệu", chat_id=12345, user_id=12345)
    wait_until_idle(12345)
    
    # Verify they get the link/auth warning prompt
    assert len(simulator.captured) > 0
    reply1 = simulator.captured[-1]
    assert "YÊU CẦU LIÊN KẾT TÀI KHOẢN" in reply1.text
    
    # 2. Authenticate user
    simulator.send_user_message("/login director@superapp.com", chat_id=12345, user_id=12345)
    otp = main.PENDING_LOGINS[12345]["otp"]
    simulator.send_user_message(f"/verify {otp}", chat_id=12345, user_id=12345)
    admin_msg = [msg for msg in simulator.captured if msg.chat_id == 55555][-1]
    simulator.send_user_callback("approve_12345", message=admin_msg, user_id=55555)
    
    # 3. Try again, should succeed and route to accounting
    simulator.send_user_message("Tạo hóa đơn 15 triệu", chat_id=12345, user_id=12345)
    wait_until_idle(12345)
    
    texts = [msg.text for msg in simulator.captured]
    assert any("Routing to Accounting app" in t for t in texts)

# 43. test_t3_settings_change_app_effect
def test_t3_settings_change_app_effect(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    # 1. Check apps keyboard
    simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    reply1 = simulator.captured[-1]
    flat_btns1 = [btn for row in reply1.reply_markup.keyboard for btn in row]
    assert len(flat_btns1) == 4
    
    # 2. Modify settings dynamically to remove hr app
    s = settings.load_settings()
    s["apps"] = [app for app in s["apps"] if app["name"] != "hr"]
    settings.save_settings(s)
    
    # 3. Check apps keyboard again, hr should be gone instantly
    simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    reply2 = simulator.captured[-1]
    flat_btns2 = [btn for row in reply2.reply_markup.keyboard for btn in row]
    assert len(flat_btns2) == 3
    assert not any("hr" in btn.text for btn in flat_btns2)

# 44. test_t3_ai_route_permission_gate
def test_t3_ai_route_permission_gate(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Log in as HR Manager
    simulator.send_user_message("/login hr@superapp.com", chat_id=12345, user_id=12345)
    otp = main.PENDING_LOGINS[12345]["otp"]
    simulator.send_user_message(f"/verify {otp}", chat_id=12345, user_id=12345)
    admin_msg = [msg for msg in simulator.captured if msg.chat_id == 55555][-1]
    simulator.send_user_callback("approve_12345", message=admin_msg, user_id=55555)
    
    # Clear captured
    simulator.clear()
    
    # HR manager tries to route to Accounting ("tạo hóa đơn")
    simulator.send_user_message("Tôi muốn tạo hóa đơn", chat_id=12345, user_id=12345)
    wait_until_idle(12345)
    
    # Should get blocked by permission gate
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Bạn không có quyền truy cập phân hệ" in reply.text
    assert "ACCOUNTING" in reply.text
