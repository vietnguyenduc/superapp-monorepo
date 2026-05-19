# Missing Database Tables Fix Design

## Overview

This document outlines the design and implementation for creating the missing database tables in the inventory-operation application: `inventory_variance_reports` and `export_logs`. These tables are referenced in the code but do not exist in the database schema.

## Current State

### Missing Tables Identified

1. **inventory_variance_reports** - Referenced in `InventoryVarianceReportPage.tsx` and related components
2. **export_logs** - Referenced in export functionality but table does not exist

### Impact
- Variance report functionality is non-functional
- Export audit logging is missing
- Data integrity issues for variance tracking
- No audit trail for export operations

## Table Designs

### 1. inventory_variance_reports Table

**Purpose:** Track inventory variance reports for stock count discrepancies

**Schema:**
```sql
CREATE TABLE inventory_variance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Report metadata
  report_name VARCHAR(255) NOT NULL,
  report_date DATE NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'ad-hoc')),
  
  -- Variance data
  total_products_counted INTEGER NOT NULL DEFAULT 0,
  total_variance_quantity INTEGER NOT NULL DEFAULT 0,
  total_variance_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  variance_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'reviewed', 'approved')),
  
  -- Approval workflow
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  
  -- Additional details
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_inventory_variance_reports_company_id ON inventory_variance_reports(company_id);
CREATE INDEX idx_inventory_variance_reports_branch_id ON inventory_variance_reports(branch_id);
CREATE INDEX idx_inventory_variance_reports_report_date ON inventory_variance_reports(report_date);
CREATE INDEX idx_inventory_variance_reports_status ON inventory_variance_reports(status);
CREATE INDEX idx_inventory_variance_reports_created_at ON inventory_variance_reports(created_at DESC);

-- Comments
COMMENT ON TABLE inventory_variance_reports IS 'Tracks inventory variance reports for stock count discrepancies';
COMMENT ON COLUMN inventory_variance_reports.report_name IS 'Human-readable name for the variance report';
COMMENT ON COLUMN inventory_variance_reports.report_type IS 'Type of report: monthly, quarterly, annual, or ad-hoc';
COMMENT ON COLUMN inventory_variance_reports.total_variance_quantity IS 'Total quantity variance across all products';
COMMENT ON COLUMN inventory_variance_reports.total_variance_value IS 'Total monetary value of variance';
COMMENT ON COLUMN inventory_variance_reports.variance_percentage IS 'Percentage of variance relative to total inventory';
COMMENT ON COLUMN inventory_variance_reports.attachments IS 'Array of attachment metadata (file names, URLs, etc.)';
```

### 2. export_logs Table

**Purpose:** Audit log for all export operations in the system

**Schema:**
```sql
CREATE TABLE export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Export metadata
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN (
    'inventory_records',
    'products',
    'movements',
    'variance_reports',
    'sales_reports',
    'stock_check',
    'custom'
  )),
  export_format VARCHAR(20) NOT NULL CHECK (export_format IN ('xlsx', 'csv', 'json', 'pdf')),
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT, -- Size in bytes
  
  -- Export parameters
  export_parameters JSONB DEFAULT '{}'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  
  -- Export results
  records_exported INTEGER NOT NULL DEFAULT 0,
  export_status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (export_status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  
  -- File storage
  file_url TEXT,
  file_path TEXT,
  storage_provider VARCHAR(50) DEFAULT 'local', -- 'local', 's3', 'gcs', etc.
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional metadata
  ip_address INET,
  user_agent TEXT
);

-- Indexes
CREATE INDEX idx_export_logs_company_id ON export_logs(company_id);
CREATE INDEX idx_export_logs_branch_id ON export_logs(branch_id);
CREATE INDEX idx_export_logs_user_id ON export_logs(user_id);
CREATE INDEX idx_export_logs_export_type ON export_logs(export_type);
CREATE INDEX idx_export_logs_export_status ON export_logs(export_status);
CREATE INDEX idx_export_logs_created_at ON export_logs(created_at DESC);
CREATE INDEX idx_export_logs_expires_at ON export_logs(expires_at) WHERE expires_at IS NOT NULL;

-- Comments
COMMENT ON TABLE export_logs IS 'Audit log for all export operations in the system';
COMMENT ON COLUMN export_logs.export_type IS 'Type of data exported';
COMMENT ON COLUMN export_logs.export_format IS 'File format of the export';
COMMENT ON COLUMN export_logs.export_parameters IS 'Parameters used for the export (date range, filters, etc.)';
COMMENT ON COLUMN export_logs.filters IS 'Filters applied to the export data';
COMMENT ON COLUMN export_logs.file_url IS 'URL to access the exported file';
COMMENT ON COLUMN export_logs.storage_provider IS 'Storage provider used for the file';
COMMENT ON COLUMN export_logs.expires_at IS 'When the export file should be deleted';
COMMENT ON COLUMN export_logs.ip_address IS 'IP address of the user who initiated the export';
```

