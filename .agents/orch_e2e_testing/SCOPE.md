# Scope: superapp-business-bot E2E Test Suite

## Architecture
- **E2E Test Runner**: Python-based test runner using `pytest` to execute tests in `apps/superapp-business-bot/tests/test_e2e.py`.
- **Bot Simulator**: A lightweight test harness class that instantiates `telebot.TeleBot` in a test mode, intercepting outgoing calls (like `send_message`, `reply_to`, `edit_message_text`, `send_media_group`) to verify the bot's outputs.
- **Database & API Stubs**: Stubs/mocks for the Supabase DB client (`core/db.py`), Supabase Auth client (`core/auth_manager.py`), and the AI router endpoint (`core/ai_router.py`) to run tests deterministically without live external network dependencies (CODE_ONLY).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Setup Test Harness | Design and implement the mock bot harness and database stubs. | None | PLANNED |
| 2 | Implement Tiers 1-4 | Implement the E2E test cases covering Tiers 1-4 (49 test cases minimum). | M1 | PLANNED |
| 3 | Documentation & Verification | Create TEST_INFRA.md, TEST_READY.md, run the test suite, and ensure all tests pass. | M2 | PLANNED |

## E2E Test Catalog & Partitions
We follow the Category-Partition methodology for features R1-R4:

### Feature R1: Conversational Onboarding & Email OTP Auth
- **Tier 1 (Happy-Path)**
  1. `test_r1_start_onboarding`: `/start` starts the conversational onboarding.
  2. `test_r1_login_prompt`: `/login` asks the user for their business email.
  3. `test_r1_valid_email_otp_sent`: Submitting a valid corporate email triggers OTP generation.
  4. `test_r1_otp_verification_success`: Submitting the correct 6-digit OTP completes authentication.
  5. `test_r1_multiple_logins`: Authenticating with different email roles registers user correctly.
- **Tier 2 (Boundaries & Errors)**
  6. `test_r1_invalid_email_format`: Submitting malformed emails (e.g. `invalid_email`, `@@gmail.com`).
  7. `test_r1_unknown_email`: Submitting a corporate email that is not in the system matrix.
  8. `test_r1_incorrect_otp`: Submitting an incorrect 6-digit OTP code.
  9. `test_r1_expired_otp`: Submitting an OTP after it has expired.
  10. `test_r1_otp_max_attempts`: Attempting incorrect OTP 5 times blocks/resets the OTP.

### Feature R2: User Roles & Access Handling
- **Tier 1 (Happy-Path)**
  11. `test_r2_trial_user_onboarding`: Log in as a guest/trial user and receive a trial role.
  22. `test_r2_trial_user_apps`: Trial user accesses apps and gets trial-limited URLs and contact details.
  13. `test_r2_company_member_welcome`: Corporate user receives personalized welcome with company name and role.
  14. `test_r2_admin_settings`: User with Admin role accesses `/settings` command successfully.
  15. `test_r2_non_admin_settings_denied`: User with Staff/Member role is denied access to `/settings`.
- **Tier 2 (Boundaries & Errors)**
  16. `test_r2_trial_session_expiration`: Trial session expires, requiring re-onboarding.
  17. `test_r2_dynamic_role_update`: Permission check handles real-time role change in the database.
  18. `test_r2_inactive_user_blocked`: User marked inactive in DB is blocked from commands.
  19. `test_r2_unauthorized_command_execution`: Attempt to execute unauthorized commands returns error response.
  20. `test_r2_multiple_overlapping_roles`: Verifies permissions logic when user holds multiple roles.

### Feature R3: Dynamic App Walkthrough
- **Tier 1 (Happy-Path)**
  21. `test_r3_apps_list`: Running `/apps` displays all active apps for the user's company.
  22. `test_r3_app_button_click`: Clicking on an app inline button returns its URL.
  23. `test_r3_multiple_apps_display`: Inline keyboard adjusts dynamically based on the number of apps.
  24. `test_r3_company_app_separation`: Verify Company A cannot see Company B's apps.
  25. `test_r3_walkthrough_flow`: First-time user receives an interactive app walkthrough/tutorial.
- **Tier 2 (Boundaries & Errors)**
  26. `test_r3_no_apps_configured`: `/apps` handles company with 0 registered apps.
  27. `test_r3_malformed_app_url`: Displays appropriate warning for empty/malformed app URLs.
  28. `test_r3_unauthenticated_apps_access`: Accessing `/apps` before logging in redirects to login.
  29. `test_r3_apps_db_query_failure`: Handles database query errors gracefully.
  30. `test_r3_stale_callback_query`: Handlers ignore or report stale callbacks.

### Feature R4: AI Intent Routing
- **Tier 1 (Happy-Path)**
  31. `test_r4_route_accounting`: Free text "tạo hóa đơn" is routed to the Accounting app.
  32. `test_r4_route_sales`: Free text "bán hàng" is routed to the Sales app.
  33. `test_r4_route_hr`: Free text "xin nghỉ phép" is routed to the HR app.
  34. `test_r4_route_inventory`: Free text "nhập kho" is routed to the Inventory app.
  35. `test_r4_direct_conversational_response`: General inputs get direct helpful conversational responses.
- **Tier 2 (Boundaries & Errors)**
  36. `test_r4_empty_prompt`: Whitespace/empty text messages are ignored or handled cleanly.
  37. `test_r4_ambiguous_routing`: Ambiguous messages return a clarifying prompt from the bot.
  38. `test_r4_exceed_length_limit`: Handles extremely long input text without crashing.
  39. `test_r4_ai_service_down`: Graceful fallback when the AI service is unavailable.
  40. `test_r4_malicious_prompt_injection`: Handles special characters, commands, and potential injection safely.

### Tier 3: Cross-Feature Combinations (Pairwise Coverage)
- 41. `test_t3_login_role_app_sync`: Complete flow: login (R1) -> resolves role (R2) -> changes dynamic apps keyboard output (R3).
- 42. `test_t3_free_text_auth_interruption`: User types free-text action (R4) -> Bot prompts for authentication (R1) -> Auth succeeds -> Bot completes action.
- 43. `test_t3_settings_change_app_effect`: Changing configuration in settings (R2) instantly impacts accessible apps (R3).
- 44. `test_t3_ai_route_permission_gate`: AI routes user to an app (R4), but the role access check (R2) blocks them if unauthorized.

### Tier 4: Real-World Application Scenarios
- 45. `test_t4_employee_full_onboarding_and_invoice`: Happy-path flow: Employee starts bot, completes OTP authentication, lists apps, and routes free text to create an invoice.
- 46. `test_t4_trial_user_exploration_limit`: Guest enters trial mode, walkthrough is shown, tries admin command (blocked), asks for contact/pricing.
- 47. `test_t4_revoked_credentials_mid_session`: Active user has account disabled in DB; bot immediately blocks their next command.
- 48. `test_t4_admin_dynamic_url_update_and_use`: Admin logs in, updates company app URL, runs `/apps`, and AI correctly routes using the new URL.
- 49. `test_t4_ingestion_and_cleaning_pipeline`: User uploads a CSV data file, bot routes it to the ingestion tool, and profiles the data.
