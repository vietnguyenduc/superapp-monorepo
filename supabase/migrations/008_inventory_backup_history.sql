-- Migration for inventory backup history table
-- Part of Phase 8 enhancements based on cashflow patterns

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Inventory backup history table
CREATE TABLE IF NOT EXISTS inventory_backup_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  backup_data JSONB NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_backup_data CHECK (backup_data IS NOT NULL)
);

-- Indexes for inventory_backup_history
CREATE INDEX IF NOT EXISTS idx_inventory_backup_history_company ON inventory_backup_history(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_backup_history_created_at ON inventory_backup_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_backup_history_created_by ON inventory_backup_history(created_by);

-- RLS Policies for inventory_backup_history
ALTER TABLE inventory_backup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_backup_history_select_policy ON inventory_backup_history
  FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY inventory_backup_history_insert_policy ON inventory_backup_history
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY inventory_backup_history_delete_policy ON inventory_backup_history
  FOR DELETE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
