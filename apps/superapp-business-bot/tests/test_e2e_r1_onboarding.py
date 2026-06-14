import time
import pytest
import main
from tests.conftest import wait_until_idle

# 1. test_r1_start_onboarding
def test_r1_start_onboarding(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # User is not logged in / not admin, so /start should ask them to link/inform them about admin linking
    simulator.send_user_message("/start", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    welcome_msg = simulator.captured[-1]
    assert "YÊU CẦU LIÊN KẾT TÀI KHOẢN DEVELOPER" in welcome_msg.text or "chưa được phân quyền" in welcome_msg.text

# 2. test_r1_login_prompt
def test_r1_login_prompt(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # /login without email should prompt for syntax
    simulator.send_user_message("/login", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Cú pháp: `/login <email_trong_supabase>`" in reply.text

# 3. test_r1_valid_email_otp_sent
def test_r1_valid_email_otp_sent(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Send login command with valid admin email
    simulator.send_user_message("/login director@superapp.com", chat_id=12345, user_id=12345)
    
    # Verify OTP sent messages
    texts = [msg.text for msg in simulator.captured]
    assert any("Đang gửi mã OTP qua email..." in t for t in texts)
    assert any("Đã gửi mã OTP 6 số" in t for t in texts)
    assert 12345 in main.PENDING_LOGINS

# 4. test_r1_otp_verification_success
def test_r1_otp_verification_success(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # 1. Trigger OTP send
    simulator.send_user_message("/login director@superapp.com", chat_id=12345, user_id=12345)
    otp = main.PENDING_LOGINS[12345]["otp"]
    
    # 2. Verify OTP
    simulator.send_user_message(f"/verify {otp}", chat_id=12345, user_id=12345)
    
    # Should say email verification success, waiting for admin approval
    texts = [msg.text for msg in simulator.captured]
    assert any("Xác thực email thành công! Đang chờ Admin chính phê duyệt..." in t for t in texts)
    
    # Find the approval message sent to primary admin (55555)
    admin_msgs = [msg for msg in simulator.captured if msg.chat_id == 55555]
    assert len(admin_msgs) > 0
    admin_msg = admin_msgs[-1]
    assert "YÊU CẦU ĐĂNG NHẬP MỚI" in admin_msg.text
    
    # 3. Simulate Primary Admin approving via callback query
    simulator.send_user_callback(f"approve_12345", message=admin_msg, user_id=55555)
    
    # Verify user mapping is updated & session is saved & user is notified
    assert db_stub.users["director@superapp.com"]["telegram_id"] == "12345"
    user_notif = [msg.text for msg in simulator.captured if msg.chat_id == 12345]
    assert any("Chúc mừng! Yêu cầu của bạn đã được phê duyệt." in t for t in user_notif)

# 5. test_r1_multiple_logins
def test_r1_multiple_logins(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Authenticate User 1
    simulator.send_user_message("/login director@superapp.com", chat_id=11111, user_id=11111)
    otp1 = main.PENDING_LOGINS[11111]["otp"]
    simulator.send_user_message(f"/verify {otp1}", chat_id=11111, user_id=11111)
    admin_msg1 = [msg for msg in simulator.captured if msg.chat_id == 55555][-1]
    simulator.send_user_callback("approve_11111", message=admin_msg1, user_id=55555)
    
    # Authenticate User 2
    simulator.send_user_message("/login trial@superapp.com", chat_id=22222, user_id=22222)
    otp2 = main.PENDING_LOGINS[22222]["otp"]
    simulator.send_user_message(f"/verify {otp2}", chat_id=22222, user_id=22222)
    admin_msg2 = [msg for msg in simulator.captured if msg.chat_id == 55555][-1]
    simulator.send_user_callback("approve_22222", message=admin_msg2, user_id=55555)
    
    assert db_stub.users["director@superapp.com"]["telegram_id"] == "11111"
    assert db_stub.users["trial@superapp.com"]["telegram_id"] == "22222"

# 6. test_r1_invalid_email_format
def test_r1_invalid_email_format(test_env):
    simulator, db_stub, ai_stub = test_env
    
    simulator.send_user_message("/login invalid_email", chat_id=12345, user_id=12345)
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Email không tồn tại hoặc không có quyền truy cập." in reply.text
    
    simulator.send_user_message("/login @@gmail.com", chat_id=12345, user_id=12345)
    reply = simulator.captured[-1]
    assert "Email không tồn tại hoặc không có quyền truy cập." in reply.text

# 7. test_r1_unknown_email
def test_r1_unknown_email(test_env):
    simulator, db_stub, ai_stub = test_env
    
    simulator.send_user_message("/login stranger@superapp.com", chat_id=12345, user_id=12345)
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Email không tồn tại hoặc không có quyền truy cập." in reply.text

# 8. test_r1_incorrect_otp
def test_r1_incorrect_otp(test_env):
    simulator, db_stub, ai_stub = test_env
    
    simulator.send_user_message("/login director@superapp.com", chat_id=12345, user_id=12345)
    simulator.send_user_message("/verify 999999", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Mã OTP không chính xác." in reply.text

# 9. test_r1_expired_otp
def test_r1_expired_otp(test_env):
    simulator, db_stub, ai_stub = test_env
    
    simulator.send_user_message("/login director@superapp.com", chat_id=12345, user_id=12345)
    otp = main.PENDING_LOGINS[12345]["otp"]
    
    # Mock expiration
    main.PENDING_LOGINS[12345]["expires_at"] = time.time() - 10
    
    simulator.send_user_message(f"/verify {otp}", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Mã OTP đã hết hạn." in reply.text
    assert 12345 not in main.PENDING_LOGINS

# 10. test_r1_otp_max_attempts
def test_r1_otp_max_attempts(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Call login 5 times
    for i in range(5):
        simulator.send_user_message("/login director@superapp.com", chat_id=12345, user_id=12345)
        
    # The 6th time must be blocked by rate limit
    simulator.send_user_message("/login director@superapp.com", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "yêu cầu OTP quá nhiều lần" in reply.text
