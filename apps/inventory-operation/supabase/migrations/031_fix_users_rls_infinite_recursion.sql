-- Migration: 031_fix_users_rls_infinite_recursion.sql
-- Description: Fix infinite recursion in users table RLS policies
-- The previous migration 030 used self-referencing subqueries (SELECT FROM public.users)
-- which caused infinite recursion. This migration replaces them with auth.jwt() metadata checks.
-- Date: 2026-06-14

-- Step 1: Drop the broken policies from migration 030
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_select_admin_company" ON public.users;

-- Step 2: Recreate admin_master policy using auth.jwt() metadata
-- This avoids self-referencing public.users which caused infinite recursion
CREATE POLICY "users_select_admin" ON public.users
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin_master')
    );

-- Step 3: Recreate admin_company policy using auth.jwt() metadata
CREATE POLICY "users_select_admin_company" ON public.users
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_company'
        AND (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = company_id
    );
