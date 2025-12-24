-- Create a function to search transactions by ID or Product Name
CREATE OR REPLACE FUNCTION public.search_transactions_v2(
    p_shop_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_search text DEFAULT '',
    p_limit int DEFAULT 10,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    id text,
    created_at timestamptz,
    total_amount numeric,
    status text,
    items jsonb,
    customer_name text,
    cashier_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id::text,
        t.created_at,
        t.total_amount,
        t.status,
        t.items,
        c.name as customer_name,
        p.full_name as cashier_name
    FROM transactions t
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN profiles p ON t.user_id = p.id
    WHERE t.shop_id = p_shop_id
    AND t.created_at BETWEEN p_start_date AND p_end_date
    AND (
        p_search IS NULL OR p_search = '' OR
        t.id::text ILIKE '%' || p_search || '%' OR
        t.items::text ILIKE '%' || p_search || '%' OR
        c.name ILIKE '%' || p_search || '%'
    )
    ORDER BY t.created_at DESC
    LIMIT p_limit 
    OFFSET p_offset;
END;
$$;

-- Also need a function to get the count for pagination
CREATE OR REPLACE FUNCTION public.count_transactions_v2(
    p_shop_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_search text DEFAULT ''
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO total_count
    FROM transactions t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.shop_id = p_shop_id
    AND t.created_at BETWEEN p_start_date AND p_end_date
    AND (
        p_search IS NULL OR p_search = '' OR
        t.id::text ILIKE '%' || p_search || '%' OR
        t.items::text ILIKE '%' || p_search || '%' OR
        c.name ILIKE '%' || p_search || '%'
    );
    
    RETURN total_count;
END;
$$;
