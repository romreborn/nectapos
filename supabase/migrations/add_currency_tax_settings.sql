-- Migration: Add currency and tax settings to shops table
-- Run this in Supabase SQL Editor

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0.00;

-- Add comment for documentation
COMMENT ON COLUMN shops.currency IS 'Shop currency code (USD, IDR, SGD, etc.)';
COMMENT ON COLUMN shops.tax_percentage IS 'Tax percentage applied to transactions (0.00 to 100.00)';

-- Update existing shops with default values
UPDATE shops 
SET 
    currency = COALESCE(currency, 'USD'),
    tax_percentage = COALESCE(tax_percentage, 0.00)
WHERE currency IS NULL OR tax_percentage IS NULL;

-- Verify the migration
SELECT id, name, currency, tax_percentage FROM shops;
