-- Add CRUD RLS policies for child tables that lack a company_id column
-- Uses parent-table company_id joins to enforce multi-tenant scoping.

-- Note: approval_logs is handled in a separate migration because it has no declared FK and needs its own company_id column.
-- Framework-method (fm_*) tables, global lookup tables (color_settings, product_column_presets),
-- companies, and user_preferences are intentionally excluded per project audit scope.

DROP POLICY IF EXISTS "Users can modify accounting_transaction_lines" ON "public"."accounting_transaction_lines";
DROP POLICY IF EXISTS "Users can view accounting_transaction_lines" ON "public"."accounting_transaction_lines";

CREATE POLICY "Users can view accounting_transaction_lines" ON "public"."accounting_transaction_lines"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."accounting_transactions" p WHERE p."id" = "public"."accounting_transaction_lines"."transaction_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert accounting_transaction_lines" ON "public"."accounting_transaction_lines"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."accounting_transactions" p WHERE p."id" = "public"."accounting_transaction_lines"."transaction_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update accounting_transaction_lines" ON "public"."accounting_transaction_lines"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."accounting_transactions" p WHERE p."id" = "public"."accounting_transaction_lines"."transaction_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete accounting_transaction_lines" ON "public"."accounting_transaction_lines"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."accounting_transactions" p WHERE p."id" = "public"."accounting_transaction_lines"."transaction_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users can manage employee_kpis" ON "public"."employee_kpis";
DROP POLICY IF EXISTS "Users can view employee_kpis" ON "public"."employee_kpis";

CREATE POLICY "Users can view employee_kpis" ON "public"."employee_kpis"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."employees" p WHERE p."id" = "public"."employee_kpis"."employee_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert employee_kpis" ON "public"."employee_kpis"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."employees" p WHERE p."id" = "public"."employee_kpis"."employee_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update employee_kpis" ON "public"."employee_kpis"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."employees" p WHERE p."id" = "public"."employee_kpis"."employee_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete employee_kpis" ON "public"."employee_kpis"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."employees" p WHERE p."id" = "public"."employee_kpis"."employee_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users can manage employee_shifts" ON "public"."employee_shifts";
DROP POLICY IF EXISTS "Users can view employee_shifts" ON "public"."employee_shifts";

CREATE POLICY "Users can view employee_shifts" ON "public"."employee_shifts"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."employees" p WHERE p."id" = "public"."employee_shifts"."employee_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert employee_shifts" ON "public"."employee_shifts"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."employees" p WHERE p."id" = "public"."employee_shifts"."employee_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update employee_shifts" ON "public"."employee_shifts"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."employees" p WHERE p."id" = "public"."employee_shifts"."employee_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete employee_shifts" ON "public"."employee_shifts"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."employees" p WHERE p."id" = "public"."employee_shifts"."employee_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users can view goods_receipt_items" ON "public"."goods_receipt_items";

CREATE POLICY "Users can view goods_receipt_items" ON "public"."goods_receipt_items"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."goods_receipts" p WHERE p."id" = "public"."goods_receipt_items"."gr_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert goods_receipt_items" ON "public"."goods_receipt_items"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."goods_receipts" p WHERE p."id" = "public"."goods_receipt_items"."gr_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update goods_receipt_items" ON "public"."goods_receipt_items"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."goods_receipts" p WHERE p."id" = "public"."goods_receipt_items"."gr_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete goods_receipt_items" ON "public"."goods_receipt_items"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."goods_receipts" p WHERE p."id" = "public"."goods_receipt_items"."gr_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users can manage key_results" ON "public"."key_results";
DROP POLICY IF EXISTS "Users can view key_results" ON "public"."key_results";

