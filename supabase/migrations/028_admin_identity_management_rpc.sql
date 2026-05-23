-- Migration: 028_admin_identity_management_rpc
-- Description: RPCs for Admin Portal Identity Management with multi-tenancy
-- Date: 2026-05-23

-- 1. RPC to get all users safely
DROP FUNCTION IF EXISTS public.admin_get_all_users();
CREATE OR REPLACE FUNCTION public.admin_get_all_users(p_company_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    app_permissions JSONB,
    company_id UUID,
    branch_id UUID,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    caller_role TEXT;
    caller_company UUID;
BEGIN
    SELECT u.role::TEXT, u.company_id INTO caller_role, caller_company
    FROM public.users u WHERE u.id = auth.uid();

    IF caller_role NOT IN ('admin_master', 'admin_company') THEN
        RAISE EXCEPTION 'Access denied. Only admins can fetch users.';
    END IF;

    IF caller_role = 'admin_company' THEN
        p_company_id := caller_company;
    END IF;

    RETURN QUERY 
    SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role::TEXT, 
        u.app_permissions, 
        u.company_id, 
        u.branch_id, 
        u.is_active, 
        u.created_at
    FROM public.users u
    WHERE (p_company_id IS NULL OR u.company_id = p_company_id)
    ORDER BY u.created_at DESC;
END;
$$;

-- 2. RPC to update user claims (role and app_permissions)
CREATE OR REPLACE FUNCTION public.admin_update_user_claims(
    target_user_id UUID,
    new_role TEXT,
    new_app_permissions JSONB,
    new_company_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    caller_role TEXT;
    caller_company UUID;
    target_company UUID;
    updated_user RECORD;
BEGIN
    SELECT role::TEXT, company_id INTO caller_role, caller_company
    FROM public.users WHERE id = auth.uid();

    IF caller_role NOT IN ('admin_master', 'admin_company') THEN
        RAISE EXCEPTION 'Access denied. Only admins can modify user claims.';
    END IF;

    SELECT company_id INTO target_company
    FROM public.users WHERE id = target_user_id;

    IF caller_role = 'admin_company' AND caller_company != target_company THEN
        RAISE EXCEPTION 'Access denied. You can only modify users in your own company.';
    END IF;

    IF caller_role = 'admin_company' AND new_role = 'admin_master' THEN
        RAISE EXCEPTION 'Access denied. You cannot grant admin_master role.';
    END IF;

    IF caller_role = 'admin_company' AND new_company_id != caller_company THEN
        RAISE EXCEPTION 'Access denied. You can only assign users to your own company.';
    END IF;

    -- NEW RULE: admin_master CANNOT be assigned to any company
    IF new_role = 'admin_master' AND new_company_id IS NOT NULL THEN
        RAISE EXCEPTION 'Master admin cannot be assigned to a specific company.';
    END IF;

    IF target_user_id = auth.uid() AND new_role != 'admin_master' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.users 
            WHERE role = 'admin_master' AND id != auth.uid() AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Cannot demote the last active admin_master.';
        END IF;
    END IF;

    UPDATE public.users
    SET 
        role = new_role::public.user_role,
        app_permissions = new_app_permissions,
        company_id = new_company_id,
        updated_at = NOW()
    WHERE id = target_user_id
    RETURNING id, role::TEXT as role_text, app_permissions, company_id INTO updated_user;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found.';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', updated_user.id,
        'role', updated_user.role_text,
        'app_permissions', updated_user.app_permissions,
        'company_id', updated_user.company_id,
        'message', 'Claims updated successfully.'
    );
END;
$$;
