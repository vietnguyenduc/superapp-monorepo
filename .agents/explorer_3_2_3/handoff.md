# Milestone 3.2 Handoff Report: Authentication & DB Integration Refactoring

## 1. Observation
- In `apps/superapp-business-bot/core/db.py`, the function `get_user_by_email(email: str)` is currently implemented at lines 38-51:
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
- In `apps/superapp-business-bot/core/db.py`, the function `link_telegram_id(email: str, telegram_id: str)` is implemented at lines 53-67. However, the query URL parameter is structured as `email=eq.{email}` (without casing/whitespace normalization), which can lead to case-sensitivity mismatches during linking.
- Additionally, `db.py` initializes the authorization key using `SUPABASE_ANON_KEY` as follows:
  ```python
  SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")
  ```
  Row Level Security (RLS) policies defined on the `public.users` table (observed in `030_fix_users_rls_select.sql`) block anonymous users from querying or editing user profiles.
- In `apps/superapp-business-bot/core/auth_manager.py`, the user mapping is currently maintained locally using `config/user_mapping.json` via functions `load_user_mapping` and `save_user_mapping`. Role checks use a hardcoded `ENTERPRISE_MATRIX` dictionary inside `check_superapp_matrix(email: str)`.
- The OTP generation and verification in `auth_manager.py` (lines 61-96) use a local memory dictionary `OTP_CACHE` instead of relying on Supabase Auth.

## 2. Logic Chain
- To establish database-backed authentication and leverage Supabase Auth OTP verification, the hardcoded matrix and local JSON mapping in `auth_manager.py` must be replaced with queries to `public.users` via `core/db.py`.
- The bot backend needs to query and edit the database using administrative rights. To bypass RLS policies on `public.users` (which restrict normal users to selecting their own profiles), we should load `SUPABASE_SERVICE_ROLE_KEY` first, falling back to `SUPABASE_ANON_KEY`.
- Supabase Auth exposes `/auth/v1/otp` and `/auth/v1/verify` for passwordless login and verification. Using `requests`, we can issue POST calls to these endpoints.
- For OTP generation (`/auth/v1/otp`), we should pass the email and defensively configure `shouldCreateUser: true` to ensure that pre-seeded database users can seamlessly sign up in Supabase Auth if their auth account does not yet exist.
- For OTP verification (`/auth/v1/verify`), passing `type: "email"`, `email`, and `token` enables token verification. Upon success (HTTP 200), the bot then updates the database to associate the user's `telegram_id` with their email via `db.link_telegram_id(email, chat_id)`.
- To evaluate permissions dynamically: we check the user's role from the database. Non-staff roles are mapped to standard lists (e.g. `admin` has all permissions), and staff users' permissions are retrieved/merged from their `staff_permissions` JSONB column.

## 3. Caveats
- If the local testing environment does not have a live connection to a Supabase server, calling `/auth/v1/otp` and `/auth/v1/verify` will return HTTP errors. To prevent unit test breakages, a mocking layer or fallback to local OTP caching (like the existing `OTP_CACHE`) can be retained for test environments if needed.
- If `SUPABASE_SERVICE_ROLE_KEY` is missing in the environment, write/read operations on `public.users` might fail due to strict RLS policies on the database.

## 4. Conclusion
We propose the following code designs for implementation:

### Proposed Changes to `apps/superapp-business-bot/core/db.py`
1. Load `SUPABASE_SERVICE_ROLE_KEY` first:
   ```python
   # Load Supabase keys from environment (using service role key for administrative tasks)
   SUPABASE_URL = os.environ.get("SUPABASE_URL")
   SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
   ```
2. Normalize email parameter in `link_telegram_id`:
   ```python
   url = f"{SUPABASE_URL}/rest/v1/users?email=eq.{email.strip().lower()}"
   ```

