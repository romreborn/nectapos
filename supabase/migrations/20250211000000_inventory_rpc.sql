-- RPCs for Product Management with Stock Tracking

-- 1. Create Product with Initial Stock
CREATE OR REPLACE FUNCTION create_product_general(
  p_id UUID,
  p_shop_id UUID,
  p_user_id UUID,
  p_name TEXT,
  p_sku TEXT,
  p_price NUMERIC,
  p_stock_qty INTEGER,
  p_is_custom BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert Product
  INSERT INTO products (
    id, shop_id, name, sku, price, stock_qty, is_custom, created_at, updated_at
  ) VALUES (
    p_id, p_shop_id, p_name, p_sku, p_price, p_stock_qty, p_is_custom, NOW(), NOW()
  );

  -- Create Initial Stock Movement if stock > 0
  IF p_stock_qty > 0 THEN
    INSERT INTO stock_movements (
      shop_id, user_id, product_id,
      type, quantity,
      stock_before, stock_after,
      reference_type, reference_id,
      created_at
    ) VALUES (
      p_shop_id, p_user_id, p_id,
      'restock', p_stock_qty,
      0, p_stock_qty,
      'initial_stock', NULL,
      NOW()
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'data', p_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Update Product with Automatic Stock Movement
CREATE OR REPLACE FUNCTION update_product_general(
  p_product_id UUID,
  p_shop_id UUID,
  p_user_id UUID,
  p_name TEXT,
  p_sku TEXT,
  p_price NUMERIC,
  p_stock_qty INTEGER,
  p_is_custom BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_stock_diff INTEGER;
  v_new_name TEXT;
  v_new_price NUMERIC;
  v_new_is_custom BOOLEAN;
BEGIN
  -- Get current stock and details
  SELECT stock_qty INTO v_old_stock
  FROM products
  WHERE id = p_product_id AND shop_id = p_shop_id;

  IF v_old_stock IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  -- Handle partial updates safely for NOT NULL columns
  v_new_stock := COALESCE(p_stock_qty, v_old_stock);
  v_stock_diff := v_new_stock - v_old_stock;

  -- Update Product
  UPDATE products
  SET
    name = COALESCE(p_name, name),
    sku = p_sku, -- Nullable, so we accept NULL
    price = COALESCE(p_price, price),
    stock_qty = v_new_stock,
    is_custom = COALESCE(p_is_custom, is_custom),
    updated_at = NOW()
  WHERE id = p_product_id AND shop_id = p_shop_id;

  -- Create Movement if stock changed
  IF v_stock_diff != 0 THEN
    INSERT INTO stock_movements (
      shop_id, user_id, product_id,
      type, quantity,
      stock_before, stock_after,
      reference_type, reference_id,
      created_at
    ) VALUES (
      p_shop_id, p_user_id, p_product_id,
      CASE WHEN v_stock_diff > 0 THEN 'restock' ELSE 'correction' END,
      v_stock_diff,
      v_old_stock, v_new_stock,
      'manual_adjustment', p_product_id,
      NOW()
    );
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
