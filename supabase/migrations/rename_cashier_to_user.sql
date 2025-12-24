-- Migration: Rename cashier_id to user_id in transactions table
-- This allows any user type (not just cashiers) to create transactions

ALTER TABLE transactions 
RENAME COLUMN cashier_id TO user_id;

-- Add comment for documentation
COMMENT ON COLUMN transactions.user_id IS 'ID of the user who created this transaction (can be any role: cashier, manager, owner)';

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'transactions'
ORDER BY ordinal_position;
