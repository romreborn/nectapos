-- Run this in Supabase SQL Editor to debug stock issues

-- 1. Check completed transactions
SELECT
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN items IS NOT NULL THEN 1 END) as transactions_with_items
FROM transactions
WHERE status = 'completed';

-- 2. Check products
SELECT
    COUNT(*) as total_products,
    SUM(stock) as total_stock,
    COUNT(CASE WHEN stock > 0 THEN 1 END) as products_with_stock
FROM products;

-- 3. Check a sample transaction with items
SELECT
    id,
    created_at,
    items
FROM transactions
WHERE status = 'completed'
AND items IS NOT NULL
LIMIT 3;

-- 4. Check items in transactions
SELECT
    COUNT(DISTINCT t.id) as unique_transactions,
    COUNT(DISTINCT (item->>'product_id')::uuid) as unique_products_in_transactions,
    SUM(CASE
        WHEN (item->>'quantity') IS NOT NULL THEN (item->>'quantity')::INTEGER
        WHEN (item->>'qty') IS NOT NULL THEN (item->>'qty')::INTEGER
        ELSE 1
    END) as total_items_sold
FROM transactions t,
jsonb_array_elements(t.items) as item
WHERE t.status = 'completed';

-- 5. Check which products are sold
SELECT
    p.id,
    p.name,
    p.stock as current_stock,
    COALESCE(sold.total_sold, 0) as total_sold,
    p.stock - COALESCE(sold.total_sold, 0) as calculated_stock
FROM products p
LEFT JOIN (
    SELECT
        (item->>'product_id')::uuid as product_id,
        SUM(CASE
            WHEN (item->>'quantity') IS NOT NULL THEN (item->>'quantity')::INTEGER
            WHEN (item->>'qty') IS NOT NULL THEN (item->>'qty')::INTEGER
            ELSE 1
        END) as total_sold
    FROM transactions,
    jsonb_array_elements(transactions.items) as item
    WHERE transactions.status = 'completed'
    GROUP BY (item->>'product_id')::uuid
) sold ON p.id = sold.product_id
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. Fix all stocks in one query
UPDATE products p
SET stock = GREATEST(0, p.stock - COALESCE(sold.total_sold, 0))
FROM (
    SELECT
        (item->>'product_id')::uuid as product_id,
        SUM(CASE
            WHEN (item->>'quantity') IS NOT NULL THEN (item->>'quantity')::INTEGER
            WHEN (item->>'qty') IS NOT NULL THEN (item->>'qty')::INTEGER
            ELSE 1
        END) as total_sold
    FROM transactions,
    jsonb_array_elements(transactions.items) as item
    WHERE transactions.status = 'completed'
    GROUP BY (item->>'product_id')::uuid
) sold
WHERE p.id = sold.product_id;