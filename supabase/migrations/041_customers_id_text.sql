-- Align Supabase customers.id with app-generated string IDs (cust-... / txn-... / bank-...).
-- This allows migrating data from InsForge local DB, which already stores these as text.

BEGIN;

-- 1. Drop FK constraints that reference customers.id
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_customer_id_fkey;
ALTER TABLE public.inventory_records DROP CONSTRAINT IF EXISTS inventory_records_supplier_id_fkey;
ALTER TABLE public.sales_records DROP CONSTRAINT IF EXISTS sales_records_customer_id_fkey;
ALTER TABLE public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_customer_id_fkey;
ALTER TABLE public.marketing_costs DROP CONSTRAINT IF EXISTS marketing_costs_customer_id_fkey;

-- 2. Drop customers primary key
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_pkey;

-- 3. Change column types to text
ALTER TABLE public.customers ALTER COLUMN id TYPE text;
ALTER TABLE public.transactions ALTER COLUMN customer_id TYPE text;
ALTER TABLE public.inventory_records ALTER COLUMN supplier_id TYPE text;
ALTER TABLE public.sales_records ALTER COLUMN customer_id TYPE text;
ALTER TABLE public.sales_orders ALTER COLUMN customer_id TYPE text;
ALTER TABLE public.marketing_costs ALTER COLUMN customer_id TYPE text;

-- 4. Re-add primary key
ALTER TABLE public.customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id);

-- 5. Re-add foreign key constraints
ALTER TABLE public.transactions ADD CONSTRAINT transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_records ADD CONSTRAINT inventory_records_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.sales_records ADD CONSTRAINT sales_records_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.marketing_costs ADD CONSTRAINT marketing_costs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

COMMIT;
