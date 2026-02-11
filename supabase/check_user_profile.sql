-- Check if the specific user has a profile with shop_id
SELECT 
    p.id,
    p.shop_id,
    p.role,
    u.email,
    u.created_at
FROM profiles p
RIGHT JOIN auth.users u ON u.id = p.id
WHERE u.id = 'db4ea810-adac-4c6b-8d18-4ab3286c5591';

-- If the profile doesn't exist, we need to create it
-- First, check what shops exist
SELECT id, name FROM shops LIMIT 5;
