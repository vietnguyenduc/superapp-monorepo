-- Audit Schema Mismatch - Compare schema.sql with actual Supabase schema
-- This script checks for differences between the documented schema and actual database

-- Check all tables in the database
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check table structures
SELECT 
    t.table_name,
    string_agg(
        c.column_name || ' ' || c.data_type || 
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        ', ' ORDER BY c.ordinal_position
    ) as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.column_name
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;
