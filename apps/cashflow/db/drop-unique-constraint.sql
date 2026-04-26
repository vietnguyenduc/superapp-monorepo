-- Drop unique constraint that blocks insert when branch_id is null
-- The constraint unique_customer_code_per_branch UNIQUE (customer_code, branch_id)
-- causes issues when branch_id is null because multiple customers with null branch_id
-- and same customer_code would violate the constraint

-- Drop the constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS unique_customer_code_per_branch;

-- Create a new constraint that only enforces uniqueness when branch_id is not null
-- This allows multiple customers with same code but different null/branch_id
CREATE UNIQUE INDEX unique_customer_code_when_branch_not_null 
ON customers (customer_code) 
WHERE branch_id IS NOT NULL;

-- Verify changes
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'customers'::regclass;