## RLS Policies

### inventory_variance_reports RLS

```sql
-- Enable RLS
ALTER TABLE inventory_variance_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reports for their company
CREATE POLICY inventory_variance_reports_select_company 
ON inventory_variance_reports
FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT company_id FROM user_companies 
  WHERE user_id = auth.uid()
));

-- Policy: Users can insert reports for their company
CREATE POLICY inventory_variance_reports_insert_company 
ON inventory_variance_reports
FOR INSERT
TO authenticated
WITH CHECK (company_id IN (
  SELECT company_id FROM user_companies 
  WHERE user_id = auth.uid()
));

-- Policy: Users can update reports for their company
CREATE POLICY inventory_variance_reports_update_company 
ON inventory_variance_reports
FOR UPDATE
TO authenticated
USING (company_id IN (
  SELECT company_id FROM user_companies 
  WHERE user_id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM user_companies 
  WHERE user_id = auth.uid()
));

-- Policy: Admins can delete reports for their company
CREATE POLICY inventory_variance_reports_delete_admin 
ON inventory_variance_reports
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_companies 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### export_logs RLS

```sql
-- Enable RLS
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own export logs
CREATE POLICY export_logs_select_own 
ON export_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can view export logs for their company
CREATE POLICY export_logs_select_company 
ON export_logs
FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT company_id FROM user_companies 
  WHERE user_id = auth.uid()
));

-- Policy: Users can insert their own export logs
CREATE POLICY export_logs_insert_own 
ON export_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Admins can view all export logs for their company
CREATE POLICY export_logs_select_admin 
ON export_logs
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_companies 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can delete export logs for their company
CREATE POLICY export_logs_delete_admin 
ON export_logs
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_companies 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Triggers and Functions

### Updated At Trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to inventory_variance_reports
CREATE TRIGGER update_inventory_variance_reports_updated_at
  BEFORE UPDATE ON inventory_variance_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Export Log Completion Trigger

```sql
-- Function to set completed_at when export status changes to completed or failed
CREATE OR REPLACE FUNCTION set_export_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.export_status IN ('completed', 'failed', 'cancelled') 
     AND OLD.export_status NOT IN ('completed', 'failed', 'cancelled') THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to export_logs
CREATE TRIGGER set_export_logs_completed_at
  BEFORE UPDATE ON export_logs
  FOR EACH ROW
  WHEN (NEW.export_status IS DISTINCT FROM OLD.export_status)
  EXECUTE FUNCTION set_export_completed_at();
```

### Export Log Cleanup Function

```sql
-- Function to clean up expired export logs
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired export logs
  DELETE FROM export_logs
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION cleanup_expired_exports() IS 'Deletes expired export logs and their associated files';
```

## Migration Script

### File: `supabase/migrations/020_create_missing_tables.sql`

