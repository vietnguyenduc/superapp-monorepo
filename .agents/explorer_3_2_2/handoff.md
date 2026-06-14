# Handoff Report — Milestone 3.2 Code Refactoring Design

## 1. Observation
- **Analyzed Files**:
  - `apps/superapp-business-bot/core/db.py` (lines 8-15, 38-51, 53-67)
  - `apps/superapp-business-bot/core/auth_manager.py` (lines 39-58, 61-96)
  - `apps/superapp-business-bot/tests/conftest.py` (lines 17-19, 209-276)
  - `supabase/migrations/030_fix_users_rls_select.sql` (lines 22-24: `CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid()::uuid = id);`)
  - `supabase/migrations/038_add_telegram_otp_and_apps.sql` (lines 5-11: adding columns `telegram_id`, `is_active`, `staff_permissions`, etc. to `public.users`)

- **Current Implementation of `get_user_by_email` in `core/db.py`**:
  ```python
  def get_user_by_email(email: str):
      """Fetches user details from public.users using email."""
      if not SUPABASE_URL or not SUPABASE_KEY:
          return None
      url = f"{SUPABASE_URL}/rest/v1/users?email=eq.{email.strip().lower()}"
      try:
          res = requests.get(url, headers=get_headers(), timeout=10)
          if res.status_code == 200:
              users = res.json()
              if users:
                  return users[0]
      except Exception as e:
          logger.error(f"Error querying user by email: {e}", exc_info=True)
      return None
  ```

- **Current Implementation of Mock Verification in `core/auth_manager.py`**:
  ```python
  def check_superapp_matrix(email: str) -> dict:
      """Mock verification endpoint mapping corporate directory roles and permissions."""
      email_clean = email.strip().lower()
      ...
      ENTERPRISE_MATRIX = { ... }
      return ENTERPRISE_MATRIX.get(email_clean)
  ```

## 2. Logic Chain
- **Step 1 (RLS and Credentials)**: Row Level Security (RLS) is enabled on `public.users` via `030_fix_users_rls_select.sql`. Under standard `SUPABASE_ANON_KEY`, queries like `db.get_user_by_email` return an empty array if not authenticated. Therefore, the backend business bot must utilize `SUPABASE_SERVICE_ROLE_KEY` if available to query user details and link Telegram IDs. We must update key loading in `core/db.py` and `core/auth_manager.py` to prioritize `SUPABASE_SERVICE_ROLE_KEY` over `SUPABASE_ANON_KEY`.
- **Step 2 (Database-backed Status and Permissions)**: Instead of the mock `check_superapp_matrix`, we must query the database. The user's status must be verified (checking both `is_active is False` and `status == "inactive"`). The permissions must be loaded by mapping their role to the standard `ROLE_PERMISSIONS` and merging custom privileges from the `staff_permissions` JSONB column.
- **Step 3 (Supabase Auth REST OTP calls)**: We must construct HTTP `POST` requests using the `requests` library to:
  - `/auth/v1/otp`: Payload `{ "email": email, "create_user": False }` (checks existence first, triggers OTP delivery).
  - `/auth/v1/verify`: Payload `{ "type": "magiclink", "email": email, "token": token }` with a fallback attempt on type `"email"` to handle varied GoTrue configurations.
- **Step 4 (Verifying and Linking)**: `verify_otp_and_link` must be refactored to verify the OTP against Supabase, check the user's status and permissions in the database, link the Telegram ID via a DB update, and save the session cache.

## 3. Caveats
- **Service Role Key Dependency**: Without `SUPABASE_SERVICE_ROLE_KEY` set in the environment, anonymous access might fail to fetch user rows before verification due to RLS. The deployment checklist must require setting `SUPABASE_SERVICE_ROLE_KEY`.
- **Test Suite Stubbing**: The `SupabaseStub` in `tests/conftest.py` currently mocks REST queries but does not handle GoTrue endpoints `/auth/v1/otp` and `/auth/v1/verify`. Once `auth_manager.py` is updated, the test environment stub must be modified to mock these endpoints, or tests like `test_e2e_r1_onboarding.py` will fail with 404/connection errors.

## 4. Conclusion
We propose the following code modifications:

### A. Modifications in `apps/superapp-business-bot/core/db.py`

#### Before (Lines 8-9):
```python
# Load Supabase keys from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")
```

