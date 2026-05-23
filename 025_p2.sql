DROP POLICY IF EXISTS "Admin Master can manage all users" ON public."users";
CREATE POLICY "Admin Master can manage all users" ON public."users" FOR ALL
USING (check_user_role((select auth.uid()), 'admin_master'::text))
WITH CHECK (check_user_role((select auth.uid()), 'admin_master'::text));

DROP POLICY IF EXISTS "Admin Company can view company users" ON public."users";
CREATE POLICY "Admin Company can view company users" ON public."users" FOR ALL
USING ((check_user_role((select auth.uid()), 'admin_company'::text) AND (company_id = get_user_company_id((select auth.uid())))));

DROP POLICY IF EXISTS "Admin Company can manage company users" ON public."users";
CREATE POLICY "Admin Company can manage company users" ON public."users" FOR ALL
USING ((check_user_role((select auth.uid()), 'admin_company'::text) AND (company_id = get_user_company_id((select auth.uid())))))
WITH CHECK ((check_user_role((select auth.uid()), 'admin_company'::text) AND (company_id = get_user_company_id((select auth.uid())))));

DROP POLICY IF EXISTS "Admin can view all users" ON public."users";
CREATE POLICY "Admin can view all users" ON public."users" FOR ALL
USING (check_user_role((select auth.uid()), 'admin'::text));

DROP POLICY IF EXISTS "Users with inventory access can view their branch inventory rep" ON public."inventory_reports";
CREATE POLICY "Users with inventory access can view their branch inventory rep" ON public."inventory_reports" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users can view their company bank accounts" ON public."bank_accounts";
CREATE POLICY "Users can view their company bank accounts" ON public."bank_accounts" FOR ALL
USING (((check_user_role((select auth.uid()), 'admin_master'::text) AND (get_user_company_id((select auth.uid())) IS NULL)) OR (check_user_role((select auth.uid()), 'admin_master'::text) AND (company_id = get_user_company_id((select auth.uid())))) OR (company_id = get_user_company_id((select auth.uid())))));

DROP POLICY IF EXISTS "Users with inventory access can update their branch inventory r" ON public."inventory_reports";
CREATE POLICY "Users with inventory access can update their branch inventory r" ON public."inventory_reports" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can delete their branch inventory r" ON public."inventory_reports";
CREATE POLICY "Users with inventory access can delete their branch inventory r" ON public."inventory_reports" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can view their branch stock check p" ON public."stock_check_prints";
CREATE POLICY "Users with inventory access can view their branch stock check p" ON public."stock_check_prints" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can view product conversions" ON public."product_conversions";
CREATE POLICY "Users with inventory access can view product conversions" ON public."product_conversions" FOR ALL
USING ((has_app_access((select auth.uid()), 'inventory'::text) = true));

DROP POLICY IF EXISTS "Users with inventory access can view stock check items" ON public."stock_check_items";
CREATE POLICY "Users with inventory access can view stock check items" ON public."stock_check_items" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND (EXISTS ( SELECT 1
   FROM stock_check_prints scp
  WHERE ((scp.id = stock_check_items.stock_check_id) AND ((scp.branch_id = ( SELECT users.branch_id
           FROM users
          WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
           FROM users
          WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
           FROM users
          WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
                   FROM users users_1
                  WHERE (users_1.id = (select auth.uid())))))))))))));

DROP POLICY IF EXISTS "Users with inventory access can view approval logs" ON public."approval_logs";
CREATE POLICY "Users with inventory access can view approval logs" ON public."approval_logs" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users can update backup history for their company" ON public."backup_history";
CREATE POLICY "Users can update backup history for their company" ON public."backup_history" FOR ALL
USING ((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))));

DROP POLICY IF EXISTS "Users can view their branch variance reports" ON public."inventory_variance_reports";
CREATE POLICY "Users can view their branch variance reports" ON public."inventory_variance_reports" FOR ALL
USING (((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (( SELECT users.role
   FROM users
  WHERE (users.id = (select auth.uid()))) = 'admin_master'::text) OR ((( SELECT users.role
   FROM users
  WHERE (users.id = (select auth.uid()))) = 'admin_company'::text) AND (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))))));

