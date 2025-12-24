-- Disable RLS for customers table to fix permission issues
-- Run this in your Supabase SQL editor

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Also disable RLS for profiles if needed
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;