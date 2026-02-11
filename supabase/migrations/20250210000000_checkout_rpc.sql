-- Create a function to handle checkout process atomically
-- This ensures transactions, stock updates, and movements are consistent

-- 1. Ensure transactions table has all necessary columns
DO $$
BEGIN
    -- Add items column if not exists (store line items as JSON)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'items') THEN
        ALTER TABLE transactions ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add payment_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_method') THEN
        ALTER TABLE transactions ADD COLUMN payment_method TEXT DEFAULT 'cash';
    END IF;

    -- Add tax_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'tax_amount') THEN
        ALTER TABLE transactions ADD COLUMN tax_amount DECIMAL(12, 2) DEFAULT 0;
    END IF;

    -- Add subtotal_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'subtotal_amount') THEN
        ALTER TABLE transactions ADD COLUMN subtotal_amount DECIMAL(12, 2) DEFAULT 0;
    END IF;
END $$;

-- 2. Create the checkout RPC function
CREATE OR REPLACE FUNCTION process_checkout(
  p_shop_id UUID,
  p_user_id UUID,
  p_customer_id UUID,
  p_items JSONB,
  p_payment_method TEXT,
  p_total_amount NUMERIC,
  p_tax_amount NUMERIC,
  p_subtotal_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_product_name TEXT;
BEGIN
  -- Create Transaction
  INSERT INTO transactions (
    shop_id, user_id, customer_id, items, payment_method,
    total_amount, tax_amount, subtotal_amount, status
  ) VALUES (
    p_shop_id, p_user_id, p_customer_id, p_items, p_payment_method,
    p_total_amount, p_tax_amount, p_subtotal_amount, 'completed'
  ) RETURNING id INTO v_transaction_id;

  -- Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INTEGER;
    v_product_name := (v_item->>'product_name')::TEXT;

    -- Lock product for update
    SELECT stock_qty INTO v_current_stock
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Product % not found during checkout', v_product_name;
    END IF;

    -- Calculate new stock
    v_new_stock := v_current_stock - v_qty;

    -- Update product stock
    UPDATE products
    SET stock_qty = v_new_stock
    WHERE id = v_product_id;

    -- Create stock movement
    INSERT INTO stock_movements (
      shop_id, user_id, product_id,
      type, quantity,
      stock_before, stock_after,
      reference_id, reference_type
    ) VALUES (
      p_shop_id, p_user_id, v_product_id,
      'sale', -v_qty,
      v_current_stock, v_new_stock,
      v_transaction_id, 'transaction'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
