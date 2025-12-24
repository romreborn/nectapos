-- Insert demo products directly into Supabase
-- Run this in your Supabase SQL Editor

-- First, get your shop_id (replace with actual shop_id from your shops table)
-- You can find it by running: SELECT id FROM shops LIMIT 1;

-- Insert Products (using the shop_id from your database)
INSERT INTO public.products (id, shop_id, name, sku, price, stock_qty, is_custom, low_stock_threshold)
VALUES 
  -- Coffee Products
  ('a0000001-0000-0000-0000-000000000001', (SELECT id FROM shops LIMIT 1), 'Espresso', 'COFFEE-ESP', 3.50, 100, false, 20),
  ('a0000001-0000-0000-0000-000000000002', (SELECT id FROM shops LIMIT 1), 'Cappuccino', 'COFFEE-CAP', 4.50, 80, false, 20),
  ('a0000001-0000-0000-0000-000000000003', (SELECT id FROM shops LIMIT 1), 'Latte', 'COFFEE-LAT', 4.75, 90, false, 20),
  ('a0000001-0000-0000-0000-000000000004', (SELECT id FROM shops LIMIT 1), 'Americano', 'COFFEE-AME', 3.75, 85, false, 20),
  ('a0000001-0000-0000-0000-000000000005', (SELECT id FROM shops LIMIT 1), 'Mocha', 'COFFEE-MOC', 5.00, 70, false, 15),
  
  -- Pastries
  ('a0000001-0000-0000-0000-000000000006', (SELECT id FROM shops LIMIT 1), 'Croissant', 'PASTRY-CRO', 3.25, 50, false, 10),
  ('a0000001-0000-0000-0000-000000000007', (SELECT id FROM shops LIMIT 1), 'Blueberry Muffin', 'PASTRY-MUF', 3.50, 40, false, 10),
  ('a0000001-0000-0000-0000-000000000008', (SELECT id FROM shops LIMIT 1), 'Chocolate Chip Cookie', 'PASTRY-COO', 2.50, 60, false, 15),
  
  -- Cold Drinks
  ('a0000001-0000-0000-0000-000000000009', (SELECT id FROM shops LIMIT 1), 'Iced Coffee', 'COLD-ICE', 4.00, 75, false, 20),
  ('a0000001-0000-0000-0000-00000000000a', (SELECT id FROM shops LIMIT 1), 'Cold Brew', 'COLD-BRW', 4.50, 65, false, 15),
  ('a0000001-0000-0000-0000-00000000000b', (SELECT id FROM shops LIMIT 1), 'Iced Latte', 'COLD-LAT', 5.00, 70, false, 15),
  
  -- Specialty
  ('a0000001-0000-0000-0000-00000000000c', (SELECT id FROM shops LIMIT 1), 'Caramel Macchiato', 'SPEC-CAR', 5.50, 55, false, 10),
  ('a0000001-0000-0000-0000-00000000000d', (SELECT id FROM shops LIMIT 1), 'Vanilla Latte', 'SPEC-VAN', 5.25, 60, false, 10),
  
  -- Custom Item (variable pricing)
  ('a0000001-0000-0000-0000-00000000000e', (SELECT id FROM shops LIMIT 1), 'Custom Order', 'CUSTOM', 0.00, 999, true, 0)
ON CONFLICT (id) DO NOTHING;
