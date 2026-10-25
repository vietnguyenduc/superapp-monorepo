import type { Department, Employee, EmployeeImportInput } from './hrService';
import type { AssignmentImportRow } from './assignmentImportService';
import { normalizeAssignmentEmployeeCode } from './assignmentImportService';

const STORAGE_PREFIX = 'hr:demo-data:v1:';

interface DemoData {
  departments: Department[];
  employees: Employee[];
}

const now = '2026-10-25T00:00:00.000Z';

const departmentSeed = (companyId: string): Department[] => [
  { id: 'dept-executive', company_id: companyId, name: 'Ban Điều hành', created_at: now },
  { id: 'dept-product', company_id: companyId, name: 'Phát triển Sản phẩm', parent_id: 'dept-executive', manager_id: 'emp-1002', created_at: now },
  { id: 'dept-sourcing', company_id: companyId, name: 'Cung ứng', parent_id: 'dept-executive', manager_id: 'emp-1005', created_at: now },
  { id: 'dept-sales', company_id: companyId, name: 'Kinh doanh', parent_id: 'dept-executive', manager_id: 'emp-1008', created_at: now },
  { id: 'dept-finance', company_id: companyId, name: 'Tài chính – Kế toán', parent_id: 'dept-executive', manager_id: 'emp-1011', created_at: now },
  { id: 'dept-people', company_id: companyId, name: 'Nhân sự', parent_id: 'dept-executive', manager_id: 'emp-1013', created_at: now },
];

const employeeSeed = (companyId: string, departments: Department[]): Employee[] => {
  const department = (id: string) => departments.find((item) => item.id === id);
  const rows: Array<Omit<Employee, 'company_id' | 'created_at' | 'department'>> = [
    { id: 'emp-1001', employee_code: '1001', full_name: 'Nguyễn Minh An', base_salary: 42000000, status: 'active', join_date: '2021-03-15', department_id: 'dept-executive', position: 'Giám đốc Điều hành' },
    { id: 'emp-1002', employee_code: '1002', full_name: 'Trần Thu Hà', base_salary: 32000000, status: 'active', join_date: '2022-01-10', department_id: 'dept-product', position: 'Trưởng phòng Phát triển Sản phẩm', manager_id: 'emp-1001' },
    { id: 'emp-1003', employee_code: '1003', full_name: 'Lê Hoàng Nam', base_salary: 21000000, status: 'active', join_date: '2023-05-08', department_id: 'dept-product', position: 'Chuyên viên Thiết kế Sản phẩm', manager_id: 'emp-1002' },
    { id: 'emp-1004', employee_code: '1004', full_name: 'Phạm Ngọc Mai', base_salary: 19500000, status: 'active', join_date: '2024-02-19', department_id: 'dept-product', position: 'Chuyên viên Phát triển Sản phẩm', manager_id: 'emp-1002' },
    { id: 'emp-1005', employee_code: '1005', full_name: 'Vũ Đức Long', base_salary: 30000000, status: 'active', join_date: '2021-11-01', department_id: 'dept-sourcing', position: 'Trưởng phòng Cung ứng', manager_id: 'emp-1001' },
    { id: 'emp-1006', employee_code: '1006', full_name: 'Đỗ Hải Yến', base_salary: 17500000, status: 'active', join_date: '2024-04-22', department_id: 'dept-sourcing', position: 'Chuyên viên Tìm nguồn', manager_id: 'emp-1005' },
    { id: 'emp-1007', employee_code: '1007', full_name: 'Bùi Quốc Huy', base_salary: 16800000, status: 'on_leave', join_date: '2023-09-12', department_id: 'dept-sourcing', position: 'Chuyên viên Thu mua', manager_id: 'emp-1005' },
    { id: 'emp-1008', employee_code: '1008', full_name: 'Ngô Thanh Vân', base_salary: 31000000, status: 'active', join_date: '2020-08-03', department_id: 'dept-sales', position: 'Trưởng phòng Kinh doanh', manager_id: 'emp-1001' },
    { id: 'emp-1009', employee_code: '1009', full_name: 'Hoàng Tuấn Kiệt', base_salary: 18500000, status: 'active', join_date: '2024-01-08', department_id: 'dept-sales', position: 'Chuyên viên Kinh doanh', manager_id: 'emp-1008' },
    { id: 'emp-1010', employee_code: '1010', full_name: 'Đặng Khánh Linh', base_salary: 18200000, status: 'active', join_date: '2023-07-17', department_id: 'dept-sales', position: 'Chuyên viên Phát triển Khách hàng', manager_id: 'emp-1008' },
    { id: 'emp-1011', employee_code: '1011', full_name: 'Phan Bảo Châu', base_salary: 28000000, status: 'active', join_date: '2022-06-06', department_id: 'dept-finance', position: 'Kế toán trưởng', manager_id: 'emp-1001' },
    { id: 'emp-1012', employee_code: '1012', full_name: 'Hồ Gia Bảo', base_salary: 16000000, status: 'active', join_date: '2024-03-11', department_id: 'dept-finance', position: 'Kế toán viên', manager_id: 'emp-1011' },
    { id: 'emp-1013', employee_code: '1013', full_name: 'Lý Mỹ Duyên', base_salary: 27000000, status: 'active', join_date: '2021-09-20', department_id: 'dept-people', position: 'Trưởng phòng Nhân sự', manager_id: 'emp-1001' },
    { id: 'emp-1014', employee_code: '1014', full_name: 'Trương Anh Khoa', base_salary: 16500000, status: 'active', join_date: '2025-01-06', department_id: 'dept-people', position: 'Chuyên viên C&B', manager_id: 'emp-1013' },
  ];
  return rows.map((row) => ({
    ...row,
    company_id: companyId,
    created_at: now,
    department: row.department_id ? department(row.department_id) : undefined,
  }));
};

