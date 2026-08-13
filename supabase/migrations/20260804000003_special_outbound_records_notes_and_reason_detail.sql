-- Add columns the Special Outbound form expects but the schema was missing,
-- so the app can persist notes and detailed reason text.
ALTER TABLE "public"."special_outbound_records"
  ADD COLUMN IF NOT EXISTS "notes" "text";

ALTER TABLE "public"."special_outbound_records"
  ADD COLUMN IF NOT EXISTS "reason_detail" "text";
