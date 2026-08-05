-- Phase 5: Inventory data model redesign
-- Canonical inventory model built around movements + balances

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Inventory movements table - core ledger
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  
  -- Movement dimensions
  movement_type TEXT NOT NULL CHECK (movement_type IN ('inbound', 'outbound', 'adjustment', 'stock_count')),
  source TEXT NOT NULL CHECK (source IN ('purchase', 'sales', 'transfer', 'production', 'stock_count', 'adjustment', 'return')),
  role_owner TEXT NOT NULL CHECK (role_owner IN ('warehouse_keeper', 'accountant', 'manager', 'system')),
  
  -- Quantity and value
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  unit_cost NUMERIC,
  total_value NUMERIC GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,
  
  -- Balance tracking
  running_balance NUMERIC NOT NULL,
  running_value NUMERIC GENERATED ALWAYS AS (running_balance * COALESCE(unit_cost, 0)) STORED,
  
  -- For F&B: distinguish between book and actual
  is_book_entry BOOLEAN DEFAULT FALSE,
  is_actual_entry BOOLEAN DEFAULT FALSE,
  
  -- Reference to related documents
  reference_id TEXT,
  reference_type TEXT,
  
  -- Timestamps
  movement_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  notes TEXT,
  
  -- Constraints
  CONSTRAINT valid_quantity CHECK (quantity >= 0),
  CONSTRAINT valid_unit_cost CHECK (unit_cost IS NULL OR unit_cost >= 0),
  CONSTRAINT valid_running_balance CHECK (running_balance >= 0)
);

-- Indexes for inventory_movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_company ON inventory_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_source ON inventory_movements(source);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_id, reference_type);

-- Inventory balance snapshots table - periodic balances
CREATE TABLE IF NOT EXISTS inventory_balance_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  
  -- Period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Opening balance
  opening_quantity NUMERIC NOT NULL,
  opening_unit TEXT NOT NULL,
  opening_value NUMERIC,
  
  -- Inbound in period
  inbound_quantity NUMERIC NOT NULL,
  inbound_unit TEXT NOT NULL,
  inbound_value NUMERIC,
  
  -- Outbound in period
  outbound_quantity NUMERIC NOT NULL,
  outbound_unit TEXT NOT NULL,
  outbound_value NUMERIC,
  
  -- Closing balance
  closing_quantity NUMERIC NOT NULL,
  closing_unit TEXT NOT NULL,
  closing_value NUMERIC,
  
  -- Variance (if reconciled with stock count)
  stock_count_quantity NUMERIC,
  variance_quantity NUMERIC GENERATED ALWAYS AS (COALESCE(stock_count_quantity, 0) - closing_quantity) STORED,
  variance_notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reconciled', 'approved')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_period CHECK (period_end >= period_start),
  CONSTRAINT valid_quantities CHECK (
    opening_quantity >= 0 AND
    inbound_quantity >= 0 AND
    outbound_quantity >= 0 AND
    closing_quantity >= 0
  ),
  CONSTRAINT unique_product_period UNIQUE (company_id, product_id, period_start, period_end)
);

-- Indexes for inventory_balance_snapshots
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_company ON inventory_balance_snapshots(company_id);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_product ON inventory_balance_snapshots(product_id);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_period ON inventory_balance_snapshots(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_status ON inventory_balance_snapshots(status);

-- Stock count entries table - physical counting records
CREATE TABLE IF NOT EXISTS stock_count_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  
  -- Count data
  counted_quantity NUMERIC NOT NULL,
  counted_unit TEXT NOT NULL,
  
  -- Expected (book) quantity
  expected_quantity NUMERIC NOT NULL,
  expected_unit TEXT NOT NULL,
  
  -- Variance
  variance_quantity NUMERIC GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
  variance_unit TEXT NOT NULL,
  variance_value NUMERIC,
  
  -- Count metadata
  count_date TIMESTAMP WITH TIME ZONE NOT NULL,
  counted_by TEXT NOT NULL,
  reviewed_by TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  -- Constraints
  CONSTRAINT valid_counted_quantity CHECK (counted_quantity >= 0),
  CONSTRAINT valid_expected_quantity CHECK (expected_quantity >= 0)
);

-- Indexes for stock_count_entries
CREATE INDEX IF NOT EXISTS idx_stock_count_company ON stock_count_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_product ON stock_count_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_date ON stock_count_entries(count_date);
CREATE INDEX IF NOT EXISTS idx_stock_count_status ON stock_count_entries(status);

-- RLS Policies for inventory_movements
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_movements_select_policy ON inventory_movements
  FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY inventory_movements_insert_policy ON inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY inventory_movements_update_policy ON inventory_movements
  FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY inventory_movements_delete_policy ON inventory_movements
  FOR DELETE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for inventory_balance_snapshots
ALTER TABLE inventory_balance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_balance_snapshots_select_policy ON inventory_balance_snapshots
  FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY inventory_balance_snapshots_insert_policy ON inventory_balance_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY inventory_balance_snapshots_update_policy ON inventory_balance_snapshots
  FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY inventory_balance_snapshots_delete_policy ON inventory_balance_snapshots
  FOR DELETE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for stock_count_entries
ALTER TABLE stock_count_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_count_entries_select_policy ON stock_count_entries
  FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY stock_count_entries_insert_policy ON stock_count_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY stock_count_entries_update_policy ON stock_count_entries
  FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY stock_count_entries_delete_policy ON stock_count_entries
  FOR DELETE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_inventory_movements_updated_at
  BEFORE UPDATE ON inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_balance_snapshots_updated_at
  BEFORE UPDATE ON inventory_balance_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_count_entries_updated_at
  BEFORE UPDATE ON stock_count_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
