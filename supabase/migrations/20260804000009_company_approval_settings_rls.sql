-- Migration: 20260804000009_company_approval_settings_rls.sql
-- Description: Restrict company updates to approval_settings for admin/admin_company,
--              while letting admin and admin_master update any selected company.
-- Date: 2026-08-04

-- Replace the broad "Company admins can update own company" policy with a
-- narrower one that allows cross-company updates for admin/admin_master and
-- keeps admin_company scoped to their assigned company.  Column restrictions
-- are enforced by the trigger below.
DROP POLICY IF EXISTS "Company admins can update own company" ON public.companies;

CREATE POLICY "Company admins can update approval settings" ON public.companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role::text = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role::text = 'admin_company'
        AND company_id = companies.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role::text = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role::text = 'admin_company'
        AND company_id = companies.id
    )
  );

-- Trigger function: only allow non-admin-master users to change approval_settings.
-- admin_master bypasses this check (they manage companies via the admin_master policy).
CREATE OR REPLACE FUNCTION trg_companies_approval_settings_only()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_user_company_id uuid;
  v_col text;
  v_old_val text;
  v_new_val text;
BEGIN
  SELECT role::text, company_id
  INTO v_role, v_user_company_id
  FROM public.users
  WHERE id = auth.uid();

  IF v_role = 'admin_master' THEN
    RETURN NEW;
  END IF;

  IF v_role NOT IN ('admin', 'admin_company') THEN
    RAISE EXCEPTION 'Không có quyền cập nhật cấu hình công ty';
  END IF;

  IF v_role = 'admin_company' AND v_user_company_id IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'admin_company chỉ được cập nhật công ty được phân công';
  END IF;

  -- Reject any change that is not approval_settings (or updated_at, which is
  -- commonly auto-maintained by a moddatetime trigger).
  FOR v_col IN
    SELECT a.attname
    FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = TG_RELID
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND a.attname NOT IN ('approval_settings', 'updated_at')
  LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', v_col, v_col)
      USING OLD, NEW
      INTO v_old_val, v_new_val;
    IF v_old_val IS DISTINCT FROM v_new_val THEN
      RAISE EXCEPTION 'Chỉ được cập nhật cột approval_settings';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_companies_approval_settings_only ON public.companies;
CREATE TRIGGER trg_companies_approval_settings_only
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION trg_companies_approval_settings_only();
