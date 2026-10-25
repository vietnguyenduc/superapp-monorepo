import * as XLSX from 'xlsx';
import type { Department, Employee } from './hrService';

export type EmployeeImportStatus = Employee['status'];

export interface EmployeeImportRow {
  rowNumber: number;
  employeeCode: string;
  fullName: string;
  baseSalary: number;
  status: EmployeeImportStatus;
  joinDate: string;
  departmentName: string;
  positionName: string;
  departmentId?: string;
  errors: string[];
  warnings: string[];
}

const aliases: Record<string, string[]> = {
  employeeCode: ['employee_code', 'employee code', 'ma nv', 'ma nhan vien', 'ma so lao dong', 'manv'],
  fullName: ['full_name', 'full name', 'ho ten', 'ho va ten', 'ten nhan vien', 'employee name'],
  baseSalary: ['base_salary', 'base salary', 'luong co ban', 'tong luong cung', 'luong'],
  status: ['status', 'trang thai', 'tinh trang lam viec', 'tinh trang'],
  joinDate: ['join_date', 'join date', 'ngay vao lam', 'ngay vao cong ty', 'ngay bat dau'],
  departmentName: ['department', 'department_name', 'phong ban', 'bo phan'],
  positionName: ['position', 'job title', 'vi tri tieng viet', 'chuc danh chuyen mon', 'chuc vu va chuc danh chuyen mon'],
};

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const normalizeEmployeeCode = (value: unknown) => {
  const normalized = normalize(value);
  return /^\d+$/.test(normalized) ? normalized.replace(/^0+(?=\d)/, '') : normalized;
};

const normalizeHeader = (value: unknown) => normalize(value).replace(/[_–—/\\|]+/g, ' ');

const headerMatches = (header: unknown, field: keyof typeof aliases) => {
  const normalizedHeader = normalizeHeader(header);
  return aliases[field].some((alias) => {
    const normalizedAlias = normalizeHeader(alias);
    return normalizedHeader === normalizedAlias ||
      normalizedHeader.startsWith(`${normalizedAlias} `) ||
      normalizedHeader.endsWith(` ${normalizedAlias}`);
  });
};

const findColumn = (headers: unknown[], field: keyof typeof aliases) =>
  headers.findIndex((header) => headerMatches(header, field));

const pick = (headers: unknown[], row: unknown[], field: keyof typeof aliases) => {
  const column = findColumn(headers, field);
  return column >= 0 ? row[column] : undefined;
};

export interface EmployeeSheetOption {
  name: string;
  headerRow: number;
  dataRowCount: number;
}

export const inspectEmployeeWorkbook = (content: ArrayBuffer): EmployeeSheetOption[] => {
  const workbook = XLSX.read(content, { type: 'array', cellDates: true });
  const options: EmployeeSheetOption[] = [];

  workbook.SheetNames.forEach((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false, blankrows: true });
    let bestHeaderIndex = -1;
    let bestScore = -1;
    rows.slice(0, 20).forEach((row, index) => {
      const hasCode = findColumn(row, 'employeeCode') >= 0;
      const hasName = findColumn(row, 'fullName') >= 0;
      if (!hasCode || !hasName) return;
      const score = (['departmentName', 'positionName', 'joinDate', 'status', 'baseSalary'] as const)
        .reduce((total, field) => total + (findColumn(row, field) >= 0 ? 1 : 0), 2);
      if (score > bestScore) {
        bestHeaderIndex = index;
        bestScore = score;
      }
    });

    if (bestHeaderIndex >= 0) {
      const headers = rows[bestHeaderIndex];
      const dataRowCount = rows.slice(bestHeaderIndex + 1).filter((row) => {
        const code = String(pick(headers, row, 'employeeCode') ?? '').trim();
        const nameValue = String(pick(headers, row, 'fullName') ?? '').trim();
        return code && nameValue && !(headerMatches(code, 'employeeCode') && headerMatches(nameValue, 'fullName'));
      }).length;
      options.push({ name, headerRow: bestHeaderIndex + 1, dataRowCount });
    }
  });

  return options;
};

