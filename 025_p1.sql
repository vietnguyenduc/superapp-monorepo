-- Fix auth_rls_initplan issues by wrapping auth.uid() in scalar subqueries

DROP POLICY IF EXISTS "Users can read own preferences" ON public."user_preferences";
CREATE POLICY "Users can read own preferences" ON public."user_preferences" FOR ALL
USING ((user_id = ( SELECT (select auth.uid()) AS uid)));

DROP POLICY IF EXISTS "Users can update own preferences" ON public."user_preferences";
CREATE POLICY "Users can update own preferences" ON public."user_preferences" FOR ALL
USING ((user_id = ( SELECT (select auth.uid()) AS uid)))
WITH CHECK ((user_id = ( SELECT (select auth.uid()) AS uid)));

DROP POLICY IF EXISTS "Authenticated users can view customer fields" ON public."customer_fields";
CREATE POLICY "Authenticated users can view customer fields" ON public."customer_fields" FOR ALL
USING ((( SELECT (select auth.uid()) AS uid) IS NOT NULL));

DROP POLICY IF EXISTS "users_select_policy" ON public."users";
CREATE POLICY "users_select_policy" ON public."users" FOR ALL
USING ((((select auth.uid()) = id) OR (role = 'admin'::text)));

DROP POLICY IF EXISTS "admin_master can delete backup history for any company" ON public."backup_history";
CREATE POLICY "admin_master can delete backup history for any company" ON public."backup_history" FOR ALL
USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))));

DROP POLICY IF EXISTS "users_update_policy" ON public."users";
CREATE POLICY "users_update_policy" ON public."users" FOR ALL
USING ((((select auth.uid()) = id) OR (role = 'admin'::text)))
WITH CHECK ((((select auth.uid()) = id) OR (role = 'admin'::text)));

DROP POLICY IF EXISTS "users_delete_policy" ON public."users";
CREATE POLICY "users_delete_policy" ON public."users" FOR ALL
USING ((((select auth.uid()) = id) OR (role = 'admin'::text)));

DROP POLICY IF EXISTS "sales_orders_select" ON public."sales_orders";
CREATE POLICY "sales_orders_select" ON public."sales_orders" FOR ALL
USING ((company_id = get_user_company_id(( SELECT (select auth.uid()) AS uid))));

DROP POLICY IF EXISTS "Admin Master can manage companies" ON public."companies";
CREATE POLICY "Admin Master can manage companies" ON public."companies" FOR ALL
USING (check_user_role((select auth.uid()), 'admin_master'::text))
WITH CHECK (check_user_role((select auth.uid()), 'admin_master'::text));

DROP POLICY IF EXISTS "Admin Master can view all customers" ON public."customers";
CREATE POLICY "Admin Master can view all customers" ON public."customers" FOR ALL
USING ((check_user_role((select auth.uid()), 'admin_master'::text) OR (company_id = get_user_company_id((select auth.uid())))));

DROP POLICY IF EXISTS "Admin Master can manage all customers" ON public."customers";
CREATE POLICY "Admin Master can manage all customers" ON public."customers" FOR ALL
USING (check_user_role((select auth.uid()), 'admin_master'::text))
WITH CHECK (check_user_role((select auth.uid()), 'admin_master'::text));

DROP POLICY IF EXISTS "Users can view transaction types" ON public."transaction_types";
CREATE POLICY "Users can view transaction types" ON public."transaction_types" FOR ALL
USING ((EXISTS ( SELECT 1
   FROM users
  WHERE (users.id = (select auth.uid())))));

DROP POLICY IF EXISTS "Admin Company can manage company customers" ON public."customers";
CREATE POLICY "Admin Company can manage company customers" ON public."customers" FOR ALL
USING ((check_user_role((select auth.uid()), 'admin_company'::text) AND (company_id = get_user_company_id((select auth.uid())))))
WITH CHECK ((check_user_role((select auth.uid()), 'admin_company'::text) AND (company_id = get_user_company_id((select auth.uid())))));

DROP POLICY IF EXISTS "Admin Master can view all transactions" ON public."transactions";
CREATE POLICY "Admin Master can view all transactions" ON public."transactions" FOR ALL
USING ((check_user_role((select auth.uid()), 'admin_master'::text) OR (company_id = get_user_company_id((select auth.uid())))));

DROP POLICY IF EXISTS "Admin Master can manage all transactions" ON public."transactions";
CREATE POLICY "Admin Master can manage all transactions" ON public."transactions" FOR ALL
USING (check_user_role((select auth.uid()), 'admin_master'::text))
WITH CHECK (check_user_role((select auth.uid()), 'admin_master'::text));

DROP POLICY IF EXISTS "Admin Company can manage company transactions" ON public."transactions";
CREATE POLICY "Admin Company can manage company transactions" ON public."transactions" FOR ALL
USING ((check_user_role((select auth.uid()), 'admin_company'::text) AND (company_id = get_user_company_id((select auth.uid())))))
WITH CHECK ((check_user_role((select auth.uid()), 'admin_company'::text) AND (company_id = get_user_company_id((select auth.uid())))));

