# Handoff Report — Database Migration Design

## 1. Observation

### Existing Database Schemas
1. **`public.users` Table Definition**:
   In `supabase/migrations/001_initial_schema.sql` (lines 29–37), the `users` table is created as follows:
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

2. **Subsequent Modifications to `public.users`**:
   In `supabase/migrations/005_multi_level_admin_schema.sql` (lines 45–51), further fields are added:
   ```sql
   ALTER TABLE public.users 
   ADD COLUMN IF NOT EXISTS phone TEXT,
   ADD COLUMN IF NOT EXISTS position TEXT,
   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
   ADD COLUMN IF NOT EXISTS staff_permissions JSONB DEFAULT '{}',
   ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
   ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
   ```
   *Note: Role check constraints for roles are updated in line 61 to support `admin_master` and `admin_company`.*

3. **`public.companies` Table Definition**:
   In `supabase/migrations/005b_create_companies_table.sql` (lines 6–14), the `companies` table is defined:
   ```sql
   CREATE TABLE IF NOT EXISTS public.companies (
       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
       name TEXT NOT NULL,
       code TEXT UNIQUE NOT NULL,
       description TEXT,
       is_active BOOLEAN DEFAULT true,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

4. **Users Table RLS SELECT Policies**:
   In `supabase/migrations/030_fix_users_rls_select.sql` (lines 22–41), the select policies on `public.users` are structured as follows:
   ```sql
   CREATE POLICY "users_select_own" ON public.users
       FOR SELECT
       USING (auth.uid()::uuid = id);

   CREATE POLICY "users_select_admin" ON public.users
       FOR SELECT
       USING (
           (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin_master')
       );

   CREATE POLICY "users_select_admin_company" ON public.users
       FOR SELECT
       USING (
           (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_company'
           AND (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = company_id
       );
   ```

5. **Sample RLS Policy Pattern in Operations Schema**:
   In `supabase/migrations/20260527000002_operations_portal_phase3.sql` (lines 65–71), subqueries are used for tenant check:
   ```sql
   CREATE POLICY "Users can view courses in their company" ON public.operation_training_courses FOR SELECT USING (
       company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
   );
   CREATE POLICY "Admin/Manager can manage courses" ON public.operation_training_courses FOR ALL USING (
       company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
       EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
   );
   ```

---

## 2. Logic Chain

1. **`public.users` Modifications**:
   - The user request requires adding the following columns to `public.users`:
     - `telegram_id` (text unique)
     - `otp_code` (varchar(6))
     - `otp_expires_at` (timestamp with time zone)
     - `otp_attempts` (integer default 0)
     - `is_trial` (boolean default false)
     - `trial_ends_at` (timestamp with time zone)
   - These can be appended cleanly using an `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ...` migration step.
   - A unique constraint on `telegram_id` will implicitly create a unique index.

2. **`public.apps` Schema Design**:
   - The new table must link to `public.companies(id)`. This requires a foreign key column: `company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE`.
   - To make it usable as a dynamic app router, the table should contain:
     - `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
     - `name TEXT NOT NULL` (e.g. `'accounting'`, `'sales'`, etc.)
     - `url TEXT NOT NULL`
     - `is_active BOOLEAN DEFAULT true`
     - `created_at TIMESTAMPTZ DEFAULT NOW()`
     - `updated_at TIMESTAMPTZ DEFAULT NOW()`
     - A unique constraint: `UNIQUE (company_id, name)` to prevent duplicate apps within the same company.
   - An index on `company_id` (`idx_apps_company_id`) will optimize RLS evaluation and joins.
   - An `update_updated_at_column()` trigger should be attached to keep `updated_at` timestamps accurate.

3. **Row-Level Security (RLS) Policy Design**:
   - **Requirement**: Allow company members to view their own company's apps, and admins to manage them.
   - **Company Members View Access (SELECT)**:
     - Company members are users whose `company_id` matches the app's `company_id`.
     - *Approach A (Subquery-based)*:
       `company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())`
       *(Safe from infinite recursion because `public.users` SELECT policies do not query `public.apps`)*
     - *Approach B (JWT Metadata-based)*:
       `(auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = company_id`
       *(Faster as it avoids querying the database, but relies on JWT claims remaining in-sync)*
   - **Admins Management Access (ALL)**:
     - "Admins" includes `admin_master` (global access across companies) and `admin_company` (restricted to company context).
     - *Admin Master check*:
       `role = 'admin_master'` or `(auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_master'`
     - *Admin Company check*:
       `role = 'admin_company'` (or `role = 'admin'`) and `company_id` matching their own company.

---

## 3. Caveats

- **Network Constraints**: We operate in `CODE_ONLY` mode, so we cannot verify live DB states or constraints beyond those declared in the local `supabase/migrations/` directory.
- **Role Alignment**: It is assumed that the legacy `admin` role and the newer `admin_company` role should both have management permissions inside their own companies. If `admin` is fully deprecated in the production setup, references to it in the policies can be dropped.

---

## 4. Conclusion

We recommend creating a new migration file (e.g. `20260615000000_add_user_otp_and_apps.sql` or similar naming schema) with the following content:

```sql
-- Migration: Add user OTP/Telegram columns and Create Apps table
-- Description: Supports Telegram authentication flows and dynamic multi-tenant app routes

-- 1. Add columns to public.users
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
    ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- 2. Create public.apps table
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_company_app_name UNIQUE (company_id, name)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_apps_company_id ON public.apps(company_id);

-- Attach standard updated_at trigger
CREATE TRIGGER set_updated_at_apps
    BEFORE UPDATE ON public.apps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (Approach A: Subquery-based, matching legacy style)

-- SELECT policy: allows company members to view their own company's apps
CREATE POLICY "Users can view company apps" ON public.apps
    FOR SELECT
    USING (
        -- Admin master with no company selected (sees all)
        (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
         AND (SELECT company_id FROM public.users WHERE id = auth.uid()) IS NULL)
        OR
        -- Admin master with company selected (sees that company's apps)
        (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
         AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
        OR
        -- Standard company members: see their company's apps
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- INSERT/UPDATE/DELETE (ALL) policy for global Admin Master
CREATE POLICY "Admin Master can manage all apps" ON public.apps
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    );

-- INSERT/UPDATE/DELETE (ALL) policy for Company Admins
CREATE POLICY "Company Admins can manage company apps" ON public.apps
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin_company', 'admin'))
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

/* 
-- ALTERNATIVE RLS Policies (Approach B: JWT-based, optimized)
-- Recommended if database performance is a high priority as it avoids users subqueries.

CREATE POLICY "Users can view company apps" ON public.apps
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_master'
        OR
        (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = company_id
    );

CREATE POLICY "Admin Master can manage all apps" ON public.apps
    FOR ALL
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_master'
    );

CREATE POLICY "Company Admins can manage company apps" ON public.apps
    FOR ALL
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin_company', 'admin')
        AND (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = company_id
    );
*/
```

---

## 5. Verification Method

To verify the migration locally after implementation:
1. **Apply the migration** using Supabase CLI:
   `supabase db reset` (or run it via a tool/script if local migrations are containerized).
2. **Schema Verification**:
   Query the table descriptions using `psql` or Supabase Studio to confirm columns:
   - Check columns added to `public.users`: `telegram_id`, `otp_code`, `otp_expires_at`, `otp_attempts`, `is_trial`, `trial_ends_at`.
   - Check that `public.apps` exists and has a foreign key to `public.companies(id)`.
3. **RLS Verification**:
   As a non-admin company member, verify that you can query only your own company's apps.
   As an `admin_company` user, verify that you can insert/update/delete apps for your own company, but receive a violation error when attempting to modify another company's apps.
   As an `admin_master` user, verify full read-write capabilities on all apps.
