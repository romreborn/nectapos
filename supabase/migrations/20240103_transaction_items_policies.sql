-- Row Level Security Policies for transaction_items table

-- Enable RLS on transaction_items table
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Policy for users to view transaction items from their shop
CREATE POLICY "Users can view transaction items from their shop"
ON transaction_items FOR SELECT
USING (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy for users to insert transaction items for their shop
CREATE POLICY "Users can insert transaction items for their shop"
ON transaction_items FOR INSERT
WITH CHECK (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy for users to update transaction items from their shop
CREATE POLICY "Users can update transaction items from their shop"
ON transaction_items FOR UPDATE
USING (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy for users to delete transaction items from their shop
CREATE POLICY "Users can delete transaction items from their shop"
ON transaction_items FOR DELETE
USING (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);