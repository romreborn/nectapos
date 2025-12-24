-- Create ENUMs
CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'manager', 'cashier');
CREATE TYPE transaction_status AS ENUM ('completed', 'cancelled', 'pending_approval');

-- Create Tables

-- 1. shops
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subscription_status BOOLEAN DEFAULT TRUE,
    is_online_sync_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. profiles (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE, -- Null for Superadmin
    role user_role NOT NULL DEFAULT 'cashier',
    full_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    sku TEXT,
    name TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    is_custom BOOLEAN DEFAULT FALSE,
    low_stock_threshold INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    cashier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status transaction_status DEFAULT 'completed',
    cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. transaction_items
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    qty INTEGER NOT NULL DEFAULT 1,
    price_at_sale DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. stock_movements
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('sale', 'restock', 'opname', 'cancel_return')),
    qty_change INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's shop_id
CREATE OR REPLACE FUNCTION get_auth_shop_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT shop_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Shops: Users can view their own shop. Superadmin can view all.
CREATE POLICY "Users can view own shop" ON shops
    FOR SELECT
    USING (id = get_auth_shop_id());

-- Profiles: Users can view profiles in their shop.
CREATE POLICY "Users can view profiles in own shop" ON profiles
    FOR SELECT
    USING (shop_id = get_auth_shop_id());
    
-- Self profile view (for initial load)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (id = auth.uid());

-- Products
CREATE POLICY "Users can view products in own shop" ON products
    FOR ALL
    USING (shop_id = get_auth_shop_id());

-- Customers
CREATE POLICY "Users can view customers in own shop" ON customers
    FOR ALL
    USING (shop_id = get_auth_shop_id());

-- Transactions
CREATE POLICY "Users can view transactions in own shop" ON transactions
    FOR ALL
    USING (shop_id = get_auth_shop_id());

-- Transaction Items
CREATE POLICY "Users can view transaction items in own shop" ON transaction_items
    FOR ALL
    USING (shop_id = get_auth_shop_id());
    
-- Stock Movements
CREATE POLICY "Users can view stock movements in own shop" ON stock_movements
    FOR ALL
    USING (shop_id = get_auth_shop_id());
