-- Update backup_history table to store actual backup data
-- Add columns for compressed backup data and restore metadata

-- Add backup_data column to store compressed JSON backup
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS backup_data JSONB;

-- Add column to track which tables are included in this backup
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS included_tables TEXT[];

-- Add compression metadata columns
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS is_compressed BOOLEAN DEFAULT true;
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS compression_algorithm TEXT DEFAULT 'gzip';

-- Add restore metadata columns
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS restore_allowed_by TEXT[];
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS restore_count INTEGER DEFAULT 0;
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS last_restored_at TIMESTAMPTZ;
ALTER TABLE backup_history ADD COLUMN IF NOT EXISTS last_restored_by UUID REFERENCES users(id);

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_backup_history_data ON backup_history USING GIN (backup_data);

-- Create index for included_tables array
CREATE INDEX IF NOT EXISTS idx_backup_history_included_tables ON backup_history USING GIN (included_tables);

-- Create index for restore_allowed_by array
CREATE INDEX IF NOT EXISTS idx_backup_history_restore_allowed ON backup_history USING GIN (restore_allowed_by);

-- Add comments
COMMENT ON COLUMN backup_history.backup_data IS 'Compressed backup data stored as JSONB';
COMMENT ON COLUMN backup_history.included_tables IS 'Array of table names included in this backup';
COMMENT ON COLUMN backup_history.is_compressed IS 'Whether backup data is compressed';
COMMENT ON COLUMN backup_history.compression_algorithm IS 'Compression algorithm used (e.g., gzip, lz4)';
COMMENT ON COLUMN backup_history.restore_allowed_by IS 'Array of user IDs allowed to revert this backup';
COMMENT ON COLUMN backup_history.restore_count IS 'Number of times this backup has been restored';
COMMENT ON COLUMN backup_history.last_restored_at IS 'Timestamp of last restore operation';
COMMENT ON COLUMN backup_history.last_restored_by IS 'User who last restored this backup';
