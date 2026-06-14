## 2026-06-15T01:28:13Z
You are worker_3_2, a teamwork worker agent.
Your working directory is: c:\Vibecoding\superapp-monorepo\.agents\worker_3_2
Your task is to refactor `apps/superapp-business-bot/core/db.py` and `apps/superapp-business-bot/core/auth_manager.py` for Milestone 3.2.

Follow these instructions exactly:
1. Modify `apps/superapp-business-bot/core/db.py`:
   - Update `SUPABASE_KEY` configuration to check `SUPABASE_SERVICE_ROLE_KEY` first, falling back to `SUPABASE_ANON_KEY`.
   - Implement `get_user_by_email(email: str) -> dict`:
     Query the REST API for `public.users` matching `email` (strip and lower the input first).
     ```python
     def get_user_by_email(email: str):
         """Fetches user details from public.users using email."""
         if not SUPABASE_URL or not SUPABASE_KEY:
             logger.error("Supabase config is missing from environment.")
             return None
         url = f"{SUPABASE_URL}/rest/v1/users?email=eq.{email.strip().lower()}"
         try:
             res = requests.get(url, headers=get_headers(), timeout=10)
             if res.status_code == 200:
                 users = res.json()
                 if users:
                     return users[0]
             else:
                 logger.error(f"Failed to fetch user by email: {res.status_code} {res.text}")
         except Exception as e:
             logger.error(f"Error querying user by email: {e}", exc_info=True)
         return None
     ```
   - Update `link_telegram_id(email: str, telegram_id: str) -> bool`:
     Ensure the query filters by `email.strip().lower()`.
     Before patching, perform an idempotent step to clear the target `telegram_id` from any existing users to prevent DB unique key constraint violations:
     ```python
     # Clear existing mapping for this telegram_id
     clear_url = f"{SUPABASE_URL}/rest/v1/users?telegram_id=eq.{telegram_id}"
     try:
         requests.patch(clear_url, json={"telegram_id": None}, headers=get_headers(), timeout=10)
     except Exception as e:
         logger.warning(f"Failed to clear existing telegram_id mapping: {e}")
     ```

2. Modify `apps/superapp-business-bot/core/auth_manager.py`:
   - Keep the public function interfaces and signatures identical to prevent regressions.
   - Update keys to use service role key first:
     ```python
     SUPABASE_URL = os.environ.get("SUPABASE_URL")
     SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
     ```
   - Implement `check_superapp_matrix(email: str) -> dict`:
     Query the database via `db.get_user_by_email(email)`. Verify the user exists and is active.
     Permissions map dynamically by role:
     - `admin`, `admin_master`, `admin_company` -> `["accounting", "cashflow", "hr", "sales", "inventory", "admin"]`
     - `accountant` -> `["accounting", "cashflow"]`
     - `hr_manager` -> `["hr"]`
     - `sales_agent` -> `["sales"]`
     - `warehouse_keeper` -> `["inventory"]`
     - `branch_manager` -> `["accounting", "cashflow", "sales", "inventory"]`
     If the user has granular permissions inside their `staff_permissions` JSONB column, merge them into the permission list.
   - Implement `generate_and_send_otp(email: str) -> str`:
     Trigger passwordless email OTP using Supabase Auth:
     `POST /auth/v1/otp`
     Payload: `{"email": email.strip().lower(), "create_user": True, "options": {"shouldCreateUser": True}}`
     Return a non-empty status string like `"SENT"` if successful, or `None` if it fails.
   - Implement `verify_otp_and_link(chat_id: str, email: str, user_otp: str) -> dict`:
     Verify the OTP with Supabase Auth:
     `POST /auth/v1/verify`
     Payload: `{"type": "email", "email": email.strip().lower(), "token": user_otp.strip()}` (also try fallback to type: "magiclink" or similar if needed, or check response status).
     If verification succeeds, fetch user matrix, run `db.link_telegram_id`, and save the session mapping.
   - Implement similar REST-based auth calls for `generate_and_send_phone_otp` and `verify_phone_otp_and_link`.

Run linting/syntax checks and write your changes in `handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Send a message to the sub-orchestrator (conversation ID: a399f9d5-d6f0-4226-9a50-dc56362f9fb6) when done.
