-- Migration: 014_inventory_seed_data.sql
-- Description: Seed data for inventory tables (assign to existing company/branch)
-- Date: 2026-05-01

-- Step 1: Get existing company and branch IDs
-- This will assign inventory data to the first company/branch found
-- In production, you would specify the actual company_id and branch_id

-- Step 2: Update existing products to have company_id and branch_id
-- Assign to the first company found
DO $$
DECLARE
    v_company_id UUID;
    v_branch_id UUID;
BEGIN
    -- Get first company
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    -- Get first branch for that company
    SELECT id INTO v_branch_id FROM public.branches 
    WHERE company_id = v_company_id LIMIT 1;
    
    -- Update existing products
    IF v_company_id IS NOT NULL AND v_branch_id IS NOT NULL THEN
        UPDATE public.products 
        SET company_id = v_company_id, branch_id = v_branch_id
        WHERE company_id IS NULL;
        
        RAISE NOTICE 'Updated products with company_id: % and branch_id: %', v_company_id, v_branch_id;
    ELSE
        RAISE NOTICE 'No company or branch found to assign inventory data';
    END IF;
END $$;

-- Step 3: Update existing inventory records
DO $$
DECLARE
    v_company_id UUID;
    v_branch_id UUID;
BEGIN
    -- Get first company
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    -- Get first branch for that company
    SELECT id INTO v_branch_id FROM public.branches 
    WHERE company_id = v_company_id LIMIT 1;
    
    -- Update existing inventory records
    IF v_company_id IS NOT NULL AND v_branch_id IS NOT NULL THEN
        UPDATE public.inventory_records 
        SET company_id = v_company_id, branch_id = v_branch_id
        WHERE company_id IS NULL;
        
        RAISE NOTICE 'Updated inventory_records with company_id: % and branch_id: %', v_company_id, v_branch_id;
    END IF;
END $$;

-- Step 4: Update existing sales records
DO $$
DECLARE
    v_company_id UUID;
    v_branch_id UUID;
BEGIN
    -- Get first company
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    -- Get first branch for that company
    SELECT id INTO v_branch_id FROM public.branches 
    WHERE company_id = v_company_id LIMIT 1;
    
    -- Update existing sales records
    IF v_company_id IS NOT NULL AND v_branch_id IS NOT NULL THEN
        UPDATE public.sales_records 
        SET company_id = v_company_id, branch_id = v_branch_id
        WHERE company_id IS NULL;
        
        RAISE NOTICE 'Updated sales_records with company_id: % and branch_id: %', v_company_id, v_branch_id;
    END IF;
END $$;

-- Step 5: Update existing special outbound records
DO $$
DECLARE
    v_company_id UUID;
    v_branch_id UUID;
BEGIN
    -- Get first company
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    -- Get first branch for that company
    SELECT id INTO v_branch_id FROM public.branches 
    WHERE company_id = v_company_id LIMIT 1;
    
    -- Update existing special outbound records
    IF v_company_id IS NOT NULL AND v_branch_id IS NOT NULL THEN
        UPDATE public.special_outbound_records 
        SET company_id = v_company_id, branch_id = v_branch_id
        WHERE company_id IS NULL;
        
        RAISE NOTICE 'Updated special_outbound_records with company_id: % and branch_id: %', v_company_id, v_branch_id;
    END IF;
END $$;

-- Step 6: Update existing inventory reports
DO $$
DECLARE
    v_company_id UUID;
    v_branch_id UUID;
BEGIN
    -- Get first company
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    -- Get first branch for that company
    SELECT id INTO v_branch_id FROM public.branches 
    WHERE company_id = v_company_id LIMIT 1;
    
    -- Update existing inventory reports
    IF v_company_id IS NOT NULL AND v_branch_id IS NOT NULL THEN
        UPDATE public.inventory_reports 
        SET company_id = v_company_id, branch_id = v_branch_id
        WHERE company_id IS NULL;
        
        RAISE NOTICE 'Updated inventory_reports with company_id: % and branch_id: %', v_company_id, v_branch_id;
    END IF;
END $$;

-- Step 7: Update existing stock check prints
DO $$
DECLARE
    v_company_id UUID;
    v_branch_id UUID;
BEGIN
    -- Get first company
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    -- Get first branch for that company
    SELECT id INTO v_branch_id FROM public.branches 
    WHERE company_id = v_company_id LIMIT 1;
    
    -- Update existing stock check prints
    IF v_company_id IS NOT NULL AND v_branch_id IS NOT NULL THEN
        UPDATE public.stock_check_prints 
        SET company_id = v_company_id, branch_id = v_branch_id
        WHERE company_id IS NULL;
        
        RAISE NOTICE 'Updated stock_check_prints with company_id: % and branch_id: %', v_company_id, v_branch_id;
    END IF;
END $$;

-- Step 8: Add inventory-specific staff permissions example
-- This shows how to set inventory permissions for staff users
-- Uncomment and modify for actual users:
-- UPDATE public.users 
-- SET staff_permissions = staff_permissions || '{"import_products": true, "import_inventory": true, "view_reports": true, "manage_settings": false}'::jsonb
-- WHERE role = 'staff' AND id = 'user-uuid-here';