```sql
-- Migration: Create missing database tables
-- Version: 020
-- Date: 2026-03-23

-- ============================================
-- inventory_variance_reports table
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_variance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Report metadata
  report_name VARCHAR(255) NOT NULL,
  report_date DATE NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'ad-hoc')),
  
  -- Variance data
  total_products_counted INTEGER NOT NULL DEFAULT 0,
  total_variance_quantity INTEGER NOT NULL DEFAULT 0,
  total_variance_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  variance_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'reviewed', 'approved')),
  
  -- Approval workflow
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  
  -- Additional details
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for inventory_variance_reports
CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_company_id 
  ON inventory_variance_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_branch_id 
  ON inventory_variance_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_report_date 
  ON inventory_variance_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_status 
  ON inventory_variance_reports(status);
CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_created_at 
  ON inventory_variance_reports(created_at DESC);

-- Comments for inventory_variance_reports
COMMENT ON TABLE inventory_variance_reports IS 'Tracks inventory variance reports for stock count discrepancies';
COMMENT ON COLUMN inventory_variance_reports.report_name IS 'Human-readable name for the variance report';
COMMENT ON COLUMN inventory_variance_reports.report_type IS 'Type of report: monthly, quarterly, annual, or ad-hoc';
COMMENT ON COLUMN inventory_variance_reports.total_variance_quantity IS 'Total quantity variance across all products';
COMMENT ON COLUMN inventory_variance_reports.total_variance_value IS 'Total monetary value of variance';
COMMENT ON COLUMN inventory_variance_reports.variance_percentage IS 'Percentage of variance relative to total inventory';
COMMENT ON COLUMN inventory_variance_reports.attachments IS 'Array of attachment metadata (file names, URLs, etc.)';

-- ============================================
-- export_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Export metadata
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN (
    'inventory_records',
    'products',
    'movements',
    'variance_reports',
    'sales_reports',
    'stock_check',
    'custom'
  )),
  export_format VARCHAR(20) NOT NULL CHECK (export_format IN ('xlsx', 'csv', 'json', 'pdf')),
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  
  -- Export parameters
  export_parameters JSONB DEFAULT '{}'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  
  -- Export results
  records_exported INTEGER NOT NULL DEFAULT 0,
  export_status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (export_status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  
  -- File storage
  file_url TEXT,
  file_path TEXT,
  storage_provider VARCHAR(50) DEFAULT 'local',
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional metadata
  ip_address INET,
  user_agent TEXT
);

-- Indexes for export_logs
CREATE INDEX IF NOT EXISTS idx_export_logs_company_id ON export_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_branch_id ON export_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_user_id ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_export_type ON export_logs(export_type);
CREATE INDEX IF NOT EXISTS idx_export_logs_export_status ON export_logs(export_status);
CREATE INDEX IF NOT EXISTS idx_export_logs_created_at ON export_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_logs_expires_at ON export_logs(expires_at) WHERE expires_at IS NOT NULL;

-- Comments for export_logs
COMMENT ON TABLE export_logs IS 'Audit log for all export operations in the system';
COMMENT ON COLUMN export_logs.export_type IS 'Type of data exported';
COMMENT ON COLUMN export_logs.export_format IS 'File format of the export';
COMMENT ON COLUMN export_logs.export_parameters IS 'Parameters used for the export (date range, filters, etc.)';
COMMENT ON COLUMN export_logs.filters IS 'Filters applied to the export data';
COMMENT ON COLUMN export_logs.file_url IS 'URL to access the exported file';
COMMENT ON COLUMN export_logs.storage_provider IS 'Storage provider used for the file';
COMMENT ON COLUMN export_logs.expires_at IS 'When the export file should be deleted';
COMMENT ON COLUMN export_logs.ip_address IS 'IP address of the user who initiated the export';

-- ============================================
-- Triggers and Functions
-- ============================================

-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to inventory_variance_reports
DROP TRIGGER IF EXISTS update_inventory_variance_reports_updated_at ON inventory_variance_reports;
CREATE TRIGGER update_inventory_variance_reports_updated_at
  BEFORE UPDATE ON inventory_variance_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create set_export_completed_at function
CREATE OR REPLACE FUNCTION set_export_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.export_status IN ('completed', 'failed', 'cancelled') 
     AND OLD.export_status NOT IN ('completed', 'failed', 'cancelled') THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to export_logs
DROP TRIGGER IF EXISTS set_export_logs_completed_at ON export_logs;
CREATE TRIGGER set_export_logs_completed_at
  BEFORE UPDATE ON export_logs
  FOR EACH ROW
  WHEN (NEW.export_status IS DISTINCT FROM OLD.export_status)
  EXECUTE FUNCTION set_export_completed_at();

-- Create cleanup_expired_exports function
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM export_logs
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_exports() IS 'Deletes expired export logs and their associated files';

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS on inventory_variance_reports
ALTER TABLE inventory_variance_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS inventory_variance_reports_select_company ON inventory_variance_reports;
DROP POLICY IF EXISTS inventory_variance_reports_insert_company ON inventory_variance_reports;
DROP POLICY IF EXISTS inventory_variance_reports_update_company ON inventory_variance_reports;
DROP POLICY IF EXISTS inventory_variance_reports_delete_admin ON inventory_variance_reports;

-- Create RLS policies for inventory_variance_reports
CREATE POLICY inventory_variance_reports_select_company 
ON inventory_variance_reports
FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT company_id FROM user_companies 
  WHERE user_id = auth.uid()
));

CREATE POLICY inventory_variance_reports_insert_company 
ON inventory_variance_reports
FOR INSERT
TO authenticated
WITH CHECK (company_id IN (
  SELECT company_id FROM user_companies 
  WHERE user_id = auth.uid()
));

CREATE POLICY inventory_variance_reports_update_company 
ON inventory_variance_reports
FOR UPDATE
TO authenticated
USING (company_id IN (
  SELECT company_id FROM user_companies 
  WHERE user_id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM user_companies 
  WHERE user_id = auth.uid()
));

CREATE POLICY inventory_variance_reports_delete_admin 
ON inventory_variance_reports
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_companies 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Enable RLS on export_logs
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS export_logs_select_own ON export_logs;
DROP POLICY IF EXISTS export_logs_select_company ON export_logs;
DROP POLICY IF EXISTS export_logs_insert_own ON export_logs;
DROP POLICY IF EXISTS export_logs_select_admin ON export_logs;
DROP POLICY IF EXISTS export_logs_delete_admin ON export_logs;

-- Create RLS policies for export_logs
CREATE POLICY export_logs_select_own 
ON export_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY export_logs_select_company 
ON export_logs
FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT company_id FROM user_companies 
  WHERE user_id = auth.uid()
));

CREATE POLICY export_logs_insert_own 
ON export_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY export_logs_select_admin 
ON export_logs
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_companies 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY export_logs_delete_admin 
ON export_logs
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_companies 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## TypeScript Type Definitions

### Update `apps/inventory-operation/src/types/index.ts`

```typescript
// Inventory Variance Report Types
export interface InventoryVarianceReport {
  id: string;
  company_id: string;
  branch_id?: string;
  report_name: string;
  report_date: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'ad-hoc';
  total_products_counted: number;
  total_variance_quantity: number;
  total_variance_value: number;
  variance_percentage: number;
  status: 'pending' | 'in_progress' | 'completed' | 'reviewed' | 'approved';
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  notes?: string;
  attachments: Array<{
    name: string;
    url: string;
    size: number;
    uploaded_at: string;
  }>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface InventoryVarianceReportCreateInput {
  company_id: string;
  branch_id?: string;
  report_name: string;
  report_date: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'ad-hoc';
  total_products_counted?: number;
  total_variance_quantity?: number;
  total_variance_value?: number;
  variance_percentage?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'reviewed' | 'approved';
  notes?: string;
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    uploaded_at: string;
  }>;
}

