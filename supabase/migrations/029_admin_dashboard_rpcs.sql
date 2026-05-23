-- Migration: 029_admin_dashboard_rpcs
-- Description: RPCs for Admin Portal Dashboard (Consolidated Metrics) and Data Lifecycle with Multi-tenancy
-- Date: 2026-05-23

-- ═══════════════════════════════════════════════════════════════
-- 1. Get Consolidated Metrics
-- ═══════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.admin_get_consolidated_metrics();
CREATE OR REPLACE FUNCTION public.admin_get_consolidated_metrics(p_company_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_revenue NUMERIC;
    v_receivables NUMERIC;
    v_inventory_value NUMERIC;
    v_payables NUMERIC;
    v_total_users INT;
    v_active_branches INT;
    caller_role TEXT;
    caller_company UUID;
BEGIN
    SELECT role::TEXT, company_id INTO caller_role, caller_company
    FROM public.users WHERE id = auth.uid();

    IF caller_role NOT IN ('admin_master', 'admin_company') THEN
        RAISE EXCEPTION 'Permission denied. Must be Admin.';
    END IF;

    IF caller_role = 'admin_company' THEN
        p_company_id := caller_company;
    END IF;

    SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue 
    FROM public.sales_orders 
    WHERE status IN ('confirmed', 'processing', 'delivered')
    AND (p_company_id IS NULL OR company_id = p_company_id);

    SELECT COALESCE(SUM(debt_amount), 0) INTO v_receivables 
    FROM public.sales_orders 
    WHERE status IN ('confirmed', 'processing', 'delivered')
    AND (p_company_id IS NULL OR company_id = p_company_id);

    SELECT COALESCE(SUM(total_amount), 0) INTO v_inventory_value 
    FROM public.inventory_records 
    WHERE transaction_type = 'IN'
    AND (p_company_id IS NULL OR company_id = p_company_id);

    SELECT COALESCE(SUM(amount), 0) INTO v_payables 
    FROM public.transactions 
    WHERE transaction_type = 'payment' AND status = 'pending'
    AND (p_company_id IS NULL OR company_id = p_company_id);

    SELECT COUNT(*) INTO v_total_users FROM public.users 
    WHERE (p_company_id IS NULL OR company_id = p_company_id);
    
    SELECT COUNT(*) INTO v_active_branches FROM public.branches 
    WHERE is_active = true
    AND (p_company_id IS NULL OR company_id = p_company_id);

    RETURN json_build_object(
        'revenue', v_revenue,
        'receivables', v_receivables,
        'inventoryValue', v_inventory_value,
        'payables', v_payables,
        'totalUsers', v_total_users,
        'activeBranches', v_active_branches
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 2. Wipe Trial/Operational Data
-- ═══════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.admin_wipe_operational_data();
CREATE OR REPLACE FUNCTION public.admin_wipe_operational_data(p_company_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    caller_role TEXT;
    caller_company UUID;
BEGIN
    SELECT role::TEXT, company_id INTO caller_role, caller_company
    FROM public.users WHERE id = auth.uid();

    IF caller_role NOT IN ('admin_master', 'admin_company') THEN
        RAISE EXCEPTION 'Permission denied. Must be Admin to wipe data.';
    END IF;

    IF caller_role = 'admin_company' THEN
        p_company_id := caller_company;
    END IF;

    DELETE FROM public.marketing_costs WHERE (p_company_id IS NULL OR company_id = p_company_id);
    DELETE FROM public.sales_order_items WHERE sales_order_id IN (SELECT id FROM public.sales_orders WHERE (p_company_id IS NULL OR company_id = p_company_id));
    DELETE FROM public.sales_orders WHERE (p_company_id IS NULL OR company_id = p_company_id);
    DELETE FROM public.inventory_records WHERE (p_company_id IS NULL OR company_id = p_company_id);
    DELETE FROM public.transactions WHERE (p_company_id IS NULL OR company_id = p_company_id);
    DELETE FROM public.customers WHERE (p_company_id IS NULL OR company_id = p_company_id);
    DELETE FROM public.products WHERE (p_company_id IS NULL OR company_id = p_company_id);
END;
$$;
