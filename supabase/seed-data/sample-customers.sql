-- Sample customers for testing
-- Run these queries in Supabase SQL Editor to add sample customers

-- Make sure to replace the shop_id with your actual shop ID
INSERT INTO customers (id, name, email, phone, shop_id, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'John Doe', 'john.doe@email.com', '+1234567890', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'Jane Smith', 'jane.smith@email.com', '+0987654321', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'Acme Corporation', 'billing@acme.com', '+1122334455', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'Bob Johnson', NULL, '+5544332211', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'Alice Wilson', 'alice.w@email.com', NULL, '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW());

-- Note: If you have a different shop_id, update it in the queries above