CREATE POLICY "Users can view key_results" ON "public"."key_results"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."objectives" p WHERE p."id" = "public"."key_results"."objective_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert key_results" ON "public"."key_results"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."objectives" p WHERE p."id" = "public"."key_results"."objective_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update key_results" ON "public"."key_results"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."objectives" p WHERE p."id" = "public"."key_results"."objective_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete key_results" ON "public"."key_results"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."objectives" p WHERE p."id" = "public"."key_results"."objective_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users can join groups in their company" ON "public"."operation_chat_members";
DROP POLICY IF EXISTS "Users can view members in their groups" ON "public"."operation_chat_members";

CREATE POLICY "Users can view operation_chat_members" ON "public"."operation_chat_members"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."operation_chat_groups" p WHERE p."id" = "public"."operation_chat_members"."group_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert operation_chat_members" ON "public"."operation_chat_members"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."operation_chat_groups" p WHERE p."id" = "public"."operation_chat_members"."group_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update operation_chat_members" ON "public"."operation_chat_members"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."operation_chat_groups" p WHERE p."id" = "public"."operation_chat_members"."group_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete operation_chat_members" ON "public"."operation_chat_members"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."operation_chat_groups" p WHERE p."id" = "public"."operation_chat_members"."group_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users can send messages in their groups" ON "public"."operation_chat_messages";
DROP POLICY IF EXISTS "Users can view messages in their company" ON "public"."operation_chat_messages";

CREATE POLICY "Users can view operation_chat_messages" ON "public"."operation_chat_messages"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."operation_chat_groups" p WHERE p."id" = "public"."operation_chat_messages"."group_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert operation_chat_messages" ON "public"."operation_chat_messages"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."operation_chat_groups" p WHERE p."id" = "public"."operation_chat_messages"."group_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update operation_chat_messages" ON "public"."operation_chat_messages"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."operation_chat_groups" p WHERE p."id" = "public"."operation_chat_messages"."group_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete operation_chat_messages" ON "public"."operation_chat_messages"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."operation_chat_groups" p WHERE p."id" = "public"."operation_chat_messages"."group_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Admin/Manager can manage materials" ON "public"."operation_training_materials";
DROP POLICY IF EXISTS "Users can view materials for their courses" ON "public"."operation_training_materials";

CREATE POLICY "Users can view operation_training_materials" ON "public"."operation_training_materials"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."operation_training_courses" p WHERE p."id" = "public"."operation_training_materials"."course_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert operation_training_materials" ON "public"."operation_training_materials"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."operation_training_courses" p WHERE p."id" = "public"."operation_training_materials"."course_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update operation_training_materials" ON "public"."operation_training_materials"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."operation_training_courses" p WHERE p."id" = "public"."operation_training_materials"."course_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete operation_training_materials" ON "public"."operation_training_materials"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."operation_training_courses" p WHERE p."id" = "public"."operation_training_materials"."course_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users can insert their own progress" ON "public"."operation_training_progress";
DROP POLICY IF EXISTS "Users can update their own progress" ON "public"."operation_training_progress";
DROP POLICY IF EXISTS "Users can view all progress in their company" ON "public"."operation_training_progress";

CREATE POLICY "Users can view operation_training_progress" ON "public"."operation_training_progress"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."operation_training_courses" p WHERE p."id" = "public"."operation_training_progress"."course_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert operation_training_progress" ON "public"."operation_training_progress"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."operation_training_courses" p WHERE p."id" = "public"."operation_training_progress"."course_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update operation_training_progress" ON "public"."operation_training_progress"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."operation_training_courses" p WHERE p."id" = "public"."operation_training_progress"."course_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete operation_training_progress" ON "public"."operation_training_progress"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."operation_training_courses" p WHERE p."id" = "public"."operation_training_progress"."course_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Admin/Manager can manage questions" ON "public"."operation_training_questions";
DROP POLICY IF EXISTS "Users can view questions for their materials" ON "public"."operation_training_questions";

