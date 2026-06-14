# Milestone 1: Exploration and Database Check Task Instructions

## Objective
Analyze the current codebase, Supabase database schemas, and existing tests in `c:\Vibecoding\superapp-monorepo\apps\superapp-business-bot`. 

## Instructions
1. Explore the folder layout and files inside `apps/superapp-business-bot`.
2. Inspect the current database schema using the Supabase configuration found in `.env` (or mock calls). Identify if there are existing tables like `users` or if we need to create/update tables (e.g. `users`, `apps` / `applications`).
3. Check the existing test structure under `tests/`. Find out how tests are run (e.g. pytest, python script) and what mock data exists.
4. Recommend the exact DB schema structures (especially for `users` and a new `apps` table) to support email OTP verification, trial vs company member roles, and dynamic app URLs.
5. Identify the exact places in `main.py`, `core/db.py`, `core/auth_manager.py`, and `core/ai_router.py` that need to be modified.
6. Write your findings and recommendations in `handoff.md` inside your working directory.
