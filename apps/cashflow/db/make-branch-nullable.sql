-- Make branch_id nullable in customers table
-- Reason: Admin accounts don't have branch_id, customers can exist without branch assignment

-- Drop NOT NULL constraint on branch_id
ALTER TABLE customers ALTER COLUMN branch_id DROP NOT NULL;

-- Also make branch_id nullable in transactions (for consistency)
ALTER TABLE transactions ALTER COLUMN branch_id DROP NOT NULL;

-- Verify changes
SELECT 
    column_name, 
    is_nullable, 
    data_type
FROM information_schema.columns
WHERE table_name = 'customers' 
  AND column_name = 'branch_id';
