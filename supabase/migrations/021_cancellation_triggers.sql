-- Migration: 021_cancellation_triggers
-- Description: Adds status columns to inventory/sales records and cancellation sync triggers.

-- 1. Add status columns
ALTER TABLE public.inventory_records ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'cancelled')) DEFAULT 'active';
ALTER TABLE public.sales_records ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'cancelled')) DEFAULT 'active';

-- 2. Trigger Function: Sync Cancellation to Cashflow (Inventory)
CREATE OR REPLACE FUNCTION public.handle_inventory_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_code text;
BEGIN
  -- If status changed to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- The transaction code we generated in 020 was 'IMP-' || substring(NEW.id::text from 1 for 8)
    v_transaction_code := 'IMP-' || substring(NEW.id::text from 1 for 8);
    
    -- Update Cashflow transaction to cancelled
    UPDATE public.transactions 
    SET status = 'cancelled', updated_at = NOW()
    WHERE transaction_code = v_transaction_code AND status = 'pending';
    
    -- Note: We only cancel if it's still 'pending'. If it was already 'completed' (paid), 
    -- the accountant should handle it manually, or we could force it. We'll cancel it anyway for safety,
    -- but usually you'd want to reverse the payment. For now, we update it.
    UPDATE public.transactions 
    SET status = 'cancelled', updated_at = NOW()
    WHERE transaction_code = v_transaction_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Trigger
DROP TRIGGER IF EXISTS trg_inventory_cancellation ON public.inventory_records;
CREATE TRIGGER trg_inventory_cancellation
AFTER UPDATE ON public.inventory_records
FOR EACH ROW
EXECUTE FUNCTION public.handle_inventory_cancellation();

-- 4. Trigger Function: Sync Cancellation to Cashflow (Sales)
CREATE OR REPLACE FUNCTION public.handle_sales_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_code text;
BEGIN
  -- If status changed to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    v_transaction_code := 'SAL-' || substring(NEW.id::text from 1 for 8);
    
    -- Update Cashflow transaction to cancelled
    UPDATE public.transactions 
    SET status = 'cancelled', updated_at = NOW()
    WHERE transaction_code = v_transaction_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Trigger
DROP TRIGGER IF EXISTS trg_sales_cancellation ON public.sales_records;
CREATE TRIGGER trg_sales_cancellation
AFTER UPDATE ON public.sales_records
FOR EACH ROW
EXECUTE FUNCTION public.handle_sales_cancellation();