#### After:
```python
# Load Supabase keys from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL")
# Prefer service role key to bypass RLS for bot backend operations, fallback to anon key
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
```

---

### B. Modifications in `apps/superapp-business-bot/core/auth_manager.py`

#### Before (Lines 1-6):
```python
import os
import json
import random
import logging
import requests
from pathlib import Path
```

#### After:
```python
import os
import json
import random
import logging
import requests
from pathlib import Path
import core.db as db  # To query and update database
```

#### Additions/Updates:
Add the following functions and configurations to `core/auth_manager.py`:

```python
SUPABASE_URL = os.environ.get("SUPABASE_URL")
# Use service role key if available to bypass RLS, fallback to anon key
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

def check_user_status_and_permissions(email: str) -> dict:
    """
    Queries public.users database to verify if user is active,
    and returns their role and merged permissions.
    """
    email_clean = email.strip().lower()
    
    ROLE_PERMISSIONS = {
        "admin": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
        "admin_master": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
        "admin_company": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
        "accountant": ["accounting", "cashflow"],
        "hr_manager": ["hr"],
        "sales_agent": ["sales"],
        "warehouse_keeper": ["inventory"],
        "staff": []
    }
    
    user = db.get_user_by_email(email_clean)
    if not user:
        logger.warning(f"User not found in database: {email_clean}")
        return {
            "success": False,
            "message": "Email doanh nghiệp không tồn tại trong cấu trúc thư mục SuperApp."
        }
        
    # Check if user is active
    is_active = user.get("is_active", True)
    status = user.get("status")
    if is_active is False or status == "inactive":
        logger.warning(f"User is inactive: {email_clean}")
        return {
            "success": False,
            "message": "Tài khoản của bạn đã bị vô hiệu hóa hoặc chưa được kích hoạt."
        }
        
    role = user.get("role", "staff")
    permissions = list(ROLE_PERMISSIONS.get(role, []))
    
    # Merge custom permissions from staff_permissions JSONB field in database
    staff_perms = user.get("staff_permissions") or {}
    if isinstance(staff_perms, dict):
        allowed = staff_perms.get("allowed_modules", [])
        if isinstance(allowed, list):
            permissions = list(set(permissions + allowed))
        else:
            for module, allowed_val in staff_perms.items():
                if allowed_val is True and module not in permissions:
                    permissions.append(module)
    elif isinstance(staff_perms, list):
        permissions = list(set(permissions + staff_perms))
        
    return {
        "success": True,
        "role": role,
        "permissions": permissions,
        "company_id": user.get("company_id"),
        "user_id": user.get("id")
    }

def check_superapp_matrix(email: str) -> dict:
    """Wrapper around database-backed validation for backward compatibility."""
    res = check_user_status_and_permissions(email)
    if res.get("success"):
        return {
            "role": res["role"],
            "permissions": res["permissions"]
        }
    return None

def send_supabase_otp(email: str) -> dict:
    """
    Triggers Supabase Auth OTP delivery.
    Endpoint: POST /auth/v1/otp
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"success": False, "message": "Cấu hình Supabase chưa được cài đặt."}
        
    url = f"{SUPABASE_URL}/auth/v1/otp"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "email": email.strip().lower(),
        "create_user": False
    }
    
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        if res.status_code == 200:
            return {"success": True, "message": "Mã OTP đã được gửi thành công."}
        else:
            try:
                err_json = res.json()
                msg = err_json.get("error_description") or err_json.get("msg") or err_json.get("error") or res.text
            except Exception:
                msg = res.text
            logger.error(f"Supabase Auth OTP send failed: {res.status_code} - {msg}")
            return {"success": False, "message": f"Gửi OTP thất bại: {msg}"}
    except Exception as e:
        logger.error(f"Error calling Supabase Auth OTP send: {e}", exc_info=True)
        return {"success": False, "message": f"Lỗi kết nối Supabase Auth: {str(e)}"}

def verify_supabase_otp(email: str, token: str) -> dict:
    """
    Verifies the OTP token against Supabase Auth API.
    Endpoint: POST /auth/v1/verify
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"success": False, "message": "Cấu hình Supabase chưa được cài đặt."}
        
    url = f"{SUPABASE_URL}/auth/v1/verify"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    
    # Try magiclink first
    payload = {
        "type": "magiclink",
        "email": email.strip().lower(),
        "token": token.strip()
    }
    
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        if res.status_code == 200:
            return {"success": True, "session": res.json()}
            
        # Fallback to type 'email'
        payload["type"] = "email"
        res2 = requests.post(url, headers=headers, json=payload, timeout=10)
        if res2.status_code == 200:
            return {"success": True, "session": res2.json()}
            
        try:
            err_json = res2.json()
            msg = err_json.get("error_description") or err_json.get("msg") or err_json.get("error") or res2.text
        except Exception:
            msg = res2.text
        logger.error(f"Supabase Auth OTP verify failed: {res2.status_code} - {msg}")
        return {"success": False, "message": f"Xác thực OTP thất bại: {msg}"}
    except Exception as e:
        logger.error(f"Error calling Supabase Auth OTP verify: {e}", exc_info=True)
        return {"success": False, "message": f"Lỗi kết nối Supabase Auth: {str(e)}"}

def initiate_email_otp_flow(email: str) -> dict:
    """
    Initiates the full onboarding flow by checking status first,
    then sending the OTP via Supabase Auth.
    """
    email_clean = email.strip().lower()
    
    # Check DB status first to prevent sending OTP to unregistered / inactive emails
    status_res = check_user_status_and_permissions(email_clean)
    if not status_res.get("success"):
        return status_res
        
    return send_supabase_otp(email_clean)

def verify_otp_and_link(chat_id: str, email: str, user_otp: str) -> dict:
    """Matches user input, verifies via Supabase, and establishes the authentication link if correct."""
    email_clean = email.strip().lower()
    
    # 1. Verify OTP with Supabase
    verify_res = verify_supabase_otp(email_clean, user_otp)
    if not verify_res.get("success"):
        return {"success": False, "message": verify_res.get("message", "Mã OTP không chính xác hoặc đã hết hạn.")}
        
    # 2. Get status and permissions from DB
    matrix_info = check_user_status_and_permissions(email_clean)
    if not matrix_info.get("success"):
        return {"success": False, "message": matrix_info.get("message", "Email doanh nghiệp không hợp lệ hoặc đã bị khóa.")}
        
    # 3. Link Telegram ID in the database
    link_success = db.link_telegram_id(email_clean, str(chat_id))
    if not link_success:
        return {"success": False, "message": "Lỗi hệ thống: Không thể liên kết Telegram ID vào database."}
        
    # 4. Save pairing mapping details locally for quick session checks
    mapping = load_user_mapping()
    mapping[str(chat_id)] = {
        "email": email_clean,
        "role": matrix_info["role"],
        "permissions": matrix_info["permissions"],
        "status": "verified"
    }
    save_user_mapping(mapping)
    
    return {"success": True, "info": mapping[str(chat_id)]}
```

