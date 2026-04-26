-- Migration 009: Update granular permissions structure
-- This migration updates the staff_permissions JSONB structure to support more granular permissions

-- Update existing staff_permissions to new structure
-- Old structure: {view_reports, edit_settings, import_customers, manage_customers, import_transactions, manage_transactions, no_edit_transaction, add_transaction_only}
-- New structure: 
-- {
--   customers: {
--     import_own: boolean,        -- Can create/edit only customers they created
--     manage_all: boolean         -- Can edit/delete all customers
--   },
--   transactions: {
--     import_own: boolean,        -- Can create/edit only transactions they created
--     manage_all: boolean         -- Can edit/delete all transactions
--   },
--   settings: {
--     edit_general: boolean,      -- Can edit general settings (not accounts/permissions)
--     branches: boolean,          -- Can edit branch settings
--     bank_accounts: boolean,     -- Can edit bank account settings
--     transaction_types: boolean, -- Can edit transaction type settings
--     customer_fields: boolean,   -- Can edit customer field settings
--     color_settings: boolean,    -- Can edit color settings
--     reports: boolean            -- Can edit report settings
--   },
--   reports: {
--     view: boolean              -- Can view reports
--   }
-- }

-- Function to migrate old permissions to new structure
CREATE OR REPLACE FUNCTION migrate_staff_permissions()
RETURNS void AS $$
BEGIN
  -- Update users with old permission structure to new structure
  UPDATE users
  SET staff_permissions = jsonb_build_object(
    'customers', jsonb_build_object(
      'import_own', COALESCE((staff_permissions->>'import_customers')::boolean, false),
      'manage_all', COALESCE((staff_permissions->>'manage_customers')::boolean, false)
    ),
    'transactions', jsonb_build_object(
      'import_own', COALESCE((staff_permissions->>'import_transactions')::boolean, false),
      'manage_all', COALESCE((staff_permissions->>'manage_transactions')::boolean, false)
    ),
    'settings', jsonb_build_object(
      'edit_general', COALESCE((staff_permissions->>'edit_settings')::boolean, false),
      'branches', false,
      'bank_accounts', false,
      'transaction_types', false,
      'customer_fields', false,
      'color_settings', false,
      'reports', false
    ),
    'reports', jsonb_build_object(
      'view', COALESCE((staff_permissions->>'view_reports')::boolean, false)
    )
  )
  WHERE staff_permissions IS NOT NULL 
    AND staff_permissions != '{}'::jsonb
    AND NOT (staff_permissions ? 'customers');
END;
$$ LANGUAGE plpgsql;

-- Run migration function
SELECT migrate_staff_permissions();

-- Drop migration function
DROP FUNCTION migrate_staff_permissions();
