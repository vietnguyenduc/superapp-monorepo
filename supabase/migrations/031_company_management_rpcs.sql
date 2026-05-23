-- Migration: 031_company_management_rpcs
-- Description: RPCs for Master Admin to create and track companies
-- Date: 2026-05-23

-- Create Company
CREATE OR REPLACE FUNCTION public.admin_create_company(p_name TEXT, p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    new_id UUID;
    caller_role TEXT;
BEGIN
    SELECT role::TEXT INTO caller_role FROM public.users WHERE id = auth.uid();
    IF caller_role != 'admin_master' THEN
        RAISE EXCEPTION 'Access denied. Only master admin can create companies.';
    END IF;

    INSERT INTO public.companies (name, code, is_active)
    VALUES (p_name, p_code, true)
    RETURNING id INTO new_id;

    RETURN jsonb_build_object('success', true, 'company_id', new_id, 'message', 'Company created successfully.');
END;
$$;

-- Toggle Company Status
CREATE OR REPLACE FUNCTION public.admin_toggle_company_status(p_company_id UUID, p_is_active BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    SELECT role::TEXT INTO caller_role FROM public.users WHERE id = auth.uid();
    IF caller_role != 'admin_master' THEN
        RAISE EXCEPTION 'Access denied. Only master admin can toggle company status.';
    END IF;

    UPDATE public.companies SET is_active = p_is_active, updated_at = NOW() WHERE id = p_company_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Company status updated.');
END;
$$;

-- Get Company Stats
CREATE OR REPLACE FUNCTION public.admin_get_company_stats()
RETURNS TABLE (
    company_id UUID,
    name TEXT,
    code TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    total_users BIGINT,
    active_branches BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    SELECT role::TEXT INTO caller_role FROM public.users WHERE id = auth.uid();
    IF caller_role != 'admin_master' THEN
        RAISE EXCEPTION 'Access denied. Only master admin can view all company stats.';
    END IF;

    RETURN QUERY
    SELECT 
        c.id as company_id,
        c.name,
        c.code,
        c.is_active,
        c.created_at,
        (SELECT COUNT(*) FROM public.users u WHERE u.company_id = c.id) as total_users,
        (SELECT COUNT(*) FROM public.branches b WHERE b.company_id = c.id AND b.is_active = true) as active_branches
    FROM public.companies c
    ORDER BY c.created_at DESC;
END;
$$;
