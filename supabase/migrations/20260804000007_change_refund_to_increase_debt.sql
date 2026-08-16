-- Migration: 20260804000007_change_refund_to_increase_debt.sql
-- Description:
--   Hoàn tiền (refund) is now treated as a debt-increasing transaction
--   (the customer receives money back and owes more / gets a loan).
--   1. Update the canonical factor function for refund aliases to +1.
--   2. Update existing transaction_types rows for refund to math_factor=1.
--   3. Recalculate customer balances to reflect the new convention.
-- Date: 2026-08-04

-- Update canonical semantic factor for refund
CREATE OR REPLACE FUNCTION canonical_customer_factor(p_type TEXT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE
    WHEN lower(p_type) IN ('charge','phát sinh tăng','phat sinh tang','cho nợ','cho no','chi','tiền ra','tien ra','điều chỉnh tăng','dieu chinh tang') THEN 1
    WHEN lower(p_type) IN ('payment','phát sinh giảm','phat sinh giam','thanh toán','thanh toan','thu','tien vao','thu tiền','thu tien','điều chỉnh giảm','dieu chinh giam') THEN -1
    WHEN lower(p_type) IN ('refund','hoàn tiền','hoan tien','trả lại','tra lai') THEN 1
    WHEN lower(p_type) IN ('deposit','đặt cọc','dat coc','cọc','coc','tạm ứng','tam ung','prepayment','ứng trước','ung truoc') THEN -1
    WHEN lower(p_type) IN ('adjustment','điều chỉnh','dieu chinh') THEN 1
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update stored refund rows to the new factor and impact_type
UPDATE public.transaction_types
SET
  math_factor = 1,
  impact_type = 'increase'
WHERE canonical_customer_factor(name) = 1
  AND canonical_customer_factor(name) IS DISTINCT FROM math_factor
  AND lower(name) IN ('refund','hoàn tiền','hoan tien','trả lại','tra lai');

-- Recalculate all customer balances using the updated factors
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, company_id FROM public.customers LOOP
    PERFORM recalc_customer_balance(r.id, r.company_id);
  END LOOP;
END $$;
