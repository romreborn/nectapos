-- Enable Row Level Security on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all products
CREATE POLICY "Allow authenticated users to read products"
ON products
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert products
CREATE POLICY "Allow authenticated users to insert products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update products
CREATE POLICY "Allow authenticated users to update products"
ON products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to delete products
CREATE POLICY "Allow authenticated users to delete products"
ON products
FOR DELETE
TO authenticated
USING (true);

-- Enable RLS on transactions table as well
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all transactions
CREATE POLICY "Allow authenticated users to read transactions"
ON transactions
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert transactions
CREATE POLICY "Allow authenticated users to insert transactions"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update transactions
CREATE POLICY "Allow authenticated users to update transactions"
ON transactions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to delete transactions
CREATE POLICY "Allow authenticated users to delete transactions"
ON transactions
FOR DELETE
TO authenticated
USING (true);
