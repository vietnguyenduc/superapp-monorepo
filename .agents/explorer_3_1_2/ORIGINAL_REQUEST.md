## 2026-06-14T18:17:15Z
You are explorer_3_1_2, an exploration agent.
Your working directory is: c:\Vibecoding\superapp-monorepo\.agents\explorer_3_1_2
Your task is to explore the existing Supabase migrations under c:\Vibecoding\superapp-monorepo\supabase\migrations\ and current code to design a new database migration.
This migration must:
1. Add columns to `public.users`: `telegram_id` (text unique), `otp_code` (varchar(6)), `otp_expires_at` (timestamp with time zone), `otp_attempts` (integer default 0), `is_trial` (boolean default false), and `trial_ends_at` (timestamp with time zone).
2. Create the `public.apps` table linked to `public.companies(id)` with RLS policies allowing company members to view their own company's apps, and admins to manage them.
Review files, understand the current schema structure and constraints, and write your findings/recommendations in your handoff.md. Do not write code or create migrations yourself.
Send a message to the sub-orchestrator (conversation ID: a399f9d5-d6f0-4226-9a50-dc56362f9fb6) when done.