CREATE POLICY "Users can view operation_training_questions" ON "public"."operation_training_questions"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."operation_training_materials" p WHERE p."id" = "public"."operation_training_questions"."material_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert operation_training_questions" ON "public"."operation_training_questions"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."operation_training_materials" p WHERE p."id" = "public"."operation_training_questions"."material_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update operation_training_questions" ON "public"."operation_training_questions"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."operation_training_materials" p WHERE p."id" = "public"."operation_training_questions"."material_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete operation_training_questions" ON "public"."operation_training_questions"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."operation_training_materials" p WHERE p."id" = "public"."operation_training_questions"."material_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users can manage payroll_items" ON "public"."payroll_items";
DROP POLICY IF EXISTS "Users can view payroll_items" ON "public"."payroll_items";

CREATE POLICY "Users can view payroll_items" ON "public"."payroll_items"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."payrolls" p WHERE p."id" = "public"."payroll_items"."payroll_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert payroll_items" ON "public"."payroll_items"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."payrolls" p WHERE p."id" = "public"."payroll_items"."payroll_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update payroll_items" ON "public"."payroll_items"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."payrolls" p WHERE p."id" = "public"."payroll_items"."payroll_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete payroll_items" ON "public"."payroll_items"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."payrolls" p WHERE p."id" = "public"."payroll_items"."payroll_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users can view po_items" ON "public"."po_items";

CREATE POLICY "Users can view po_items" ON "public"."po_items"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."purchase_orders" p WHERE p."id" = "public"."po_items"."po_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert po_items" ON "public"."po_items"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."purchase_orders" p WHERE p."id" = "public"."po_items"."po_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update po_items" ON "public"."po_items"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."purchase_orders" p WHERE p."id" = "public"."po_items"."po_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete po_items" ON "public"."po_items"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."purchase_orders" p WHERE p."id" = "public"."po_items"."po_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users with inventory access can view product conversions" ON "public"."product_conversions";

CREATE POLICY "Users can view product_conversions" ON "public"."product_conversions"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."products" p WHERE p."id" = "public"."product_conversions"."product_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert product_conversions" ON "public"."product_conversions"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."products" p WHERE p."id" = "public"."product_conversions"."product_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update product_conversions" ON "public"."product_conversions"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."products" p WHERE p."id" = "public"."product_conversions"."product_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete product_conversions" ON "public"."product_conversions"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."products" p WHERE p."id" = "public"."product_conversions"."product_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "order_items_insert" ON "public"."sales_order_items";
DROP POLICY IF EXISTS "order_items_select" ON "public"."sales_order_items";
DROP POLICY IF EXISTS "order_items_update" ON "public"."sales_order_items";

CREATE POLICY "Users can view sales_order_items" ON "public"."sales_order_items"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."sales_orders" p WHERE p."id" = "public"."sales_order_items"."order_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert sales_order_items" ON "public"."sales_order_items"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."sales_orders" p WHERE p."id" = "public"."sales_order_items"."order_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update sales_order_items" ON "public"."sales_order_items"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."sales_orders" p WHERE p."id" = "public"."sales_order_items"."order_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete sales_order_items" ON "public"."sales_order_items"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."sales_orders" p WHERE p."id" = "public"."sales_order_items"."order_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

DROP POLICY IF EXISTS "Users with inventory access can create stock check items" ON "public"."stock_check_items";
DROP POLICY IF EXISTS "Users with inventory access can view stock check items" ON "public"."stock_check_items";

CREATE POLICY "Users can view stock_check_items" ON "public"."stock_check_items"
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM "public"."stock_check_prints" p WHERE p."id" = "public"."stock_check_items"."stock_check_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can insert stock_check_items" ON "public"."stock_check_items"
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "public"."stock_check_prints" p WHERE p."id" = "public"."stock_check_items"."stock_check_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update stock_check_items" ON "public"."stock_check_items"
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "public"."stock_check_prints" p WHERE p."id" = "public"."stock_check_items"."stock_check_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete stock_check_items" ON "public"."stock_check_items"
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM "public"."stock_check_prints" p WHERE p."id" = "public"."stock_check_items"."stock_check_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));
