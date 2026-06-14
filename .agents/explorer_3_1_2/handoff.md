# Handoff Report - Database Migration Design for Users & Apps

## 1. Observation
During the exploration of `supabase/migrations/`, we observed the following:
* **Users Table Structure**:
  * In `supabase/migrations/001_initial_schema.sql` (lines 29–37), the `public.users` table is created:
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
  * In `005_multi_level_admin_schema.sql` (lines 44–51) and `005b_create_companies_table.sql` (lines 20–22), `company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL` was added to `public.users` along with other columns like `phone`, `position`, `staff_permissions`, `created_by`, and `is_active`.
* **Security & RLS Helpers**:
  * In `supabase/migrations/026_fix_function_schema_references.sql` (lines 3–26), the helper functions `public.check_user_role(user_id uuid, role_name text)` and `public.get_user_company_id(user_id uuid)` are defined:
    ```sql
    CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, role_name text)
     RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND role::text = role_name
      );
    END;
    $$;
    ```
  * These helper functions are used across RLS policies (e.g., in `025_fix_rls_initplan.sql` and `023_fix_security_definer_functions.sql`) to avoid infinite recursion and ensure secure access checks.
* **Audit Triggers**:
  * In `supabase/migrations/003_functions_triggers.sql` (lines 178–184), `public.update_updated_at_column()` trigger function is defined to maintain `updated_at` timestamps on updates.
* **Verification Script**:
  * In `supabase/scripts/verify_migrations.py`, there is a basic SQL syntax and string verification script that checks parenthesis pairing and syntax conventions.

## 2. Logic Chain
1. **Adding Columns to `public.users`**:
   Adding columns using `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ...` ensures idempotency. The new columns must be added with the correct data types, defaults, and uniqueness constraints as requested:
   * `telegram_id` -> `TEXT UNIQUE`
   * `otp_code` -> `VARCHAR(6)`
   * `otp_expires_at` -> `TIMESTAMP WITH TIME ZONE`
   * `otp_attempts` -> `INTEGER DEFAULT 0`
   * `is_trial` -> `BOOLEAN DEFAULT false`
   * `trial_ends_at` -> `TIMESTAMP WITH TIME ZONE`
2. **Creating `public.apps` Table**:
   * To establish multi-tenancy, `public.apps` must reference `public.companies(id)` via `company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE`.
   * Essential index `idx_apps_company_id` should be created on `company_id` to optimize filter speed in RLS policies.
   * `ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;` is required to restrict unauthorized access.
3. **Designing RLS Policies**:
   * **View Policy (Select)**: Allows company members to view their own company's apps. Using `public.get_user_company_id(auth.uid()) = company_id` ensures that members only see apps belonging to their company. Global master admins (`admin_master`) should bypass this constraint via `public.check_user_role(auth.uid(), 'admin_master')`.
   * **Manage Policy (All/Insert/Update/Delete)**: Allows admins to manage the apps. "Admins" includes `admin_master` (global) and local company admins (`admin_company`, `admin`) when editing their own company's apps.
   * Using the helper functions `check_user_role` and `get_user_company_id` aligns with existing RLS optimizations in the project and prevents the infinite recursion that direct subqueries on `public.users` can cause.

## 3. Caveats
* The word "admins" is interpreted as including:
  * Global Master Admins (`admin_master`) who can manage all apps regardless of company association.
  * Company Admins (`admin_company`) and standard Admins (`admin`) who can only manage apps within their assigned company (`company_id = get_user_company_id(auth.uid())`).
* Since we are in a read-only investigation role, no actual migration has been written to the `supabase/migrations/` directory or run against the database.

## 4. Conclusion
We recommend creating a new database migration file (e.g., `038_add_telegram_otp_and_apps.sql`) with the following SQL schema and policy configuration:

```sql
-- Step 1: Add new columns to public.users table
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
    ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Add comments for users table updates
COMMENT ON COLUMN public.users.telegram_id IS 'Telegram ID of the user for bot integration';
COMMENT ON COLUMN public.users.otp_code IS 'One-Time Password code for verification';
COMMENT ON COLUMN public.users.otp_expires_at IS 'Expiration timestamp for the OTP code';
COMMENT ON COLUMN public.users.otp_attempts IS 'Failed verification attempts for current OTP';
COMMENT ON COLUMN public.users.is_trial IS 'Indicates if the user is in trial mode';
COMMENT ON COLUMN public.users.trial_ends_at IS 'Timestamp when user trial expires';

-- Step 2: Create public.apps table
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for foreign key performance
CREATE INDEX IF NOT EXISTS idx_apps_company_id ON public.apps(company_id);

-- Register update trigger for apps table
CREATE TRIGGER trigger_update_apps_updated_at
    BEFORE UPDATE ON public.apps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 3: Enable RLS on apps table
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for apps table
DROP POLICY IF EXISTS "Users can view their company apps" ON public.apps;
CREATE POLICY "Users can view their company apps" ON public.apps
    FOR SELECT
    USING (
        public.check_user_role(auth.uid(), 'admin_master')
        OR company_id = public.get_user_company_id(auth.uid())
    );

DROP POLICY IF EXISTS "Admins can manage company apps" ON public.apps;
CREATE POLICY "Admins can manage company apps" ON public.apps
    FOR ALL
    USING (
        public.check_user_role(auth.uid(), 'admin_master')
        OR (
            (public.check_user_role(auth.uid(), 'admin_company') OR public.check_user_role(auth.uid(), 'admin'))
            AND company_id = public.get_user_company_id(auth.uid())
        )
    )
    WITH CHECK (
        public.check_user_role(auth.uid(), 'admin_master')
        OR (
            (public.check_user_role(auth.uid(), 'admin_company') OR public.check_user_role(auth.uid(), 'admin'))
            AND company_id = public.get_user_company_id(auth.uid())
        )
    );
```

## 5. Verification Method
1. **Syntax Check**: Execute the project check script to confirm syntax compatibility:
   ```powershell
   python supabase/scripts/verify_migrations.py
   ```
2. **Local Schema Verification**: Once applied locally, verify table columns and RLS policies status by running:
   ```sql
   -- Verify users columns
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name IN ('telegram_id', 'otp_code', 'otp_expires_at', 'otp_attempts', 'is_trial', 'trial_ends_at');

   -- Verify apps table
   SELECT table_name, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND table_name = 'apps';
   ```
3. **RLS Policy Verification**: Test SELECT and management operations as different users (`admin_master`, `admin_company`, `staff`) belonging to different companies.
