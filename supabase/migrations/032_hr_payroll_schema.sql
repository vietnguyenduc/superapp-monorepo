-- Migration: 032_hr_payroll_schema.sql
-- Description: Create tables for HR and Payroll module

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID, -- References employees(id), will add foreign key later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Employees Table (Links to users)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    base_salary NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, on_leave
    join_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, employee_code)
);

-- Add manager_id constraint to departments
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager 
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 3. Shifts (Ca làm việc)
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'fixed', -- fixed, flexible, night
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_mins INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Employee Shifts (Xếp ca)
CREATE TABLE IF NOT EXISTS employee_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, effective_date)
);

-- 5. Attendance Logs (Chấm công đa nguồn)
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    source VARCHAR(50) DEFAULT 'gps', -- gps, manual, import
    type VARCHAR(20) NOT NULL, -- in, out
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    location_lat NUMERIC(10, 8),
    location_lng NUMERIC(11, 8),
    image_url TEXT,
    status VARCHAR(50), -- on_time, late, early_leave
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Leave Requests (Đơn từ)
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- annual_leave, sick_leave, unpaid, ot
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approver_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Payrolls (Kỳ lương)
CREATE TABLE IF NOT EXISTS payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, processed, paid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, month, year)
);

-- 8. Payroll Items (Chi tiết lương nhân viên)
CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id UUID NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    standard_days NUMERIC(5, 2) DEFAULT 0,
    actual_days NUMERIC(5, 2) DEFAULT 0,
    ot_hours NUMERIC(5, 2) DEFAULT 0,
    base_salary NUMERIC(15, 2) DEFAULT 0,
    allowances NUMERIC(15, 2) DEFAULT 0,
    deductions NUMERIC(15, 2) DEFAULT 0,
    net_salary NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payroll_id, employee_id)
);

-- 9. Row Level Security (RLS)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's company_id (assumes it's in jwt or custom auth function, usually via auth.jwt()->>'company_id' in Supabase, but depends on your setup. Given the other apps use company_id, let's use the standard approach or allow users from the same company).
-- For simplicity, standard multi-tenant RLS:
-- We assume the user has a company_id in their auth claims or users table.
-- The existing RLS in superapp usually joins with users table or uses current_setting.
-- Creating generic RLS policies based on existing patterns:

CREATE POLICY "Users can view departments in their company"
    ON departments FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage departments in their company"
    ON departments FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view employees in their company"
    ON employees FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage employees in their company"
    ON employees FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view shifts in their company"
    ON shifts FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage shifts in their company"
    ON shifts FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view employee_shifts"
    ON employee_shifts FOR SELECT
    USING (employee_id IN (SELECT id FROM employees WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage employee_shifts"
    ON employee_shifts FOR ALL
    USING (employee_id IN (SELECT id FROM employees WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can view attendance_logs in their company"
    ON attendance_logs FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage attendance_logs in their company"
    ON attendance_logs FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view leave_requests in their company"
    ON leave_requests FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage leave_requests in their company"
    ON leave_requests FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view payrolls in their company"
    ON payrolls FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage payrolls in their company"
    ON payrolls FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view payroll_items"
    ON payroll_items FOR SELECT
    USING (payroll_id IN (SELECT id FROM payrolls WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage payroll_items"
    ON payroll_items FOR ALL
    USING (payroll_id IN (SELECT id FROM payrolls WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));