## 5. Verification Method

### A. Test Execution
Verify implementation using `pytest` inside the bot root directory:
```powershell
# Run the entire test suite to ensure no regressions
pytest apps/superapp-business-bot/tests/

# Run onboarding and role tests specifically
pytest apps/superapp-business-bot/tests/test_e2e_r1_onboarding.py
pytest apps/superapp-business-bot/tests/test_e2e_r2_roles.py
```

### B. Required Changes to Test Stubs
To verify code changes without running into 404 errors during testing, update `SupabaseStub.mock_requests_post` inside `apps/superapp-business-bot/tests/conftest.py` to support auth endpoints:
```python
    def mock_requests_post(self, url, json=None, headers=None, timeout=None):
        if self.db_fail:
            raise Exception("Mock Database Failure")
        url_lower = url.lower()
        
        # Mock Supabase Auth OTP Send
        if "/auth/v1/otp" in url_lower:
            email = json.get("email")
            matching_users = [u for u in self.users.values() if u["email"].lower().strip() == email.lower().strip()]
            if not matching_users:
                return MockResponse({"error": "user_not_found", "msg": "User not found"}, 400)
            return MockResponse({}, 200)
            
        # Mock Supabase Auth OTP Verify
        elif "/auth/v1/verify" in url_lower:
            email = json.get("email")
            token = json.get("token")
            # In test conftest simulation, we check if token matches the mocked OTP or a dummy success code
            # We can retrieve from main.PENDING_LOGINS or just allow any token for simplified tests
            return MockResponse({"access_token": "mock_token_123", "user": {"email": email}}, 200)

        # Existing route mocks
        elif "/rest/v1/accounting_invoices" in url_lower:
            self.invoices.append(json)
            return MockResponse([json], 201)
        ...
```
