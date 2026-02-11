-- Enable RLS on all tables
-- This migration fixes the security issue where RLS policies exist but RLS is not enabled

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on shops table
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Enable RLS on stock_movements table
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
DO $$
DECLARE
    table_name TEXT;
    rls_enabled BOOLEAN;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('customers', 'profiles', 'shops', 'stock_movements', 'transactions', 'products')
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = table_name;
        
        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS not enabled on table: %', table_name;
        END IF;
        
        RAISE NOTICE 'RLS enabled on table: %', table_name;
    END LOOP;
END $$;
