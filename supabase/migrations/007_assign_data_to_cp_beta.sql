-- Migration: 007_assign_data_to_cp_beta.sql
-- Description: Assign existing data to CP Beta company and create default settings
-- Date: 2026-04-27

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
INSERT INTO public.transaction_types (company_id, name, color, math_factor, impact_type, is_active)
SELECT
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
INSERT INTO public.customer_fields (company_id, name, type, is_required, is_active, is_default)
SELECT
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
