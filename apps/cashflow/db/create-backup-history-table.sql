-- Create backup_history table for tracking backup and restore operations
-- This table stores metadata about backups created and restored

CREATE TABLE IF NOT EXISTS backup_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    backup_name TEXT NOT NULL,
    backup_version TEXT NOT NULL DEFAULT '1.0.0',
    backup_timestamp TIMESTAMPTZ NOT NULL,
    backup_format TEXT NOT NULL CHECK (backup_format IN ('xlsx', 'json')),
    backup_size BIGINT,
    created_by UUID NOT NULL,
    
    -- Backup statistics
    total_customers INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_bank_accounts INTEGER DEFAULT 0,
    total_branches INTEGER DEFAULT 0,
    
    -- Additional metadata
    branch_id UUID,
    notes TEXT,
    is_restorable BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_backup_history_company_id ON backup_history(company_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_created_by ON backup_history(created_by);
CREATE INDEX IF NOT EXISTS idx_backup_history_timestamp ON backup_history(backup_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_backup_history_branch_id ON backup_history(branch_id);

-- Add RLS policies for backup_history table
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see backup history for their own company
CREATE POLICY "Users can view backup history for their company"
    ON backup_history FOR SELECT
    USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- Policy: admin_master can view all backup history
CREATE POLICY "admin_master can view all backup history"
    ON backup_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin_master'
        )
    );

-- Policy: admin_company can view backup history for their company
CREATE POLICY "admin_company can view backup history for their company"
    ON backup_history FOR SELECT
    USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin_company'
        )
    );

-- Policy: Users can insert backup history for their company
CREATE POLICY "Users can insert backup history for their company"
    ON backup_history FOR INSERT
    WITH CHECK (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- Policy: admin_master can insert backup history for any company
CREATE POLICY "admin_master can insert backup history for any company"
    ON backup_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin_master'
        )
    );

-- Policy: Users can update backup history for their company
CREATE POLICY "Users can update backup history for their company"
    ON backup_history FOR UPDATE
    USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- Policy: admin_master can update backup history for any company
CREATE POLICY "admin_master can update backup history for any company"
    ON backup_history FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin_master'
        )
    );

-- Policy: Users can delete backup history for their company
CREATE POLICY "Users can delete backup history for their company"
    ON backup_history FOR DELETE
    USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- Policy: admin_master can delete backup history for any company
CREATE POLICY "admin_master can delete backup history for any company"
    ON backup_history FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin_master'
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_backup_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_backup_history_updated_at
    BEFORE UPDATE ON backup_history
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_history_updated_at();

-- Add comment
COMMENT ON TABLE backup_history IS 'Stores history of backup and restore operations with company-based isolation';
