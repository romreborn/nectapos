-- SQL script to create demo shop and customers
-- Run this manually in your Supabase SQL editor

-- Create a default shop for demo purposes
INSERT INTO shops (id, name, subscription_status, is_online_sync_enabled)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Demo Shop',
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Insert some demo customers for the default shop
INSERT INTO customers (id, shop_id, name, email, phone)
VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'John Doe', 'john.doe@example.com', '+1234567890'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Jane Smith', 'jane.smith@example.com', '+0987654321'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Bob Wilson', NULL, '+1122334455')
ON CONFLICT (id) DO NOTHING;