-- Test query to check customers and search functionality
-- Run this in your Supabase SQL editor

-- Check if Bob Johnson exists
SELECT * FROM customers
WHERE name ILIKE '%bob%' OR email ILIKE '%bob%' OR phone ILIKE '%bob%';

-- Check all customers
SELECT id, name, email, phone, shop_id FROM customers
ORDER BY name;

-- Test the search pattern that the API uses
SELECT * FROM customers
WHERE shop_id = '550e8400-e29b-41d4-a716-446655440000'
AND (
    name ILIKE '%bob%' OR
    email ILIKE '%bob%' OR
    phone ILIKE '%bob%'
);

-- Test with full name
SELECT * FROM customers
WHERE shop_id = '550e8400-e29b-41d4-a716-446655440000'
AND (
    name ILIKE '%bob johnson%'
);