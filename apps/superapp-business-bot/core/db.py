import os
import requests
import logging

logger = logging.getLogger("ATA.db")

# Load Supabase keys from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

def get_headers():
    return {
        "apikey": SUPABASE_KEY or "",
        "Authorization": f"Bearer {SUPABASE_KEY}" if SUPABASE_KEY else "",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def get_user_by_telegram_id(telegram_id: str):
    """Fetches user details and role from public.users using telegram_id."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Supabase config is missing from environment.")
        return None
    
    url = f"{SUPABASE_URL}/rest/v1/users?telegram_id=eq.{telegram_id}"
    try:
        res = requests.get(url, headers=get_headers(), timeout=10)
        if res.status_code == 200:
            users = res.json()
            if users:
                return users[0]
        else:
            logger.error(f"Failed to fetch user: {res.status_code} {res.text}")
    except Exception as e:
        logger.error(f"Error querying Supabase: {e}", exc_info=True)
    return None

def link_telegram_id(email: str, telegram_id: str) -> bool:
    """Links a user email in public.users to their Telegram ID."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    
    url = f"{SUPABASE_URL}/rest/v1/users?email=eq.{email}"
    try:
        # Patch the telegram_id
        res = requests.patch(url, json={"telegram_id": telegram_id}, headers=get_headers(), timeout=10)
        if res.status_code in [200, 201, 204]:
            return True
        logger.error(f"Failed to link Telegram ID: {res.status_code} {res.text}")
    except Exception as e:
        logger.error(f"Error linking Telegram ID: {e}", exc_info=True)
    return False

def get_users_list():
    """Lists all users who have registered telegram_ids."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    
    url = f"{SUPABASE_URL}/rest/v1/users?telegram_id=not.is.null"
    try:
        res = requests.get(url, headers=get_headers(), timeout=10)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        logger.error(f"Error listing users: {e}", exc_info=True)
    return []

# --- Business Workflows Inputs ---

def create_accounting_invoice(amount: float, supplier_name: str, invoice_date: str, status: str = "pending"):
    """Inserts a new accounting invoice into public.accounting_invoices."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    url = f"{SUPABASE_URL}/rest/v1/accounting_invoices"
    payload = {
        "amount": amount,
        "supplier_name": supplier_name,
        "invoice_date": invoice_date,
        "status": status
    }
    try:
        res = requests.post(url, json=payload, headers=get_headers(), timeout=10)
        if res.status_code in [200, 201]:
            return res.json()[0] if res.json() else True
    except Exception as e:
        logger.error(f"Error creating invoice: {e}", exc_info=True)
    return None

def create_leave_request(telegram_id: str, days: float, start_date: str, reason: str):
    """Creates a leave request for the employee associated with this telegram_id."""
    user = get_user_by_telegram_id(telegram_id)
    if not user:
        return None
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    
    url = f"{SUPABASE_URL}/rest/v1/leave_requests"
    payload = {
        "user_id": user.get("id"),
        "days": days,
        "start_date": start_date,
        "reason": reason,
        "status": "pending"
    }
    try:
        res = requests.post(url, json=payload, headers=get_headers(), timeout=10)
        if res.status_code in [200, 201]:
            return res.json()[0] if res.json() else True
    except Exception as e:
        logger.error(f"Error creating leave request: {e}", exc_info=True)
    return None

def create_sales_order(customer_phone: str, product_sku: str, quantity: int, discount: str = "0%"):
    """Creates a sales order inside public.sales_orders."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    
    url = f"{SUPABASE_URL}/rest/v1/sales_orders"
    payload = {
        "customer_phone": customer_phone,
        "product_sku": product_sku,
        "quantity": quantity,
        "discount": discount,
        "status": "pending"
    }
    try:
        res = requests.post(url, json=payload, headers=get_headers(), timeout=10)
        if res.status_code in [200, 201]:
            return res.json()[0] if res.json() else True
    except Exception as e:
        logger.error(f"Error creating sales order: {e}", exc_info=True)
    return None

def create_inventory_record(product_sku: str, quantity: int, location: str, record_type: str = "inbound"):
    """Creates a stock movement inside public.inventory_records."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    
    url = f"{SUPABASE_URL}/rest/v1/inventory_records"
    payload = {
        "product_sku": product_sku,
        "quantity": quantity,
        "location": location,
        "record_type": record_type
    }
    try:
        res = requests.post(url, json=payload, headers=get_headers(), timeout=10)
        if res.status_code in [200, 201]:
            return res.json()[0] if res.json() else True
    except Exception as e:
        logger.error(f"Error creating inventory record: {e}", exc_info=True)
    return None
