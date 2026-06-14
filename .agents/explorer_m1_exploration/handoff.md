# explorer_m1 Investigation Handoff Report

## 1. Observation

### Codebase Layout and Config
- The directory `apps/superapp-business-bot` has the following structures:
  - `core/db.py`: Database query functions.
  - `core/auth_manager.py`: Role-permission matrix definition and session verification.
  - `core/ai_router.py`: AI task classification, model routing, and agentic tool loop.
  - `main.py`: Telegram Bot event handling and command routing.
  - `tests/`: Contains `test_cleaning_scenarios.py`, `test_export_csv.py`, and `test_ingestion_scenarios.py`.
  - `test_data/`: Contains Excel and CSV files `dirty_hr.xlsx` and `clean_sales.csv`.
- In `apps/superapp-business-bot/.env`, the Supabase project configuration is:
  ```env
  SUPABASE_URL=https://peslmsctejmvkwzyohke.supabase.co
  SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### Database Schema Structure (Migrations)
- `supabase/migrations/001_initial_schema.sql` (lines 29-37) defines the users table:
  ```sql
  CREATE TABLE public.users (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      role user_role DEFAULT 'staff',
      branch_id UUID REFERENCES public.branches(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- `supabase/migrations/005_multi_level_admin_schema.sql` (lines 45-51) adds columns to `public.users`:
  ```sql
  ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS staff_permissions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  ```
- No SQL migration files contain columns `telegram_id`, `otp_code`, `otp_expires_at`, `otp_attempts`, `is_trial`, or `trial_ends_at`.
- There is no table named `apps` or `applications` in any SQL migration file.

### Tests
- Tests under `tests/` are written as standalone executable Python scripts:
  ```python
  if __name__ == "__main__":
      main()
  ```
- No testing framework (like `pytest`) is declared in `requirements.txt`.

### Identified Gaps / Code Defects
- `main.py` line 204 calls:
  ```python
  user = db.get_user_by_email(email)
  ```
  However, `core/db.py` does not define `get_user_by_email`. This will cause a `NameError` or `AttributeError` if `/login` is called.
- `core/auth_manager.py` (lines 44-52) uses a hardcoded dictionary `ENTERPRISE_MATRIX` for role checks:
  ```python
  ENTERPRISE_MATRIX = {
      "vietnguyenduccp@gmail.com": {"role": "admin", "permissions": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"]},
      "director@superapp.com": {"role": "admin", "permissions": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"]},
      ...
  }
  ```
- OTP matching (`OTP_CACHE`) and user pairings are saved to a local configuration file `user_mapping.json` (lines 10-38) instead of database tables, which prevents persistent state sync across bot scale-outs.

---

## 2. Logic Chain

1. **Gaps in Schema**:
   - `core/db.py` executes query calls targeting `telegram_id` in `public.users`. However, the root SQL migration files do not contain definitions or alterations for adding `telegram_id` to `public.users`.
   - Therefore, a migration must be created to add `telegram_id` and other columns (`otp_code`, `otp_expires_at`, `otp_attempts`, `is_trial`, `trial_ends_at`) to the table `public.users`.
2. **Support for Dynamic App URLs**:
   - Multiple modules (accounting, cashflow, etc.) require URLs that vary by tenant (company) and environment (production vs local development ngrok tunnels).
   - Storing these URLs in a configuration file violates multi-tenant dynamic separation.
   - Therefore, a new `public.apps` table linked to `public.companies(id)` is required to map companies to their respective active module URLs.
3. **Defect in `main.py` / `core/db.py`**:
   - `/login` command in `main.py` attempts to fetch user data by calling `db.get_user_by_email(email)`.
   - Since this function is absent in `core/db.py`, the `/login` workflow will crash.
   - Therefore, we must implement `get_user_by_email(email)` in `core/db.py`.
4. **Hardcoded Role Matrix**:
   - `core/auth_manager.py` checks roles/permissions via a hardcoded memory map `ENTERPRISE_MATRIX`.
   - This must be replaced with Supabase database queries fetching the user's role and permissions directly from `public.users`.
5. **AI Router Integration**:
   - `core/ai_router.py` coordinates model routing and executing workspace tools.
   - To make the LLM context-aware of the dynamic app URLs when performing tasks, `run_agentic_loop` should read the logged-in user's app URLs and prepend them to the system prompt.

---

## 3. Caveats

- We assumed that live DB schemas on Supabase might differ from the local migrations directory (i.e. some columns or tables could have been added via the Supabase Dashboard UI manually). However, since we are in `CODE_ONLY` network mode, we cannot query the external Supabase instance to verify this. Our recommendations are strictly based on the code analysis and migrations found in the repository.

---

## 4. Conclusion

We recommend applying the following modifications and database migrations:

### Proposed DB Schema Additions

#### A. Migration: Add columns to `public.users`
```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
```

#### B. Migration: Create `public.apps` table
```sql
CREATE TABLE public.apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'accounting', 'sales', 'inventory'
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_company_app UNIQUE (company_id, name)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- Allow company members to read their own app URLs
CREATE POLICY "Users can view their own company's apps" ON public.apps
FOR SELECT USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Allow Admin Master to manage all app URLs
CREATE POLICY "Admin Master can manage all apps" ON public.apps
FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master'));

-- Allow Admin Company to manage their own company's app URLs
CREATE POLICY "Admin Company can manage their own apps" ON public.apps
FOR ALL USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid() AND role = 'admin_company'));
```

### Proposed Code Modifications

#### 1. `apps/superapp-business-bot/core/db.py`
Add functions to fetch users by email, update/verify OTP in the DB, and get dynamic app URLs:
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

def save_email_otp(email: str, otp: str, expires_in_seconds: int = 300) -> bool:
    """Updates the user's OTP code, expiration, and resets attempts in Supabase."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    from datetime import datetime, timedelta, timezone
    expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)).isoformat()
    url = f"{SUPABASE_URL}/rest/v1/users?email=eq.{email.strip().lower()}"
    payload = {
        "otp_code": otp,
        "otp_expires_at": expires_at,
        "otp_attempts": 0
    }
    try:
        res = requests.patch(url, json=payload, headers=get_headers(), timeout=10)
        return res.status_code in [200, 201, 204]
    except Exception as e:
        logger.error(f"Error saving email OTP: {e}", exc_info=True)
        return False

def get_app_url(company_id: str, app_name: str) -> str:
    """Fetches dynamic app URL from public.apps."""
    if not SUPABASE_URL or not SUPABASE_KEY or not company_id:
        return None
    url = f"{SUPABASE_URL}/rest/v1/apps?company_id=eq.{company_id}&name=eq.{app_name}"
    try:
        res = requests.get(url, headers=get_headers(), timeout=10)
        if res.status_code == 200:
            apps = res.json()
            if apps:
                return apps[0].get("url")
    except Exception as e:
        logger.error(f"Error querying app URL: {e}", exc_info=True)
    return None
```

#### 2. `apps/superapp-business-bot/core/auth_manager.py`
Update `check_superapp_matrix` to fetch dynamic configuration:
```python
def check_superapp_matrix(email: str) -> dict:
    """Queries user database to determine role and permissions."""
    import core.db as db
    user = db.get_user_by_email(email)
    if not user:
        return None
    
    # Map roles to permissions dynamically or use permissions field
    permissions = []
    role = user.get("role", "staff")
    if role in ["admin", "admin_master", "admin_company"]:
        permissions = ["accounting", "cashflow", "hr", "sales", "inventory", "admin"]
    elif role == "accountant":
        permissions = ["accounting", "cashflow"]
    elif role == "hr_manager":
        permissions = ["hr"]
    elif role == "sales_agent":
        permissions = ["sales"]
    elif role == "warehouse_keeper":
        permissions = ["inventory"]
        
    return {
        "role": role,
        "permissions": permissions,
        "company_id": user.get("company_id"),
        "is_trial": user.get("is_trial", False)
    }
```
Update OTP check functions (`verify_otp_and_link`) to fetch `otp_code` and `otp_expires_at` from `public.users` rather than referencing `OTP_CACHE`.

#### 3. `apps/superapp-business-bot/main.py`
- Modify `handle_login`: replace the local memory `PENDING_LOGINS` assignment with `db.save_email_otp(email, otp)`.
- Modify `handle_verify` and `handle_approval_callback`: verify OTP status by querying the database (`otp_code`, `otp_expires_at` expiration, increment `otp_attempts` on failure), and update the user's `telegram_id` using `db.link_telegram_id` upon verification approval.
- Modify the command handlers that invoke external resources (e.g. scrapers, system automation) to query dynamic URLs using `db.get_app_url(company_id, app_name)`.

#### 4. `apps/superapp-business-bot/core/ai_router.py`
In `run_agentic_loop`, query the user's company specific URLs from `public.apps` (passed down in execution context) and inject them dynamically into the first system prompt message:
```python
# Inside run_agentic_loop
if app_urls_context:
    system_msg = messages[0]["content"]
    messages[0]["content"] = system_msg + f"\n\nDynamic App URLs for this session:\n{app_urls_context}"
```

---

## 5. Verification Method

To verify these changes:
1. **Database Schema Setup**:
   Create a test Supabase migration containing the schema changes above, and apply it locally:
   ```bash
   npx supabase db reset
   ```
2. **Execute Existing Test Suite**:
   Run the existing testing scripts to ensure no regressions:
   ```bash
   python tests/test_ingestion_scenarios.py
   python tests/test_cleaning_scenarios.py
   python tests/test_export_csv.py
   ```
3. **Verification of Login Logic**:
   Write a new integration test script `tests/test_auth_flow.py` which mocks a user record in `public.users` (with email, company, and role), invokes `get_user_by_email` and `save_email_otp`, and validates that:
   - OTP code is correctly saved to the user's record in Supabase.
   - OTP expires correctly after the expiration timestamp.
   - User role permissions match the enterprise matrix dynamically.
   - Dynamic URL is correctly returned by calling `get_app_url`.
