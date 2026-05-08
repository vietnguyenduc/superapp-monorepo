-- Migration: Inventory Movements
-- Description: Canonical inventory model built around movements + balances
-- Phase 5 - Inventory data model redesign

-- Table: inventory_movements (Canonical movement tracking)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_date DATE NOT NULL,
    movement_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Movement type and source
    movement_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'transfer', 'adjustment', 'stock_count', 'production', 'consumption'
    source_type VARCHAR(50) NOT NULL, -- 'purchase_order', 'sales_order', 'manual', 'system', 'stock_count'
    source_id UUID, -- Reference to source document
    
    -- Product and quantity
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity DECIMAL(14,3) NOT NULL, -- Positive for inbound, negative for outbound
    unit VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(14,4), -- Unit cost at time of movement
    total_value DECIMAL(14,2), -- quantity * unit_cost
    
    -- Running balance
    running_balance DECIMAL(14,3), -- Calculated running balance after this movement
    running_value DECIMAL(14,2), -- Calculated running value after this movement
    
    -- F&B specific: Xuất sổ vs Xuất thực
    movement_category VARCHAR(50), -- 'book_entry' (Xuất sổ), 'physical' (Xuất thực)
    reference_movement_id UUID REFERENCES public.inventory_movements(id) ON DELETE SET NULL, -- Link book to physical movement
    
    -- Context
    notes TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    warehouse_id UUID, -- Future: multiple warehouses support
    
    -- Audit
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_movements_quantity_nonzero CHECK (quantity != 0),
    CONSTRAINT inventory_movements_unit_positive CHECK (unit_cost IS NULL OR unit_cost >= 0)
);

-- Table: inventory_balance_snapshots (Period balances)
CREATE TABLE IF NOT EXISTS public.inventory_balance_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_date DATE NOT NULL,
    snapshot_type VARCHAR(50) NOT NULL DEFAULT 'period_end', -- 'opening', 'period_end', 'stock_count'
    
    -- Balance data
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity DECIMAL(14,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(14,4),
    total_value DECIMAL(14,2),
    
    -- Period context
    period_start_date DATE,
    period_end_date DATE,
    
    -- F&B specific
    book_quantity DECIMAL(14,3), -- Xuất sổ quantity
    physical_quantity DECIMAL(14,3), -- Xuất thực quantity
    variance DECIMAL(14,3), -- physical - book
    variance_percentage DECIMAL(10,4),
    
    -- Context
    notes TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    warehouse_id UUID,
    
    -- Audit
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_balance_snapshots_date_product_company_key UNIQUE (company_id, branch_id, snapshot_date, product_id, snapshot_type)
);

-- Table: stock_count_entries (Stock count reconciliation)
CREATE TABLE IF NOT EXISTS public.stock_count_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    count_date DATE NOT NULL,
    count_type VARCHAR(50) NOT NULL DEFAULT 'full', -- 'full', 'partial', 'cycle'
    
    -- Product and counts
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    book_quantity DECIMAL(14,3) NOT NULL, -- Expected quantity from system
    counted_quantity DECIMAL(14,3) NOT NULL, -- Actual counted quantity
    unit VARCHAR(50) NOT NULL,
    
    -- Variance
    variance DECIMAL(14,3) GENERATED ALWAYS AS (counted_quantity - book_quantity) STORED,
    variance_percentage DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE 
            WHEN book_quantity = 0 THEN NULL 
            ELSE ((counted_quantity - book_quantity) / ABS(book_quantity)) * 100 
        END
    ) STORED,
    
    -- Reconciliation status
    reconciliation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reconciliation_notes TEXT,
    reconciled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    
    -- Context
    notes TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    warehouse_id UUID,
    
    -- Audit
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT stock_count_entries_variance_not_null CHECK (variance IS NOT NULL),
    CONSTRAINT stock_count_entries_quantity_positive CHECK (book_quantity >= 0 AND counted_quantity >= 0)
);

