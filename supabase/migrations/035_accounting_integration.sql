-- Migration: 035_accounting_integration.sql
-- Description: Auto-sync cashflow transactions to accounting entries

-- Function to handle syncing
CREATE OR REPLACE FUNCTION public.sync_cashflow_to_accounting()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_standard VARCHAR;
    v_acc_cash UUID;
    v_acc_customer UUID;
    v_tx_id UUID;
    v_date DATE;
BEGIN
    -- Get company_id (assuming transactions has company_id or we get it via branch_id)
    -- In this schema, we assume we can get company_id via branch_id or it's on transactions.
    -- Let's try to get it from branch_id first.
    -- For simplicity, if transactions doesn't have company_id directly, we fallback.
    BEGIN
        SELECT company_id INTO v_company_id FROM public.branches WHERE id = NEW.branch_id;
    EXCEPTION WHEN OTHERS THEN
        -- If branches doesn't have company_id, maybe transactions does?
        BEGIN
            EXECUTE 'SELECT company_id FROM public.transactions WHERE id = $1' INTO v_company_id USING NEW.id;
        EXCEPTION WHEN OTHERS THEN
            v_company_id := NULL;
        END;
    END;

    IF v_company_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get settings
    SELECT chart_of_accounts_standard INTO v_standard FROM public.accounting_settings WHERE company_id = v_company_id;
    
    IF v_standard IS NULL THEN
        RETURN NEW;
    END IF;

    -- Find relevant accounts
    SELECT id INTO v_acc_cash FROM public.accounting_accounts WHERE company_id = v_company_id AND code = '111' LIMIT 1;
    SELECT id INTO v_acc_customer FROM public.accounting_accounts WHERE company_id = v_company_id AND (code = '131' OR code = '331') LIMIT 1;

    IF v_acc_cash IS NULL OR v_acc_customer IS NULL THEN
        RETURN NEW; -- Cannot map, skip
    END IF;

    v_date := NEW.transaction_date::DATE;

    -- Insert accounting transaction
    INSERT INTO public.accounting_transactions (company_id, date, voucher_number, description, status)
    VALUES (v_company_id, v_date, 'AUTO-' || NEW.transaction_code, 'Auto-sync from Cashflow: ' || COALESCE(NEW.description, ''), 'DRAFT')
    RETURNING id INTO v_tx_id;

    -- Create lines based on transaction type
    IF NEW.transaction_type = 'payment' THEN
        -- Khách hàng trả tiền: Nợ Tiền mặt / Có Phải thu
        INSERT INTO public.accounting_transaction_lines (transaction_id, account_id, debit_amount, credit_amount, description, cashflow_transaction_id)
        VALUES (v_tx_id, v_acc_cash, NEW.amount, 0, NEW.description, NEW.id);
        
        INSERT INTO public.accounting_transaction_lines (transaction_id, account_id, debit_amount, credit_amount, description, cashflow_transaction_id)
        VALUES (v_tx_id, v_acc_customer, 0, NEW.amount, NEW.description, NEW.id);
        
    ELSIF NEW.transaction_type = 'charge' THEN
        -- Phát sinh công nợ: Nợ Phải thu / Có Tiền mặt (tạm mượn)
        INSERT INTO public.accounting_transaction_lines (transaction_id, account_id, debit_amount, credit_amount, description, cashflow_transaction_id)
        VALUES (v_tx_id, v_acc_customer, NEW.amount, 0, NEW.description, NEW.id);
        
        INSERT INTO public.accounting_transaction_lines (transaction_id, account_id, debit_amount, credit_amount, description, cashflow_transaction_id)
        VALUES (v_tx_id, v_acc_cash, 0, NEW.amount, NEW.description, NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_sync_cashflow_to_accounting ON public.transactions;
CREATE TRIGGER trg_sync_cashflow_to_accounting
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_cashflow_to_accounting();