const keyFor = (companyId: string) => `${STORAGE_PREFIX}${encodeURIComponent(companyId)}`;

const createSeed = (companyId: string): DemoData => {
  const departments = departmentSeed(companyId);
  return { departments, employees: employeeSeed(companyId, departments) };
};

const read = (companyId: string): DemoData => {
  const key = keyFor(companyId);
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null') as DemoData | null;
    if (parsed?.departments?.length && Array.isArray(parsed.employees)) return parsed;
  } catch {
    localStorage.removeItem(key);
  }
  const seeded = createSeed(companyId);
  localStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
};

const write = (companyId: string, data: DemoData) => {
  localStorage.setItem(keyFor(companyId), JSON.stringify(data));
};

export const hrDemoStore = {
  getDepartments(companyId: string) {
    return read(companyId).departments;
  },

  getEmployees(companyId: string) {
    const data = read(companyId);
    const departmentMap = new Map(data.departments.map((item) => [item.id, item]));
    return data.employees.map((employee) => ({
      ...employee,
      department: employee.department_id ? departmentMap.get(employee.department_id) : undefined,
    }));
  },

  ensureDepartments(companyId: string, names: string[]) {
    const data = read(companyId);
    const normalize = (value: string) => value.trim().toLocaleLowerCase('vi');
    const existing = new Set(data.departments.map((item) => normalize(item.name)));
    const created: Department[] = [];
    names.forEach((name, index) => {
      const trimmed = name.trim();
      if (!trimmed || existing.has(normalize(trimmed))) return;
      const department: Department = {
        id: `demo-dept-${Date.now()}-${index}`,
        company_id: companyId,
        name: trimmed,
        created_at: new Date().toISOString(),
      };
      data.departments.push(department);
      created.push(department);
      existing.add(normalize(trimmed));
    });
    if (created.length) write(companyId, data);
    return created;
  },

  addEmployees(companyId: string, employees: EmployeeImportInput[]) {
    const data = read(companyId);
    const created = employees.map((employee, index): Employee => ({
      ...employee,
      id: `demo-${Date.now()}-${index}`,
      company_id: companyId,
      created_at: new Date().toISOString(),
      department: employee.department_id
        ? data.departments.find((item) => item.id === employee.department_id)
        : undefined,
    }));
    data.employees.push(...created);
    write(companyId, data);
    return created;
  },

  applyAssignments(companyId: string, rows: AssignmentImportRow[]) {
    const data = read(companyId);
    const createdDepartments = this.ensureDepartments(companyId, rows.map((row) => row.departmentName));
    if (createdDepartments.length) {
      const refreshed = read(companyId);
      data.departments = refreshed.departments;
    }
    const departmentMap = new Map(data.departments.map((item) => [item.name.trim().toLocaleLowerCase('vi'), item]));
    const byCode = new Map(data.employees.map((employee) => [normalizeAssignmentEmployeeCode(employee.employee_code), employee]));

    rows.forEach((row, index) => {
      const key = normalizeAssignmentEmployeeCode(row.employeeCode);
      const department = departmentMap.get(row.departmentName.trim().toLocaleLowerCase('vi'));
      const current = byCode.get(key);
      if (current) {
        current.full_name = row.fullName || current.full_name;
        current.position = row.position || current.position;
        current.department_id = department?.id || current.department_id;
        current.department = department || current.department;
        if (row.baseSalary > 0) current.base_salary = row.baseSalary;
      } else {
        const employee: Employee = {
          id: `demo-assignment-${Date.now()}-${index}`,
          company_id: companyId,
          employee_code: row.employeeCode,
          full_name: row.fullName,
          base_salary: row.baseSalary,
          status: 'active',
          join_date: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString(),
          department_id: department?.id,
          department,
          position: row.position,
        };
        data.employees.push(employee);
        byCode.set(key, employee);
      }
    });

    const byName = new Map(data.employees.map((employee) => [employee.full_name.trim().toLocaleLowerCase('vi'), employee]));
    rows.forEach((row) => {
      const employee = byCode.get(normalizeAssignmentEmployeeCode(row.employeeCode));
      const manager = byName.get(row.managerName.trim().toLocaleLowerCase('vi'));
      if (employee && manager && employee.id !== manager.id) employee.manager_id = manager.id;
    });
    write(companyId, data);
    return rows.length;
  },

  reset(companyId: string) {
    const seeded = createSeed(companyId);
    write(companyId, seeded);
    return seeded;
  },
};
