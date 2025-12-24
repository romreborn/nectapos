-- First, create the demo shop if it doesn't exist
INSERT INTO shops (id, name, address, phone)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Demo Coffee Shop', '123 Main Street', '+1234567890')
ON CONFLICT (id) DO NOTHING;

-- Insert demo products
INSERT INTO products (id, shop_id, name, sku, price, stock_qty, is_custom, low_stock_threshold)
VALUES 
  ('a0000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Espresso', 'COFFEE-ESP', 3.50, 100, false, 20),
  ('a0000001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'Cappuccino', 'COFFEE-CAP', 4.50, 80, false, 20),
  ('a0000001-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'Latte', 'COFFEE-LAT', 4.75, 90, false, 20),
  ('a0000001-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440000', 'Americano', 'COFFEE-AME', 3.75, 85, false, 20),
  ('a0000001-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440000', 'Mocha', 'COFFEE-MOC', 5.00, 70, false, 15),
  ('a0000001-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440000', 'Croissant', 'PASTRY-CRO', 3.25, 50, false, 10),
  ('a0000001-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440000', 'Blueberry Muffin', 'PASTRY-MUF', 3.50, 40, false, 10),
  ('a0000001-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440000', 'Chocolate Chip Cookie', 'PASTRY-COO', 2.50, 60, false, 15),
  ('a0000001-0000-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440000', 'Iced Coffee', 'COLD-ICE', 4.00, 75, false, 20),
  ('a0000001-0000-0000-0000-00000000000a', '550e8400-e29b-41d4-a716-446655440000', 'Cold Brew', 'COLD-BRW', 4.50, 65, false, 15)
ON CONFLICT (id) DO NOTHING;

-- Verify data was inserted
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as shop_count FROM shops;