export interface InventoryVarianceReportUpdateInput {
  report_name?: string;
  report_date?: string;
  report_type?: 'monthly' | 'quarterly' | 'annual' | 'ad-hoc';
  total_products_counted?: number;
  total_variance_quantity?: number;
  total_variance_value?: number;
  variance_percentage?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'reviewed' | 'approved';
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  notes?: string;
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    uploaded_at: string;
  }>;
}

// Export Log Types
export interface ExportLog {
  id: string;
  company_id: string;
  branch_id?: string;
  user_id?: string;
  export_type: 'inventory_records' | 'products' | 'movements' | 'variance_reports' | 'sales_reports' | 'stock_check' | 'custom';
  export_format: 'xlsx' | 'csv' | 'json' | 'pdf';
  file_name: string;
  file_size?: number;
  export_parameters: Record<string, any>;
  filters: Record<string, any>;
  records_exported: number;
  export_status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;
  file_url?: string;
  file_path?: string;
  storage_provider: string;
  expires_at?: string;
  created_at: string;
  completed_at?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface ExportLogCreateInput {
  company_id: string;
  branch_id?: string;
  user_id?: string;
  export_type: 'inventory_records' | 'products' | 'movements' | 'variance_reports' | 'sales_reports' | 'stock_check' | 'custom';
  export_format: 'xlsx' | 'csv' | 'json' | 'pdf';
  file_name: string;
  file_size?: number;
  export_parameters?: Record<string, any>;
  filters?: Record<string, any>;
  records_exported?: number;
  export_status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;
  file_url?: string;
  file_path?: string;
  storage_provider?: string;
  expires_at?: string;
  ip_address?: string;
  user_agent?: string;
}
```

## Service Layer Updates

### Create `apps/inventory-operation/src/services/varianceReportService.ts`

```typescript
import { supabase } from '../config/supabase';
import type { 
  InventoryVarianceReport, 
  InventoryVarianceReportCreateInput, 
  InventoryVarianceReportUpdateInput 
} from '../types';

export const varianceReportService = {
  async getAll(filters?: {
    company_id?: string;
    branch_id?: string;
    status?: string;
    report_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{ data: InventoryVarianceReport[] | null; error: any }> {
    let query = supabase
      .from('inventory_variance_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id);
    }
    if (filters?.branch_id) {
      query = query.eq('branch_id', filters.branch_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.report_type) {
      query = query.eq('report_type', filters.report_type);
    }
    if (filters?.date_from) {
      query = query.gte('report_date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('report_date', filters.date_to);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async getById(id: string): Promise<{ data: InventoryVarianceReport | null; error: any }> {
    const { data, error } = await supabase
      .from('inventory_variance_reports')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async create(input: InventoryVarianceReportCreateInput): Promise<{ data: InventoryVarianceReport | null; error: any }> {
    const { data, error } = await supabase
      .from('inventory_variance_reports')
      .insert(input)
      .select()
      .single();

    return { data, error };
  },

  async update(id: string, input: InventoryVarianceReportUpdateInput): Promise<{ data: InventoryVarianceReport | null; error: any }> {
    const { data, error } = await supabase
      .from('inventory_variance_reports')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async delete(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('inventory_variance_reports')
      .delete()
      .eq('id', id);

    return { error };
  },

  async approve(id: string, approvedBy: string, notes?: string): Promise<{ data: InventoryVarianceReport | null; error: any }> {
    const { data, error } = await supabase
      .from('inventory_variance_reports')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        approval_notes: notes,
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }
};
```

### Create `apps/inventory-operation/src/services/exportLogService.ts`

```typescript
import { supabase } from '../config/supabase';
import type { ExportLog, ExportLogCreateInput } from '../types';

export const exportLogService = {
  async create(input: ExportLogCreateInput): Promise<{ data: ExportLog | null; error: any }> {
    const { data, error } = await supabase
      .from('export_logs')
      .insert(input)
      .select()
      .single();

    return { data, error };
  },

  async update(id: string, updates: Partial<ExportLogCreateInput>): Promise<{ data: ExportLog | null; error: any }> {
    const { data, error } = await supabase
      .from('export_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async getById(id: string): Promise<{ data: ExportLog | null; error: any }> {
    const { data, error } = await supabase
      .from('export_logs')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async getAll(filters?: {
    company_id?: string;
    branch_id?: string;
    user_id?: string;
    export_type?: string;
    export_status?: string;
  }): Promise<{ data: ExportLog[] | null; error: any }> {
    let query = supabase
      .from('export_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id);
    }
    if (filters?.branch_id) {
      query = query.eq('branch_id', filters.branch_id);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.export_type) {
      query = query.eq('export_type', filters.export_type);
    }
    if (filters?.export_status) {
      query = query.eq('export_status', filters.export_status);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async delete(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('export_logs')
      .delete()
      .eq('id', id);

    return { error };
  },

  async cleanupExpired(): Promise<{ deleted_count: number; error: any }> {
    const { data, error } = await supabase.rpc('cleanup_expired_exports');
    return { deleted_count: data, error };
  }
};
```

## Implementation Steps

### Step 1: Create Migration File
- Create `supabase/migrations/020_create_missing_tables.sql`
- Add the complete migration script
- Test locally with Supabase CLI

### Step 2: Apply Migration
- Run migration locally: `supabase db push`
- Verify tables are created
- Check indexes and constraints
- Verify RLS policies

### Step 3: Update TypeScript Types
- Add types to `apps/inventory-operation/src/types/index.ts`
- Ensure type consistency
- Add export/import statements

### Step 4: Create Service Layer
- Create `varianceReportService.ts`
- Create `exportLogService.ts`
- Implement all CRUD operations
- Add error handling

### Step 5: Update Existing Components
- Update `InventoryVarianceReportPage.tsx` to use new service
- Update export components to log to `export_logs`
- Test all functionality

### Step 6: Testing
- Test variance report creation
- Test variance report approval workflow
- Test export logging
- Test RLS policies
- Test cleanup function

### Step 7: Documentation
- Update API documentation
- Add service documentation
- Update component documentation

## Testing Strategy

### Unit Tests
- Test service layer functions
- Test type definitions
- Test error handling

### Integration Tests
- Test database operations
- Test RLS policies
- Test triggers
- Test cleanup function

### Manual Testing
- Create variance report via UI
- Approve variance report
- Export data and verify log entry
- Test expired export cleanup

## Rollback Plan

If issues arise after deployment:

```sql
-- Rollback migration
DROP TABLE IF EXISTS inventory_variance_reports CASCADE;
DROP TABLE IF EXISTS export_logs CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS set_export_completed_at();
DROP FUNCTION IF EXISTS cleanup_expired_exports();
```

## Success Criteria

- Tables created successfully
- All indexes created
- RLS policies working correctly
- Triggers functioning as expected
- Service layer working
- UI components updated
- All tests passing
- No data loss during migration

## Timeline

- **Day 1:** Create migration file and test locally
- **Day 2:** Apply migration and verify
- **Day 3:** Update TypeScript types and create services
- **Day 4:** Update components and integrate
- **Day 5:** Testing and documentation
- **Day 6:** Deploy to production and monitor

## Conclusion

This design provides a comprehensive solution for creating the missing database tables with proper schema, RLS policies, triggers, and service layer integration. The migration script is idempotent and can be safely applied to production environments.
