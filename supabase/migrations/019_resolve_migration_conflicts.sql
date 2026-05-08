-- Migration: 019_resolve_migration_conflicts.sql
-- Description: Resolve conflicts between duplicate migration files
-- Date: 2026-05-08
-- Issues:
--   1. 007 and 017 both create inventory_movements with different schemas
--   2. 015 and 018 both create/export_logs with different schemas

-- Step 1: Drop tables from migration 007 (old schema) if they exist
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.inventory_balance_snapshots CASCADE;
DROP TABLE IF EXISTS public.stock_count_entries CASCADE;

-- Step 2: Drop functions to avoid conflicts
DROP FUNCTION IF EXISTS update_export_duration() CASCADE;
DROP FUNCTION IF EXISTS get_export_statistics(UUID, DATE, DATE) CASCADE;

-- Step 3: Drop old export_logs table if it exists
DROP TABLE IF EXISTS public.export_logs CASCADE;

-- Note: Tables will be recreated by migrations 017 and 018
-- This migration ensures clean state before applying those migrations
