## 2026-06-15T18:19:05Z

You are worker_3_1, a teamwork worker agent.
Your working directory is: c:\Vibecoding\superapp-monorepo\.agents\worker_3_1
Your task is to write and apply the database migration SQL script for Milestone 3.1.

Specifically:
1. Create a migration file `c:\Vibecoding\superapp-monorepo\supabase\migrations\038_add_telegram_otp_and_apps.sql`.
Ensure it matches the following SQL design:
```sql
-- Migration: 038_add_telegram_otp_and_apps.sql
-- Description: Add telegram and OTP columns to users table, and create apps table with RLS policies

-- Step 1: Add columns to public.users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Create public.apps table
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_company_app UNIQUE (company_id, name)
);

-- Step 3: Create index for apps performance
CREATE INDEX IF NOT EXISTS idx_apps_company_id ON public.apps(company_id);

-- Step 4: Enable RLS on public.apps table
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for public.apps table

-- Policy A: Company members can view their own company's apps
-- Also allows global admins (admin_master and admin) to view all apps
DROP POLICY IF EXISTS "Users can view their company apps" ON public.apps;
CREATE POLICY "Users can view their company apps" ON public.apps
FOR SELECT
USING (
    company_id = public.get_user_company_id((select auth.uid()))
    OR public.check_user_role((select auth.uid()), 'admin_master'::text)
    OR public.check_user_role((select auth.uid()), 'admin'::text)
);

-- Policy B: Admins can manage apps
-- Global admins (admin_master and admin) can manage all apps
-- Company admins (admin_company) can manage their own company's apps
DROP POLICY IF EXISTS "Admins can manage apps" ON public.apps;
CREATE POLICY "Admins can manage apps" ON public.apps
FOR ALL
USING (
    public.check_user_role((select auth.uid()), 'admin_master'::text)
    OR public.check_user_role((select auth.uid()), 'admin'::text)
    OR (
        public.check_user_role((select auth.uid()), 'admin_company'::text)
        AND company_id = public.get_user_company_id((select auth.uid()))
    )
)
WITH CHECK (
    public.check_user_role((select auth.uid()), 'admin_master'::text)
    OR public.check_user_role((select auth.uid()), 'admin'::text)
    OR (
        public.check_user_role((select auth.uid()), 'admin_company'::text)
        AND company_id = public.get_user_company_id((select auth.uid()))
    )
);
```

2. Run `python supabase/scripts/verify_migrations.py` to verify SQL syntax correctness.
3. Apply the migration locally by running the command: `npx supabase db reset` (or equivalent database reset/apply commands) to verify it succeeds without errors.
4. Verify the new schema in database tables.
5. Document all command lines used and output results in `handoff.md` in your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Send a message to the sub-orchestrator (conversation ID: a399f9d5-d6f0-4226-9a50-dc56362f9fb6) when done.
