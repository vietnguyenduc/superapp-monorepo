-- Migration: 20260804000005_fix_chat_training_rls.sql
-- Description: Tighten RLS policies on operation_chat_messages and
--              operation_training_progress so users can only write their own
--              data, and chat message insertion requires group membership.
-- Date: 2026-08-04

-- operation_chat_messages
DROP POLICY IF EXISTS "Users can insert operation_chat_messages" ON "public"."operation_chat_messages";
DROP POLICY IF EXISTS "Users can update operation_chat_messages" ON "public"."operation_chat_messages";
DROP POLICY IF EXISTS "Users can delete operation_chat_messages" ON "public"."operation_chat_messages";

CREATE POLICY "Users can insert operation_chat_messages" ON "public"."operation_chat_messages"
  FOR INSERT
  WITH CHECK (
    (EXISTS (SELECT 1 FROM "public"."operation_chat_groups" p WHERE p."id" = "public"."operation_chat_messages"."group_id" AND p."company_id" = "public"."get_user_company_id"("auth"."uid"())))
    AND
    ((EXISTS (SELECT 1 FROM "public"."operation_chat_members" m WHERE m."group_id" = "public"."operation_chat_messages"."group_id" AND m."user_id" = "auth"."uid"()))
     OR "public"."check_user_role"("auth"."uid"(), 'admin_master'))
  );

CREATE POLICY "Users can update operation_chat_messages" ON "public"."operation_chat_messages"
  FOR UPDATE
  USING (("public"."operation_chat_messages"."user_id" = "auth"."uid"()) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete operation_chat_messages" ON "public"."operation_chat_messages"
  FOR DELETE
  USING (("public"."operation_chat_messages"."user_id" = "auth"."uid"()) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

-- operation_training_progress
DROP POLICY IF EXISTS "Users can insert operation_training_progress" ON "public"."operation_training_progress";
DROP POLICY IF EXISTS "Users can update operation_training_progress" ON "public"."operation_training_progress";
DROP POLICY IF EXISTS "Users can delete operation_training_progress" ON "public"."operation_training_progress";

CREATE POLICY "Users can insert operation_training_progress" ON "public"."operation_training_progress"
  FOR INSERT
  WITH CHECK (("public"."operation_training_progress"."user_id" = "auth"."uid"()) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can update operation_training_progress" ON "public"."operation_training_progress"
  FOR UPDATE
  USING (("public"."operation_training_progress"."user_id" = "auth"."uid"()) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));

CREATE POLICY "Users can delete operation_training_progress" ON "public"."operation_training_progress"
  FOR DELETE
  USING (("public"."operation_training_progress"."user_id" = "auth"."uid"()) OR "public"."check_user_role"("auth"."uid"(), 'admin_master'));
