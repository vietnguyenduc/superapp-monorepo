import { supabase, TABLES, getCurrentCompanyId } from '../lib/supabase';
import { isTrialMode } from '@superapp/shared-utils';
import { hrDemoStore } from './hrDemoStore';
import type { AssignmentImportRow } from './assignmentImportService';

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
  position?: string;
  manager_id?: string;
  work_email?: string;
  p2_allowance?: number;
}

interface PositionRecord {
  id: string;
  company_id: string;
  title: string;
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

export type EmployeeImportInput = Omit<
  Employee,
  'id' | 'created_at' | 'company_id' | 'department' | 'user_id'
>;

export const hrService = {
  // Departments
  async getDepartments(selectedCompanyId?: string) {
    const companyId = selectedCompanyId || await getCurrentCompanyId();
    if (!companyId) return [] as Department[];
    if (isTrialMode()) return hrDemoStore.getDepartments(companyId);
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

  async ensureDepartments(names: string[], selectedCompanyId?: string) {
    const companyId = selectedCompanyId || await getCurrentCompanyId();
    if (!companyId) throw new Error('Không tìm thấy công ty của người dùng');
    const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
    if (!uniqueNames.length) return [] as Department[];
    if (isTrialMode()) return hrDemoStore.ensureDepartments(companyId, uniqueNames);

    const existing = await this.getDepartments(companyId);
    const normalize = (value: string) => value.trim().toLocaleLowerCase('vi');
    const existingNames = new Set(existing.map((item) => normalize(item.name)));
    const missing = uniqueNames.filter((name) => !existingNames.has(normalize(name)));
    if (!missing.length) return [] as Department[];
    const { data, error } = await supabase
      .from(TABLES.DEPARTMENTS)
      .insert(missing.map((name) => ({ name, company_id: companyId })))
      .select();
    if (error) throw error;
    return (data || []) as Department[];
  },

  // Employees
  async getEmployees(selectedCompanyId?: string) {
    const companyId = selectedCompanyId || await getCurrentCompanyId();
    if (!companyId) return [] as Employee[];
    if (isTrialMode()) return hrDemoStore.getEmployees(companyId);
    const { data, error } = await supabase
      .from(TABLES.EMPLOYEES)
      .select(`
        *,
        department:departments!employees_department_id_fkey(*),
        position_record:positions!employees_position_id_fkey(title)
      `)
      .eq('company_id', companyId)
      .order('full_name');

    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      position: row.position_record?.title,
      position_record: undefined,
    })) as Employee[];
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

  async bulkCreateEmployees(
    employees: EmployeeImportInput[],
    selectedCompanyId?: string,
  ) {
    const companyId = selectedCompanyId || await getCurrentCompanyId();
    if (!companyId) throw new Error('Không tìm thấy công ty của người dùng');
    if (!employees.length) return [] as Employee[];
    if (isTrialMode()) return hrDemoStore.addEmployees(companyId, employees);

    const positionNames = [...new Set(employees.map((employee) => employee.position?.trim()).filter(Boolean))] as string[];
    const positionByName = new Map<string, PositionRecord>();
    if (positionNames.length) {
      const { data: existingPositions, error: positionReadError } = await supabase
        .from(TABLES.POSITIONS)
        .select('id, company_id, title')
        .eq('company_id', companyId);
      if (positionReadError) throw positionReadError;

      const normalize = (value: string) => value.trim().toLocaleLowerCase('vi');
      (existingPositions || []).forEach((position: PositionRecord) => {
        positionByName.set(normalize(position.title), position);
      });
      const missingNames = positionNames.filter((name) => !positionByName.has(normalize(name)));
      if (missingNames.length) {
        const { data: createdPositions, error: positionCreateError } = await supabase
          .from(TABLES.POSITIONS)
          .insert(missingNames.map((title) => ({ company_id: companyId, title })))
          .select('id, company_id, title');
        if (positionCreateError) throw positionCreateError;
        (createdPositions || []).forEach((position: PositionRecord) => {
          positionByName.set(normalize(position.title), position);
        });
      }
    }

    const databaseRows = employees.map((employee) => ({
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      base_salary: employee.base_salary,
      status: employee.status,
      join_date: employee.join_date,
      department_id: employee.department_id,
      position_id: employee.position
        ? positionByName.get(employee.position.trim().toLocaleLowerCase('vi'))?.id
        : undefined,
      company_id: companyId,
    }));
    const { data, error } = await supabase
      .from(TABLES.EMPLOYEES)
      .insert(databaseRows)
      .select();

    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      position: employees.find((employee) => employee.employee_code === row.employee_code)?.position,
    })) as Employee[];
  },

  async applyAssignmentImport(rows: AssignmentImportRow[], selectedCompanyId?: string) {
    const companyId = selectedCompanyId || await getCurrentCompanyId();
    if (!companyId) throw new Error('Không tìm thấy công ty của người dùng');
    if (!isTrialMode()) {
      throw new Error('Cập nhật phân công hiện đang ở giai đoạn demo cục bộ; cần duyệt schema lịch sử trước khi ghi dữ liệu thật.');
    }
    return hrDemoStore.applyAssignments(companyId, rows);
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
