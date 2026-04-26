-- Check transactions data
SELECT 
    id,
    transaction_code,
    customer_id,
    branch_id,
    transaction_type,
    amount,
    transaction_date,
    created_at
FROM transactions
ORDER BY created_at DESC
LIMIT 10;

-- Count total transactions
SELECT COUNT(*) as total_transactions FROM transactions;
