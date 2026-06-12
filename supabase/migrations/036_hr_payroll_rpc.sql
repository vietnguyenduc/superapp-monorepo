-- Migration: 036_hr_payroll_rpc.sql
-- Description: Create RPC to generate monthly payroll items with 3P calculation

CREATE OR REPLACE FUNCTION generate_monthly_payrolls(
    p_company_id UUID,
    p_month INTEGER,
    p_year INTEGER,
    p_system_profit NUMERIC -- Parameter for system-wide profit/revenue to calculate P3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payroll_id UUID;
    v_p3_percentage NUMERIC;
    v_total_p3_pool NUMERIC;
    v_total_kpi_score NUMERIC := 0;
    v_emp_record RECORD;
    v_result JSONB;
BEGIN
    -- 1. Check if payroll already exists
    SELECT id INTO v_payroll_id FROM payrolls 
    WHERE company_id = p_company_id AND month = p_month AND year = p_year;

    IF v_payroll_id IS NULL THEN
        -- Create new payroll
        INSERT INTO payrolls (company_id, month, year, status)
        VALUES (p_company_id, p_month, p_year, 'draft')
        RETURNING id INTO v_payroll_id;
    END IF;

    -- 2. Get P3 Profit Percentage from hr_settings
    SELECT p3_profit_percentage INTO v_p3_percentage FROM hr_settings WHERE company_id = p_company_id;
    IF v_p3_percentage IS NULL THEN
        v_p3_percentage := 0;
    END IF;

    -- Total P3 Pool to distribute among employees
    v_total_p3_pool := p_system_profit * (v_p3_percentage / 100.0);

    -- 3. Calculate Total KPI Score for the company (to distribute pool proportionally)
    -- We assume cycle matches month and year loosely, or we just average all key results for the employee
    -- For simplicity, we calculate the average completion_percentage for each employee in the active cycle
    FOR v_emp_record IN 
        SELECT e.id as emp_id,
               COALESCE((SELECT AVG(ek.completion_percentage) 
                         FROM employee_kpis ek 
                         JOIN key_results kr ON ek.key_result_id = kr.id
                         JOIN objectives o ON kr.objective_id = o.id
                         JOIN kpi_cycles kc ON o.cycle_id = kc.id
                         WHERE ek.employee_id = e.id 
                           AND kc.status = 'active'), 0) as avg_kpi
        FROM employees e
        WHERE e.company_id = p_company_id AND e.status = 'active'
    LOOP
        v_total_kpi_score := v_total_kpi_score + v_emp_record.avg_kpi;
    END LOOP;

    -- 4. Generate Payroll Items
    FOR v_emp_record IN 
        SELECT e.id as emp_id, 
               p.base_salary_min as p1_salary, 
               COALESCE(e.p2_allowance, 0) as p2_allowance,
               COALESCE((SELECT AVG(ek.completion_percentage) 
                         FROM employee_kpis ek 
                         JOIN key_results kr ON ek.key_result_id = kr.id
                         JOIN objectives o ON kr.objective_id = o.id
                         JOIN kpi_cycles kc ON o.cycle_id = kc.id
                         WHERE ek.employee_id = e.id 
                           AND kc.status = 'active'), 0) as avg_kpi
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.id
        WHERE e.company_id = p_company_id AND e.status = 'active'
    LOOP
        DECLARE
            v_p3_bonus NUMERIC := 0;
            v_net_salary NUMERIC := 0;
        BEGIN
            -- Calculate P3 for this employee
            IF v_total_kpi_score > 0 THEN
                v_p3_bonus := (v_emp_record.avg_kpi / v_total_kpi_score) * v_total_p3_pool;
            END IF;

            v_net_salary := COALESCE(v_emp_record.p1_salary, 0) + v_emp_record.p2_allowance + v_p3_bonus;

            -- Upsert payroll item
            INSERT INTO payroll_items (
                payroll_id, 
                employee_id, 
                p1_salary, 
                p2_allowance, 
                p3_bonus, 
                kpi_score_percentage, 
                net_salary,
                base_salary
            ) VALUES (
                v_payroll_id, 
                v_emp_record.emp_id, 
                COALESCE(v_emp_record.p1_salary, 0), 
                v_emp_record.p2_allowance, 
                v_p3_bonus, 
                v_emp_record.avg_kpi,
                v_net_salary,
                COALESCE(v_emp_record.p1_salary, 0)
            )
            ON CONFLICT (payroll_id, employee_id) 
            DO UPDATE SET 
                p1_salary = EXCLUDED.p1_salary,
                p2_allowance = EXCLUDED.p2_allowance,
                p3_bonus = EXCLUDED.p3_bonus,
                kpi_score_percentage = EXCLUDED.kpi_score_percentage,
                net_salary = EXCLUDED.net_salary,
                base_salary = EXCLUDED.base_salary;
        END;
    END LOOP;

    v_result := jsonb_build_object(
        'success', true,
        'payroll_id', v_payroll_id,
        'message', 'Payroll generated successfully'
    );
    RETURN v_result;
END;
$$;
