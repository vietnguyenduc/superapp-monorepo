# BRIEFING — 2026-06-14T18:26:19Z

## Mission
Analyze db.py and auth_manager.py to propose implementation details for user lookup, verification, status check, and Telegram linking.

## 🔒 My Identity
- Archetype: explorer
- Roles: Teamwork explorer
- Working directory: c:\Vibecoding\superapp-monorepo\.agents\explorer_3_2_3
- Original parent: a399f9d5-d6f0-4226-9a50-dc56362f9fb6
- Milestone: Milestone 3.2

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Code-only network mode - no external web lookup or external curl

## Current Parent
- Conversation ID: a399f9d5-d6f0-4226-9a50-dc56362f9fb6
- Updated: 2026-06-14T18:27:45Z

## Investigation State
- **Explored paths**:
  - `apps/superapp-business-bot/core/db.py`
  - `apps/superapp-business-bot/core/auth_manager.py`
  - `apps/superapp-business-bot/tests/test_e2e_r1_onboarding.py`
  - `supabase/migrations/038_add_telegram_otp_and_apps.sql`
- **Key findings**:
  - `public.users` table holds the user details (role, is_active, staff_permissions, telegram_id).
  - Admin users must bypass Row Level Security policies (which limit users to their own profiles) to search and link users. Thus, the bot must use `SUPABASE_SERVICE_ROLE_KEY`.
  - Supabase Auth endpoints `/auth/v1/otp` and `/auth/v1/verify` can be successfully invoked via the `requests` library to trigger passwordless email and SMS verification.
- **Unexplored areas**: None, the task is complete.

## Key Decisions Made
- Use `shouldCreateUser: true` when sending OTP via `/auth/v1/otp` so pre-seeded database users can register in Supabase Auth automatically.
- Fallback to local session pairing logic (`load_user_mapping`/`save_user_mapping`) to preserve backward compatibility with existing tests.

## Artifact Index
- `c:\Vibecoding\superapp-monorepo\.agents\explorer_3_2_3\handoff.md` — Detailed analysis and proposed code changes for `db.py` and `auth_manager.py`.
