-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_select_admin_company" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: users can SELECT their own record
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (auth.uid()::uuid = id);

-- Policy 2: admin_master can SELECT all users (direct comparison, no recursion)
CREATE POLICY "users_select_admin" ON public.users
    FOR SELECT
    USING (
        auth.uid()::uuid IN (
            SELECT id FROM public.users WHERE role = 'admin_master'
        )
    );

-- Policy 3: admin_company can SELECT users in their company (direct comparison, no recursion)
CREATE POLICY "users_select_admin_company" ON public.users
    FOR SELECT
    USING (
        auth.uid()::uuid IN (
            SELECT id FROM public.users WHERE role = 'admin_company' AND company_id = public.users.company_id
        )
    );