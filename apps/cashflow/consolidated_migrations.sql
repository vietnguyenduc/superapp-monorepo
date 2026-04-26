-- =====================================================
-- CONSOLIDATED SUPABASE MIGRATIONS
-- =====================================================
-- Description: Combined migration script for multi-tenancy and multi-level admin support
-- Order: 005 -> 005b -> 006 -> 007 -> 008 -> 009
-- Date: 2026-04-27
-- =====================================================

-- Enable necessary extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MIGRATION 005: Multi-Level Admin Schema
-- =====================================================

-- Step 1: Create or update user_role enum
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

-- Step 2: Create companies table (using complete schema from 005)
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
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'branch_manager'::text, 'staff'::text, 'admin_master'::text, 'admin_company'::text]));

-- Step 6: Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_branches_company_id ON public.branches(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_code ON public.companies(code);

-- Step 7: Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for companies table
DROP POLICY IF EXISTS "Admin Master can view all companies" ON public.companies;
CREATE POLICY "Admin Master can view all companies" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
    );

DROP POLICY IF EXISTS "Admin Master can manage companies" ON public.companies;
CREATE POLICY "Admin Master can manage companies" ON public.companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_master'
        )
    );

-- =====================================================
-- MIGRATION 006: Multi-Tenancy company_id additions
-- =====================================================

-- Step 1: Add company_id to bank_accounts table
ALTER TABLE public.bank_accounts
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Step 2: Add company_id to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Step 3: Add company_id to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Step 4: Create transaction_types table
CREATE TABLE IF NOT EXISTS public.transaction_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    math_factor DECIMAL,
    impact_type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Step 5: Create customer_fields table
CREATE TABLE IF NOT EXISTS public.customer_fields (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Step 6: Create indexes for company_id
CREATE INDEX IF NOT EXISTS idx_bank_accounts_company_id ON public.bank_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON public.transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transaction_types_company_id ON public.transaction_types(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_fields_company_id ON public.customer_fields(company_id);

-- Step 7: Update uniqueness constraints to be composite with company_id

-- Drop old unique constraint for customers.customer_code
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_customer_code_key;
-- Drop composite constraint if exists
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_customer_code_company_key;
-- Add new composite unique constraint
ALTER TABLE public.customers
ADD CONSTRAINT customers_customer_code_company_key UNIQUE (company_id, customer_code);

-- Drop old unique constraint for transactions.transaction_code
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_transaction_code_key;
-- Drop composite constraint if exists
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_transaction_code_company_key;
-- Add new composite unique constraint
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_transaction_code_company_key UNIQUE (company_id, transaction_code);

-- Drop old unique constraint for branches.code
ALTER TABLE public.branches DROP CONSTRAINT IF EXISTS branches_code_key;
-- Drop composite constraint if exists
ALTER TABLE public.branches DROP CONSTRAINT IF EXISTS branches_code_company_key;
-- Add new composite unique constraint for branches
ALTER TABLE public.branches
ADD CONSTRAINT branches_code_company_key UNIQUE (company_id, code);

-- Step 8: Enable RLS on new tables
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_fields ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- MIGRATION 007: Assign data to CP Beta company
-- =====================================================

-- Step 1: Create CP Beta company if not exists
INSERT INTO public.companies (name, code, is_active)
VALUES ('CP Beta', 'BETA', true)
ON CONFLICT (code) DO NOTHING;

-- Step 2: Assign branches to CP Beta
UPDATE public.branches
SET company_id = (SELECT id FROM public.companies WHERE code = 'BETA')
WHERE company_id IS NULL;

-- Step 3: Assign users to CP Beta (staff and admin_company roles)
UPDATE public.users
SET company_id = (SELECT id FROM public.companies WHERE code = 'BETA')
WHERE company_id IS NULL AND role IN ('staff', 'admin_company');

-- Step 4: Assign bank accounts to CP Beta
UPDATE public.bank_accounts ba
SET company_id = (SELECT company_id FROM public.branches WHERE id = ba.branch_id)
WHERE company_id IS NULL;

-- Step 5: Assign customers to CP Beta
UPDATE public.customers c
SET company_id = (SELECT company_id FROM public.branches WHERE id = c.branch_id)
WHERE company_id IS NULL;

-- Step 6: Assign transactions to CP Beta
UPDATE public.transactions t
SET company_id = (SELECT company_id FROM public.customers WHERE id = t.customer_id)
WHERE company_id IS NULL;

-- Step 7: Create default transaction types for CP Beta
INSERT INTO public.transaction_types (id, company_id, name, color, math_factor, impact_type, is_active)
SELECT
    gen_random_uuid(),
    (SELECT id FROM public.companies WHERE code = 'BETA'),
    name,
    color,
    math_factor,
    impact_type,
    is_active
FROM (
    VALUES
        ('payment', 'green', -1, 'decrease', true),
        ('charge', 'red', 1, 'increase', true),
        ('adjustment', 'blue', 1, 'increase', true),
        ('refund', 'green', -1, 'decrease', true)
) AS v(name, color, math_factor, impact_type, is_active)
ON CONFLICT (company_id, name) DO NOTHING;

-- Step 8: Create default customer fields for CP Beta
-- Add type column if it doesn't exist (for backwards compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_fields' AND column_name = 'type'
    ) THEN
        ALTER TABLE public.customer_fields ADD COLUMN type TEXT NOT NULL DEFAULT 'text';
    END IF;
END $$;

-- Add unique constraint if it doesn't exist (for backwards compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'customer_fields' AND constraint_name = 'customer_fields_company_id_name_key'
    ) THEN
        ALTER TABLE public.customer_fields ADD CONSTRAINT customer_fields_company_id_name_key UNIQUE (company_id, name);
    END IF;
