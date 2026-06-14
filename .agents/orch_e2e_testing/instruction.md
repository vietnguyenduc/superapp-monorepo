# E2E Testing Track Orchestrator Task Instructions

## Objective
Design and implement a comprehensive, opaque-box E2E test suite for the revamped `superapp-business-bot` Telegram bot. You must follow the Category-Partition methodology and test case design requirements across Tiers 1-4.

## Core Principles
1. **Opaque-box**: Exercise the bot commands and conversational flows as an end user would (e.g. simulating message events and asserting replies/responses). Do not import implementation details.
2. **Requirements-driven**: Test cases must map directly to:
   - R1: Conversational Onboarding & Email OTP Auth.
   - R2: User Roles & Access Handling (Trial vs Company member).
   - R3: Dynamic App Walkthrough.
   - R4: AI Intent Routing.
3. **Progressive Testability**: Verification must be simple and clean.
4. **Test Tiers**:
   - Tier 1: Feature Coverage (at least 5 per feature, happy-path).
   - Tier 2: Boundary & Corner Cases (at least 5 per feature, e.g. invalid emails, expired OTPs, incorrect OTP codes, empty prompt routing, character limits).
   - Tier 3: Cross-Feature combinations (pairwise interactions).
   - Tier 4: Real-world application scenarios.
5. **Output**:
   - Create `TEST_INFRA.md` at the project root outlining the test architecture and command.
   - Publish `TEST_READY.md` at the project root when the entire test suite is fully designed and executable.

## Running Tests
Ensure tests are runnable via a standard command, e.g. `pytest tests/test_e2e.py` or similar script.

When done, write a soft handoff to `handoff.md` and send a message to the Project Orchestrator (conversation ID: 51d8e7d7-9171-40ce-b970-a1943cb2dc76).
