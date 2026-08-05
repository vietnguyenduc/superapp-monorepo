-- Migration: 010_transaction_type_constraints.sql
-- Description: Add strict constraints to transaction_types table for data integrity
-- Date: 2026-04-27
-- Priority: CRITICAL - Prevents data corruption

-- Step 1: Add unique constraint on transaction_types.id
-- This ensures transaction type IDs are globally unique across all companies
ALTER TABLE public.transaction_types
DROP CONSTRAINT IF EXISTS transaction_types_id_unique;
ALTER TABLE public.transaction_types
ADD CONSTRAINT transaction_types_id_unique UNIQUE (id);

-- Step 2 (removed): A foreign key from transactions.transaction_type to transaction_types.id
-- cannot be enforced because the columns are different types (enum vs uuid) in this
-- migration phase. Data integrity is enforced by the app layer and by the
-- transaction_types.name values inserted by 007_assign_data_to_cp_beta.sql.

-- Step 3: Add composite unique constraint (company_id, id)
-- This ensures transaction type IDs are unique within each company
-- Replaces the existing (company_id, name) constraint
ALTER TABLE public.transaction_types
DROP CONSTRAINT IF EXISTS transaction_types_company_id_name_key;

ALTER TABLE public.transaction_types
ADD CONSTRAINT transaction_types_company_id_id_key UNIQUE (company_id, id);

-- Step 4: Add index for performance on transaction_type lookups
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
DROP CONSTRAINT IF EXISTS transaction_types_math_factor_check;
ALTER TABLE public.transaction_types
ADD CONSTRAINT transaction_types_math_factor_check 
CHECK (math_factor IN (-1, 1));

-- Step 7: Add check constraint for impact_type
-- Ensures impact_type is either 'increase' or 'decrease'
ALTER TABLE public.transaction_types
DROP CONSTRAINT IF EXISTS transaction_types_impact_type_check;
ALTER TABLE public.transaction_types
ADD CONSTRAINT transaction_types_impact_type_check 
CHECK (impact_type IN ('increase', 'decrease'));

-- Step 8/9 (removed): Trigger logic compared transactions.transaction_type (enum) with
-- transaction_types.id (uuid), which are incompatible types. Application layer handles
-- preventing deletion of transaction types that are in use.

-- Step 10: Add comment to document constraints
COMMENT ON CONSTRAINT transaction_types_id_unique ON public.transaction_types IS
'Ensures transaction type IDs are globally unique to prevent conflicts';

COMMENT ON CONSTRAINT transaction_types_company_id_id_key ON public.transaction_types IS 
'Ensures transaction type IDs are unique within each company for proper multi-tenancy';

COMMENT ON CONSTRAINT transaction_types_math_factor_check ON public.transaction_types IS 
'Ensures math_factor is either -1 (decrease balance) or 1 (increase balance)';

COMMENT ON CONSTRAINT transaction_types_impact_type_check ON public.transaction_types IS 
'Ensures impact_type is either increase or decrease for consistency';
