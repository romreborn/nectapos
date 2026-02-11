-- Fix: Create profile for kasir@demo.com user if it doesn't exist
-- User ID: db4ea810-adac-4c6b-8d18-4ab3286c5591
-- Shop ID: 550e8400-e29b-41d4-a716-446655440000 (Demo Coffee Shop)

-- First, check if profile exists
SELECT 
    p.id,
    p.shop_id,
    p.role,
    u.email
FROM profiles p
RIGHT JOIN auth.users u ON u.id = p.id
WHERE u.id = 'db4ea810-adac-4c6b-8d18-4ab3286c5591';

-- If the above query shows NULL for shop_id or no profile exists, run this:
INSERT INTO profiles (id, shop_id, role)
VALUES (
    'db4ea810-adac-4c6b-8d18-4ab3286c5591',
    '550e8400-e29b-41d4-a716-446655440000',
    'cashier'
)
ON CONFLICT (id) 
DO UPDATE SET 
    shop_id = '550e8400-e29b-41d4-a716-446655440000',
    role = 'cashier';

-- Verify the profile was created/updated
SELECT 
    p.id,
    p.shop_id,
    p.role,
    u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.id = 'db4ea810-adac-4c6b-8d18-4ab3286c5591';
