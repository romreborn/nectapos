-- Check all user_id values in transactions table
SELECT
    user_id,
    COUNT(*) as transaction_count,
    MIN(created_at) as earliest_transaction,
    MAX(created_at) as latest_transaction
FROM transactions
WHERE status = 'completed'
GROUP BY user_id
ORDER BY transaction_count DESC;

-- Show all transaction records with user_id
SELECT
    id,
    user_id,
    status,
    total_amount,
    created_at
FROM transactions
WHERE status = 'completed'
ORDER BY created_at DESC;