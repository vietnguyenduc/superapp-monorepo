-- 1. Add missing search_path to ALL public functions to prevent search_path hijacking
ALTER FUNCTION public.has_app_access(uuid, text) SET search_path = '';
ALTER FUNCTION public.ensure_app_permissions_not_null() SET search_path = '';
ALTER FUNCTION public.get_my_role() SET search_path = '';
ALTER FUNCTION public.get_my_branch_id() SET search_path = '';
ALTER FUNCTION public.update_transaction_types_updated_at() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.is_admin(uuid) SET search_path = '';
ALTER FUNCTION public.is_admin_master(uuid) SET search_path = '';
ALTER FUNCTION public.update_backup_history_updated_at() SET search_path = '';
ALTER FUNCTION public.update_audit_columns() SET search_path = '';
ALTER FUNCTION public.check_user_role(uuid, text) SET search_path = '';
ALTER FUNCTION public.update_inventory_movements_updated_at() SET search_path = '';
ALTER FUNCTION public.get_user_company_id(uuid) SET search_path = '';
ALTER FUNCTION public.update_export_duration() SET search_path = '';
ALTER FUNCTION public.update_product_column_settings_updated_at() SET search_path = '';
ALTER FUNCTION public.handle_inventory_import_transaction() SET search_path = '';
ALTER FUNCTION public.handle_sales_export_transaction() SET search_path = '';
ALTER FUNCTION public.handle_inventory_cancellation() SET search_path = '';
ALTER FUNCTION public.handle_sales_cancellation() SET search_path = '';
ALTER FUNCTION public.update_customer_stats_on_order() SET search_path = '';
ALTER FUNCTION public.handle_sales_order_transaction() SET search_path = '';

-- 2. Revoke execution from anon for SECURITY DEFINER functions that shouldn't be publicly accessible
REVOKE EXECUTE ON FUNCTION public.has_app_access(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_branch_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_master(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_user_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_company_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_inventory_import_transaction() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_sales_export_transaction() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_inventory_cancellation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_sales_cancellation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_customer_stats_on_order() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_sales_order_transaction() FROM anon;

-- 3. Fix overly permissive RLS policies on sales_orders and sales_order_items
-- sales_orders
DROP POLICY IF EXISTS "sales_orders_select" ON public.sales_orders;
DROP POLICY IF EXISTS "sales_orders_insert" ON public.sales_orders;
DROP POLICY IF EXISTS "sales_orders_update" ON public.sales_orders;

CREATE POLICY "sales_orders_select" ON public.sales_orders FOR SELECT USING (
  company_id = public.get_user_company_id((select auth.uid()))
);

CREATE POLICY "sales_orders_insert" ON public.sales_orders FOR INSERT WITH CHECK (
  company_id = public.get_user_company_id((select auth.uid()))
);

CREATE POLICY "sales_orders_update" ON public.sales_orders FOR UPDATE USING (
  company_id = public.get_user_company_id((select auth.uid()))
);

-- sales_order_items
DROP POLICY IF EXISTS "order_items_select" ON public.sales_order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.sales_order_items;
DROP POLICY IF EXISTS "order_items_update" ON public.sales_order_items;

CREATE POLICY "order_items_select" ON public.sales_order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sales_orders so 
    WHERE so.id = order_id AND so.company_id = public.get_user_company_id((select auth.uid()))
  )
);

CREATE POLICY "order_items_insert" ON public.sales_order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales_orders so 
    WHERE so.id = order_id AND so.company_id = public.get_user_company_id((select auth.uid()))
  )
);

CREATE POLICY "order_items_update" ON public.sales_order_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.sales_orders so 
    WHERE so.id = order_id AND so.company_id = public.get_user_company_id((select auth.uid()))
  )
);
