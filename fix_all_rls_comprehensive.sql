-- Comprehensive fix for ALL RLS issues
-- Run this in your Supabase SQL editor

-- First, check current RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Disable RLS for ALL tables that have it enabled
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_movements DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies to ensure they don't interfere
DROP POLICY IF EXISTS "Users can view own shop" ON shops;
DROP POLICY IF EXISTS "Users can view profiles in own shop" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in same shop" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view products in own shop" ON products;
DROP POLICY IF EXISTS "Users can view customers in own shop" ON customers;
DROP POLICY IF EXISTS "Users can manage customers in own shop" ON customers;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable select for all authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable delete for all authenticated users" ON customers;
DROP POLICY IF EXISTS "Bypass RLS for authenticated users" ON customers;
DROP POLICY IF EXISTS "Service role bypass" ON customers;
DROP POLICY IF EXISTS "Allow all customer operations" ON customers;
DROP POLICY IF EXISTS "Users can view transactions in own shop" ON transactions;
DROP POLICY IF EXISTS "Users can view transaction items in own shop" ON transaction_items;
DROP POLICY IF EXISTS "Users can view stock movements in own shop" ON stock_movements;

-- Grant ALL permissions to authenticated and service_role users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify RLS is disabled after changes
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Test the profiles table directly
SELECT 'Testing profiles table...' as status;
SELECT
    p.*,
    u.email as user_email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'kasir@demo.com';