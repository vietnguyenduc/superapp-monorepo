# explorer_3_1_3 Migration Design Handoff Report

## 1. Observation

### Users Table and Roles
- **Initial Schema (`supabase/migrations/001_initial_schema.sql` lines 29-37)**:
  ```sql
  CREATE TABLE public.users (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      role user_role DEFAULT 'staff',
      branch_id UUID REFERENCES public.branches(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- **Admin Schema Expansion (`supabase/migrations/005_multi_level_admin_schema.sql` lines 44-51)**:
  ```sql
  ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS staff_permissions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  ```
- No existing migrations define `telegram_id`, `otp_code`, `otp_expires_at`, `otp_attempts`, `is_trial`, `trial_ends_at`, or a `public.apps` table.

### Security Helpers and RLS Best Practices
- **Security Helpers (`supabase/migrations/026_fix_function_schema_references.sql` lines 3-25)**:
  ```sql
  CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, role_name text)
   RETURNS boolean
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path TO ''
  AS $function$
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = user_id AND role::text = role_name
    );
  END;
  $function$;

  CREATE OR REPLACE FUNCTION public.get_user_company_id(user_id uuid)
   RETURNS uuid
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path TO ''
  AS $function$
  BEGIN
    RETURN (SELECT company_id FROM public.users WHERE id = user_id);
  END;
  ```
- **RLS Policy Performance (`supabase/migrations/025_fix_rls_initplan.sql`)**:
  Polices wrap `auth.uid()` in a scalar subquery to allow PostgreSQL to cache the result rather than evaluating it per-row, for example:
  ```sql
  USING ((company_id = get_user_company_id(( SELECT (select auth.uid()) AS uid))));
  ```
  And `supabase-postgres-best-practices/references/security-rls-performance.md` dictates:
  ```sql
  create policy orders_policy on orders
    using ((select auth.uid()) = user_id);  -- Called once, cached
  ```

### Code Queries
- **Telegram Bot DB Helpers (`apps/antigravity-telegram-agent/core/db.py` lines 19-36, 51-65)**:
  Queries and patches `telegram_id` in `public.users`:
  ```python
  url = f"{SUPABASE_URL}/rest/v1/users?telegram_id=eq.{telegram_id}"
  # ...
  res = requests.patch(url, json={"telegram_id": telegram_id}, headers=get_headers(), timeout=10)
  ```

---

## 2. Logic Chain

1. **User Schema Alterations**:
   - The current `public.users` schema does not contain `telegram_id`, `otp_code`, `otp_expires_at`, `otp_attempts`, `is_trial`, and `trial_ends_at`.
   - The bot codebase actively expects these columns (specifically `telegram_id` as unique) to exist in the database.
   - Therefore, a migration must modify `public.users` to add these columns.
2. **Creating the Apps Table**:
   - The system requires a `public.apps` table to map companies to their respective active app names and URLs.
   - The table must link to `public.companies(id)` with a foreign key constraint and clean cascade on delete.
   - To prevent duplicate app registrations under the same company, a composite unique constraint `unique_company_app` on `(company_id, name)` is necessary.
3. **RLS and Helper Functions**:
   - Row Level Security (RLS) is enabled globally across all tables.
   - Company members (users with the same `company_id`) must have `SELECT` privileges on their company's apps. We can check this cleanly using the optimized `public.get_user_company_id((select auth.uid()))` function.
   - Global admins (`admin_master`, `admin`) should have unrestricted view and management rights.
   - Company admins (`admin_company`) must have management (`ALL`) rights restricted to their own company's apps.
   - To ensure optimal performance and avoid infinite recursion, policies must wrap `auth.uid()` inside `(select auth.uid())` subqueries and use helper security definer functions, conforming to best practices established in `025_fix_rls_initplan.sql` and the project guidelines.
   - An index on `company_id` in the `public.apps` table must be created to support fast query planning during RLS filtering.

---

## 3. Caveats

- We assume that the database has already been successfully migrated up to `037_einvoice_and_tax_schema.sql` and that the helper functions `check_user_role` and `get_user_company_id` are defined.
- Since we are in `CODE_ONLY` network mode, we cannot execute these SQL queries against the live Supabase instance. However, the designed SQL syntax matches the syntax used in the latest working migrations.

---

## 4. Conclusion

We propose the following migration design for the next step of the pipeline.

### Designed SQL Migration (`038_add_telegram_otp_and_apps.sql`)

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

-- Policy A: Company members can view their own company's apps (including company admins)
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

---

## 5. Verification Method

To independently verify this migration design:
1. **Apply the Migration**:
   Run the Supabase CLI to apply the migration locally:
   ```bash
   supabase db reset
   ```
2. **Schema Verification**:
   Query the table descriptions using `psql` or Supabase SQL Editor:
   ```sql
   -- Check public.users columns
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND table_schema = 'public';

   -- Check public.apps columns
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'apps' AND table_schema = 'public';
   ```
3. **RLS Verification**:
   Execute test transactions using test roles:
   ```sql
   -- Set up test data
   -- Insert a test company and a user belonging to it
   -- Impersonate the user and verify they can view apps for their company, but cannot insert/update apps unless they have the 'admin_company' or 'admin_master' role.
   ```