END $$;

INSERT INTO public.customer_fields (id, company_id, name, type, is_required, is_active, is_default)
SELECT
    gen_random_uuid(),
    (SELECT id FROM public.companies WHERE code = 'BETA'),
    name,
    type,
    is_required,
    is_active,
    is_default
FROM (
    VALUES
        ('Họ và tên', 'text', true, true, true),
        ('Email', 'email', false, true, true),
        ('Số điện thoại', 'tel', true, true, true),
        ('Địa chỉ', 'text', false, true, true)
) AS v(name, type, is_required, is_active, is_default)
ON CONFLICT (company_id, name) DO NOTHING;

-- =====================================================
-- MIGRATION 008: Update RLS for multi-tenancy
-- =====================================================

-- Step 1: Drop old policies for bank_accounts
DROP POLICY IF EXISTS "Users can view their branch bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can manage their branch bank accounts" ON public.bank_accounts;

-- Step 2: Create new policies for bank_accounts with company filtering
DROP POLICY IF EXISTS "Users can view their company bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can view their company bank accounts" ON public.bank_accounts
FOR SELECT USING (
    -- Admin master không chọn company: thấy tất cả
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND (SELECT company_id FROM public.users WHERE id = auth.uid()) IS NULL)
    OR
    -- Admin master đã chọn company: chỉ thấy company đó
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
    OR
    -- Admin company/staff: chỉ thấy company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage their company bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can manage their company bank accounts" ON public.bank_accounts
