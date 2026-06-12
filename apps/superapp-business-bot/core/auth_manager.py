import os
import json
import random
import logging
import requests
from pathlib import Path

logger = logging.getLogger("ATA.auth")

MAPPING_FILE = Path(__file__).resolve().parents[1] / "config" / "user_mapping.json"
MAPPING_FILE.parent.mkdir(parents=True, exist_ok=True)

# Temporary memory cache to store dynamic OTP codes
OTP_CACHE = {}

# eSMS.vn Configurations
ESMS_API_KEY = os.environ.get("ESMS_API_KEY", "")
ESMS_SECRET_KEY = os.environ.get("ESMS_SECRET_KEY", "")
ESMS_BRANDNAME = os.environ.get("ESMS_BRANDNAME", "Qc")
ESMS_SMS_TYPE = os.environ.get("ESMS_SMS_TYPE", "2") # 2 = OTP, 8 = Fixed number, etc.


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
    """Mock verification endpoint mapping corporate directory roles and permissions."""
    email_clean = email.strip().lower()
    
    # Predefined SuperApp Enterprise Directory roles and permitted sub-modules
    ENTERPRISE_MATRIX = {
        "vietnguyenduccp@gmail.com": {"role": "admin", "permissions": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"]},
        "director@superapp.com": {"role": "admin", "permissions": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"]},
        "trial@superapp.com": {"role": "admin", "permissions": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"]},
        "accountant@superapp.com": {"role": "accountant", "permissions": ["accounting", "cashflow"]},
        "hr@superapp.com": {"role": "hr_manager", "permissions": ["hr"]},
        "sales@superapp.com": {"role": "sales_agent", "permissions": ["sales"]},
        "warehouse@superapp.com": {"role": "warehouse_keeper", "permissions": ["inventory"]}
    }
    
    # Dynamic Trial fallback
    if email_clean in ["trial", "trainghiem", "guest"]:
        return {"role": "admin", "permissions": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"]}
        
    return ENTERPRISE_MATRIX.get(email_clean)


def generate_and_send_otp(email: str) -> str:
    """Generates a secure 6-digit OTP code and caches it."""
    otp = f"{random.randint(100000, 999999)}"
    OTP_CACHE[email.strip().lower()] = {
        "otp": otp,
        "timestamp": random.random() # mock timestamp
    }
    # In enterprise production, here you connect to SendGrid / AWS SES.
    # For local validation ease, we print directly to the logger console.
    logger.info(f"[MOCK MAIL SERVER] OTP Verification Code for {email}: {otp}")
    print(f"\n[MOCK MAIL SERVER] OTP Verification Code for {email}: {otp}\n")
    return otp

def verify_otp_and_link(chat_id: str, email: str, user_otp: str) -> dict:
    """Matches user input and establishes the authentication link if correct."""
    email_clean = email.strip().lower()
    cached = OTP_CACHE.get(email_clean)
    
    if not cached or cached["otp"] != user_otp.strip():
        return {"success": False, "message": "Mã OTP không chính xác hoặc đã hết hạn."}
        
    matrix_info = check_superapp_matrix(email_clean)
    if not matrix_info:
        return {"success": False, "message": "Email doanh nghiệp không tồn tại trong cấu trúc thư mục SuperApp."}
        
    # Save pairing mapping details
    mapping = load_user_mapping()
    mapping[str(chat_id)] = {
        "email": email_clean,
        "role": matrix_info["role"],
        "permissions": matrix_info["permissions"],
        "status": "verified"
    }
    save_user_mapping(mapping)
    OTP_CACHE.pop(email_clean, None) # Clear OTP
    return {"success": True, "info": mapping[str(chat_id)]}

def generate_and_send_phone_otp(phone: str) -> str:
    """Generates a secure 6-digit SMS OTP code for a phone number and transmits via eSMS.vn if configured."""
    otp = f"{random.randint(100000, 999999)}"
    phone_clean = phone.strip()
    
    OTP_CACHE[phone_clean] = {
        "otp": otp,
        "timestamp": random.random()
    }
    
    sms_content = f"Ma OTP xac thuc SuperApp cua ban la {otp}. Vui long khong chia se ma nay voi ai."
    
    if ESMS_API_KEY and ESMS_SECRET_KEY:
        logger.info(f"Sending real SMS OTP to {phone_clean} via eSMS.vn...")
        url = "http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json"
        
        # eSMS expects phone numbers without the '+' sign
        formatted_phone = phone_clean.replace("+", "")
        
        payload = {
            "ApiKey": ESMS_API_KEY,
            "SecretKey": ESMS_SECRET_KEY,
            "Phone": formatted_phone,
            "Content": sms_content,
            "Brandname": ESMS_BRANDNAME,
            "SmsType": int(ESMS_SMS_TYPE),
            "IsUnicode": 0
        }
        
        try:
            res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15)
            if res.status_code == 200:
                response_json = res.json()
                code_result = response_json.get("CodeResult")
                if code_result == "100" or str(code_result) == "100":
                    logger.info(f"eSMS.vn Success: SMS sent successfully to {phone_clean}. SMS ID: {response_json.get('SMSID')}")
                else:
                    logger.error(f"eSMS.vn Error Code: {code_result} - {response_json.get('ErrorMessage')}")
            else:
                logger.error(f"eSMS.vn HTTP Connection Failed: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Failed to communicate with eSMS.vn gateway: {e}", exc_info=True)
            
    logger.info(f"[SIMULATION SANDBOX] Verification OTP for {phone_clean}: {otp}")
    print(f"\n[SIMULATION SANDBOX] Verification OTP for {phone_clean}: {otp}\n")
    return otp

def verify_phone_otp_and_link(chat_id: str, phone: str, user_otp: str) -> dict:
    """Verifies phone OTP and maps the chat_id to a Trial Admin account."""
    phone_clean = phone.strip()
    cached = OTP_CACHE.get(phone_clean)
    
    if not cached or cached["otp"] != user_otp.strip():
        return {"success": False, "message": "Mã OTP không chính xác hoặc đã hết hạn."}
        
    mapping = load_user_mapping()
    mapping[str(chat_id)] = {
        "phone": phone_clean,
        "email": f"trial_{phone_clean}@superapp.com",
        "role": "admin",
        "permissions": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
        "status": "verified",
        "type": "trial"
    }
    save_user_mapping(mapping)
    OTP_CACHE.pop(phone_clean, None)
    return {"success": True, "info": mapping[str(chat_id)]}

