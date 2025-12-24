-- Dashboard Stats RPCs

-- 1. Get Dashboard Summary (Total Sales, Count, Avg Order, Products Sold)
CREATE OR REPLACE FUNCTION get_dashboard_summary(
    p_shop_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    total_sales NUMERIC,
    transaction_count INTEGER,
    avg_order_value NUMERIC,
    products_sold INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH sales_data AS (
        SELECT
            COALESCE(SUM(total_amount), 0) as total_sales,
            COUNT(id) as transaction_count,
            CASE 
                WHEN COUNT(id) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(id)
                ELSE 0
            END as avg_order_value
        FROM transactions
        WHERE shop_id = p_shop_id
        AND created_at >= p_start_date
        AND created_at <= p_end_date
        AND status = 'completed' -- Ensure only completed transactions count
    ),
    products_data AS (
        SELECT
            COALESCE(SUM((item->>'quantity')::INTEGER), 0) as products_sold
        FROM transactions t,
        jsonb_array_elements(t.items) item
        WHERE t.shop_id = p_shop_id
        AND t.created_at >= p_start_date
        AND t.created_at <= p_end_date
        AND t.status = 'completed'
    )
    SELECT
        s.total_sales,
        s.transaction_count::INTEGER,
        ROUND(s.avg_order_value, 2) as avg_order_value,
        p.products_sold::INTEGER
    FROM sales_data s, products_data p;
END;
$$;

-- 2. Get Sales Chart Data (Time series)
CREATE OR REPLACE FUNCTION get_sales_chart_data(
    p_shop_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_interval TEXT -- 'hour', 'day', 'month'
)
RETURNS TABLE (
    date TEXT,
    amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN p_interval = 'hour' THEN to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'HH24:00')
            WHEN p_interval = 'day' THEN to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'Dy') -- Mon, Tue
            ELSE to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'Mon DD')
        END as date,
        COALESCE(SUM(total_amount), 0) as amount
    FROM transactions
    WHERE shop_id = p_shop_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date
    AND status = 'completed'
    GROUP BY 1
    ORDER BY MIN(created_at);
END;
$$;

-- 3. Get Top Products (Best Sellers) - NOW USING JSONB
CREATE OR REPLACE FUNCTION get_top_products(
    p_shop_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    product_name TEXT,
    quantity INTEGER,
    total_sales NUMERIC,
    transaction_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (item->>'product_name')::TEXT as product_name,
        SUM((item->>'quantity')::INTEGER)::INTEGER as quantity,
        SUM((item->>'subtotal')::NUMERIC) as total_sales,
        COUNT(DISTINCT t.id)::INTEGER as transaction_count
    FROM transactions t,
    jsonb_array_elements(t.items) item
    WHERE t.shop_id = p_shop_id
    AND t.created_at >= p_start_date
    AND t.created_at <= p_end_date
    AND t.status = 'completed'
    GROUP BY 1
    ORDER BY quantity DESC
    LIMIT p_limit;
END;
$$;
