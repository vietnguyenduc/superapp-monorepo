-- Migration: 043_recalculate_customer_total_balances.sql
-- Description: Backfill total_balance for all customers using the canonical
--              balance formula: Dư nợ = Đầu kỳ + Σ(Số tiền × Hệ số).
--              Positive total_balance = debt (công nợ).
--              Uses transaction_types.math_factor when available, falls back
--              to canonical factors for known transaction type names.

DO $$
DECLARE
    txn RECORD;
    customer_id TEXT;
    opening NUMERIC;
    factor NUMERIC;
    delta NUMERIC := 0;
    new_total NUMERIC;
BEGIN
    -- Recalculate one customer at a time to avoid locking the whole table.
    FOR customer_id, opening IN
        SELECT id::text, COALESCE(opening_balance, 0)
        FROM public.customers
    LOOP
        delta := 0;

        FOR txn IN
            SELECT t.transaction_type, t.amount
            FROM public.transactions t
            WHERE t.customer_id::text = customer_id
        LOOP
            -- Prefer math_factor from transaction_types (company-specific or global default).
            SELECT tt.math_factor
            INTO factor
            FROM public.transaction_types tt
            WHERE (tt.company_id IS NULL OR tt.company_id = (SELECT company_id FROM public.customers WHERE id::text = customer_id))
              AND (lower(tt.name) = lower(txn.transaction_type) OR tt.id::text = txn.transaction_type)
            ORDER BY tt.company_id NULLS LAST
            LIMIT 1;

            IF factor IS NULL THEN
                -- Fallback canonical factor (positive total_balance = debt).
                factor := CASE
                    WHEN lower(txn.transaction_type) IN ('charge', 'phát sinh tăng', 'phat sinh tang', 'cho nợ', 'cho no', 'chi') THEN 1
                    WHEN lower(txn.transaction_type) IN ('payment', 'phát sinh giảm', 'phat sinh giam', 'thanh toán', 'thanh toan', 'thu', 'tien vao') THEN -1
                    WHEN lower(txn.transaction_type) IN ('refund', 'hoàn tiền', 'hoan tien') THEN -1
                    WHEN lower(txn.transaction_type) IN ('deposit', 'đặt cọc', 'dat coc', 'cọc', 'coc', 'tạm ứng', 'tam ung', 'prepayment') THEN -1
                    WHEN lower(txn.transaction_type) IN ('adjustment', 'điều chỉnh', 'dieu chinh') THEN 1
                    ELSE 1
                END;
            END IF;

            delta := delta + (txn.amount * factor);
        END LOOP;

        new_total := COALESCE(opening, 0) + delta;

        UPDATE public.customers
        SET total_balance = new_total,
            current_balance = new_total
        WHERE id::text = customer_id;
    END LOOP;
END $$;
