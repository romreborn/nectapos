-- Row Level Security Policies for transactions and transaction_items tables

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view transactions from their shop
CREATE POLICY "Users can view transactions from their shop"
ON transactions FOR SELECT
USING (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy for users to insert transactions for their shop
CREATE POLICY "Users can insert transactions for their shop"
ON transactions FOR INSERT
WITH CHECK (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy for users to update transactions from their shop
CREATE POLICY "Users can update transactions from their shop"
ON transactions FOR UPDATE
USING (
    shop_id IN (
        SELECT shop_id FROM profiles
        WHERE id = auth.uid()
    )
);

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