const parseMoney = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const compact = String(value ?? '').replace(/\s/g, '').replace(/[₫đ]/gi, '');
  if (!compact) return 0;
  const normalized = compact.includes(',') && compact.includes('.')
    ? compact.replace(/\./g, '').replace(',', '.')
    : compact.replace(/[.,](?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  return Number(normalized);
};

const parseDate = (value: unknown) => {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  const text = String(value).trim();
  const isValidParts = (year: number, month: number, day: number) => {
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  };
  const vietnamese = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (vietnamese) {
    const [, day, month, year] = vietnamese;
    if (!isValidParts(Number(year), Number(month), Number(day))) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso && isValidParts(Number(iso[1]), Number(iso[2]), Number(iso[3])) ? text : '';
};

const parseStatus = (value: unknown): EmployeeImportStatus | null => {
  const text = normalize(value || 'active').replace(/_/g, ' ');
  if (['active', 'dang lam', 'dang lam viec', 'hoat dong', 'chinh thuc', 'thu viec'].includes(text)) return 'active';
  if (['inactive', 'da nghi', 'da nghi viec', 'nghi viec', 'khong hoat dong'].includes(text)) return 'inactive';
  if (['on leave', 'tam nghi', 'nghi phep'].includes(text)) return 'on_leave';
  return null;
};

export const parseEmployeeWorkbook = (
  content: ArrayBuffer,
  departments: Department[],
  existingEmployees: Employee[],
  selectedSheetName?: string,
): EmployeeImportRow[] => {
  const workbook = XLSX.read(content, { type: 'array', cellDates: true });
  const options = inspectEmployeeWorkbook(content);
  if (!options.length) {
    throw new Error('Không tìm thấy sheet danh sách có cả cột mã và tên nhân viên.');
  }
  const selectedOption = options.find((option) => option.name === selectedSheetName) || options[0];
  const sheet = workbook.Sheets[selectedOption.name];
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false, blankrows: true });
  const allRawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true, blankrows: true });
  const headers = allRows[selectedOption.headerRow - 1];
  const codeColumn = findColumn(headers, 'employeeCode');
  const nameColumn = findColumn(headers, 'fullName');
  const relevantFields = ['employeeCode', 'fullName', 'departmentName', 'positionName', 'joinDate', 'status', 'baseSalary'] as const;
  const dataRows = allRows.slice(selectedOption.headerRow).map((formattedRow, index) => ({
    formattedRow,
    rawRow: allRawRows[selectedOption.headerRow + index] || formattedRow,
    rowNumber: selectedOption.headerRow + index + 1,
  })).filter(({ formattedRow }) => {
    const code = String(formattedRow[codeColumn] ?? '').trim();
    const name = String(formattedRow[nameColumn] ?? '').trim();
    const repeatedHeader = headerMatches(code, 'employeeCode') && headerMatches(name, 'fullName');
    const relevantValueCount = relevantFields.filter((field) => String(pick(headers, formattedRow, field) ?? '').trim()).length;
    return !repeatedHeader && (Boolean(code || name) || relevantValueCount >= 3);
  });
  if (!dataRows.length) throw new Error('Sheet đã chọn không có dòng dữ liệu nào.');

  const existingCodes = new Set(existingEmployees.map((employee) => normalizeEmployeeCode(employee.employee_code)));
  const importedCodes = new Set<string>();
  const departmentMap = new Map(departments.map((department) => [normalize(department.name), department]));

  return dataRows.map(({ formattedRow, rawRow, rowNumber }) => {
    const employeeCode = String(pick(headers, formattedRow, 'employeeCode') ?? '').trim();
    const fullName = String(pick(headers, formattedRow, 'fullName') ?? '').trim();
    const isMidomaxMaster = normalizeHeader(headers[codeColumn]) === 'ma so lao dong';
    const departmentValue = isMidomaxMaster && codeColumn >= 0
      ? formattedRow[codeColumn + 2]
      : pick(headers, formattedRow, 'departmentName');
    const departmentName = String(departmentValue ?? '').trim();
    const positionName = String(pick(headers, formattedRow, 'positionName') ?? '').trim();
    const baseSalaryValue = pick(headers, rawRow, 'baseSalary');
    const joinDateValue = pick(headers, rawRow, 'joinDate');
    const baseSalary = parseMoney(baseSalaryValue);
    const joinDate = parseDate(joinDateValue);
    const status = parseStatus(pick(headers, formattedRow, 'status'));
    const errors: string[] = [];
    const warnings: string[] = [];
    const normalizedCode = normalizeEmployeeCode(employeeCode);
    const department = departmentMap.get(normalize(departmentName));

    if (!employeeCode) errors.push('Thiếu mã nhân viên');
    if (!fullName) errors.push('Thiếu họ tên');
    if (!Number.isFinite(baseSalary) || baseSalary < 0) errors.push('Lương cơ bản không hợp lệ');
    if (joinDateValue && !joinDate) errors.push('Ngày vào làm không hợp lệ');
    if (!status) errors.push('Trạng thái không hợp lệ');
    if (normalizedCode && existingCodes.has(normalizedCode)) warnings.push('Mã đã tồn tại, dòng này sẽ được bỏ qua');
    if (normalizedCode && importedCodes.has(normalizedCode)) errors.push('Mã bị trùng trong file');
    if (normalizedCode) importedCodes.add(normalizedCode);
    if (departmentName && !department) warnings.push('Không tìm thấy phòng ban, nhân viên sẽ để chưa xếp phòng');

    return {
      rowNumber,
      employeeCode,
      fullName,
      baseSalary: Number.isFinite(baseSalary) ? baseSalary : 0,
      status: status || 'active',
      joinDate,
      departmentName,
      positionName,
      departmentId: department?.id,
      errors,
      warnings,
    };
  });
};

export const isImportableRow = (row: EmployeeImportRow) =>
  row.errors.length === 0 && !row.warnings.some((warning) => warning.startsWith('Mã đã tồn tại'));
