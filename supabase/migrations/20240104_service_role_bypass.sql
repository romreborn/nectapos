-- Allow service role to bypass RLS for all tables
-- This is needed for admin operations and reporting

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own shop" ON shops;
DROP POLICY IF EXISTS "Users can view profiles in own shop" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view products in own shop" ON products;
DROP POLICY IF EXISTS "Users can manage products in own shop" ON products;
DROP POLICY IF EXISTS "Users can view customers in own shop" ON customers;
DROP POLICY IF EXISTS "Users can manage customers in own shop" ON customers;
DROP POLICY IF EXISTS "Users can view transactions in own shop" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions in own shop" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions in own shop" ON transactions;
DROP POLICY IF EXISTS "Users can view transaction_items in own shop" ON transaction_items;
DROP POLICY IF EXISTS "Users can manage transaction_items in own shop" ON transaction_items;
DROP POLICY IF EXISTS "Users can view stock movements in own shop" ON stock_movements;
DROP POLICY IF EXISTS "Users can manage stock movements in own shop" ON stock_movements;

-- Create new policies that allow service role bypass
-- Shops
CREATE POLICY "Shops policy" ON shops
    FOR ALL
    USING (auth.uid() = (SELECT id FROM profiles WHERE shop_id = shops.id LIMIT 1)
           OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Profiles
CREATE POLICY "Profiles policy" ON profiles
    FOR ALL
    USING (shop_id = get_auth_shop_id()
           OR id = auth.uid()
           OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Products
CREATE POLICY "Products policy" ON products
    FOR ALL
    USING (shop_id = get_auth_shop_id()
           OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Customers
CREATE POLICY "Customers policy" ON customers
    FOR ALL
    USING (shop_id = get_auth_shop_id()
           OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Transactions
CREATE POLICY "Transactions policy" ON transactions
    FOR ALL
    USING (shop_id = get_auth_shop_id()
           OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Transaction items
CREATE POLICY "Transaction items policy" ON transaction_items
    FOR ALL
    USING (shop_id = get_auth_shop_id()
           OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Stock movements
CREATE POLICY "Stock movements policy" ON stock_movements
    FOR ALL
    USING (shop_id = get_auth_shop_id()
           OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');