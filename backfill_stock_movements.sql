-- Backfill all existing POS transactions into stock_movements table
-- Run this in Supabase SQL Editor

-- First, let's see how many transactions we have
SELECT COUNT(*) as total_transactions FROM transactions WHERE status = 'completed';

-- Create a function to backfill stock movements (if doesn't exist)
CREATE OR REPLACE FUNCTION backfill_stock_movements()
RETURNS TABLE(
    transaction_id UUID,
    movements_created INT,
    status TEXT
) AS $$
DECLARE
    transaction_record RECORD;
    movement_count INT;
    item_record JSONB;
    product_id UUID;
    quantity INT;
    current_stock INT;
    new_stock INT;
BEGIN
    -- Loop through all completed transactions
    FOR transaction_record IN
        SELECT * FROM transactions
        WHERE status = 'completed'
        AND id NOT IN (
            SELECT DISTINCT reference_id
            FROM stock_movements
            WHERE reference_type = 'transaction'
        )
        ORDER BY created_at ASC
    LOOP
        movement_count := 0;

        -- Process each item in the transaction
        IF transaction_record.items IS NOT NULL THEN
            FOR item_record IN SELECT * FROM jsonb_array_elements(transaction_record.items)
            LOOP
                product_id := (item_record->>'product_id')::UUID;
                quantity := -(COALESCE((item_record->>'quantity')::INT, (item_record->>'qty')::INT, 1));

                -- Get current stock
                SELECT stock INTO current_stock
                FROM products
                WHERE id = product_id;

                IF current_stock IS NULL THEN
                    current_stock := 0;
                END IF;

                -- Calculate new stock (prevent negative)
                new_stock := GREATEST(0, current_stock + quantity);

                -- Create stock movement
                INSERT INTO stock_movements (
                    product_id,
                    quantity,
                    type,
                    reference_id,
                    reference_type,
                    shop_id,
                    user_id,
                    stock_before,
                    stock_after,
                    created_at
                ) VALUES (
                    product_id,
                    quantity,
                    'sale',
                    transaction_record.id,
                    'transaction',
                    transaction_record.shop_id,
                    transaction_record.user_id,
                    current_stock,
                    new_stock,
                    transaction_record.created_at
                );

                movement_count := movement_count + 1;
            END LOOP;
        END IF;

        -- Return result for this transaction
        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Run the backfill function
SELECT * FROM backfill_stock_movements();

-- Verify the results
SELECT
    COUNT(*) as total_movements,
    COUNT(DISTINCT reference_id) as unique_transactions,
    MIN(created_at) as earliest_movement,
    MAX(created_at) as latest_movement
FROM stock_movements
WHERE reference_type = 'transaction';

-- Show a sample of created movements
SELECT
    sm.id,
    sm.product_id,
    p.name as product_name,
    sm.quantity,
    sm.stock_before,
    sm.stock_after,
    sm.reference_id,
    sm.created_at
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.reference_type = 'transaction'
ORDER BY sm.created_at DESC
LIMIT 10;