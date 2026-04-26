-- Check customer_id in transactions
SELECT 
    id,
    transaction_code,
    customer_id,
    transaction_type,
    amount,
    transaction_date
FROM transactions
ORDER BY created_at DESC
LIMIT 5;
