# BRIEFING — 2026-06-15T01:28:16+07:00

## Mission
Analyze db.py and auth_manager.py and design database query modifications and REST API client integrations for user OTP authentication and verification.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Teamwork explorer, Read-only investigator
- Working directory: c:\Vibecoding\superapp-monorepo\.agents\explorer_3_2_1
- Original parent: a399f9d5-d6f0-4226-9a50-dc56362f9fb6
- Milestone: Milestone 3.2 (Telegram user OTP authentication/database linking)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Code modifications should be proposed in handoff.md inside our working directory. Do not write or edit the source files.

## Current Parent
- Conversation ID: a399f9d5-d6f0-4226-9a50-dc56362f9fb6
- Updated: 2026-06-15T01:28:16+07:00

## Investigation State
- **Explored paths**:
  - `apps/superapp-business-bot/core/db.py` - Contains the DB wrappers querying Supabase REST endpoints.
  - `apps/superapp-business-bot/core/auth_manager.py` - Manages user local pairing, mock matrices, and phone OTP via eSMS.
  - `apps/superapp-business-bot/main.py` - Telegram handlers and onboarding state logic.
  - `apps/superapp-business-bot/tests/conftest.py` - Setup of mocks including `SupabaseStub` (stubbing requests for REST API endpoints).
- **Key findings**:
  - `get_user_by_email` in `db.py` is already implemented. We will verify and document its implementation to ensure robustness.
  - `auth_manager.py` has a mock role map `check_superapp_matrix`. We need to replace it with real database lookups from `db.py` and call Supabase Auth endpoints for email OTP verification.
  - Integration of `/auth/v1/otp` and `/auth/v1/verify` in `auth_manager.py` using `requests` is feasible. We will implement testing fallback options (offline simulation) so the existing test suites continue to function normally.
- **Unexplored areas**: None.

## Key Decisions Made
- Designed a hybrid approach in `auth_manager.py` for `generate_and_send_otp` and `verify_otp_and_link` that uses real Supabase Auth calls when keys are present and falls back to simulation/local cache when running in testing/stubbed mode.
- Proposed a helper function `check_user_status_and_permissions` in `auth_manager.py` to check user active status and RBAC mapping.

## Artifact Index
- c:\Vibecoding\superapp-monorepo\.agents\explorer_3_2_1\handoff.md — Handoff report with findings and proposals
