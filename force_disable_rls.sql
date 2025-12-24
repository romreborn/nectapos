-- Force disable RLS for all tables
-- Run this in Supabase SQL editor

-- First check current RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('products', 'transactions', 'shops', 'profiles', 'customers', 'transaction_items', 'stock_movements');

-- Disable RLS for all relevant tables
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_movements DISABLE ROW LEVEL SECURITY;

-- Also drop all policies to ensure they don't interfere
DROP POLICY IF EXISTS "Users can view customers in own shop" ON customers;
DROP POLICY IF EXISTS "Users can manage customers in own shop" ON customers;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable select for all authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable delete for all authenticated users" ON customers;
DROP POLICY IF EXISTS "Bypass RLS for authenticated users" ON customers;
DROP POLICY IF EXISTS "Service role bypass" ON customers;
DROP POLICY IF EXISTS "Allow all customer operations" ON customers;

-- Verify RLS is disabled after changes
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('products', 'transactions', 'shops', 'profiles', 'customers', 'transaction_items', 'stock_movements');

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;