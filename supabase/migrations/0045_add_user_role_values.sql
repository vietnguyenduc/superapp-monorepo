-- Migration: 0045_add_user_role_values.sql
-- Description: Add admin_master and admin_company values to the user_role enum
--              in a dedicated migration so later migrations can reference them
--              without hitting "unsafe use of new value" in the same transaction.
-- Date: 2026-08-06

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typtype = 'e') THEN
        BEGIN
            ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin_master';
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;

        BEGIN
            ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin_company';
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END $$;