FOR ALL USING (
    -- Admin master: có thể quản lý tất cả
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR
    -- Admin company/staff: chỉ quản lý company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- Step 3: Drop old policies for customers
DROP POLICY IF EXISTS "Users can view their branch customers" ON public.customers;
DROP POLICY IF EXISTS "Users can manage their branch customers" ON public.customers;

-- Step 4: Create new policies for customers with company filtering
DROP POLICY IF EXISTS "Users can view their company customers" ON public.customers;
CREATE POLICY "Users can view their company customers" ON public.customers
FOR SELECT USING (
    -- Admin master không chọn company: thấy tất cả
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND (SELECT company_id FROM public.users WHERE id = auth.uid()) IS NULL)
    OR
    -- Admin master đã chọn company: chỉ thấy company đó
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
    OR
    -- Admin company/staff: chỉ thấy company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage their company customers" ON public.customers;
CREATE POLICY "Users can manage their company customers" ON public.customers
FOR ALL USING (
    -- Admin master: có thể quản lý tất cả
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR
    -- Admin company/staff: chỉ quản lý company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- Step 5: Drop old policies for transactions
DROP POLICY IF EXISTS "Users can view their branch transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions for their branch" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their branch transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their branch transactions" ON public.transactions;

-- Step 6: Create new policies for transactions with company filtering
DROP POLICY IF EXISTS "Users can view their company transactions" ON public.transactions;
CREATE POLICY "Users can view their company transactions" ON public.transactions
FOR SELECT USING (
    -- Admin master không chọn company: thấy tất cả
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND (SELECT company_id FROM public.users WHERE id = auth.uid()) IS NULL)
    OR
    -- Admin master đã chọn company: chỉ thấy company đó
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
    OR
    -- Admin company/staff: chỉ thấy company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create transactions for their company" ON public.transactions;
CREATE POLICY "Users can create transactions for their company" ON public.transactions
FOR INSERT WITH CHECK (
    -- Admin master: có thể tạo cho tất cả
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR
    -- Admin company/staff: chỉ tạo cho company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their company transactions" ON public.transactions;
CREATE POLICY "Users can update their company transactions" ON public.transactions
FOR UPDATE USING (
    -- Admin master: có thể cập nhật tất cả
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR
    -- Admin company/staff: chỉ cập nhật company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their company transactions" ON public.transactions;
CREATE POLICY "Users can delete their company transactions" ON public.transactions
FOR DELETE USING (
    -- Admin master: có thể xóa tất cả
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR
    -- Admin company/staff: chỉ xóa company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- Step 7: Update branches policies with company filtering
DROP POLICY IF EXISTS "Users can view their branch" ON public.branches;
DROP POLICY IF EXISTS "Admin Master can manage all branches" ON public.branches;
DROP POLICY IF EXISTS "Admin Company can manage company branches" ON public.branches;

DROP POLICY IF EXISTS "Users can view their company branches" ON public.branches;
CREATE POLICY "Users can view their company branches" ON public.branches
FOR SELECT USING (
    -- Admin master không chọn company: thấy tất cả
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND (SELECT company_id FROM public.users WHERE id = auth.uid()) IS NULL)
    OR
    -- Admin master đã chọn company: chỉ thấy company đó
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
    OR
    -- Admin company/staff: chỉ thấy company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admin Master can manage all branches" ON public.branches;
CREATE POLICY "Admin Master can manage all branches" ON public.branches
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
);

DROP POLICY IF EXISTS "Admin Company can manage company branches" ON public.branches;
CREATE POLICY "Admin Company can manage company branches" ON public.branches
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_company')
    AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- Step 8: Create policies for transaction_types
DROP POLICY IF EXISTS "Users can view their company transaction types" ON public.transaction_types;
CREATE POLICY "Users can view their company transaction types" ON public.transaction_types
FOR SELECT USING (
    -- Admin master không chọn company: thấy tất cả
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND (SELECT company_id FROM public.users WHERE id = auth.uid()) IS NULL)
    OR
    -- Admin master đã chọn company: chỉ thấy company đó
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
    OR
    -- Admin company/staff: chỉ thấy company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage their company transaction types" ON public.transaction_types;
CREATE POLICY "Users can manage their company transaction types" ON public.transaction_types
FOR ALL USING (
    -- Admin master: có thể quản lý tất cả
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR
    -- Admin company: chỉ quản lý company của họ
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_company')
     AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
);

-- Step 9: Create policies for customer_fields
DROP POLICY IF EXISTS "Users can view their company customer fields" ON public.customer_fields;
CREATE POLICY "Users can view their company customer fields" ON public.customer_fields
FOR SELECT USING (
    -- Admin master không chọn company: thấy tất cả
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND (SELECT company_id FROM public.users WHERE id = auth.uid()) IS NULL)
    OR
    -- Admin master đã chọn company: chỉ thấy company đó
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
     AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
    OR
    -- Admin company/staff: chỉ thấy company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage their company customer fields" ON public.customer_fields;
CREATE POLICY "Users can manage their company customer fields" ON public.customer_fields
FOR ALL USING (
    -- Admin master: có thể quản lý tất cả
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR
    -- Admin company: chỉ quản lý company của họ
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_company')
     AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()))
);

-- Step 10: Update users policies to handle admin_master without company
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin Master can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin Company can view company users" ON public.users;
DROP POLICY IF EXISTS "Admin Master can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admin Company can manage company users" ON public.users;

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

-- =====================================================
-- MIGRATION 009: Update granular permissions structure
-- =====================================================

-- Function to migrate old permissions to new structure
CREATE OR REPLACE FUNCTION migrate_staff_permissions()
RETURNS void AS $$
BEGIN
  -- Update users with old permission structure to new structure
  UPDATE users
  SET staff_permissions = jsonb_build_object(
    'customers', jsonb_build_object(
      'import_own', COALESCE((staff_permissions->>'import_customers')::boolean, false),
      'manage_all', COALESCE((staff_permissions->>'manage_customers')::boolean, false)
    ),
    'transactions', jsonb_build_object(
      'import_own', COALESCE((staff_permissions->>'import_transactions')::boolean, false),
      'manage_all', COALESCE((staff_permissions->>'manage_transactions')::boolean, false)
    ),
    'settings', jsonb_build_object(
      'edit_general', COALESCE((staff_permissions->>'edit_settings')::boolean, false),
      'branches', false,
      'bank_accounts', false,
      'transaction_types', false,
      'customer_fields', false,
      'color_settings', false,
      'reports', false
    ),
    'reports', jsonb_build_object(
      'view', COALESCE((staff_permissions->>'view_reports')::boolean, false)
    )
  )
  WHERE staff_permissions IS NOT NULL 
    AND staff_permissions != '{}'::jsonb
    AND NOT (staff_permissions ? 'customers');
END;
$$ LANGUAGE plpgsql;

-- Run migration function
SELECT migrate_staff_permissions();

-- Drop migration function
DROP FUNCTION migrate_staff_permissions();

-- =====================================================
-- END OF CONSOLIDATED MIGRATIONS
-- =====================================================
