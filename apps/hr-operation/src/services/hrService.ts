import { supabase, TABLES, getCurrentCompanyId } from '../lib/supabase';

// Types
export interface Department {
  id: string;
  company_id: string;
  name: string;
  parent_id?: string;
  manager_id?: string;
  created_at: string;
}

export interface Employee {
  id: string;
  company_id: string;
  user_id?: string;
  department_id?: string;
  employee_code: string;
  full_name: string;
  base_salary: number;
  status: 'active' | 'inactive' | 'on_leave';
  join_date: string;
  created_at: string;
  department?: Department;
}

export interface Shift {
  id: string;
  company_id: string;
  name: string;
  type: 'fixed' | 'flexible' | 'night';
  start_time: string;
  end_time: string;
  grace_period_mins: number;
}

export const hrService = {
  // Departments
  async getDepartments() {
    const companyId = await getCurrentCompanyId();
    const { data, error } = await supabase
      .from(TABLES.DEPARTMENTS)
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) throw error;
    return (data || []) as Department[];
  },

  async createDepartment(department: Omit<Department, 'id' | 'created_at' | 'company_id'>) {
    const companyId = await getCurrentCompanyId();
    if (!companyId) throw new Error('Không tìm thấy công ty của người dùng');

    const { data, error } = await supabase
      .from(TABLES.DEPARTMENTS)
      .insert({ ...department, company_id: companyId })
      .select()
      .single();

    if (error) throw error;
    return data as Department;
  },

  // Employees
  async getEmployees() {
    const companyId = await getCurrentCompanyId();
    const { data, error } = await supabase
      .from(TABLES.EMPLOYEES)
      .select(`
        *,
        department:departments(*)
      `)
      .eq('company_id', companyId)
      .order('full_name');

    if (error) throw error;
    return (data || []) as Employee[];
  },

  async createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'company_id'>) {
    const companyId = await getCurrentCompanyId();
    if (!companyId) throw new Error('Không tìm thấy công ty của người dùng');

    const { data, error } = await supabase
      .from(TABLES.EMPLOYEES)
      .insert({ ...employee, company_id: companyId })
      .select()
      .single();

    if (error) throw error;
    return data as Employee;
  },

  // Shifts
  async getShifts() {
    const companyId = await getCurrentCompanyId();
    const { data, error } = await supabase
      .from(TABLES.SHIFTS)
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) throw error;
    return (data || []) as Shift[];
  }
};
