-- Drop unique constraint that blocks insert when branch_id is null
-- The constraint customers_customer_code_key is a simple unique constraint on customer_code
-- This blocks insert when branch_id is null because multiple customers with null branch_id
-- and same customer_code would violate the constraint

-- Drop the simple unique constraint on customer_code
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_code_key;

-- Create a new partial index that only enforces uniqueness when branch_id is not null
-- This allows multiple customers with same code if branch_id is null
CREATE UNIQUE INDEX unique_customer_code_when_branch_not_null 
ON customers (customer_code) 
WHERE branch_id IS NOT NULL;

-- Verify changes
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'customers'::regclass;
