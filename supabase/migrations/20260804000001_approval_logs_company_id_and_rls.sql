-- Add company_id to approval_logs and scope RLS by tenant
-- Addresses schema-health finding: approval_logs did not scope by company_id.

-- 1. Add denormalized company_id column (nullable so existing rows can be backfilled)
ALTER TABLE "public"."approval_logs"
  ADD COLUMN IF NOT EXISTS "company_id" "uuid";

-- 2. Backfill company_id from the referenced special outbound record
UPDATE "public"."approval_logs" al
SET "company_id" = sor."company_id"
FROM "public"."special_outbound_records" sor
WHERE al."record_id" = sor."id"
  AND (al."record_type" = 'special_outbound' OR al."record_type" IS NULL)
  AND al."company_id" IS NULL;

-- 3. Fall back to the user's company for any remaining rows
UPDATE "public"."approval_logs" al
SET "company_id" = u."company_id"
FROM "public"."users" u
WHERE al."user_id" = u."id"
  AND al."company_id" IS NULL;

-- 4. Add foreign key constraint to companies
ALTER TABLE "public"."approval_logs"
  ADD CONSTRAINT "approval_logs_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id")
  ON DELETE SET NULL;

-- 5. Trigger to auto-populate company_id on insert/update from the referenced record or user
CREATE OR REPLACE FUNCTION "public"."set_approval_logs_company_id"()
RETURNS "trigger" AS $$
BEGIN
  IF NEW."company_id" IS NULL THEN
    IF NEW."record_type" = 'special_outbound' THEN
      SELECT "company_id" INTO NEW."company_id"
      FROM "public"."special_outbound_records"
      WHERE "id" = NEW."record_id";
    END IF;

    IF NEW."company_id" IS NULL THEN
      SELECT "company_id" INTO NEW."company_id"
      FROM "public"."users"
      WHERE "id" = NEW."user_id";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE "plpgsql" SECURITY DEFINER;

DROP TRIGGER IF EXISTS "trg_set_approval_logs_company_id" ON "public"."approval_logs";
CREATE TRIGGER "trg_set_approval_logs_company_id"
  BEFORE INSERT OR UPDATE ON "public"."approval_logs"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_approval_logs_company_id"();

-- 6. Drop old un-scoped policies
DROP POLICY IF EXISTS "Users with inventory access can create approval logs" ON "public"."approval_logs";
DROP POLICY IF EXISTS "Users with inventory access can view approval logs" ON "public"."approval_logs";

-- 7. Create tenant-scoped policies
CREATE POLICY "Users can view company approval logs" ON "public"."approval_logs"
  FOR SELECT
  USING (
    "public"."has_app_access"("auth"."uid"(), 'inventory')
    AND (
      "company_id" = "public"."get_user_company_id"("auth"."uid"())
      OR "public"."check_user_role"("auth"."uid"(), 'admin_master')
    )
  );

CREATE POLICY "Users can insert company approval logs" ON "public"."approval_logs"
  FOR INSERT
  WITH CHECK (
    "public"."has_app_access"("auth"."uid"(), 'inventory')
    AND "company_id" = "public"."get_user_company_id"("auth"."uid"())
    AND "user_id" = "auth"."uid"()
  );

CREATE POLICY "Users can update company approval logs" ON "public"."approval_logs"
  FOR UPDATE
  USING (
    "public"."has_app_access"("auth"."uid"(), 'inventory')
    AND (
      "company_id" = "public"."get_user_company_id"("auth"."uid"())
      OR "public"."check_user_role"("auth"."uid"(), 'admin_master')
    )
  );

CREATE POLICY "Users can delete company approval logs" ON "public"."approval_logs"
  FOR DELETE
  USING (
    "public"."has_app_access"("auth"."uid"(), 'inventory')
    AND (
      "company_id" = "public"."get_user_company_id"("auth"."uid"())
      OR "public"."check_user_role"("auth"."uid"(), 'admin_master')
    )
  );
