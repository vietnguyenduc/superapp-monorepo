# BRIEFING — 2026-06-15T01:25:00+07:00

## Mission
Explore existing Supabase migrations and current code to design a new database migration.

## 🔒 My Identity
- Archetype: Teamwork Explorer
- Roles: Explorer, Investigator
- Working directory: c:\Vibecoding\superapp-monorepo\.agents\explorer_3_1_3
- Original parent: a399f9d5-d6f0-4226-9a50-dc56362f9fb6
- Milestone: Design Database Migration

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do not write code or create migrations yourself
- Strictly read-only on repository files (excluding our own agent folder)

## Current Parent
- Conversation ID: a399f9d5-d6f0-4226-9a50-dc56362f9fb6
- Updated: 2026-06-15T01:25:00+07:00

## Investigation State
- **Explored paths**:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/migrations/005_multi_level_admin_schema.sql`
  - `supabase/migrations/005b_create_companies_table.sql`
  - `supabase/migrations/008_update_rls_for_multi_tenancy.sql`
  - `supabase/migrations/025_fix_rls_initplan.sql`
  - `supabase/migrations/026_fix_function_schema_references.sql`
  - `supabase/migrations/030_fix_users_rls_select.sql`
  - `apps/antigravity-telegram-agent/core/db.py`
  - `apps/superapp-business-bot/core/db.py`
- **Key findings**:
  - `public.users` does not yet contain `telegram_id` and OTP verification columns, but the client code in `db.py` queries/updates it.
  - The roles in the system are `'admin'`, `'branch_manager'`, `'staff'`, `'admin_master'`, `'admin_company'`.
  - Security helper functions `public.check_user_role(uuid, text)` and `public.get_user_company_id(uuid)` exist.
  - RLS policies use wrapped `(select auth.uid())` subqueries to optimize database query planner cache.
  - `public.apps` table needs to be created, linked to `public.companies(id)`, and secured.
- **Unexplored areas**: None (exploration successfully completed).

## Key Decisions Made
- Designed SQL statements for the new migration `038_add_telegram_otp_and_apps.sql`.
- Included RLS policies leveraging `check_user_role` and `get_user_company_id` to enforce company-member read access and global/company admin management privileges.

## Artifact Index
- c:\Vibecoding\superapp-monorepo\.agents\explorer_3_1_3\ORIGINAL_REQUEST.md — Original task description
- c:\Vibecoding\superapp-monorepo\.agents\explorer_3_1_3\BRIEFING.md — Working memory briefing
