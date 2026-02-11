-- Create function to automatically create initial stock movement when product is created
CREATE OR REPLACE FUNCTION create_initial_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create initial stock movement if stock_qty > 0
    IF NEW.stock_qty > 0 THEN
        INSERT INTO stock_movements (
            product_id,
            shop_id,
            type,
            quantity,
            stock_before,
            stock_after,
            reference_type,
            reference_id,
            created_at
        ) VALUES (
            NEW.id,
            NEW.shop_id,
            'restock',
            NEW.stock_qty,
            0,
            NEW.stock_qty,
            'initial stock',
            NULL,
            NEW.created_at
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after product insert
DROP TRIGGER IF EXISTS trigger_create_initial_stock ON products;
CREATE TRIGGER trigger_create_initial_stock
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_stock_movement();
