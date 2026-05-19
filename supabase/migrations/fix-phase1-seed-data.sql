-- ============================================================
-- PHASE 1 FIX: Ensure seed data has company_id and branch_id
-- Run this if verify-phase1.sql test #9 fails
-- ============================================================

-- Step 1: Update products (skip if already assigned)
UPDATE public.products p
SET company_id = c.id, branch_id = b.id
FROM (SELECT id FROM public.companies LIMIT 1) c,
     (SELECT id FROM public.branches LIMIT 1) b
WHERE p.company_id IS NULL;

-- Step 2: Update inventory_records
UPDATE public.inventory_records p
SET company_id = c.id, branch_id = b.id
FROM (SELECT id FROM public.companies LIMIT 1) c,
     (SELECT id FROM public.branches LIMIT 1) b
WHERE p.company_id IS NULL;

-- Step 3: Update sales_records
UPDATE public.sales_records p
SET company_id = c.id, branch_id = b.id
FROM (SELECT id FROM public.companies LIMIT 1) c,
     (SELECT id FROM public.branches LIMIT 1) b
WHERE p.company_id IS NULL;

-- Step 4: Update special_outbound_records
UPDATE public.special_outbound_records p
SET company_id = c.id, branch_id = b.id
FROM (SELECT id FROM public.companies LIMIT 1) c,
     (SELECT id FROM public.branches LIMIT 1) b
WHERE p.company_id IS NULL;

-- Step 5: Update inventory_reports
UPDATE public.inventory_reports p
SET company_id = c.id, branch_id = b.id
FROM (SELECT id FROM public.companies LIMIT 1) c,
     (SELECT id FROM public.branches LIMIT 1) b
WHERE p.company_id IS NULL;

-- Step 6: Update stock_check_prints
UPDATE public.stock_check_prints p
SET company_id = c.id, branch_id = b.id
FROM (SELECT id FROM public.companies LIMIT 1) c,
     (SELECT id FROM public.branches LIMIT 1) b
WHERE p.company_id IS NULL;

-- Step 7: Verify the fix
SELECT 'POST-FIX: products with company_id' AS check_name,
       COUNT(*) AS count,
       CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.products
WHERE company_id IS NOT NULL;
