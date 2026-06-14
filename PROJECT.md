# Project: Telegram Bot Revamp (superapp-business-bot)

## Architecture
- **Telegram Front-end**: Handled in `main.py` using `pyTelegramBotAPI` decorators. It receives user inputs and routes them.
- **Database & Auth Integration**: Handled in `core/db.py` and `core/auth_manager.py` using the Supabase URL, anon key, and requests.
- **AI Intent Router**: Handled in `core/ai_router.py` (supported by Deepseek and Nvidia endpoints). It parses user intent and routes them dynamically.
- **Data Flow**:
  1. User enters `/start` or a free-text message.
  2. If unauthenticated, the bot initiates conversational onboarding (R1), asking for an email and sending a Supabase OTP.
  3. User enters the OTP. The bot verifies the OTP with Supabase Auth, updates `telegram_id` in the database, and loads the user role (R2).
  4. If user is unassigned (not in the database), the bot grants temporary "Trial access" (valid for the session) and displays contact info.
  5. If user is a company member, the bot loads their company details and roles, displaying a welcome message.
  6. The bot queries available apps dynamically from the Supabase `apps` table (R3) and presents the app walkthrough.
  7. When receiving free-text input, the bot uses `smart_generate` with Deepseek/Nvidia to route to the correct app or clarify intent (R4).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| 1 | Exploration & Database Check | Discover existing database schemas, current code setup, and construct required tables. | None | DONE |
| 2 | E2E Testing Track | Design and implement the testing framework (Tiers 1-4). Create `TEST_READY.md`. | M1 | IN_PROGRESS (Conv ID: c96f5ac8-bf47-4496-b715-9ff7f9841803) |
| 3 | Onboarding & OTP Auth | Add conversational onboarding flow and Supabase Auth email OTP verification. | M1, M2 | IN_PROGRESS (Conv ID: a399f9d5-d6f0-4226-9a50-dc56362f9fb6) |
| 4 | Access Handling & Dynamic Apps | Implement Trial vs Company member logic and query Supabase for app list. | M3 | PLANNED |
| 5 | AI Intent Routing | Integrate Deepseek/Nvidia API for free-text parsing and routing flow. | M4 | PLANNED |
| 6 | Integration, Review & Hardening | Run tests, execute Forensic Audit, run Tier 5 adversarial checks, resolve gaps. | M5 | PLANNED |

## Interface Contracts
### `main.py` ↔ `core/auth_manager.py`
- `send_supabase_otp(email: str) -> dict`: Sends email OTP/Magic Link via Supabase Auth. Returns status.
- `verify_supabase_otp(chat_id: str, email: str, otp: str) -> dict`: Verifies OTP with Supabase Auth, updates the database via `core/db.py`, and caches session role.

### `main.py` ↔ `core/db.py`
- `get_user_by_telegram_id(telegram_id: str) -> dict`: Retrieves user info, company name, role, permissions, admin email.
- `get_dynamic_apps() -> list`: Queries the Supabase `apps` table to get list of `{name, url}`.

### `main.py` ↔ `core/ai_router.py`
- `parse_user_intent(user_input: str, user_context: dict) -> dict`: Parses free-text intent and decides whether to route to a specific app, answer directly, or return a clarifying question.
