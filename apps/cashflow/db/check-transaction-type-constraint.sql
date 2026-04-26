-- Check transaction_type constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
  AND conname LIKE '%transaction_type%';
