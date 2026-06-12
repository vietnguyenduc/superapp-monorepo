-- Migration: 035_hr_performance_3p_schema.sql
-- Description: Create tables for HR Performance (BSC, OKR) and 3P Salary

-- 1. HR Settings (For configuring BSC vs OKR and other preferences)
CREATE TABLE IF NOT EXISTS hr_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    performance_framework VARCHAR(20) DEFAULT 'okr', -- 'okr', 'bsc'
    p3_profit_percentage NUMERIC(5, 2) DEFAULT 0, -- % of total company profit to distribute as P3
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id)
);

-- 2. Positions (P1 Salary Setup)
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    base_salary_min NUMERIC(15, 2) DEFAULT 0,
    base_salary_max NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add position_id and p2_allowance to employees table
ALTER TABLE employees 
    ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS p2_allowance NUMERIC(15, 2) DEFAULT 0;

-- 3. KPI Cycles (monthly, quarterly, annual)
CREATE TABLE IF NOT EXISTS kpi_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    cycle_type VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annual'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Objectives (For BSC Perspectives or OKR Objectives)
CREATE TABLE IF NOT EXISTS objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES kpi_cycles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    bsc_perspective VARCHAR(50), -- 'financial', 'customer', 'internal', 'learning' (only used if framework is BSC)
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL, -- Can be department or individual
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    weight NUMERIC(5, 2) DEFAULT 100, -- percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Key Results / Metrics
CREATE TABLE IF NOT EXISTS key_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_value NUMERIC(15, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT '%',
    weight NUMERIC(5, 2) DEFAULT 100, -- relative to objective
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Employee KPIs (Assigned KPIs and progress tracking)
CREATE TABLE IF NOT EXISTS employee_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    key_result_id UUID NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
    actual_value NUMERIC(15, 2) DEFAULT 0,
    completion_percentage NUMERIC(5, 2) DEFAULT 0, -- To be updated by application logic or trigger
    manager_score NUMERIC(5, 2), -- Optional override by manager
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, key_result_id)
);

-- 7. Update payroll_items for 3P
ALTER TABLE payroll_items 
    ADD COLUMN IF NOT EXISTS p1_salary NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS p2_allowance NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS p3_bonus NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS kpi_score_percentage NUMERIC(5, 2) DEFAULT 0;

-- 8. Row Level Security
ALTER TABLE hr_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_kpis ENABLE ROW LEVEL SECURITY;

-- Generic multi-tenant RLS policies
CREATE POLICY "Users can view hr_settings in their company"
    ON hr_settings FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage hr_settings in their company"
    ON hr_settings FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view positions in their company"
    ON positions FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage positions in their company"
    ON positions FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view kpi_cycles in their company"
    ON kpi_cycles FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage kpi_cycles in their company"
    ON kpi_cycles FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view objectives in their company"
    ON objectives FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage objectives in their company"
    ON objectives FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- For key_results, join with objectives for company_id
CREATE POLICY "Users can view key_results"
    ON key_results FOR SELECT
    USING (objective_id IN (SELECT id FROM objectives WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage key_results"
    ON key_results FOR ALL
    USING (objective_id IN (SELECT id FROM objectives WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

-- For employee_kpis, join with employees for company_id
CREATE POLICY "Users can view employee_kpis"
    ON employee_kpis FOR SELECT
    USING (employee_id IN (SELECT id FROM employees WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage employee_kpis"
    ON employee_kpis FOR ALL
    USING (employee_id IN (SELECT id FROM employees WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

