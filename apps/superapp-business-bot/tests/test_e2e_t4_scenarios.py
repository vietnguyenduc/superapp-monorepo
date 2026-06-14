import json
import pytest
import main
import core.settings as settings
from pathlib import Path
from tests.conftest import wait_until_idle

# 45. test_t4_employee_full_onboarding_and_invoice
def test_t4_employee_full_onboarding_and_invoice(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # 1. Employee starts bot & logins
    simulator.send_user_message("/login director@superapp.com", chat_id=12345, user_id=12345)
    otp = main.PENDING_LOGINS[12345]["otp"]
    simulator.send_user_message(f"/verify {otp}", chat_id=12345, user_id=12345)
    
    # Admin approves
    admin_msg = [msg for msg in simulator.captured if msg.chat_id == 55555][-1]
    simulator.send_user_callback("approve_12345", message=admin_msg, user_id=55555)
    
    # 2. Lists apps
    simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    assert any("Vibe-Gate Switchboard" in msg.text for msg in simulator.captured)
    
    # 3. Simulate tool calling sequence to create invoice
    # Register tool call to execute command that creates an invoice
    ai_stub.tool_calls_to_simulate = [
        ("execute_command", {"command": "python -c \"import core.db as db; db.create_accounting_invoice(15000000, 'supplierA', '2026-06-15')\""})
    ]
    
    simulator.send_user_message("Tạo hóa đơn 15 triệu từ nhà cung cấp supplierA ngày 2026-06-15", chat_id=12345, user_id=12345)
    wait_until_idle(12345)
    
    # Verify invoice was created in DB stub
    assert len(db_stub.invoices) == 1
    assert db_stub.invoices[0]["amount"] == 15000000
    assert db_stub.invoices[0]["supplier_name"] == "supplierA"

# 46. test_t4_trial_user_exploration_limit
def test_t4_trial_user_exploration_limit(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # 1. Guest login via phone OTP -> trial role
    import core.auth_manager as auth_manager
    phone = "+84999999999"
    otp = auth_manager.generate_and_send_phone_otp(phone)
    auth_manager.verify_phone_otp_and_link("99999", phone, otp)
    
    # 2. View walkthrough
    simulator.send_user_message("/walkthrough", chat_id=99999, user_id=99999)
    assert any("HƯỚNG DẪN TỪNG BƯỚC CHO THÀNH VIÊN MỚI" in msg.text for msg in simulator.captured)
    
    # 3. Tries admin command (/run dir) -> Blocked
    simulator.send_user_message("/run dir", chat_id=99999, user_id=99999)
    assert simulator.captured[-1].text == "⛔ Access Denied."
    
    # 4. Asks for contact/pricing (handled via /apps in trial mode or general text)
    simulator.send_user_message("/apps", chat_id=99999, user_id=99999)
    reply = simulator.captured[-1]
    assert "trial-limited" in reply.text
    assert "0901234567" in reply.text

# 47. test_t4_revoked_credentials_mid_session
def test_t4_revoked_credentials_mid_session(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # 1. Active user logins
    simulator.send_user_message("/login director@superapp.com", chat_id=12345, user_id=12345)
    otp = main.PENDING_LOGINS[12345]["otp"]
    simulator.send_user_message(f"/verify {otp}", chat_id=12345, user_id=12345)
    admin_msg = [msg for msg in simulator.captured if msg.chat_id == 55555][-1]
    simulator.send_user_callback("approve_12345", message=admin_msg, user_id=55555)
    
    # 2. Runs settings successfully
    simulator.send_user_message("/settings", chat_id=12345, user_id=12345)
    assert "SETTINGS" in simulator.captured[-1].text
    
    # 3. Disable user in DB stub
    db_stub.users["director@superapp.com"]["status"] = "inactive"
    
    # 4. Next command immediately blocked
    simulator.send_user_message("/settings", chat_id=12345, user_id=12345)
    assert "YÊU CẦU LIÊN KẾT TÀI KHOẢN" in simulator.captured[-1].text

# 48. test_t4_admin_dynamic_url_update_and_use
def test_t4_admin_dynamic_url_update_and_use(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    # 1. switch_app:accounting initial URL
    msg = simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    simulator.send_user_callback("switch_app:accounting", message=msg, user_id=12345)
    assert "https://accounting.example.com" in simulator.captured[-1].text
    
    # 2. Update company app URL in settings
    s = settings.load_settings()
    s["apps"][0]["production_url"] = "https://new-accounting.vercel.app"
    settings.save_settings(s)
    
    # 3. switch_app:accounting again, should use new URL
    msg2 = simulator.send_user_message("/apps", chat_id=12345, user_id=12345)
    simulator.send_user_callback("switch_app:accounting", message=msg2, user_id=12345)
    assert "https://new-accounting.vercel.app" in simulator.captured[-1].text

# 49. test_t4_ingestion_and_cleaning_pipeline
def test_t4_ingestion_and_cleaning_pipeline(test_env):
    simulator, db_stub, ai_stub = test_env
    main.UAT_ROLES[12345] = "admin"
    
    csv_content = b"employee_id,full_name,salary\n101,John Doe,15000\n102,Jane Smith,20000"
    
    # 1. Upload CSV document
    simulator.send_user_document("sales.csv", csv_content, chat_id=12345, user_id=12345)
    
    # Verify file saved and acknowledged
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "sales.csv" in reply.text
    assert "tải lên thành công" in reply.text.lower()
