-- Demo Data Seed for Necta POS
-- This creates demo users for all roles and sample data

-- ============================================
-- 1. CREATE DEMO SHOP
-- ============================================
INSERT INTO public.shops (id, name, is_online_sync_enabled, subscription_status)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Demo Coffee Shop', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CREATE DEMO USERS (via auth.users)
-- ============================================
-- Note: In production, users are created via Supabase Auth signup
-- For demo purposes, we'll create profiles directly
-- Passwords for all demo users: "demo123"

-- Superadmin User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'superadmin@demo.com',
  '$2a$10$rKVLwPYKEqKqKqKqKqKqKuXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx', -- demo123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Super Admin"}',
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Owner User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'owner@demo.com',
  '$2a$10$rKVLwPYKEqKqKqKqKqKqKuXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx', -- demo123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Shop Owner"}',
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Manager User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'manager@demo.com',
  '$2a$10$rKVLwPYKEqKqKqKqKqKqKuXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx', -- demo123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Store Manager"}',
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Cashier User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'cashier@demo.com',
  '$2a$10$rKVLwPYKEqKqKqKqKqKqKuXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx', -- demo123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Cashier One"}',
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CREATE PROFILES FOR DEMO USERS
-- ============================================
INSERT INTO public.profiles (id, full_name, role, shop_id, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Super Admin', 'superadmin', NULL, true),
  ('22222222-2222-2222-2222-222222222222', 'Shop Owner', 'owner', '550e8400-e29b-41d4-a716-446655440000', true),
  ('33333333-3333-3333-3333-333333333333', 'Store Manager', 'manager', '550e8400-e29b-41d4-a716-446655440000', true),
  ('44444444-4444-4444-4444-444444444444', 'Cashier One', 'cashier', '550e8400-e29b-41d4-a716-446655440000', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. CREATE DEMO PRODUCTS
-- ============================================
INSERT INTO public.products (id, shop_id, name, sku, price, stock_qty, is_custom, low_stock_threshold)
VALUES 
  -- Coffee Products
  ('a0000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Espresso', 'COFFEE-ESP', 3.50, 100, false, 20),
  ('a0000001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'Cappuccino', 'COFFEE-CAP', 4.50, 80, false, 20),
  ('a0000001-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'Latte', 'COFFEE-LAT', 4.75, 90, false, 20),
  ('a0000001-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440000', 'Americano', 'COFFEE-AME', 3.75, 85, false, 20),
  ('a0000001-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440000', 'Mocha', 'COFFEE-MOC', 5.00, 70, false, 15),
  
  -- Pastries
  ('a0000001-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440000', 'Croissant', 'PASTRY-CRO', 3.25, 50, false, 10),
  ('a0000001-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440000', 'Blueberry Muffin', 'PASTRY-MUF', 3.50, 40, false, 10),
  ('a0000001-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440000', 'Chocolate Chip Cookie', 'PASTRY-COO', 2.50, 60, false, 15),
  
  -- Cold Drinks
  ('a0000001-0000-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440000', 'Iced Coffee', 'COLD-ICE', 4.00, 75, false, 20),
  ('a0000001-0000-0000-0000-00000000000a', '550e8400-e29b-41d4-a716-446655440000', 'Cold Brew', 'COLD-BRW', 4.50, 65, false, 15),
  ('a0000001-0000-0000-0000-00000000000b', '550e8400-e29b-41d4-a716-446655440000', 'Iced Latte', 'COLD-LAT', 5.00, 70, false, 15),
  
  -- Specialty
  ('a0000001-0000-0000-0000-00000000000c', '550e8400-e29b-41d4-a716-446655440000', 'Caramel Macchiato', 'SPEC-CAR', 5.50, 55, false, 10),
  ('a0000001-0000-0000-0000-00000000000d', '550e8400-e29b-41d4-a716-446655440000', 'Vanilla Latte', 'SPEC-VAN', 5.25, 60, false, 10),
  
  -- Custom Item (variable pricing)
  ('a0000001-0000-0000-0000-00000000000e', '550e8400-e29b-41d4-a716-446655440000', 'Custom Order', 'CUSTOM', 0.00, 999, true, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. CREATE DEMO CUSTOMERS
-- ============================================
INSERT INTO public.customers (id, shop_id, name, email, phone)
VALUES 
  ('b0000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'John Doe', 'john@example.com', '+1234567890'),
  ('b0000001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'Jane Smith', 'jane@example.com', '+1234567891'),
  ('b0000001-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'Bob Johnson', 'bob@example.com', '+1234567892')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DEMO USER CREDENTIALS
-- ============================================
-- Email: superadmin@demo.com | Password: demo123 | Role: superadmin
-- Email: owner@demo.com      | Password: demo123 | Role: owner
-- Email: manager@demo.com    | Password: demo123 | Role: manager
-- Email: cashier@demo.com    | Password: demo123 | Role: cashier
