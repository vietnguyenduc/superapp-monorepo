-- Migration: 005_multi_level_admin_schema.sql
-- Description: Add multi-level admin system support (companies, granular permissions, new roles)
-- Date: 2026-04-26

-- Step 1: Create or update user_role enum
-- First, check if the type exists and create it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'branch_manager', 'staff', 'admin_master', 'admin_company');
    ELSE
        -- Type exists, try to add new values
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin_master';
        EXCEPTION WHEN duplicate_object THEN null;
        END;
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin_company';
        EXCEPTION WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- Step 2: Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add company_id to branches table
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Step 4: Add new fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS staff_permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 5: Update check constraint to include new roles
-- Drop old constraint if it exists
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with all role values
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role::text = ANY (ARRAY['admin'::text, 'branch_manager'::text, 'staff'::text, 'admin_master'::text, 'admin_company'::text]));

-- Step 5: Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_branches_company_id ON public.branches(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_code ON public.companies(code);

-- Step 6: Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Step 7: Update RLS policies for users table to support new roles
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create new policies for multi-level admin system
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin Master can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
    );

CREATE POLICY "Admin Company can view company users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company' 
            AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Admin Master can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
    );

CREATE POLICY "Admin Company can manage company users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
        )
    );

-- Step 8: Create RLS policies for companies table
CREATE POLICY "Admin Master can view all companies" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
    );

CREATE POLICY "Admin Master can manage companies" ON public.companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
    );

-- Step 9: Update branches RLS policies to support company-level access
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their branch" ON public.branches;
DROP POLICY IF EXISTS "Admins can manage all branches" ON public.branches;

-- Create new policies
CREATE POLICY "Users can view their branch" ON public.branches
    FOR SELECT USING (
        id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
            AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Admin Master can manage all branches" ON public.branches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
    );

CREATE POLICY "Admin Company can manage company branches" ON public.branches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
        )
    );

-- Step 10: Update other RLS policies to support new roles
-- Update bank accounts policies
DROP POLICY IF EXISTS "Users can view their branch bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can manage their branch bank accounts" ON public.bank_accounts;

CREATE POLICY "Users can view their branch bank accounts" ON public.bank_accounts
    FOR SELECT USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
            AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their branch bank accounts" ON public.bank_accounts
    FOR ALL USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
        )
    );

-- Update customers policies
DROP POLICY IF EXISTS "Users can view their branch customers" ON public.customers;
DROP POLICY IF EXISTS "Users can manage their branch customers" ON public.customers;

CREATE POLICY "Users can view their branch customers" ON public.customers
    FOR SELECT USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
            AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their branch customers" ON public.customers
    FOR ALL USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
        )
    );

-- Update transactions policies
DROP POLICY IF EXISTS "Users can view their branch transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions for their branch" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their branch transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their branch transactions" ON public.transactions;

CREATE POLICY "Users can view their branch transactions" ON public.transactions
    FOR SELECT USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
            AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can create transactions for their branch" ON public.transactions
    FOR INSERT WITH CHECK (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
        )
    );

CREATE POLICY "Users can update their branch transactions" ON public.transactions
    FOR UPDATE USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
        )
    );

CREATE POLICY "Users can delete their branch transactions" ON public.transactions
    FOR DELETE USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_company'
        )
    );
