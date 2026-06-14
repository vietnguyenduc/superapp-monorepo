-- Migration: 030_fix_users_rls_select.sql
-- Description: Add SELECT policies for users table to fix 401 errors
-- All inventory RLS policies use subqueries like (SELECT branch_id FROM public.users WHERE id = auth.uid())
-- but users table had no SELECT policy, causing permission denied errors.
-- Date: 2026-06-14
--
-- FIX: Use auth.jwt() metadata instead of self-referencing public.users
-- to avoid infinite recursion in RLS policies.

-- Step 1: Enable RLS on users table (in case not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_select_admin_company" ON public.users;

-- Step 3: Policy for users to SELECT their own record
-- This is the minimum required for all inventory RLS subqueries like:
--   (SELECT branch_id FROM public.users WHERE id = auth.uid())
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (auth.uid()::uuid = id);

-- Step 4: Policy for admin_master to SELECT all users
-- Uses auth.jwt() -> role from user_metadata to avoid self-referencing public.users
CREATE POLICY "users_select_admin" ON public.users
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin_master')
    );

-- Step 5: Policy for admin_company to SELECT users in their company
-- Uses auth.jwt() -> company_id from user_metadata to avoid self-referencing public.users
CREATE POLICY "users_select_admin_company" ON public.users
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_company'
        AND (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = company_id
    );
