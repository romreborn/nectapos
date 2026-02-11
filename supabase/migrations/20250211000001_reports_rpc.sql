-- RPCs for Reporting and Analytics

-- 1. Get Sales Analytics (Daily Sales and Top Products)
CREATE OR REPLACE FUNCTION get_sales_analytics(
  p_shop_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_sales NUMERIC;
  v_total_transactions INTEGER;
  v_avg_order_value NUMERIC;
  v_daily_sales JSONB;
  v_top_products JSONB;
BEGIN
  -- 1. Summary Stats
  SELECT
    COALESCE(SUM(total_amount), 0),
    COUNT(*),
    COALESCE(AVG(total_amount), 0)
  INTO
    v_total_sales,
    v_total_transactions,
    v_avg_order_value
  FROM transactions
  WHERE shop_id = p_shop_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date
    AND status = 'completed';

  -- 2. Daily Sales Trend
  SELECT jsonb_agg(t) INTO v_daily_sales
  FROM (
    SELECT
      to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
      COUNT(*) as count,
      SUM(total_amount) as total
    FROM transactions
    WHERE shop_id = p_shop_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date
      AND status = 'completed'
    GROUP BY 1
    ORDER BY 1 ASC
  ) t;

  -- 3. Top Products (Expand JSON items)
  SELECT jsonb_agg(t) INTO v_top_products
  FROM (
    SELECT
      item->>'product_name' as name,
      SUM(COALESCE((item->>'quantity')::numeric, 0)) as quantity,
      SUM(COALESCE((item->>'subtotal')::numeric, 0)) as total
    FROM transactions,
         jsonb_array_elements(COALESCE(items::jsonb, '[]'::jsonb)) as item
    WHERE shop_id = p_shop_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date
      AND status = 'completed'
    GROUP BY 1
    ORDER BY 3 DESC
    LIMIT 5
  ) t;

  RETURN jsonb_build_object(
    'summary', jsonb_build_object(
      'totalSales', v_total_sales,
      'transactionCount', v_total_transactions,
      'avgOrderValue', v_avg_order_value
    ),
    'dailySales', COALESCE(v_daily_sales, '[]'::jsonb),
    'topProducts', COALESCE(v_top_products, '[]'::jsonb)
  );
END;
$$;

-- 2. Search Transactions (Server-side search including JSON content)
CREATE OR REPLACE FUNCTION search_transactions(
  p_shop_id UUID,
  p_search_term TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_page INTEGER,
  p_page_size INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INTEGER;
  v_transactions JSONB;
  v_total_count INTEGER;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Count Total Query
  SELECT COUNT(*)
  INTO v_total_count
  FROM transactions t
  LEFT JOIN customers c ON t.customer_id = c.id
  WHERE t.shop_id = p_shop_id
    AND t.created_at >= p_start_date
    AND t.created_at <= p_end_date
    AND (
      p_search_term IS NULL OR p_search_term = '' OR
      t.id::text ILIKE '%' || p_search_term || '%' OR
      c.name ILIKE '%' || p_search_term || '%' OR
      -- Search inside JSON array for product name
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(t.items::jsonb, '[]'::jsonb)) as item
        WHERE item->>'product_name' ILIKE '%' || p_search_term || '%'
           OR item->>'name' ILIKE '%' || p_search_term || '%'
      )
    );

  -- Fetch Paged Data
  SELECT jsonb_agg(t) INTO v_transactions
  FROM (
    SELECT
      t.*,
      c.name as customer_name,
      c.email as customer_email
    FROM transactions t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.shop_id = p_shop_id
      AND t.created_at >= p_start_date
      AND t.created_at <= p_end_date
      AND (
        p_search_term IS NULL OR p_search_term = '' OR
        t.id::text ILIKE '%' || p_search_term || '%' OR
        c.name ILIKE '%' || p_search_term || '%' OR
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(t.items::jsonb, '[]'::jsonb)) as item
          WHERE item->>'product_name' ILIKE '%' || p_search_term || '%'
             OR item->>'name' ILIKE '%' || p_search_term || '%'
        )
      )
    ORDER BY t.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) t;

  RETURN jsonb_build_object(
    'data', COALESCE(v_transactions, '[]'::jsonb),
    'total', v_total_count,
    'page', p_page,
    'pageSize', p_page_size
  );
END;
$$;
