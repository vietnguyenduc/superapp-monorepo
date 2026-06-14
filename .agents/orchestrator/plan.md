# Plan: Telegram Bot Revamp Orchestration Plan

This plan implements the Project Pattern for revamping the `superapp-business-bot` Telegram bot.

## Milestone 1: Exploration and Base Verification
- **Goal**: Analyze the current codebase, Supabase database schema, and test infrastructure. Create initial mocks/interfaces and verify connectivity.
- **Assigned to**: `explorer_1` (using `teamwork_preview_explorer`)
- **Key Deliverables**: Discovery report detailing the `users` table, potential new `apps` table structure, and existing test framework.

## Milestone 2: E2E Test Suite Design and Setup (E2E Testing Track)
- **Goal**: Build the opaque-box test runner and test cases for Tiers 1-4.
- **Assigned to**: `e2e_tester_1` (using `teamwork_preview_explorer` / `teamwork_preview_worker`)
- **Key Deliverables**: `TEST_INFRA.md`, `TEST_READY.md`, and automated integration test cases.

## Milestone 3: Onboarding & Supabase OTP Authentication (R1 & R2)
- **Goal**: Implement conversational onboarding flow prompting for email, triggering Supabase OTP authentication, and verifying the OTP code. Link verified email to the user's Telegram ID in the database.
- **Assigned to**: `worker_auth` (using `teamwork_preview_worker`)
- **Key Deliverables**: Updated `core/auth_manager.py`, `core/db.py`, and `main.py` implementing the auth flow.

## Milestone 4: User Roles, Access Control & Dynamic App Walkthrough (R2 & R3)
- **Goal**: Implement access checking (Trial vs Company member). Query the dynamic apps list from Supabase (`apps` table) and present them.
- **Assigned to**: `worker_roles_apps` (using `teamwork_preview_worker`)
- **Key Deliverables**: Role mapping logic, trial access warning, dynamic app menu.

## Milestone 5: AI Intent Routing Integration (R4)
- **Goal**: Connect Deepseek and Nvidia AI APIs to parse free-text intents, clarify requests, and route users.
- **Assigned to**: `worker_ai` (using `teamwork_preview_worker`)
- **Key Deliverables**: AI routing logic inside `core/ai_router.py` or new module, command handlers integration.

## Milestone 6: Final Integration, Verification & Audit Gating
- **Goal**: Run all E2E tests, execute Forensic Auditor checklist, perform adversarial hardening (Tier 5), and ensure clean completion.
- **Assigned to**: `worker_integration`, `reviewer_1`, `auditor_1`
- **Key Deliverables**: Fully verified codebase, zero audit warnings, 100% test pass.
