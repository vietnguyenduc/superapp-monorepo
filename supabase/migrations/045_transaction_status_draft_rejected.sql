-- Allow transactions to be saved as drafts, queued for approval, or rejected.
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Migrate old cancelled values to the new rejected state.
UPDATE public.transactions SET status = 'rejected' WHERE status = 'cancelled';

-- New status domain: draft, pending, completed, rejected.
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_status_check
CHECK (status IN ('draft', 'pending', 'completed', 'rejected'));

-- Keep completed as the default for backward-compatible inserts.
ALTER TABLE public.transactions
ALTER COLUMN status SET DEFAULT 'completed';
