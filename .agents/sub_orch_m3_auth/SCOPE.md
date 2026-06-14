# Scope: Onboarding & OTP Auth (Milestone 3)

## Architecture
- **Supabase Auth API**: Integrate calling Supabase Auth OTP sending and verification REST API.
- **Database Mapping**: Link verified emails to `telegram_id` in `public.users`.
- **User Conversation State**: Use session/memory to track if the user is onboarding, waiting for email, or waiting for OTP token.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| 3.1 | Database Migrations | Create and apply migration for `telegram_id` and `apps` table. | None | PLANNED |
| 3.2 | Code Refactoring | Implement `get_user_by_email` and Supabase Auth OTP calls in `core/db.py` / `core/auth_manager.py`. | 3.1 | PLANNED |
| 3.3 | Conversation Flow | Implement the `/start` handler and state-based onboarding conversation flow in `main.py`. | 3.2 | PLANNED |
| 3.4 | Verification | Run unit/integration tests for onboarding. | 3.3 | PLANNED |
