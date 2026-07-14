-- Migration: 20260527000003_add_nguoi_dai_dien_to_customers
-- Description: Add nguoi_dai_dien (representative) column to customers table
-- Date: 2026-07-14

-- Cashflow: Add nguoi_dai_dien (representative) to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS nguoi_dai_dien text;
COMMENT ON COLUMN public.customers.nguoi_dai_dien IS 'Người đại diện (representative) for the customer';
