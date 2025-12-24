-- Add user_id field to transactions table
ALTER TABLE transactions
ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Copy existing cashier_id to user_id
UPDATE transactions
SET user_id = cashier_id
WHERE user_id IS NULL AND cashier_id IS NOT NULL;

-- Optional: Drop cashier_id column after migrating
-- ALTER TABLE transactions DROP COLUMN cashier_id;

-- Add comment
COMMENT ON COLUMN transactions.user_id IS 'User who created the transaction (replaces cashier_id)';