DROP POLICY IF EXISTS "Admins can manage customer fields" ON public."customer_fields";
CREATE POLICY "Admins can manage customer fields" ON public."customer_fields" FOR ALL
USING ((( SELECT users.role
   FROM users
  WHERE (users.id = ( SELECT (select auth.uid()) AS uid))
 LIMIT 1) = ANY (ARRAY['admin'::text, 'admin_master'::text])))
WITH CHECK ((( SELECT users.role
   FROM users
  WHERE (users.id = ( SELECT (select auth.uid()) AS uid))
 LIMIT 1) = ANY (ARRAY['admin'::text, 'admin_master'::text])));

DROP POLICY IF EXISTS "Authenticated users can view color settings" ON public."color_settings";
CREATE POLICY "Authenticated users can view color settings" ON public."color_settings" FOR ALL
USING ((( SELECT (select auth.uid()) AS uid) IS NOT NULL));

DROP POLICY IF EXISTS "admin_master can update backup history for any company" ON public."backup_history";
CREATE POLICY "admin_master can update backup history for any company" ON public."backup_history" FOR ALL
USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))));

DROP POLICY IF EXISTS "Admins can manage color settings" ON public."color_settings";
CREATE POLICY "Admins can manage color settings" ON public."color_settings" FOR ALL
USING ((( SELECT users.role
   FROM users
  WHERE (users.id = ( SELECT (select auth.uid()) AS uid))
 LIMIT 1) = ANY (ARRAY['admin'::text, 'admin_master'::text])))
WITH CHECK ((( SELECT users.role
   FROM users
  WHERE (users.id = ( SELECT (select auth.uid()) AS uid))
 LIMIT 1) = ANY (ARRAY['admin'::text, 'admin_master'::text])));

DROP POLICY IF EXISTS "Users can update their branch variance reports" ON public."inventory_variance_reports";
CREATE POLICY "Users can update their branch variance reports" ON public."inventory_variance_reports" FOR ALL
USING (((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (( SELECT users.role
   FROM users
  WHERE (users.id = (select auth.uid()))) = 'admin_master'::text) OR ((( SELECT users.role
   FROM users
  WHERE (users.id = (select auth.uid()))) = 'admin_company'::text) AND (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))))))
WITH CHECK (((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (( SELECT users.role
   FROM users
  WHERE (users.id = (select auth.uid()))) = 'admin_master'::text) OR ((( SELECT users.role
   FROM users
  WHERE (users.id = (select auth.uid()))) = 'admin_company'::text) AND (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))))));

DROP POLICY IF EXISTS "Admins can manage transaction types" ON public."transaction_types";
CREATE POLICY "Admins can manage transaction types" ON public."transaction_types" FOR ALL
USING ((( SELECT users.role
   FROM users
  WHERE (users.id = ( SELECT (select auth.uid()) AS uid))
 LIMIT 1) = ANY (ARRAY['admin'::text, 'admin_master'::text])))
WITH CHECK ((( SELECT users.role
   FROM users
  WHERE (users.id = ( SELECT (select auth.uid()) AS uid))
 LIMIT 1) = ANY (ARRAY['admin'::text, 'admin_master'::text])));

DROP POLICY IF EXISTS "Users can delete backup history for their company" ON public."backup_history";
CREATE POLICY "Users can delete backup history for their company" ON public."backup_history" FOR ALL
USING ((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))));

DROP POLICY IF EXISTS "Users can delete their branch variance reports" ON public."inventory_variance_reports";
CREATE POLICY "Users can delete their branch variance reports" ON public."inventory_variance_reports" FOR ALL
USING (((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (( SELECT users.role
   FROM users
  WHERE (users.id = (select auth.uid()))) = 'admin_master'::text) OR ((( SELECT users.role
   FROM users
  WHERE (users.id = (select auth.uid()))) = 'admin_company'::text) AND (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))))));

DROP POLICY IF EXISTS "inventory_movements_select_policy" ON public."inventory_movements";
CREATE POLICY "inventory_movements_select_policy" ON public."inventory_movements" FOR ALL
USING (((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))));

DROP POLICY IF EXISTS "inventory_movements_update_policy" ON public."inventory_movements";
CREATE POLICY "inventory_movements_update_policy" ON public."inventory_movements" FOR ALL
USING (((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))))
WITH CHECK (((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))));

