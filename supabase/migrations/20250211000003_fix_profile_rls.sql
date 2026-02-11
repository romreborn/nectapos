-- Fix circular dependency in RLS policies for all tables
-- The issue: get_auth_shop_id() reads from profiles, but all policies use get_auth_shop_id()
-- Solution: Fix the get_auth_shop_id() function to bypass RLS using SECURITY DEFINER

-- First, recreate the get_auth_shop_id() function to ensure it bypasses RLS
CREATE OR REPLACE FUNCTION get_auth_shop_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT shop_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing policies that might conflict
DROP POLICY IF EXISTS "Profiles policy" ON profiles;
DROP POLICY IF EXISTS "Products policy" ON products;
DROP POLICY IF EXISTS "Customers policy" ON customers;
DROP POLICY IF EXISTS "Transactions policy" ON transactions;
DROP POLICY IF EXISTS "Shops policy" ON shops;
DROP POLICY IF EXISTS "Stock movements policy" ON stock_movements;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles in own shop" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage products in own shop" ON products;
DROP POLICY IF EXISTS "Users can manage customers in own shop" ON customers;
DROP POLICY IF EXISTS "Users can manage transactions in own shop" ON transactions;
DROP POLICY IF EXISTS "Users can view own shop" ON shops;
DROP POLICY IF EXISTS "Users can manage stock movements in own shop" ON stock_movements;

-- Profiles: Allow users to read their own profile (breaks circular dependency)
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT
    USING (id = auth.uid());

-- Profiles: Allow users to read other profiles in their shop
CREATE POLICY "Users can read profiles in own shop" ON profiles
    FOR SELECT
    USING (shop_id = get_auth_shop_id());

-- Profiles: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (id = auth.uid());

-- Products: Full access for users in the same shop
CREATE POLICY "Users can manage products in own shop" ON products
    FOR ALL
    USING (shop_id = get_auth_shop_id());

-- Customers: Full access for users in the same shop
CREATE POLICY "Users can manage customers in own shop" ON customers
    FOR ALL
    USING (shop_id = get_auth_shop_id());

-- Transactions: Full access for users in the same shop
CREATE POLICY "Users can manage transactions in own shop" ON transactions
    FOR ALL
    USING (shop_id = get_auth_shop_id());

-- Shops: Users can view their own shop
CREATE POLICY "Users can view own shop" ON shops
    FOR SELECT
    USING (id = get_auth_shop_id());

-- Stock movements: Full access for users in the same shop
CREATE POLICY "Users can manage stock movements in own shop" ON stock_movements
    FOR ALL
    USING (shop_id = get_auth_shop_id());
