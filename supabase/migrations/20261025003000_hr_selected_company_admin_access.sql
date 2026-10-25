-- Allow admin_master to operate HR data for the company selected in the UI.
-- Tenant users remain restricted to the company assigned to their profile.

DROP POLICY IF EXISTS "Users can view departments in their company" ON public.departments;
CREATE POLICY "Users can view departments in their company"
  ON public.departments FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id((SELECT auth.uid()))
    OR public.check_user_role((SELECT auth.uid()), 'admin_master')
  );

DROP POLICY IF EXISTS "Users can manage departments in their company" ON public.departments;
CREATE POLICY "Users can manage departments in their company"
  ON public.departments FOR ALL TO authenticated
  USING (
    company_id = public.get_user_company_id((SELECT auth.uid()))
    OR public.check_user_role((SELECT auth.uid()), 'admin_master')
  )
  WITH CHECK (
    company_id = public.get_user_company_id((SELECT auth.uid()))
    OR public.check_user_role((SELECT auth.uid()), 'admin_master')
  );
DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;
CREATE POLICY "Users can view employees in their company"
  ON public.employees FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id((SELECT auth.uid()))
    OR public.check_user_role((SELECT auth.uid()), 'admin_master')
  );

DROP POLICY IF EXISTS "Users can manage employees in their company" ON public.employees;
CREATE POLICY "Users can manage employees in their company"
  ON public.employees FOR ALL TO authenticated
  USING (
    company_id = public.get_user_company_id((SELECT auth.uid()))
    OR public.check_user_role((SELECT auth.uid()), 'admin_master')
  )
  WITH CHECK (
    company_id = public.get_user_company_id((SELECT auth.uid()))
    OR public.check_user_role((SELECT auth.uid()), 'admin_master')
  );
