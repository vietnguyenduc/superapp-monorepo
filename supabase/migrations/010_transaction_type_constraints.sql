-- Migration: 010_transaction_type_constraints.sql
-- Description: Add strict constraints to transaction_types table for data integrity
-- Date: 2026-04-27
-- Priority: CRITICAL - Prevents data corruption

-- Step 1: Add unique constraint on transaction_types.id
-- This ensures transaction type IDs are globally unique across all companies
ALTER TABLE public.transaction_types
ADD CONSTRAINT IF NOT EXISTS transaction_types_id_unique UNIQUE (id);

-- Step 2: Add foreign key constraint from transactions.transaction_type to transaction_types.id
-- This ensures transactions only reference valid transaction types
-- ON DELETE RESTRICT prevents deletion of transaction types that are in use
ALTER TABLE public.transactions
ADD CONSTRAINT IF NOT EXISTS transactions_transaction_type_fkey
FOREIGN KEY (transaction_type) 
REFERENCES public.transaction_types(id) 
ON DELETE RESTRICT;

-- Step 3: Add composite unique constraint (company_id, id)
-- This ensures transaction type IDs are unique within each company
-- Replaces the existing (company_id, name) constraint
ALTER TABLE public.transaction_types
DROP CONSTRAINT IF EXISTS transaction_types_company_id_name_key;

ALTER TABLE public.transaction_types
ADD CONSTRAINT transaction_types_company_id_id_key UNIQUE (company_id, id);

-- Step 4: Add index for performance on transaction_type foreign key
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type 
ON public.transactions(transaction_type);

-- Step 5: Add index for transaction_types lookups
CREATE INDEX IF NOT EXISTS idx_transaction_types_company_id 
ON public.transaction_types(company_id);

CREATE INDEX IF NOT EXISTS idx_transaction_types_is_active 
ON public.transaction_types(is_active);

-- Step 6: Add check constraint for math_factor
-- Ensures math_factor is either -1 or 1
ALTER TABLE public.transaction_types
ADD CONSTRAINT IF NOT EXISTS transaction_types_math_factor_check 
CHECK (math_factor IN (-1, 1));

-- Step 7: Add check constraint for impact_type
-- Ensures impact_type is either 'increase' or 'decrease'
ALTER TABLE public.transaction_types
ADD CONSTRAINT IF NOT EXISTS transaction_types_impact_type_check 
CHECK (impact_type IN ('increase', 'decrease'));

-- Step 8: Add trigger to prevent deletion of transaction types in use
-- This provides additional protection beyond the foreign key constraint
CREATE OR REPLACE FUNCTION prevent_transaction_type_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if transaction type is used in any transactions
    IF EXISTS (
        SELECT 1 FROM public.transactions 
        WHERE transaction_type = OLD.id
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'Cannot delete transaction type "%" because it is used in % transactions', 
            OLD.name, 
            (SELECT COUNT(*) FROM public.transactions WHERE transaction_type = OLD.id);
    END IF;
    
    -- If not in use, allow deletion (will be soft delete in application layer)
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger for transaction_types BEFORE DELETE
DROP TRIGGER IF EXISTS transaction_type_before_delete ON public.transaction_types;

CREATE TRIGGER transaction_type_before_delete
BEFORE DELETE ON public.transaction_types
FOR EACH ROW
EXECUTE FUNCTION prevent_transaction_type_deletion();

-- Step 10: Add comment to document constraints
COMMENT ON CONSTRAINT transaction_types_id_unique ON public.transaction_types IS 
'Ensures transaction type IDs are globally unique to prevent conflicts';

COMMENT ON CONSTRAINT transactions_transaction_type_fkey ON public.transactions IS 
'Ensures transactions only reference valid transaction types, prevents deletion of types in use';

COMMENT ON CONSTRAINT transaction_types_company_id_id_key ON public.transaction_types IS 
'Ensures transaction type IDs are unique within each company for proper multi-tenancy';

COMMENT ON CONSTRAINT transaction_types_math_factor_check ON public.transaction_types IS 
'Ensures math_factor is either -1 (decrease balance) or 1 (increase balance)';

COMMENT ON CONSTRAINT transaction_types_impact_type_check ON public.transaction_types IS 
'Ensures impact_type is either increase or decrease for consistency';

COMMENT ON FUNCTION prevent_transaction_type_deletion() IS 
'Prevents deletion of transaction types that are used in transactions';
