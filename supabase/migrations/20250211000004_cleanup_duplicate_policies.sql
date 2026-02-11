-- Clean up duplicate/conflicting policies on all tables
-- These legacy policies are causing conflicts with our new RLS setup

-- Profiles table - remove legacy policy
DROP POLICY IF EXISTS "Allow profile operations" ON profiles;

-- Products table - remove legacy policy if exists
DROP POLICY IF EXISTS "Allow product operations" ON products;

-- Customers table - remove legacy policy if exists
DROP POLICY IF EXISTS "Allow customer operations" ON customers;

-- Transactions table - remove legacy policy if exists
DROP POLICY IF EXISTS "Allow transaction operations" ON transactions;

-- Shops table - remove legacy policy if exists
DROP POLICY IF EXISTS "Allow shop operations" ON shops;

-- Stock movements table - remove legacy policy if exists
DROP POLICY IF EXISTS "Allow stock movement operations" ON stock_movements;

-- Verify the policies are cleaned up
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'products', 'customers', 'transactions', 'shops', 'stock_movements')
ORDER BY tablename, policyname;
