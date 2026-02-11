-- Debug: Test if the user can read their own profile with RLS enabled
-- This should work because we have "Users can read own profile" policy

-- Test 1: Check if we can read the profile directly
SELECT 
    id,
    shop_id,
    role
FROM profiles
WHERE id = 'db4ea810-adac-4c6b-8d18-4ab3286c5591';

-- Test 2: Check if get_auth_shop_id() function works
-- Note: This will only work if executed as the authenticated user
SELECT get_auth_shop_id();

-- Test 3: Check all policies on profiles table
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