DROP POLICY IF EXISTS "Users can view their company branches" ON public."branches";
CREATE POLICY "Users can view their company branches" ON public."branches" FOR ALL
USING ((((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) AND (( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid()))) IS NULL)) OR ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) AND (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid()))))) OR (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid()))))));

DROP POLICY IF EXISTS "inventory_balance_snapshots_select_policy" ON public."inventory_balance_snapshots";
CREATE POLICY "inventory_balance_snapshots_select_policy" ON public."inventory_balance_snapshots" FOR ALL
USING (((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))));

DROP POLICY IF EXISTS "inventory_balance_snapshots_update_policy" ON public."inventory_balance_snapshots";
CREATE POLICY "inventory_balance_snapshots_update_policy" ON public."inventory_balance_snapshots" FOR ALL
USING (((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))))
WITH CHECK (((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))));

DROP POLICY IF EXISTS "stock_count_entries_select_policy" ON public."stock_count_entries";
CREATE POLICY "stock_count_entries_select_policy" ON public."stock_count_entries" FOR ALL
USING (((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))));

DROP POLICY IF EXISTS "stock_count_entries_update_policy" ON public."stock_count_entries";
CREATE POLICY "stock_count_entries_update_policy" ON public."stock_count_entries" FOR ALL
USING (((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))))
WITH CHECK (((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))));

DROP POLICY IF EXISTS "Admin Company can manage company branches" ON public."branches";
CREATE POLICY "Admin Company can manage company branches" ON public."branches" FOR ALL
USING (((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text)))) AND (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid()))))));

DROP POLICY IF EXISTS "Users can view their company transaction types" ON public."transaction_types";
CREATE POLICY "Users can view their company transaction types" ON public."transaction_types" FOR ALL
USING ((((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) AND (( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid()))) IS NULL)) OR ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) AND (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid()))))) OR (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid()))))));

DROP POLICY IF EXISTS "Users can manage their company transaction types" ON public."transaction_types";
CREATE POLICY "Users can manage their company transaction types" ON public."transaction_types" FOR ALL
USING (((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text)))) AND (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))))));

DROP POLICY IF EXISTS "Users can view their company customer fields" ON public."customer_fields";
CREATE POLICY "Users can view their company customer fields" ON public."customer_fields" FOR ALL
USING ((((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) AND (( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid()))) IS NULL)) OR ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) AND (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid()))))) OR (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid()))))));

DROP POLICY IF EXISTS "export_logs_select_policy" ON public."export_logs";
CREATE POLICY "export_logs_select_policy" ON public."export_logs" FOR ALL
USING (((user_id = (select auth.uid())) OR (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))));

DROP POLICY IF EXISTS "export_logs_update_policy" ON public."export_logs";
CREATE POLICY "export_logs_update_policy" ON public."export_logs" FOR ALL
USING (((user_id = (select auth.uid())) OR (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))))
WITH CHECK (((user_id = (select auth.uid())) OR (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))));

DROP POLICY IF EXISTS "Users can manage their company customer fields" ON public."customer_fields";
CREATE POLICY "Users can manage their company customer fields" ON public."customer_fields" FOR ALL
USING (((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text)))) AND (company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))))));

DROP POLICY IF EXISTS "product_column_settings_select_policy" ON public."product_column_settings";
CREATE POLICY "product_column_settings_select_policy" ON public."product_column_settings" FOR ALL
USING (((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))));

DROP POLICY IF EXISTS "product_column_settings_update_policy" ON public."product_column_settings";
CREATE POLICY "product_column_settings_update_policy" ON public."product_column_settings" FOR ALL
USING (((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'branch_manager'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))))
WITH CHECK (((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'branch_manager'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid())))))))));

DROP POLICY IF EXISTS "Users can manage their company bank accounts" ON public."bank_accounts";
CREATE POLICY "Users can manage their company bank accounts" ON public."bank_accounts" FOR ALL
USING ((check_user_role((select auth.uid()), 'admin_master'::text) OR (company_id = get_user_company_id((select auth.uid())))))
WITH CHECK ((check_user_role((select auth.uid()), 'admin_master'::text) OR (company_id = get_user_company_id((select auth.uid())))));

