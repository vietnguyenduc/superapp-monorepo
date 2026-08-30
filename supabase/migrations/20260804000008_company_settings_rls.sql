-- Migration: 20260804000008_company_settings_rls.sql
-- Description: Allow company users to read their own company and company admins to update company settings (including approval_settings).
-- Date: 2026-08-04

-- Authenticated users can always see their assigned company row.
-- This ensures fetchUserProfile and CompanyProvider can resolve company data
-- for roles like admin, admin_company, and staff.
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND company_id = companies.id
    )
  );

-- Company admins (admin, admin_company, admin_master) can update their own company row.
-- This is needed so the Cashflow Settings page can persist approval_settings.
DROP POLICY IF EXISTS "Company admins can update own company" ON public.companies;
CREATE POLICY "Company admins can update own company" ON public.companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND company_id = companies.id
        AND role::text = ANY(ARRAY['admin','admin_company','admin_master'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND company_id = companies.id
        AND role::text = ANY(ARRAY['admin','admin_company','admin_master'])
    )
  );
