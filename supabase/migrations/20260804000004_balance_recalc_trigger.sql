-- Migration: 20260804000004_balance_recalc_trigger.sql
-- Description: Fix customer/bank balance drift by recalculating from the ledger
--              on every transaction write. Positive total_balance = debt.
-- Date: 2026-08-04

-- Drop old incorrect balance triggers/functions if they exist.
DROP TRIGGER IF EXISTS trigger_update_customer_balance ON public.transactions;
DROP TRIGGER IF EXISTS trigger_update_bank_account_balance ON public.transactions;
DROP TRIGGER IF EXISTS trg_update_customer_balance ON public.transactions;
DROP TRIGGER IF EXISTS trg_update_bank_account_balance ON public.transactions;
DROP FUNCTION IF EXISTS update_customer_balance();
DROP FUNCTION IF EXISTS update_bank_account_balance();
DROP FUNCTION IF EXISTS recalc_customer_balance(uuid, uuid);
DROP FUNCTION IF EXISTS recalc_customer_balance(text, uuid);
DROP FUNCTION IF EXISTS recalc_bank_account_balance(uuid);
DROP FUNCTION IF EXISTS recalc_bank_account_balance(text);
DROP FUNCTION IF EXISTS canonical_customer_factor(text);
DROP FUNCTION IF EXISTS customer_factor_for_type(text, uuid);