### Proposed Changes to `apps/superapp-business-bot/core/auth_manager.py`
Rewrite `auth_manager.py` to integrate Supabase Auth REST endpoints and database queries:
```python
import os
import json
import logging
import requests
from pathlib import Path
from core import db

logger = logging.getLogger("ATA.auth")

MAPPING_FILE = Path(__file__).resolve().parents[1] / "config" / "user_mapping.json"
MAPPING_FILE.parent.mkdir(parents=True, exist_ok=True)

# Supabase configuration for Auth API
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

# Role to permission mapping helper
ROLE_PERMISSIONS_MAP = {
    "admin": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
    "admin_master": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
    "admin_company": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
    "accountant": ["accounting", "cashflow"],
    "hr_manager": ["hr"],
    "sales_agent": ["sales"],
    "warehouse_keeper": ["inventory"],
    "branch_manager": ["accounting", "cashflow", "sales", "inventory"]
}

def load_user_mapping() -> dict:
    if MAPPING_FILE.exists():
        try:
            return json.loads(MAPPING_FILE.read_text(encoding="utf-8"))
        except Exception as e:
            logger.error(f"Error reading user mapping: {e}")
    # Write empty mapping if not exists
    save_user_mapping({})
    return {}

def save_user_mapping(mapping: dict):
    try:
        MAPPING_FILE.write_text(json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        logger.error(f"Error saving user mapping: {e}")

def check_superapp_matrix(email: str) -> dict:
    """Queries the database to verify if user exists, is active, and fetches role and permissions."""
    email_clean = email.strip().lower()
    
    # Check database
    user = db.get_user_by_email(email_clean)
    if not user:
        logger.warning(f"User {email_clean} not found in database.")
        return None
        
    # Check status
    is_active = user.get("is_active", True)
    if not is_active or user.get("status") == "inactive":
        logger.warning(f"User {email_clean} is inactive.")
        return None
        
    role = user.get("role", "staff")
    
    # Determine permissions based on role
    permissions = list(ROLE_PERMISSIONS_MAP.get(role, []))
    
    # Merge granular staff_permissions if present
    staff_permissions = user.get("staff_permissions")
    if staff_permissions and isinstance(staff_permissions, dict):
        for module, allowed in staff_permissions.items():
            if allowed and module not in permissions:
                permissions.append(module)
                
    return {
        "id": user.get("id"),
        "email": email_clean,
        "role": role,
        "permissions": permissions,
        "is_active": is_active
    }

def generate_and_send_otp(email: str) -> bool:
    """Sends a passwordless OTP verification code to the user's email via Supabase Auth."""
    email_clean = email.strip().lower()
    
    # 1. Pre-verify that the user exists and is active in our database
    matrix_info = check_superapp_matrix(email_clean)
    if not matrix_info:
        logger.warning(f"Aborting OTP send: user {email_clean} does not exist or is inactive.")
        return False
        
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Supabase config is missing from environment.")
        return False
        
    url = f"{SUPABASE_URL}/auth/v1/otp"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    
    # Defensive payload to support diverse Supabase GoTrue setups
    payload = {
        "email": email_clean,
        "create_user": True,
        "options": {
            "shouldCreateUser": True
        }
    }
    
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        if res.status_code in [200, 201]:
            logger.info(f"Supabase Auth OTP sent successfully to {email_clean}")
            return True
        logger.error(f"Failed to send Supabase Auth OTP: {res.status_code} {res.text}")
    except Exception as e:
        logger.error(f"Error calling Supabase Auth OTP send: {e}", exc_info=True)
    return False

def verify_otp_and_link(chat_id: str, email: str, user_otp: str) -> dict:
    """Verifies the OTP token with Supabase Auth, check user status, and links the Telegram ID."""
    email_clean = email.strip().lower()
    
    # 1. Check user status in database
    matrix_info = check_superapp_matrix(email_clean)
    if not matrix_info:
        return {"success": False, "message": "Email doanh nghiệp không tồn tại hoặc tài khoản đã bị vô hiệu hóa."}
        
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"success": False, "message": "Cấu hình Supabase không khả dụng."}
        
    # 2. Call Supabase Auth to verify OTP
    url = f"{SUPABASE_URL}/auth/v1/verify"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "type": "email",
        "email": email_clean,
        "token": user_otp.strip()
    }
    
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        if res.status_code != 200:
            err_data = res.json()
            err_msg = err_data.get("error_description") or err_data.get("msg") or "Mã OTP không chính xác hoặc đã hết hạn."
            return {"success": False, "message": f"Xác thực thất bại: {err_msg}"}
            
        # 3. Link Telegram ID in the database
        link_success = db.link_telegram_id(email_clean, str(chat_id))
        if not link_success:
            return {"success": False, "message": "Không thể cập nhật liên kết Telegram ID vào cơ sở dữ liệu."}
            
        # 4. Save to local mapping for session cache / backward compatibility
        user_info = {
            "email": email_clean,
            "role": matrix_info["role"],
            "permissions": matrix_info["permissions"],
            "status": "verified"
        }
        
        try:
            mapping = load_user_mapping()
            mapping[str(chat_id)] = user_info
            save_user_mapping(mapping)
        except Exception as ex:
            logger.warning(f"Could not update local session mapping: {ex}")
            
        return {"success": True, "info": user_info}
        
    except Exception as e:
        logger.error(f"Error during Supabase Auth OTP verification: {e}", exc_info=True)
        return {"success": False, "message": f"Lỗi hệ thống trong quá trình xác thực: {str(e)}"}

def generate_and_send_phone_otp(phone: str) -> bool:
    """Sends a passwordless OTP SMS to the phone number via Supabase Auth."""
    phone_clean = phone.strip()
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Supabase config is missing from environment.")
        return False
        
    url = f"{SUPABASE_URL}/auth/v1/otp"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "phone": phone_clean,
        "create_user": True,
        "options": {
            "shouldCreateUser": True
        }
    }
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        if res.status_code in [200, 201]:
            logger.info(f"Supabase Auth Phone OTP sent successfully to {phone_clean}")
            return True
        logger.error(f"Failed to send Supabase Auth Phone OTP: {res.status_code} {res.text}")
    except Exception as e:
        logger.error(f"Error sending phone OTP: {e}", exc_info=True)
    return False

def verify_phone_otp_and_link(chat_id: str, phone: str, user_otp: str) -> dict:
    """Verifies phone OTP with Supabase Auth and maps the chat_id."""
    phone_clean = phone.strip()
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"success": False, "message": "Cấu hình Supabase không khả dụng."}
        
    url = f"{SUPABASE_URL}/auth/v1/verify"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "type": "sms",
        "phone": phone_clean,
        "token": user_otp.strip()
    }
    
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        if res.status_code != 200:
            err_data = res.json()
            err_msg = err_data.get("error_description") or err_data.get("msg") or "Mã OTP không chính xác hoặc đã hết hạn."
            return {"success": False, "message": f"Xác thực thất bại: {err_msg}"}
            
        # For phone/SMS fallback, default to Trial Admin or lookup from database users by phone
        user_info = {
            "phone": phone_clean,
            "email": f"trial_{phone_clean.replace('+', '')}@superapp.com",
            "role": "admin",
            "permissions": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
            "status": "verified",
            "type": "trial"
        }
        
        try:
            mapping = load_user_mapping()
            mapping[str(chat_id)] = user_info
            save_user_mapping(mapping)
        except Exception as ex:
            logger.warning(f"Could not update local session mapping: {ex}")
            
        return {"success": True, "info": user_info}
    except Exception as e:
        logger.error(f"Error during phone OTP verification: {e}", exc_info=True)
        return {"success": False, "message": f"Lỗi hệ thống: {str(e)}"}
```

## 5. Verification Method
- **Command Line**: Run onboarding test suite to verify the mock/stub environment functionality:
  ```bash
  pytest apps/superapp-business-bot/tests/test_e2e_r1_onboarding.py
  ```
- **Files to Inspect**:
  - `apps/superapp-business-bot/core/db.py`
  - `apps/superapp-business-bot/core/auth_manager.py`
- **Invalidation Conditions**: If Supabase credentials are missing or the API returns HTTP 4xx/5xx errors when real credentials are provided.