DROP POLICY IF EXISTS "sales_orders_update" ON public."sales_orders";
CREATE POLICY "sales_orders_update" ON public."sales_orders" FOR ALL
USING ((company_id = get_user_company_id(( SELECT (select auth.uid()) AS uid))));

DROP POLICY IF EXISTS "order_items_select" ON public."sales_order_items";
CREATE POLICY "order_items_select" ON public."sales_order_items" FOR ALL
USING ((EXISTS ( SELECT 1
   FROM sales_orders so
  WHERE ((so.id = sales_order_items.order_id) AND (so.company_id = get_user_company_id(( SELECT (select auth.uid()) AS uid)))))));

DROP POLICY IF EXISTS "Users with inventory access can view their branch products" ON public."products";
CREATE POLICY "Users with inventory access can view their branch products" ON public."products" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can update their branch products" ON public."products";
CREATE POLICY "Users with inventory access can update their branch products" ON public."products" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can delete their branch products" ON public."products";
CREATE POLICY "Users with inventory access can delete their branch products" ON public."products" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Admin Master can manage all branches" ON public."branches";
CREATE POLICY "Admin Master can manage all branches" ON public."branches" FOR ALL
USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))));

DROP POLICY IF EXISTS "order_items_update" ON public."sales_order_items";
CREATE POLICY "order_items_update" ON public."sales_order_items" FOR ALL
USING ((EXISTS ( SELECT 1
   FROM sales_orders so
  WHERE ((so.id = sales_order_items.order_id) AND (so.company_id = get_user_company_id(( SELECT (select auth.uid()) AS uid)))))));

DROP POLICY IF EXISTS "Users with inventory access can view their branch inventory rec" ON public."inventory_records";
CREATE POLICY "Users with inventory access can view their branch inventory rec" ON public."inventory_records" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can update their branch inventory r" ON public."inventory_records";
CREATE POLICY "Users with inventory access can update their branch inventory r" ON public."inventory_records" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users can manage their company branches" ON public."branches";
CREATE POLICY "Users can manage their company branches" ON public."branches" FOR ALL
USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND ((users.role = ANY (ARRAY['admin'::text, 'admin_master'::text])) OR (users.company_id = branches.company_id))))))
WITH CHECK ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND ((users.role = ANY (ARRAY['admin'::text, 'admin_master'::text])) OR (users.company_id = branches.company_id))))));

DROP POLICY IF EXISTS "Users with inventory access can delete their branch inventory r" ON public."inventory_records";
CREATE POLICY "Users with inventory access can delete their branch inventory r" ON public."inventory_records" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can view their branch sales records" ON public."sales_records";
CREATE POLICY "Users with inventory access can view their branch sales records" ON public."sales_records" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can update their branch sales recor" ON public."sales_records";
CREATE POLICY "Users with inventory access can update their branch sales recor" ON public."sales_records" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can delete their branch sales recor" ON public."sales_records";
CREATE POLICY "Users with inventory access can delete their branch sales recor" ON public."sales_records" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users can view backup history for their company" ON public."backup_history";
CREATE POLICY "Users can view backup history for their company" ON public."backup_history" FOR ALL
USING ((company_id = ( SELECT users.company_id
   FROM users
  WHERE (users.id = (select auth.uid())))));

DROP POLICY IF EXISTS "admin_master can view all backup history" ON public."backup_history";
CREATE POLICY "admin_master can view all backup history" ON public."backup_history" FOR ALL
USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))));

DROP POLICY IF EXISTS "admin_company can view backup history for their company" ON public."backup_history";
CREATE POLICY "admin_company can view backup history for their company" ON public."backup_history" FOR ALL
USING ((company_id = ( SELECT users.company_id
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text)))));

DROP POLICY IF EXISTS "Users with inventory access can view their branch special outbo" ON public."special_outbound_records";
CREATE POLICY "Users with inventory access can view their branch special outbo" ON public."special_outbound_records" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can update their branch special out" ON public."special_outbound_records";
CREATE POLICY "Users with inventory access can update their branch special out" ON public."special_outbound_records" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users with inventory access can delete their branch special out" ON public."special_outbound_records";
CREATE POLICY "Users with inventory access can delete their branch special out" ON public."special_outbound_records" FOR ALL
USING (((has_app_access((select auth.uid()), 'inventory'::text) = true) AND ((branch_id = ( SELECT users.branch_id
   FROM users
  WHERE (users.id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_master'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.role = 'admin_company'::text) AND (users.company_id = ( SELECT users_1.company_id
           FROM users users_1
          WHERE (users_1.id = (select auth.uid()))))))))));

DROP POLICY IF EXISTS "Users can view own profile" ON public."users";
CREATE POLICY "Users can view own profile" ON public."users" FOR ALL
USING (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Users can update own profile" ON public."users";
CREATE POLICY "Users can update own profile" ON public."users" FOR ALL
USING (((select auth.uid()) = id))
WITH CHECK (((select auth.uid()) = id));

DROP POLICY IF EXISTS "Admin Master can view all users" ON public."users";
CREATE POLICY "Admin Master can view all users" ON public."users" FOR ALL
USING (check_user_role((select auth.uid()), 'admin_master'::text));