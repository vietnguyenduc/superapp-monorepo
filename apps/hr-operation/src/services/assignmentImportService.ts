import * as XLSX from 'xlsx';
import type { Employee } from './hrService';

export type AssignmentAction = 'insert' | 'update' | 'unchanged' | 'conflict';

export interface AssignmentImportRow {
  rowNumber: number;
  employeeCode: string;
  fullName: string;
  position: string;
  positionEn: string;
  departmentName: string;
  departmentNameEn: string;
  teamName: string;
  teamNameEn: string;
  managerName: string;
  branchName: string;
  grade: string;
  level: string;
  baseSalary: number;
  action: AssignmentAction;
  employeeId?: string;
  errors: string[];
  warnings: string[];
}

const normalize = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

export const normalizeAssignmentEmployeeCode = (value: unknown) => {
  const code = normalize(value);
  return /^\d+$/.test(code) ? code.replace(/^0+(?=\d)/, '') : code;
};

const parseMoney = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const digits = String(value ?? '').replace(/[^\d-]/g, '');
  return digits ? Number(digits) : 0;
};

const findHeaderRow = (rows: unknown[][]) => rows.slice(0, 20).findIndex((row) => {
  const headers = row.map(normalize);
  return headers.some((value) => value.includes('ma nhan vien')) &&
    headers.some((value) => value.includes('ten nhan vien')) &&
    headers.some((value) => value.includes('position'));
});

const column = (headers: unknown[], ...needles: string[]) => headers.findIndex((header) => {
  const value = normalize(header);
  return needles.every((needle) => value.includes(normalize(needle)));
});

const valueAt = (row: unknown[], index: number) => index >= 0 ? String(row[index] ?? '').trim() : '';

export const parseAssignmentWorkbook = (
  content: ArrayBuffer,
  existingEmployees: Employee[],
): AssignmentImportRow[] => {
  const workbook = XLSX.read(content, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames.find((name) => normalize(name) === 'database') || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const formattedRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false });
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true });
  const headerIndex = findHeaderRow(formattedRows);
  if (headerIndex < 0) throw new Error('Không tìm thấy bảng phân công có Mã nhân viên, Tên nhân viên và Vị trí.');
  const headers = formattedRows[headerIndex];
  const columns = {
    code: column(headers, 'ma nhan vien'),
    name: column(headers, 'ten nhan vien'),
    position: column(headers, 'vi tri', 'vietnamese'),
    positionEn: column(headers, 'position', 'english'),
    grade: column(headers, 'grade'),
    branch: column(headers, 'chi nhanh'),
    manager: column(headers, 'cap tren truc tiep'),
    level: column(headers, 'cap bac'),
    team: column(headers, 'team', 'vietnamese'),
    teamEn: column(headers, 'team', 'english'),
    department: column(headers, 'department', 'vietnamese'),
    departmentEn: column(headers, 'department', 'english'),
    baseSalary: column(headers, 'tong luong cung'),
  };
  const employeesByCode = new Map(existingEmployees.map((employee) => [
    normalizeAssignmentEmployeeCode(employee.employee_code),
    employee,
  ]));
  const knownNames = new Map<string, Employee[]>();
  existingEmployees.forEach((employee) => {
    const key = normalize(employee.full_name);
    knownNames.set(key, [...(knownNames.get(key) || []), employee]);
  });
  const seenCodes = new Set<string>();

  return formattedRows.slice(headerIndex + 1).map((row, offset): AssignmentImportRow | null => {
    const rawRow = rawRows[headerIndex + 1 + offset] || row;
    const employeeCode = valueAt(row, columns.code);
    const fullName = valueAt(row, columns.name);
    if (!employeeCode && !fullName) return null;
    const codeKey = normalizeAssignmentEmployeeCode(employeeCode);
    const existing = employeesByCode.get(codeKey);
    const position = valueAt(row, columns.position);
    const departmentName = valueAt(row, columns.department);
    const managerName = valueAt(row, columns.manager);
    const baseSalary = parseMoney(columns.baseSalary >= 0 ? rawRow[columns.baseSalary] : 0);
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!employeeCode) errors.push('Thiếu mã nhân viên');
    if (!fullName) errors.push('Thiếu tên nhân viên');
    if (!position) warnings.push('Thiếu chức danh');
    if (!departmentName) warnings.push('Thiếu phòng ban');
    if (seenCodes.has(codeKey)) errors.push('Mã nhân viên bị trùng trong file');
    if (codeKey) seenCodes.add(codeKey);
    const managerMatches = managerName ? knownNames.get(normalize(managerName)) || [] : [];
    if (managerName && managerMatches.length === 0) warnings.push('Chưa đối chiếu được cấp trên');
    if (managerMatches.length > 1) errors.push('Tên cấp trên khớp nhiều nhân viên');
    if (managerName && normalize(managerName) === normalize(fullName)) errors.push('Nhân viên không thể tự quản lý chính mình');

    const changed = existing && (
      normalize(existing.full_name) !== normalize(fullName) ||
      normalize(existing.position) !== normalize(position) ||
      normalize(existing.department?.name) !== normalize(departmentName) ||
      (baseSalary > 0 && existing.base_salary !== baseSalary) ||
      (managerMatches[0] && existing.manager_id !== managerMatches[0].id)
    );
    const action: AssignmentAction = errors.length
      ? 'conflict'
      : !existing
        ? 'insert'
        : changed
          ? 'update'
          : 'unchanged';

    return {
      rowNumber: headerIndex + offset + 2,
      employeeCode,
      fullName,
      position,
      positionEn: valueAt(row, columns.positionEn),
      departmentName,
      departmentNameEn: valueAt(row, columns.departmentEn),
      teamName: valueAt(row, columns.team),
      teamNameEn: valueAt(row, columns.teamEn),
      managerName,
      branchName: valueAt(row, columns.branch),
      grade: valueAt(row, columns.grade),
      level: valueAt(row, columns.level),
      baseSalary,
      action,
      employeeId: existing?.id,
      errors,
      warnings,
    };
  }).filter((row): row is AssignmentImportRow => Boolean(row));
};

export const isApplicableAssignment = (row: AssignmentImportRow) =>
  row.action === 'insert' || row.action === 'update';
