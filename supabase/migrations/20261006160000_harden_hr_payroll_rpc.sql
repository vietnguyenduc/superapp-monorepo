-- Restrict payroll generation to authenticated company administrators.
-- SECURITY DEFINER is required because the function writes the payroll header
-- and its child rows atomically, but the caller and tenant are verified first.

CREATE OR REPLACE FUNCTION public.generate_monthly_payrolls(
  p_company_id uuid,
  p_month integer,
  p_year integer,
  p_system_profit numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_role text;
  v_caller_company uuid;
  v_payroll_id uuid;
  v_p3_percentage numeric;
  v_total_p3_pool numeric;
  v_total_kpi_score numeric := 0;
  v_emp_record record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Bạn cần đăng nhập để tạo bảng lương';
  END IF;

  SELECT u.role::text, u.company_id
    INTO v_caller_role, v_caller_company
  FROM public.users u
  WHERE u.id = auth.uid() AND COALESCE(u.is_active, true);

  IF v_caller_role NOT IN ('admin', 'admin_company', 'admin_master') THEN
    RAISE EXCEPTION 'Bạn không có quyền tạo bảng lương';
  END IF;

  IF v_caller_role <> 'admin_master' AND v_caller_company IS DISTINCT FROM p_company_id THEN
    RAISE EXCEPTION 'Bạn không có quyền tạo bảng lương cho công ty này';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = p_company_id) THEN
    RAISE EXCEPTION 'Công ty không tồn tại';
  END IF;

  IF p_month NOT BETWEEN 1 AND 12 OR p_year NOT BETWEEN 2000 AND 2100 THEN
    RAISE EXCEPTION 'Kỳ lương không hợp lệ';
  END IF;

  IF p_system_profit IS NULL THEN
    RAISE EXCEPTION 'Lợi nhuận hệ thống không được để trống';
  END IF;

  SELECT p.id INTO v_payroll_id
  FROM public.payrolls p
  WHERE p.company_id = p_company_id AND p.month = p_month AND p.year = p_year;

  IF v_payroll_id IS NULL THEN
    INSERT INTO public.payrolls (company_id, month, year, status)
    VALUES (p_company_id, p_month, p_year, 'draft')
    RETURNING id INTO v_payroll_id;
  END IF;

  SELECT s.p3_profit_percentage INTO v_p3_percentage
  FROM public.hr_settings s
  WHERE s.company_id = p_company_id;

  v_total_p3_pool := p_system_profit * (COALESCE(v_p3_percentage, 0) / 100.0);

  SELECT COALESCE(sum(employee_kpi.avg_kpi), 0)
    INTO v_total_kpi_score
  FROM (
    SELECT e.id,
      COALESCE((
        SELECT avg(ek.completion_percentage)
        FROM public.employee_kpis ek
        JOIN public.key_results kr ON kr.id = ek.key_result_id
        JOIN public.objectives o ON o.id = kr.objective_id
        JOIN public.kpi_cycles kc ON kc.id = o.cycle_id
        WHERE ek.employee_id = e.id AND kc.status = 'active'
      ), 0) AS avg_kpi
    FROM public.employees e
    WHERE e.company_id = p_company_id AND e.status = 'active'
  ) employee_kpi;

  FOR v_emp_record IN
    SELECT
      e.id AS emp_id,
      COALESCE(pos.base_salary_min, 0) AS p1_salary,
      COALESCE(e.p2_allowance, 0) AS p2_allowance,
      COALESCE((
        SELECT avg(ek.completion_percentage)
        FROM public.employee_kpis ek
        JOIN public.key_results kr ON kr.id = ek.key_result_id
        JOIN public.objectives o ON o.id = kr.objective_id
        JOIN public.kpi_cycles kc ON kc.id = o.cycle_id
        WHERE ek.employee_id = e.id AND kc.status = 'active'
      ), 0) AS avg_kpi
    FROM public.employees e
    LEFT JOIN public.positions pos ON pos.id = e.position_id
    WHERE e.company_id = p_company_id AND e.status = 'active'
  LOOP
    INSERT INTO public.payroll_items (
      payroll_id,
      employee_id,
      p1_salary,
      p2_allowance,
      p3_bonus,
      kpi_score_percentage,
      net_salary,
      base_salary
    )
    VALUES (
      v_payroll_id,
      v_emp_record.emp_id,
      v_emp_record.p1_salary,
      v_emp_record.p2_allowance,
      CASE WHEN v_total_kpi_score > 0
        THEN (v_emp_record.avg_kpi / v_total_kpi_score) * v_total_p3_pool
        ELSE 0
      END,
      v_emp_record.avg_kpi,
      v_emp_record.p1_salary + v_emp_record.p2_allowance +
        CASE WHEN v_total_kpi_score > 0
          THEN (v_emp_record.avg_kpi / v_total_kpi_score) * v_total_p3_pool
          ELSE 0
        END,
      v_emp_record.p1_salary
    )
    ON CONFLICT (payroll_id, employee_id) DO UPDATE SET
      p1_salary = EXCLUDED.p1_salary,
      p2_allowance = EXCLUDED.p2_allowance,
      p3_bonus = EXCLUDED.p3_bonus,
      kpi_score_percentage = EXCLUDED.kpi_score_percentage,
      net_salary = EXCLUDED.net_salary,
      base_salary = EXCLUDED.base_salary;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'payroll_id', v_payroll_id,
    'message', 'Payroll generated successfully'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.generate_monthly_payrolls(uuid, integer, integer, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_monthly_payrolls(uuid, integer, integer, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_monthly_payrolls(uuid, integer, integer, numeric) TO authenticated;

COMMENT ON FUNCTION public.generate_monthly_payrolls(uuid, integer, integer, numeric)
IS 'Generates tenant-scoped payroll rows after verifying the authenticated company administrator.';
