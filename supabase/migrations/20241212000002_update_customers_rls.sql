-- Update the get_auth_shop_id function to handle NULL values
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

-- Drop existing customers policy and recreate with better handling
DROP POLICY IF EXISTS "Users can view customers in own shop" ON customers;

-- New policy that allows all operations for users in their shop
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