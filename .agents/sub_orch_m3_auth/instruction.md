# Milestone 3 Sub-orchestrator Task Instructions

## Objective
Implement conversational onboarding, Supabase Auth-based email OTP verification, and linking the user's verified email to their Telegram ID.

## Core Responsibilities
1. **Database Schema & Migrations**:
   - Create a new database migration file (e.g. using `supabase migration new`) to add the required columns to `public.users` (`telegram_id`, `otp_code`, `otp_expires_at`, `otp_attempts`, `is_trial`, `trial_ends_at`) and create the `public.apps` table as designed in Milestone 1's handoff.
   - Run the migration locally (e.g. `npx supabase db reset` or via executing SQL statements).
2. **Conversational Onboarding Flow (R1)**:
   - When a user sends a message and is not verified, prompt them to start the onboarding flow by entering their email address.
   - Using Supabase Auth endpoints, trigger a verification OTP code to be sent to their email.
   - Prompt the user to enter the OTP code.
   - Verify the entered OTP code against Supabase Auth.
   - If verified, update the user record in `public.users` with their `telegram_id`.
3. **Refactor Code Modules**:
   - Implement `db.get_user_by_email(email)` in `core/db.py`.
   - Update `core/auth_manager.py` to check user status and link Telegram ID.
   - Implement Supabase Auth OTP verification client calls inside `core/auth_manager.py`.
4. **Verification**:
   - Run tests and write unit/integration tests to verify the onboarding & auth flow.

When done, write a soft handoff to `handoff.md` and send a message to the Project Orchestrator (conversation ID: 51d8e7d7-9171-40ce-b970-a1943cb2dc76).
