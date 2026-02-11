-- Test if RPC functions work with current user
-- Run this while logged in as kasir@demo.com

-- Test 1: Check if get_sales_analytics works
SELECT get_sales_analytics(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- Demo Coffee Shop
    '2024-01-01'::timestamptz,
    '2026-12-31'::timestamptz
);

-- Test 2: Check if search_transactions works  
SELECT search_transactions(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- Demo Coffee Shop
    '',  -- empty search
    '2024-01-01'::timestamptz,
    '2026-12-31'::timestamptz,
    1,  -- page
    10  -- page size
);

-- Test 3: Check if there are any transactions in the database
SELECT COUNT(*) as transaction_count
FROM transactions
WHERE shop_id = '550e8400-e29b-41d4-a716-446655440000';
