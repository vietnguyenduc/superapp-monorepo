-- Migration: 020_sales_and_cashflow_integration
-- Description: Adds Partner type, integration fields for sales/inventory, and triggers for Cashflow.

-- 1. Cashflow: Add partner_type to customers and status to transactions
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS partner_type text CHECK (partner_type IN ('customer', 'supplier', 'both')) DEFAULT 'customer';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'completed';

-- 2. Inventory: Add supplier_id, unit_price, total_amount to inventory_records
ALTER TABLE public.inventory_records ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_records ADD COLUMN IF NOT EXISTS unit_price numeric(15, 2);
ALTER TABLE public.inventory_records ADD COLUMN IF NOT EXISTS total_amount numeric(15, 2);

-- 3. Inventory: Add customer_id to sales_records
ALTER TABLE public.sales_records ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.sales_records ADD COLUMN IF NOT EXISTS total_amount numeric(15, 2);

-- 4. Trigger Function: Inventory Import -> Cashflow Transaction
CREATE OR REPLACE FUNCTION public.handle_inventory_import_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_code text;
BEGIN
  -- Only trigger if a supplier is provided and it's an import (input_quantity > 0)
  IF NEW.supplier_id IS NOT NULL AND NEW.input_quantity > 0 THEN
    -- Generate a unique transaction code
    v_transaction_code := 'IMP-' || substring(NEW.id::text from 1 for 8);

    INSERT INTO public.transactions (
      transaction_code,
      transaction_date,
      transaction_type,
      amount,
      customer_id,
      description,
      status,
      company_id,
      branch_id,
      created_by
    ) VALUES (
      v_transaction_code,
      NEW.date,
      'charge', -- Assuming 'charge' is used for recording debt/payable
      COALESCE(NEW.total_amount, 0),
      NEW.supplier_id, -- Maps to customer_id in transactions table (which acts as partner_id)
      'Công nợ nhập kho tự động',
      'pending',
      NEW.company_id,
      NEW.branch_id,
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Trigger to inventory_records
DROP TRIGGER IF EXISTS trg_inventory_import_transaction ON public.inventory_records;
CREATE TRIGGER trg_inventory_import_transaction
AFTER INSERT ON public.inventory_records
FOR EACH ROW
EXECUTE FUNCTION public.handle_inventory_import_transaction();

-- 6. Trigger Function: Sales Export -> Cashflow Transaction
CREATE OR REPLACE FUNCTION public.handle_sales_export_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_code text;
BEGIN
  -- Only trigger if a customer is provided and it's a sale (sales_quantity > 0)
  IF NEW.customer_id IS NOT NULL AND NEW.sales_quantity > 0 THEN
    -- Generate a unique transaction code
    v_transaction_code := 'SAL-' || substring(NEW.id::text from 1 for 8);

    INSERT INTO public.transactions (
      transaction_code,
      transaction_date,
      transaction_type,
      amount,
      customer_id,
      description,
      status,
      company_id,
      branch_id,
      created_by
    ) VALUES (
      v_transaction_code,
      NEW.date,
      'charge', -- Recording debt/receivable
      COALESCE(NEW.total_amount, 0),
      NEW.customer_id,
      'Công nợ bán hàng tự động',
      'pending',
      NEW.company_id,
      NEW.branch_id,
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Attach Trigger to sales_records
DROP TRIGGER IF EXISTS trg_sales_export_transaction ON public.sales_records;
CREATE TRIGGER trg_sales_export_transaction
AFTER INSERT ON public.sales_records
FOR EACH ROW
EXECUTE FUNCTION public.handle_sales_export_transaction();
