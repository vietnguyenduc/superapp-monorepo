-- Migration: 004_admin_identity_local
-- Description: Admin Portal identity-management RPCs for the local InsForge TEXT-id schema.

-- 1. Minimal Supabase auth helpers that read the JWT claims GUC set by the API.
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
$$;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS JSONB
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb;
$$;

-- 2. RPC to list users for the Admin Portal identity page.
DROP FUNCTION IF EXISTS public.admin_get_all_users();

CREATE OR REPLACE FUNCTION public.admin_get_all_users(p_company_id TEXT DEFAULT NULL)
RETURNS TABLE (
    id TEXT,
    email TEXT,
    full_name TEXT,
    role TEXT,
    app_permissions JSONB,
    staff_permissions JSONB,
    company_id TEXT,
    branch_id TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    caller_role TEXT;
    caller_company TEXT;
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
        COALESCE(u.app_permissions, '{}'::jsonb),
        COALESCE(u.staff_permissions, '{}'::jsonb),
        u.company_id,
        u.branch_id,
        u.is_active,
        u.created_at
    FROM public.users u
    WHERE (p_company_id IS NULL OR u.company_id = p_company_id)
    ORDER BY u.created_at DESC;
END;
$$;

-- 3. RPC to update a user's role, app_permissions, company_id and staff_permissions.
CREATE OR REPLACE FUNCTION public.admin_update_user_claims(
    target_user_id TEXT,
    new_role TEXT,
    new_app_permissions JSONB,
    new_company_id TEXT DEFAULT NULL,
    new_staff_permissions JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    caller_role TEXT;
    caller_company TEXT;
    target_company TEXT;
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
        staff_permissions = COALESCE(new_staff_permissions, staff_permissions),
        company_id = new_company_id,
        updated_at = NOW()
    WHERE id = target_user_id
    RETURNING id, role::TEXT as role_text, app_permissions, staff_permissions, company_id INTO updated_user;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found.';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', updated_user.id,
        'role', updated_user.role_text,
        'app_permissions', updated_user.app_permissions,
        'staff_permissions', updated_user.staff_permissions,
        'company_id', updated_user.company_id,
        'message', 'Claims updated successfully.'
    );
END;
$$;
