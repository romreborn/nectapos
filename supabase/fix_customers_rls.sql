-- SQL script to fix customers table RLS policies
-- Run this in your Supabase SQL editor

-- Update the function to handle NULL shop_id
CREATE OR REPLACE FUNCTION get_auth_shop_id()
RETURNS UUID AS $$
DECLARE
  user_shop_id UUID;
BEGIN
  SELECT shop_id INTO user_shop_id FROM profiles WHERE id = auth.uid();

  -- If no shop_id found, return the default demo shop ID
  IF user_shop_id IS NULL THEN
    RETURN '550e8400-e29b-41d4-a716-446655440000'::UUID;
  END IF;

  RETURN user_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view customers in own shop" ON customers;

-- Create a new policy that allows all operations
CREATE POLICY "Users can manage customers in own shop" ON customers
    FOR ALL
    USING (
        shop_id = get_auth_shop_id() OR
        shop_id = '550e8400-e29b-41d4-a716-446655440000'
    )
    WITH CHECK (
        shop_id = get_auth_shop_id() OR
        shop_id = '550e8400-e29b-41d4-a716-446655440000'
    );

-- Also fix profiles table to allow users without shop_id
DROP POLICY IF EXISTS "Users can view profiles in own shop" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- New policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can view profiles in same shop" ON profiles
    FOR SELECT
    USING (
        shop_id = get_auth_shop_id() OR
        shop_id = '550e8400-e29b-41d4-a716-446655440000' OR
        id = auth.uid()
    );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (id = auth.uid());