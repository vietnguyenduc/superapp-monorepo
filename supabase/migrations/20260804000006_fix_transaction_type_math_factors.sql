-- Migration: 20260804000006_fix_transaction_type_math_factors.sql
-- Description:
--   1. Repair transaction_types rows whose math_factor/impact_type contradict
--      the canonical meaning of their name (e.g. "Phát sinh tăng" with -1).
--   2. Harden customer_factor_for_type so it always uses the semantic factor for
--      known canonical ids/names, falling back to the stored math_factor only for
--      genuinely custom (unknown) transaction types.
--   3. Recalculate all customer balances so historical data reflects the corrected
--      factors.
-- Date: 2026-08-04

-- Canonical customer factor: returns NULL for unknown/custom names so callers
-- can tell the difference between "standard canonical" and "custom".
CREATE OR REPLACE FUNCTION canonical_customer_factor(p_type TEXT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE
    WHEN lower(p_type) IN ('charge','phát sinh tăng','phat sinh tang','cho nợ','cho no','chi','điều chỉnh tăng','dieu chinh tang') THEN 1
    WHEN lower(p_type) IN ('payment','phát sinh giảm','phat sinh giam','thanh toán','thanh toan','thu','tien vao','thu tiền','thu tien','điều chỉnh giảm','dieu chinh giam') THEN -1
    WHEN lower(p_type) IN ('refund','hoàn tiền','hoan tien','trả lại','tra lai') THEN -1
    WHEN lower(p_type) IN ('deposit','đặt cọc','dat coc','cọc','coc','tạm ứng','tam ung','prepayment','ứng trước','ung truoc') THEN -1
    WHEN lower(p_type) IN ('adjustment','điều chỉnh','dieu chinh') THEN 1
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Look up the factor for a transaction type. Stored math_factor is the source
-- of truth; the canonical semantic factor is only used as a fallback when
-- the row is missing or has no configured factor.
CREATE OR REPLACE FUNCTION customer_factor_for_type(p_type TEXT, p_company_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_factor NUMERIC;
  v_name TEXT;
BEGIN
  -- Resolve the actual transaction type row by id, name, or canonical meaning.
  -- Cast the UUID id to text before comparing to avoid lower(uuid) errors.
  SELECT tt.math_factor, tt.name INTO v_factor, v_name
  FROM public.transaction_types tt
  WHERE (tt.company_id IS NULL OR tt.company_id = p_company_id)
    AND (
      lower(tt.id::text) = lower(p_type)
      OR lower(tt.name) = lower(p_type)
      OR canonical_customer_factor(tt.name) = canonical_customer_factor(p_type)
    )
  ORDER BY (tt.company_id = p_company_id) DESC NULLS LAST, tt.updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_factor IS NOT NULL THEN
    RETURN v_factor;
  END IF;

  -- Fallback to the canonical semantic factor for known aliases.
  RETURN COALESCE(canonical_customer_factor(p_type), 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Repair rows whose stored math_factor does not match the canonical meaning of
-- their name, and sync impact_type accordingly.
UPDATE public.transaction_types
SET
  math_factor = canonical_customer_factor(name),
  impact_type = CASE canonical_customer_factor(name)
    WHEN 1 THEN 'increase'
    WHEN -1 THEN 'decrease'
    ELSE impact_type
  END
WHERE canonical_customer_factor(name) IS NOT NULL
  AND math_factor IS DISTINCT FROM canonical_customer_factor(name);

-- Backfill all customer balances using the hardened factor lookup.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, company_id FROM public.customers LOOP
    PERFORM recalc_customer_balance(r.id, r.company_id);
  END LOOP;
END $$;