-- Indexes for inventory_movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON public.inventory_movements(movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_company_branch ON public.inventory_movements(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_category ON public.inventory_movements(movement_category);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_source ON public.inventory_movements(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_ref_movement ON public.inventory_movements(reference_movement_id);

-- Indexes for inventory_balance_snapshots
CREATE INDEX IF NOT EXISTS idx_inventory_balance_snapshots_date ON public.inventory_balance_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_snapshots_product ON public.inventory_balance_snapshots(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_snapshots_company_branch ON public.inventory_balance_snapshots(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_snapshots_type ON public.inventory_balance_snapshots(snapshot_type);

-- Indexes for stock_count_entries
CREATE INDEX IF NOT EXISTS idx_stock_count_entries_date ON public.stock_count_entries(count_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_count_entries_product ON public.stock_count_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_entries_company_branch ON public.stock_count_entries(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_entries_status ON public.stock_count_entries(reconciliation_status);

-- RLS Policies
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_balance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_count_entries ENABLE ROW LEVEL SECURITY;

-- Policy: inventory_movements - Users can read their company's movements
CREATE POLICY inventory_movements_select_policy ON public.inventory_movements
FOR SELECT TO authenticated
USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

-- Policy: inventory_movements - Users can insert movements
CREATE POLICY inventory_movements_insert_policy ON public.inventory_movements
FOR INSERT TO authenticated
WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

-- Policy: inventory_movements - Users can update movements
CREATE POLICY inventory_movements_update_policy ON public.inventory_movements
FOR UPDATE TO authenticated
USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
)
WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

-- Policy: inventory_balance_snapshots - Users can read their company's snapshots
CREATE POLICY inventory_balance_snapshots_select_policy ON public.inventory_balance_snapshots
FOR SELECT TO authenticated
USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

-- Policy: inventory_balance_snapshots - Admins can insert/update snapshots
CREATE POLICY inventory_balance_snapshots_insert_policy ON public.inventory_balance_snapshots
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

CREATE POLICY inventory_balance_snapshots_update_policy ON public.inventory_balance_snapshots
FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

-- Policy: stock_count_entries - Users can read their company's entries
CREATE POLICY stock_count_entries_select_policy ON public.stock_count_entries
FOR SELECT TO authenticated
USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

-- Policy: stock_count_entries - Users with inventory permission can insert
CREATE POLICY stock_count_entries_insert_policy ON public.stock_count_entries
FOR INSERT TO authenticated
WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

-- Policy: stock_count_entries - Users with inventory permission can update
CREATE POLICY stock_count_entries_update_policy ON public.stock_count_entries
FOR UPDATE TO authenticated
USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
)
WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

-- Triggers: Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_inventory_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_movements_updated_at
BEFORE UPDATE ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION update_inventory_movements_updated_at();

CREATE TRIGGER trigger_update_inventory_balance_snapshots_updated_at
BEFORE UPDATE ON public.inventory_balance_snapshots
FOR EACH ROW
EXECUTE FUNCTION update_inventory_movements_updated_at();

CREATE TRIGGER trigger_update_stock_count_entries_updated_at
BEFORE UPDATE ON public.stock_count_entries
FOR EACH ROW
EXECUTE FUNCTION update_inventory_movements_updated_at();

-- Function: Calculate running balance for movements
CREATE OR REPLACE FUNCTION calculate_movement_running_balance()
RETURNS TRIGGER AS $$
DECLARE
    prev_balance DECIMAL(14,3);
    prev_value DECIMAL(14,2);
BEGIN
    -- Get previous balance for this product on the same or earlier date
    SELECT COALESCE(MAX(running_balance), 0), COALESCE(MAX(running_value), 0)
    INTO prev_balance, prev_value
    FROM public.inventory_movements
    WHERE product_id = NEW.product_id
    AND company_id = NEW.company_id
    AND branch_id = NEW.branch_id
    AND (movement_date < NEW.movement_date OR (movement_date = NEW.movement_date AND id < NEW.id));
    
    -- Calculate new running balance and value
    NEW.running_balance = prev_balance + NEW.quantity;
    IF NEW.unit_cost IS NOT NULL THEN
        NEW.running_value = prev_value + (NEW.quantity * NEW.unit_cost);
    ELSE
        NEW.running_value = prev_value;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_movement_running_balance
BEFORE INSERT ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION calculate_movement_running_balance();

-- Comment on tables
COMMENT ON TABLE public.inventory_movements IS 'Canonical inventory movement tracking with running balances';
COMMENT ON TABLE public.inventory_balance_snapshots IS 'Period-end balance snapshots for reporting';
COMMENT ON TABLE public.stock_count_entries IS 'Stock count entries for physical inventory reconciliation';
