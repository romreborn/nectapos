-- Add 'initial' type to stock_movements type check constraint
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_type_check;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_type_check
    CHECK (type IN ('sale', 'restock', 'opname', 'cancel_return', 'initial', 'purchase', 'adjustment'));
