-- SQL to check and fix user profiles
-- Run this in your Supabase SQL editor

-- First, let's check if the user has a profile
SELECT
    p.*,
    u.email,
    u.created_at as user_created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'kasir@demo.com';

-- Check if there are any shops
SELECT * FROM shops;

-- If no profile exists for kasir@demo.com, create one
-- First, get the user ID
DO $$
DECLARE
    user_id UUID;
    shop_id UUID;
BEGIN
    -- Get user ID for kasir@demo.com
    SELECT id INTO user_id FROM auth.users WHERE email = 'kasir@demo.com';

    IF user_id IS NOT NULL THEN
        -- Check if user has a profile
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
            -- Get first available shop ID or create a demo shop
            SELECT id INTO shop_id FROM shops LIMIT 1;

            IF shop_id IS NULL THEN
                -- Create a demo shop if none exists
                INSERT INTO shops (id, name, subscription_status, is_online_sync_enabled)
                VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Demo Shop', true, true)
                ON CONFLICT (id) DO NOTHING;

                shop_id := '550e8400-e29b-41d4-a716-446655440000';
            END IF;

            -- Create profile for the user
            INSERT INTO profiles (id, shop_id, role, full_name, email)
            VALUES (user_id, shop_id, 'cashier', 'Demo Cashier', 'kasir@demo.com');

            RAISE NOTICE 'Profile created for user kasir@demo.com with shop_id: %', shop_id;
        ELSE
            -- Profile exists, check shop_id
            SELECT shop_id INTO shop_id FROM profiles WHERE id = user_id;
            RAISE NOTICE 'Profile exists for user kasir@demo.com with shop_id: %', shop_id;
        END IF;
    ELSE
        RAISE NOTICE 'User kasir@demo.com not found in auth.users';
    END IF;
END $$;

-- Check the result again
SELECT
    p.*,
    u.email,
    u.created_at as user_created_at,
    s.name as shop_name
FROM profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN shops s ON p.shop_id = s.id
WHERE u.email = 'kasir@demo.com';

-- Also check all customers to see if any exist
SELECT
    c.*,
    s.name as shop_name
FROM customers c
JOIN shops s ON c.shop_id = s.id
LIMIT 10;