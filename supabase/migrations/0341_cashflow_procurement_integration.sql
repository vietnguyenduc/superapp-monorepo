-- Migration: 034_cashflow_procurement_integration.sql
-- Description: Integrates Procurement (Suppliers, Goods Receipts) with Cashflow

-- 1. Sync Suppliers to Customers table (so Cashflow can use them)
CREATE OR REPLACE FUNCTION public.sync_supplier_to_customer()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.customers (id, customer_code, full_name, phone, email, address, is_active, partner_type)
        VALUES (NEW.id, NEW.code, NEW.name, NEW.contact_phone, NEW.contact_email, NEW.address, (NEW.status = 'active'), 'supplier')
        ON CONFLICT (id) DO NOTHING;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.customers
        SET full_name = NEW.name,
            phone = NEW.contact_phone,
            email = NEW.contact_email,
            address = NEW.address,
            is_active = (NEW.status = 'active')
        WHERE id = NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM public.customers WHERE id = OLD.id AND partner_type = 'supplier';
    END IF;
    RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_supplier_to_customer ON public.suppliers;
CREATE TRIGGER trg_sync_supplier_to_customer
AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.sync_supplier_to_customer();

-- Sync existing suppliers
INSERT INTO public.customers (id, customer_code, full_name, phone, email, address, is_active, partner_type)
SELECT id, code, name, contact_phone, contact_email, address, (status = 'active'), 'supplier'
FROM public.suppliers
ON CONFLICT (id) DO NOTHING;

-- 2. Trigger for Goods Receipt -> Cashflow Transaction
CREATE OR REPLACE FUNCTION public.handle_goods_receipt_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_code text;
BEGIN
  -- Only trigger if the Goods Receipt changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Check if total amount is > 0 to avoid empty transactions
    IF NEW.total_amount > 0 THEN
        -- Generate a unique transaction code
        v_transaction_code := 'GR-' || substring(NEW.id::text from 1 for 8);

        INSERT INTO public.transactions (
          transaction_code,
          transaction_date,
          transaction_type,
          amount,
          customer_id,
          description,
          status,
          company_id,
          created_by
        ) VALUES (
          v_transaction_code,
          NEW.receipt_date,
          'charge', -- Recording debt/payable to supplier
          NEW.total_amount,
          NEW.supplier_id, -- Maps to customer_id in transactions table (which acts as partner_id)
          'Công nợ nhập kho từ NCC: ' || NEW.gr_number,
          'completed', -- Debt is confirmed immediately upon GR completion
          NEW.company_id,
          NEW.received_by
        );
    END IF;
  END IF;
  
  -- Handle cancellation: Reverse transaction if GR is cancelled after completion
  IF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
     -- Look for the transaction we created and cancel it
     UPDATE public.transactions 
     SET status = 'cancelled'
     WHERE transaction_code = 'GR-' || substring(NEW.id::text from 1 for 8);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_goods_receipt_transaction ON public.goods_receipts;
CREATE TRIGGER trg_goods_receipt_transaction
AFTER UPDATE ON public.goods_receipts
FOR EACH ROW
EXECUTE FUNCTION public.handle_goods_receipt_transaction();