-- Canonical customer factor (positive total_balance = debt).
CREATE OR REPLACE FUNCTION canonical_customer_factor(p_type TEXT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE
    WHEN lower(p_type) IN ('charge','phát sinh tăng','phat sinh tang','cho nợ','cho no','chi') THEN 1
    WHEN lower(p_type) IN ('payment','phát sinh giảm','phat sinh giam','thanh toán','thanh toan','thu','tien vao','thu tiền','thu tien') THEN -1
    WHEN lower(p_type) IN ('refund','hoàn tiền','hoan tien','trả lại','tra lai') THEN -1
    WHEN lower(p_type) IN ('deposit','đặt cọc','dat coc','cọc','coc','tạm ứng','tam ung','prepayment','ứng trước','ung truoc') THEN -1
    WHEN lower(p_type) IN ('adjustment','điều chỉnh','dieu chinh','điều chỉnh tăng','dieu chinh tang') THEN 1
    WHEN lower(p_type) IN ('điều chỉnh giảm','dieu chinh giam') THEN -1
    ELSE 1
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Look up a company-specific math_factor for a canonical transaction type.
-- Falls back to the canonical factor when no matching transaction_types row exists.
CREATE OR REPLACE FUNCTION customer_factor_for_type(p_type TEXT, p_company_id UUID)
RETURNS NUMERIC AS $$
DECLARE v_factor NUMERIC;
BEGIN
  SELECT tt.math_factor INTO v_factor
  FROM public.transaction_types tt
  WHERE (tt.company_id IS NULL OR tt.company_id = p_company_id)
    AND (
      lower(tt.name) = lower(p_type)
      OR (lower(p_type) = 'charge' AND lower(tt.name) = 'phát sinh tăng')
      OR (lower(p_type) = 'payment' AND lower(tt.name) = 'phát sinh giảm')
      OR (lower(p_type) = 'refund' AND lower(tt.name) = 'hoàn tiền')
      OR (lower(p_type) = 'deposit' AND lower(tt.name) = 'đặt cọc')
      OR (lower(p_type) = 'adjustment' AND lower(tt.name) = 'điều chỉnh')
    )
  ORDER BY (tt.company_id = p_company_id) DESC NULLS LAST, tt.updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_factor IS NOT NULL THEN
    RETURN v_factor;
  END IF;

  RETURN canonical_customer_factor(p_type);
END;
$$ LANGUAGE plpgsql STABLE;

-- Recalculate one customer's total_balance and current_balance from the ledger.
CREATE OR REPLACE FUNCTION recalc_customer_balance(p_customer_id TEXT, p_company_id UUID)
RETURNS void AS $$
DECLARE
  v_opening NUMERIC;
  v_total NUMERIC;
  v_last_date TIMESTAMPTZ;
  v_type TEXT;
  v_amount NUMERIC;
  v_factor NUMERIC;
BEGIN
  SELECT COALESCE(opening_balance, 0) INTO v_opening
  FROM public.customers
  WHERE id = p_customer_id;

  v_total := COALESCE(v_opening, 0);

  FOR v_type, v_amount, v_factor IN
    SELECT t.transaction_type, t.amount, customer_factor_for_type(t.transaction_type, p_company_id)
    FROM public.transactions t
    WHERE t.customer_id = p_customer_id
      AND t.status = 'completed'
    ORDER BY t.transaction_date ASC, t.created_at ASC
  LOOP
    v_total := v_total + (v_amount * v_factor);
  END LOOP;

  SELECT MAX(t.transaction_date) INTO v_last_date
  FROM public.transactions t
  WHERE t.customer_id = p_customer_id
    AND t.status = 'completed';

  UPDATE public.customers
  SET total_balance = v_total,
      current_balance = v_total,
      last_transaction_date = v_last_date
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

-- Recalculate one bank account's cash balance from the ledger.
CREATE OR REPLACE FUNCTION recalc_bank_account_balance(p_bank_account_id TEXT)
RETURNS void AS $$
DECLARE
  v_total NUMERIC;
  v_type TEXT;
  v_amount NUMERIC;
BEGIN
  v_total := 0;

  FOR v_type, v_amount IN
    SELECT t.transaction_type, t.amount
    FROM public.transactions t
    WHERE t.bank_account_id = p_bank_account_id
      AND t.status = 'completed'
    ORDER BY t.transaction_date ASC, t.created_at ASC
  LOOP
    v_total := v_total + CASE
      WHEN lower(v_type) IN ('payment','phát sinh giảm','phat sinh giam','thanh toán','thanh toan','thu','tien vao','thu tiền','thu tien',
                             'deposit','đặt cọc','dat coc','cọc','coc','tạm ứng','tam ung','prepayment','ứng trước','ung truoc') THEN v_amount
      WHEN lower(v_type) IN ('refund','hoàn tiền','hoan tien','trả lại','tra lai') THEN -v_amount
      WHEN lower(v_type) IN ('adjustment','điều chỉnh','dieu chinh','điều chỉnh tăng','dieu chinh tang','điều chỉnh giảm','dieu chinh giam') THEN v_amount
      ELSE 0
    END;
  END LOOP;

  UPDATE public.bank_accounts
  SET balance = v_total
  WHERE id = p_bank_account_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function that keeps customer balances in sync on transaction writes.
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recalc_customer_balance(NEW.customer_id, NEW.company_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
      PERFORM recalc_customer_balance(OLD.customer_id, OLD.company_id);
    END IF;
    IF NEW.customer_id IS NOT NULL THEN
      PERFORM recalc_customer_balance(NEW.customer_id, NEW.company_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalc_customer_balance(OLD.customer_id, OLD.company_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function that keeps bank account balances in sync on transaction writes.
CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recalc_bank_account_balance(NEW.bank_account_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id THEN
      PERFORM recalc_bank_account_balance(OLD.bank_account_id);
    END IF;
    IF NEW.bank_account_id IS NOT NULL THEN
      PERFORM recalc_bank_account_balance(NEW.bank_account_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalc_bank_account_balance(OLD.bank_account_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_customer_balance ON public.transactions;
CREATE TRIGGER trg_update_customer_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

DROP TRIGGER IF EXISTS trg_update_bank_account_balance ON public.transactions;
CREATE TRIGGER trg_update_bank_account_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION update_bank_account_balance();

-- Backfill all existing balances using the same formula.
DO $$
DECLARE
  c RECORD;
  b RECORD;
BEGIN
  FOR c IN SELECT id, company_id FROM public.customers LOOP
    PERFORM recalc_customer_balance(c.id, c.company_id);
  END LOOP;

  FOR b IN SELECT id FROM public.bank_accounts LOOP
    PERFORM recalc_bank_account_balance(b.id);
  END LOOP;
END $$;
