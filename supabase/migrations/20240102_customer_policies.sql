-- Row Level Security Policies for customers table

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy for users to view customers from their shop
CREATE POLICY "Users can view customers from their shop"
ON customers FOR SELECT
USING (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy for users to insert customers for their shop
CREATE POLICY "Users can insert customers for their shop"
ON customers FOR INSERT
WITH CHECK (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy for users to update customers from their shop
CREATE POLICY "Users can update customers from their shop"
ON customers FOR UPDATE
USING (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy for users to delete customers from their shop
CREATE POLICY "Users can delete customers from their shop"
ON customers FOR DELETE
USING (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);