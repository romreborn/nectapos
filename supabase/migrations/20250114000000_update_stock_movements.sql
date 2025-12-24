-- Update stock_movements table to include additional fields for tracking
-- Also fix column name from qty_change to quantity for consistency

-- First, add the missing columns if they don't exist
DO $$
BEGIN
    -- Check if reference_id column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stock_movements'
        AND column_name = 'reference_id'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN reference_id UUID;
    END IF;

    -- Check if reference_type column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stock_movements'
        AND column_name = 'reference_type'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN reference_type TEXT;
    END IF;

    -- Check if stock_before column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stock_movements'
        AND column_name = 'stock_before'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN stock_before INTEGER DEFAULT 0;
    END IF;

    -- Check if stock_after column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stock_movements'
        AND column_name = 'stock_after'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN stock_after INTEGER DEFAULT 0;
    END IF;

    -- Rename qty_change to quantity for consistency
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stock_movements'
        AND column_name = 'qty_change'
    ) THEN
        ALTER TABLE stock_movements RENAME COLUMN qty_change TO quantity;
    END IF;
END $$;

-- Update the type check constraint to match new column name
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_type_check;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_type_check
    CHECK (type IN ('sale', 'restock', 'opname', 'cancel_return'));

-- Create index on reference_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_id ON stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_type ON stock_movements(reference_type);

-- Update RLS policies for the new columns
DROP POLICY IF EXISTS "Users can view stock movements in own shop" ON stock_movements;
CREATE POLICY "Users can view stock movements in own shop" ON stock_movements
    FOR ALL
    USING (shop_id = get_auth_shop_id());