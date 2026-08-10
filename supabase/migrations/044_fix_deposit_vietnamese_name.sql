-- Migration: 044_fix_deposit_vietnamese_name.sql
-- Description: Rename seeded deposit transaction type labels from English "deposit"
--              to Vietnamese "Đặt cọc" so the UI displays the correct label.

UPDATE public.transaction_types
SET name = 'Đặt cọc'
WHERE LOWER(TRIM(name)) = 'deposit';
