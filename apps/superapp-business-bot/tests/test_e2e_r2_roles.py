import json
import pytest
import main
import core.auth_manager as auth_manager
from tests.conftest import wait_until_idle

# 11. test_r2_trial_user_onboarding
def test_r2_trial_user_onboarding(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Generate and verify OTP via phone
    phone = "+84901234567"
    otp = auth_manager.generate_and_send_phone_otp(phone)
    res = auth_manager.verify_phone_otp_and_link("98765", phone, otp)
    
    assert res["success"] is True
    assert res["info"]["role"] == "admin"
    assert res["info"]["type"] == "trial"

# 12. test_r2_trial_user_apps
def test_r2_trial_user_apps(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Set role to trial in UAT roles override
    main.UAT_ROLES[98765] = "trial"
    
    simulator.send_user_message("/apps", chat_id=98765, user_id=98765)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "TÀI KHỎN TRẢI NGHIỆM" in reply.text or "TÀI KHOẢN TRẢI NGHIỆM" in reply.text
    assert "trial-limited" in reply.text

# 13. test_r2_company_member_welcome
def test_r2_company_member_welcome(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Associate user in Supabase
    db_stub.users["accountant_corp"] = {
        "id": "u7",
        "email": "member@acme.com",
        "role": "accountant",
        "telegram_id": "11112",
        "status": "active",
        "company_name": "Acme Industries"
    }
    
    simulator.send_user_message("/start", chat_id=11112, user_id=11112)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Acme Industries" in reply.text
    assert "ACCOUNTANT" in reply.text

# 14. test_r2_admin_settings
def test_r2_admin_settings(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Admin role has settings access
    main.UAT_ROLES[12345] = "admin"
    
    simulator.send_user_message("/settings", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "SETTINGS" in reply.text

# 15. test_r2_non_admin_settings_denied
def test_r2_non_admin_settings_denied(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Non-admin (staff/member/accountant) role gets denied
    main.UAT_ROLES[12345] = "accountant"
    
    simulator.send_user_message("/settings", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "QUYỀN TRUY CẬP BỊ TỪ CHỐI" in reply.text or "Access Denied" in reply.text

# 16. test_r2_trial_session_expiration
def test_r2_trial_session_expiration(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Register session
    main.save_session("12345", "director@superapp.com")
    
    # Verify they have role
    assert main.get_user_role(12345) == "admin"
    
    # Now simulate expiration by corrupting/modifying the session file
    with open(main.SESSION_FILE, "r+", encoding="utf-8") as f:
        data = json.load(f)
        data["12345"]["expires_at"] = time.time() - 3600
        f.seek(0)
        json.dump(data, f)
        f.truncate()
        
    # User role is now None (session expired)
    assert main.get_user_role(12345) is None

# 17. test_r2_dynamic_role_update
def test_r2_dynamic_role_update(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Create user in db_stub
    db_stub.users["dynamic@superapp.com"] = {
        "id": "dyn1",
        "email": "dynamic@superapp.com",
        "role": "accountant",
        "telegram_id": "88888",
        "status": "active"
    }
    
    # Session needs to be valid
    main.save_session("88888", "dynamic@superapp.com")
    
    # 1. Run settings as accountant -> denied
    simulator.send_user_message("/settings", chat_id=88888, user_id=88888)
    assert "QUYỀN TRUY CẬP BỊ TỪ CHỐI" in simulator.captured[-1].text or "Access Denied" in simulator.captured[-1].text
    
    # 2. Update role to admin in DB stub
    db_stub.users["dynamic@superapp.com"]["role"] = "admin"
    
    # 3. Run settings again -> allowed!
    simulator.send_user_message("/settings", chat_id=88888, user_id=88888)
    assert "SETTINGS" in simulator.captured[-1].text

# 18. test_r2_inactive_user_blocked
def test_r2_inactive_user_blocked(test_env):
    simulator, db_stub, ai_stub = test_env
    
    db_stub.users["inactive@superapp.com"] = {
        "id": "in1",
        "email": "inactive@superapp.com",
        "role": "admin",
        "telegram_id": "77777",
        "status": "inactive"
    }
    
    main.save_session("77777", "inactive@superapp.com")
    
    # Should get welcome message prompt for linking because role resolved to None
    simulator.send_user_message("/start", chat_id=77777, user_id=77777)
    assert "YÊU CẦU LIÊN KẾT TÀI KHOẢN" in simulator.captured[-1].text

# 19. test_r2_unauthorized_command_execution
def test_r2_unauthorized_command_execution(test_env):
    simulator, db_stub, ai_stub = test_env
    
    main.UAT_ROLES[12345] = "hr_manager" # Only HR
    
    # HR manager tries to run awake (which is restricted to admins)
    simulator.send_user_message("/awake", chat_id=12345, user_id=12345)
    
    assert len(simulator.captured) > 0
    reply = simulator.captured[-1]
    assert "Access Denied" in reply.text

# 20. test_r2_multiple_overlapping_roles
def test_r2_multiple_overlapping_roles(test_env):
    simulator, db_stub, ai_stub = test_env
    
    # Set user role to overlapping roles
    main.UAT_ROLES[12345] = "accountant, hr_manager"
    
    # Check permissions interceptor directly or via command check
    # Check accountant module permission (accounting)
    msg = type('MockMsg', (object,), {"from_user": type('User', (object,), {"id": 12345})()})()
    
    assert main.check_rbac_permission(msg, "accounting") is True
    assert main.check_rbac_permission(msg, "hr") is True
    assert main.check_rbac_permission(msg, "sales") is False # not permitted
