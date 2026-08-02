-- ============================================================================
-- 003_fix_user_sync_and_audit.sql
-- Fixes 3 issues found on 2026-08-02 during E2E production verification:
--
-- 1. audit_logs table missing: superapp-api's ensureAuditTable() failed
--    because user `superapp` had wrong password. After fixing the password,
--    the table was created. This migration makes the table creation
--    idempotent and explicit so a fresh DB doesn't depend on the API server
--    startup. The API server's CREATE TABLE IF NOT EXISTS is still the
--    primary path; this is a safety net.
--
-- 2. auth.users missing raw_user_meta_data / raw_app_meta_data columns:
--    admin-sync.js and auth-sync.js (webhook routes) use the Supabase cloud
--    column names `raw_user_meta_data` / `raw_app_meta_data`, while the
--    local schema in 001 used `user_metadata` / `app_metadata`. Add both
--    columns so both code paths work. Backfill from user_metadata.
--
-- 3. public.users.role was TEXT; admin-sync.js casts `$4::user_role` which
--    requires a custom ENUM type. Create the type and migrate the column.
--    The 5 valid roles match the API server's validRoles list.
-- ============================================================================

-- ── 1. audit_logs (safety net; API server also creates this on startup) ──
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id         SERIAL PRIMARY KEY,
    user_id    UUID NOT NULL,
    action     TEXT NOT NULL,
    table_name TEXT NOT NULL,
    payload    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ── 2. auth.users: add Supabase-cloud column names for webhook sync ──
ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS raw_app_meta_data  JSONB DEFAULT '{}'::jsonb;

-- Backfill raw_* from the local-named columns for existing rows
UPDATE auth.users
SET raw_user_meta_data = user_metadata
WHERE raw_user_meta_data = '{}'::jsonb AND user_metadata IS NOT NULL;

-- ── 3. public.users.role: TEXT → user_role ENUM ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'admin_master', 'admin_company', 'branch_manager', 'staff');
  END IF;
END $$;

-- Migrate the column type (drop default first, cast, restore default)
ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'staff'::user_role;

-- ── 4. Grant superapp user full privileges on all tables/sequences ──
-- The API server connects as `superapp`; without these grants it gets
-- "permission denied for table users" when upserting user records.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO superapp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO superapp;
GRANT ALL PRIVILEGES ON SCHEMA public TO superapp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO superapp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO superapp;
GRANT ALL PRIVILEGES ON SCHEMA auth TO superapp;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO superapp;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO superapp;
