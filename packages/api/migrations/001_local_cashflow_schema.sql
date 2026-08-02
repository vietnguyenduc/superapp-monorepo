-- ============================================================================
-- 001_local_cashflow_schema.sql
-- Local InsForge Postgres schema for the Cashflow app (530 fix / hướng B).
--
-- Design decisions (verified against the running apps on 2026-07-31):
--   * All `id` columns are TEXT PRIMARY KEY, NOT UUID. The app generates
--     ids like `payment` (transaction_types), `txn-<ts>-<rand>` (transactions)
--     and `cust-<ts>-<rand>` (customers). A UUID column rejects these with
--     `invalid input syntax for type uuid` — the very class of 530 errors we
--     are eliminating. TEXT accepts both real UUIDs and legacy prefixed ids.
--   * No foreign keys: legacy rows may reference ids that do not exist yet
--     (e.g. bank_account.branch_id = 'trial-branch'), so FKs would make
--     inserts fail. The app layer owns referential integrity.
--   * transactions.transaction_code is NOT unique: the app generates
--     `TXN<Date.now()>` at millisecond precision — two rows in the same ms
--     would violate UNIQUE and fail the insert.
--   * Column sets are a superset of what the app reads/writes today, taken
--     from the Supabase migrations (001, 006, 008, 010, 025) and the service
--     transform functions (apps/cashflow/src/services/businessLogic/transformation.ts).
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS auth;

-- Minimal mirror of Supabase auth.users so future webhook sync has a target.
-- Auth itself stays on Supabase cloud; this table is only for local lookups.
CREATE TABLE IF NOT EXISTS auth.users (
    id                  TEXT PRIMARY KEY,
    email               TEXT,
    user_metadata       JSONB DEFAULT '{}'::jsonb,
    app_metadata        JSONB DEFAULT '{}'::jsonb,
    raw_user_meta_data  JSONB DEFAULT '{}'::jsonb,
    raw_app_meta_data   JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.companies (
    id         TEXT PRIMARY KEY,
    code       TEXT,
    name       TEXT,
    logo_url   TEXT,
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_role ENUM: must match admin-sync.js validRoles list.
-- Created before public.users so the column can reference it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'admin_master', 'admin_company', 'branch_manager', 'staff');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
    id                TEXT PRIMARY KEY,
    company_id        TEXT,
    branch_id         TEXT,
    email             TEXT,
    full_name         TEXT,
    phone             TEXT,
    position          TEXT,
    role              user_role DEFAULT 'staff',
    staff_permissions JSONB DEFAULT '{}'::jsonb,
    app_permissions   JSONB DEFAULT '{}'::jsonb,
    can_delete        BOOLEAN DEFAULT TRUE,
    is_active         BOOLEAN DEFAULT TRUE,
    is_trial          BOOLEAN DEFAULT FALSE,
    trial_ends_at     TIMESTAMPTZ,
    otp_code          TEXT,
    otp_attempts      INTEGER DEFAULT 0,
    otp_expires_at    TIMESTAMPTZ,
    telegram_id       TEXT,
    created_by        TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.branches (
    id         TEXT PRIMARY KEY,
    company_id TEXT,
    code       TEXT,
    name       TEXT,
    address    TEXT,
    phone      TEXT,
    email      TEXT,
    manager_id TEXT,
    is_active  BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id             TEXT PRIMARY KEY,
    company_id     TEXT,
    branch_id      TEXT,
    account_number TEXT,
    account_name   TEXT,
    bank_name      TEXT,
    balance        NUMERIC(15,2) DEFAULT 0,
    is_active      BOOLEAN DEFAULT TRUE,
    created_by     TEXT,
    updated_by     TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
    id              TEXT PRIMARY KEY,
    company_id      TEXT,
    branch_id       TEXT,
    customer_code   TEXT,
    full_name       TEXT NOT NULL,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    nguoi_dai_dien  TEXT,
    opening_balance NUMERIC(15,2) DEFAULT 0,
    total_balance   NUMERIC(15,2) DEFAULT 0,
    created_by      TEXT,
    updated_by      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT customers_company_code_unique UNIQUE (company_id, customer_code)
);

CREATE TABLE IF NOT EXISTS public.transaction_types (
    id           TEXT PRIMARY KEY,
    company_id   TEXT,
    name         TEXT NOT NULL,
    color        TEXT DEFAULT 'blue',
    math_factor  INTEGER DEFAULT 1,
    impact_type  TEXT DEFAULT 'increase',
    is_active    BOOLEAN DEFAULT TRUE,
    created_by   TEXT,
    updated_by   TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id               TEXT PRIMARY KEY,
    company_id       TEXT,
    branch_id        TEXT,
    customer_id      TEXT,
    bank_account_id  TEXT,
    transaction_code TEXT,
    transaction_type TEXT,
    amount           NUMERIC(15,2) NOT NULL,
    description      TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_by       TEXT,
    updated_by       TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.color_settings (
    id            TEXT PRIMARY KEY,
    setting_key   TEXT NOT NULL,
    setting_value JSONB DEFAULT '{}'::jsonb,
    description   TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT color_settings_key_unique UNIQUE (setting_key)
);

CREATE TABLE IF NOT EXISTS public.backup_history (
    id                  TEXT PRIMARY KEY,
    company_id          TEXT,
    branch_id           TEXT,
    backup_name         TEXT,
    backup_version      TEXT,
    backup_timestamp    TIMESTAMPTZ,
    backup_format       TEXT,
    backup_size         NUMERIC,
    created_by          TEXT,
    total_customers     INTEGER,
    total_transactions  INTEGER,
    total_bank_accounts INTEGER,
    total_branches      INTEGER,
    notes               TEXT,
    is_restorable       BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Grant the `superapp` DB user full privileges so the API server
-- (which connects as `superapp`) can read/write all tables.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO superapp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO superapp;
GRANT ALL PRIVILEGES ON SCHEMA public TO superapp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO superapp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO superapp;
GRANT ALL PRIVILEGES ON SCHEMA auth TO superapp;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO superapp;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO superapp;
