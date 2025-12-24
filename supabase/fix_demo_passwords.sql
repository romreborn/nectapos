-- Fix Demo User Passwords
-- This updates the demo users with the correct bcrypt hash for "demo123"

-- The correct bcrypt hash for "demo123" is:
-- $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4xJp5fLtwe

UPDATE auth.users
SET encrypted_password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4xJp5fLtwe'
WHERE email IN (
    'superadmin@demo.com',
    'owner@demo.com',
    'manager@demo.com',
    'cashier@demo.com'
);

-- Verify the update
SELECT email,
       CASE
         WHEN encrypted_password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4xJp5fLtwe'
         THEN 'Password updated successfully'
         ELSE 'Password update failed'
       END as password_status
FROM auth.users
WHERE email IN (
    'superadmin@demo.com',
    'owner@demo.com',
    'manager@demo.com',
    'cashier@demo.com'
);