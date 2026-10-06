-- The transaction triggers are the only production writers for derived customer
-- and bank balances. Harden their execution context and repair historical drift.

CREATE OR REPLACE FUNCTION public.recalc_customer_balance(p_customer_id text, p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_opening numeric;
  v_total numeric;
  v_last_date timestamptz;
  v_transaction record;
BEGIN
  SELECT COALESCE(c.opening_balance, 0)
    INTO v_opening
  FROM public.customers c
  WHERE c.id = p_customer_id AND c.company_id = p_company_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_total := v_opening;
  FOR v_transaction IN
    SELECT t.transaction_type, t.amount
    FROM public.transactions t
    WHERE t.customer_id = p_customer_id
      AND t.company_id = p_company_id
      AND t.status = 'completed'
    ORDER BY t.transaction_date, t.created_at
  LOOP
    v_total := v_total + (
      v_transaction.amount * public.customer_factor_for_type(v_transaction.transaction_type, p_company_id)
    );
  END LOOP;

  SELECT max(t.transaction_date)
    INTO v_last_date
  FROM public.transactions t
  WHERE t.customer_id = p_customer_id
    AND t.company_id = p_company_id
    AND t.status = 'completed';

  UPDATE public.customers c
  SET total_balance = v_total,
      current_balance = v_total,
      last_transaction_date = v_last_date
  WHERE c.id = p_customer_id AND c.company_id = p_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalc_bank_account_balance(p_bank_account_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_company_id uuid;
  v_total numeric := 0;
  v_transaction record;
BEGIN
  SELECT b.company_id INTO v_company_id
  FROM public.bank_accounts b
  WHERE b.id = p_bank_account_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  FOR v_transaction IN
    SELECT t.transaction_type, t.amount
    FROM public.transactions t
    WHERE t.bank_account_id = p_bank_account_id
      AND t.company_id = v_company_id
      AND t.status = 'completed'
    ORDER BY t.transaction_date, t.created_at
  LOOP
    v_total := v_total + CASE
      WHEN lower(v_transaction.transaction_type) IN (
        'payment','phát sinh giảm','phat sinh giam','thanh toán','thanh toan',
        'thu','tien vao','thu tiền','thu tien','deposit','đặt cọc','dat coc',
        'cọc','coc','tạm ứng','tam ung','prepayment','ứng trước','ung truoc'
      ) THEN v_transaction.amount
      WHEN lower(v_transaction.transaction_type) IN ('refund','hoàn tiền','hoan tien','trả lại','tra lai')
        THEN -v_transaction.amount
      WHEN lower(v_transaction.transaction_type) IN (
        'adjustment','điều chỉnh','dieu chinh','điều chỉnh tăng','dieu chinh tang',
        'điều chỉnh giảm','dieu chinh giam'
      ) THEN v_transaction.amount
      ELSE 0
    END;
  END LOOP;

  UPDATE public.bank_accounts b
  SET balance = v_total
  WHERE b.id = p_bank_account_id AND b.company_id = v_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_customer_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalc_customer_balance(NEW.customer_id, NEW.company_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id OR OLD.company_id IS DISTINCT FROM NEW.company_id THEN
      PERFORM public.recalc_customer_balance(OLD.customer_id, OLD.company_id);
    END IF;
    IF NEW.customer_id IS NOT NULL THEN
      PERFORM public.recalc_customer_balance(NEW.customer_id, NEW.company_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_customer_balance(OLD.customer_id, OLD.company_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalc_bank_account_balance(NEW.bank_account_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id THEN
      PERFORM public.recalc_bank_account_balance(OLD.bank_account_id);
    END IF;
    IF NEW.bank_account_id IS NOT NULL THEN
      PERFORM public.recalc_bank_account_balance(NEW.bank_account_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_bank_account_balance(OLD.bank_account_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.recalc_customer_balance(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_bank_account_balance(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_customer_balance() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_bank_account_balance() FROM PUBLIC, anon, authenticated;

-- Repair balances that may have been incremented by both the database trigger
-- and the browser after earlier transaction writes.
DO $$
DECLARE
  v_customer record;
  v_bank record;
BEGIN
  FOR v_customer IN SELECT c.id, c.company_id FROM public.customers c LOOP
    PERFORM public.recalc_customer_balance(v_customer.id, v_customer.company_id);
  END LOOP;

  FOR v_bank IN SELECT b.id FROM public.bank_accounts b LOOP
    PERFORM public.recalc_bank_account_balance(v_bank.id);
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.recalc_customer_balance(text, uuid)
IS 'Internal trigger helper that rebuilds one tenant customer balance from the transaction ledger.';
COMMENT ON FUNCTION public.recalc_bank_account_balance(text)
IS 'Internal trigger helper that rebuilds one tenant bank balance from the transaction ledger.';
