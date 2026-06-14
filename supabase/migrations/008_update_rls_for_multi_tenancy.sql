-- Migration: 008_update_rls_for_multi_tenancy.sql
-- Description: Update RLS policies to filter by company_id for multi-tenancy
-- Date: 2026-04-27

-- Step 1: Drop old policies for bank_accounts
DROP POLICY IF EXISTS "Users can view their branch bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can manage their branch bank accounts" ON public.bank_accounts;

-- Step 2: Create new policies for bank_accounts with company filtering
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

CREATE POLICY "Users can create transactions for their company" ON public.transactions
FOR INSERT WITH CHECK (
    -- Admin master: có thể tạo cho tất cả
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR
    -- Admin company/staff: chỉ tạo cho company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Users can update their company transactions" ON public.transactions
FOR UPDATE USING (
    -- Admin master: có thể cập nhật tất cả
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR
    -- Admin company/staff: chỉ cập nhật company của họ
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

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

CREATE POLICY "Admin Master can manage all branches" ON public.branches
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
);

CREATE POLICY "Admin Company can manage company branches" ON public.branches
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_company')
    AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- Step 8: Create policies for transaction_types
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
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_master'
);

CREATE POLICY "Admin Company can view company users" ON public.users
FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_company'
    AND (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = company_id
);

CREATE POLICY "Admin Master can manage all users" ON public.users
FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_master'
);

CREATE POLICY "Admin Company can manage company users" ON public.users
FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_company'
);
