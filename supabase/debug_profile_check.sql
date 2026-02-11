-- Check if the user profile exists and has a shop_id
-- Run this query to verify the kasir@demo.com user has a profile with shop_id

SELECT 
    p.id,
    p.shop_id,
    p.role,
    u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'kasir@demo.com';

-- Also check if RLS is enabled on profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- Check what policies exist on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';
