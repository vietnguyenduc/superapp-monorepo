import { supabase, TABLES } from '../lib/supabase';

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
    const { data, error } = await supabase
      .from(TABLES.DEPARTMENTS)
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Department[];
  },

  async createDepartment(department: Omit<Department, 'id' | 'created_at' | 'company_id'>) {
    const { data: userData } = await supabase.auth.getUser();
    // Assuming company_id is available in user metadata or we get it via RPC
    // For now, let's assume we can insert and RLS or trigger will handle company_id,
    // or we fetch it first. Since RLS requires company_id, let's fetch current user's company_id.
    const { data: userDetails } = await supabase
      .from(TABLES.USERS)
      .select('company_id')
      .eq('id', userData.user?.id)
      .single();

    if (!userDetails?.company_id) throw new Error('Company ID not found for user');

    const { data, error } = await supabase
      .from(TABLES.DEPARTMENTS)
      .insert({ ...department, company_id: userDetails.company_id })
      .select()
      .single();
      
    if (error) throw error;
    return data as Department;
  },

  // Employees
  async getEmployees() {
    const { data, error } = await supabase
      .from(TABLES.EMPLOYEES)
      .select(`
        *,
        department:departments(*)
      `)
      .order('full_name');
    
    if (error) throw error;
    return data as Employee[];
  },

  async createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'company_id'>) {
    const { data: userData } = await supabase.auth.getUser();
    const { data: userDetails } = await supabase
      .from(TABLES.USERS)
      .select('company_id')
      .eq('id', userData.user?.id)
      .single();

    if (!userDetails?.company_id) throw new Error('Company ID not found for user');

    const { data, error } = await supabase
      .from(TABLES.EMPLOYEES)
      .insert({ ...employee, company_id: userDetails.company_id })
      .select()
      .single();
      
    if (error) throw error;
    return data as Employee;
  },

  // Shifts
  async getShifts() {
    const { data, error } = await supabase
      .from(TABLES.SHIFTS)
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Shift[];
  }
};
