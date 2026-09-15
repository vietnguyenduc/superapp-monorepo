-- Preserve the exact company prefix, including lowercase letters and punctuation.
CREATE OR REPLACE FUNCTION public.create_customer_with_auto_code(
  p_customer jsonb,
  p_prefix text DEFAULT 'KH',
  p_digits integer DEFAULT 4,
  p_fill_gaps boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_branch_id uuid;
  v_prefix text;
  v_digits integer;
  v_next bigint;
  v_limit bigint;
  v_code text;
  v_customer public.customers%ROWTYPE;
BEGIN
  v_company_id := NULLIF(p_customer->>'company_id', '')::uuid;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Vui lòng chọn công ty trước khi tạo khách hàng';
  END IF;
  IF COALESCE(trim(p_customer->>'full_name'), '') = '' THEN
    RAISE EXCEPTION 'Họ và tên là bắt buộc';
  END IF;

  v_prefix := COALESCE(p_prefix, 'KH');
  v_digits := LEAST(GREATEST(COALESCE(p_digits, 4), 1), 12);
  v_limit := power(10::numeric, v_digits)::bigint - 1;
  v_branch_id := NULLIF(p_customer->>'branch_id', '')::uuid;

  -- Serialize allocation per tenant. The lock is released with this transaction.
  PERFORM pg_advisory_xact_lock(hashtextextended('customer-code:' || v_company_id::text, 0));

  IF COALESCE(p_fill_gaps, false) THEN
    v_next := 1;
    WHILE EXISTS (
      SELECT 1
      FROM public.customers
      WHERE company_id = v_company_id
        AND left(customer_code, length(v_prefix)) = v_prefix
        AND substring(customer_code FROM length(v_prefix) + 1) ~ ('^[0-9]{1,' || v_digits || '}$')
        AND substring(customer_code FROM length(v_prefix) + 1)::bigint = v_next
    ) LOOP
      v_next := v_next + 1;
      IF v_next > v_limit THEN
        RAISE EXCEPTION 'Đã dùng hết mã khách hàng có % chữ số', v_digits;
      END IF;
    END LOOP;
  ELSE
    SELECT COALESCE(max(substring(customer_code FROM length(v_prefix) + 1)::bigint), 0) + 1
      INTO v_next
    FROM public.customers
    WHERE company_id = v_company_id
      AND left(customer_code, length(v_prefix)) = v_prefix
      AND substring(customer_code FROM length(v_prefix) + 1) ~ ('^[0-9]{1,' || v_digits || '}$');
  END IF;

  IF v_next > v_limit THEN
    RAISE EXCEPTION 'Đã dùng hết mã khách hàng có % chữ số', v_digits;
  END IF;
  v_code := v_prefix || lpad(v_next::text, v_digits, '0');

  INSERT INTO public.customers (
    id, customer_code, full_name, phone, email, address, branch_id,
    opening_balance, total_balance, current_balance, company_id,
    working_method, status, is_active, created_at, updated_at
  ) VALUES (
    COALESCE(NULLIF(p_customer->>'id', ''), gen_random_uuid()::text),
    v_code,
    trim(p_customer->>'full_name'),
    NULLIF(trim(p_customer->>'phone'), ''),
    NULLIF(trim(p_customer->>'email'), ''),
    NULLIF(trim(p_customer->>'address'), ''),
    v_branch_id,
    COALESCE(NULLIF(p_customer->>'opening_balance', '')::numeric, 0),
    COALESCE(NULLIF(p_customer->>'total_balance', '')::numeric, 0),
    COALESCE(NULLIF(p_customer->>'current_balance', '')::numeric, 0),
    v_company_id,
    NULLIF(trim(p_customer->>'working_method'), ''),
    COALESCE(NULLIF(p_customer->>'status', ''), 'active'),
    COALESCE(NULLIF(p_customer->>'is_active', '')::boolean, true),
    COALESCE(NULLIF(p_customer->>'created_at', '')::timestamptz, now()),
    now()
  )
  RETURNING * INTO v_customer;

  RETURN to_jsonb(v_customer);
END;
$$;

REVOKE ALL ON FUNCTION public.create_customer_with_auto_code(jsonb, text, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_customer_with_auto_code(jsonb, text, integer, boolean) TO authenticated;

COMMENT ON FUNCTION public.create_customer_with_auto_code(jsonb, text, integer, boolean)
IS 'Atomically allocates a tenant-scoped customer code and creates the customer under RLS.';
