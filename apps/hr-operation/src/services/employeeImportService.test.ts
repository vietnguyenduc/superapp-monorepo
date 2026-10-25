import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { inspectEmployeeWorkbook, isImportableRow, parseEmployeeWorkbook } from './employeeImportService';
import type { Department, Employee } from './hrService';

const toWorkbook = (rows: Record<string, unknown>[]) => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Nhan vien');
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
};

const departments: Department[] = [
  { id: 'department-1', company_id: 'company-1', name: 'Kinh doanh', created_at: '' },
];

const existingEmployees: Employee[] = [
  {
    id: 'employee-1',
    company_id: 'company-1',
    employee_code: 'NV001',
    full_name: 'Nhân viên cũ',
    base_salary: 1,
    status: 'active',
    join_date: '2026-01-01',
    created_at: '',
  },
];

describe('parseEmployeeWorkbook', () => {
  it('maps Vietnamese columns and an existing department', () => {
    const rows = parseEmployeeWorkbook(
      toWorkbook([
        {
          'Mã nhân viên': 'NV002',
          'Họ tên': 'Nguyễn Văn Mới',
          'Lương cơ bản': '12.500.000',
          'Trạng thái': 'Đang làm',
          'Ngày vào làm': '24/10/2026',
          'Phòng ban': 'Kinh doanh',
        },
      ]),
      departments,
      existingEmployees,
    );

    expect(rows[0]).toMatchObject({
      employeeCode: 'NV002',
      fullName: 'Nguyễn Văn Mới',
      baseSalary: 12_500_000,
      status: 'active',
      joinDate: '2026-10-24',
      departmentId: 'department-1',
      errors: [],
    });
    expect(isImportableRow(rows[0])).toBe(true);
  });

  it('blocks duplicate codes in the file and skips codes already in the company', () => {
    const rows = parseEmployeeWorkbook(
      toWorkbook([
        { employee_code: 'NV001', full_name: 'Đã có' },
        { employee_code: 'NV003', full_name: 'Mới 1' },
        { employee_code: 'nv003', full_name: 'Mới 2' },
      ]),
      departments,
      existingEmployees,
    );

    expect(rows[0].warnings).toContain('Mã đã tồn tại, dòng này sẽ được bỏ qua');
    expect(isImportableRow(rows[0])).toBe(false);
    expect(rows[2].errors).toContain('Mã bị trùng trong file');
    expect(isImportableRow(rows[2])).toBe(false);
  });

  it('treats numeric employee codes with different zero padding as the same key', () => {
    const rows = parseEmployeeWorkbook(
      toWorkbook([{ employee_code: '00001', full_name: 'Cùng mã' }]),
      [],
      [{ ...existingEmployees[0], employee_code: '1' }],
    );

    expect(rows[0].warnings).toContain('Mã đã tồn tại, dòng này sẽ được bỏ qua');
    expect(isImportableRow(rows[0])).toBe(false);
  });

  it('reports missing required fields and invalid values', () => {
    const rows = parseEmployeeWorkbook(
      toWorkbook([
        {
          employee_code: '',
          full_name: '',
          base_salary: 'không phải số',
          status: 'khác',
          join_date: '31/31/2026',
        },
      ]),
      [],
      [],
    );

    expect(rows[0].errors).toEqual([
      'Thiếu mã nhân viên',
      'Thiếu họ tên',
      'Lương cơ bản không hợp lệ',
      'Ngày vào làm không hợp lệ',
      'Trạng thái không hợp lệ',
    ]);
  });

  it('detects the real header below title rows and lets the user select a sheet', () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['DANH SÁCH NHÂN SỰ'],
      [],
      ['Ghi chú'],
      [],
      ['STT', 'Mã số lao động', 'Họ và tên', 'Phòng Kinh doanh', 'Bộ phận', 'Chức vụ', 'Chức danh chuyên môn', 'Chi nhánh', 'Tên cấp trên', 'Giới tính', 'Ngày sinh', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Ngày vào công ty', '', '', '', '', '', 'Tình trạng làm việc'],
      [1, '00001', 'Nguyễn Văn A', 'Phòng Kinh doanh', 'Bán lẻ', '', 'Chuyên viên bán hàng', 'HN', '', 'Nam', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', new Date('2024-05-02T00:00:00Z'), '', '', '', '', '', 'Đang làm việc'],
    ]), 'MIDOMAX 2026');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['Mã nhân viên', 'Tên nhân viên / Employee Name', 'Phòng ban – Tiếng Việt / Department – Vietnamese', 'TỔNG LƯƠNG CỨNG'],
      ['002', 'Nhân viên nghỉ', 'Phòng NSHC', 10_000_000],
    ]), 'Nghỉ việc');
    const content = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

    expect(inspectEmployeeWorkbook(content)).toEqual([
      { name: 'MIDOMAX 2026', headerRow: 5, dataRowCount: 1 },
      { name: 'Nghỉ việc', headerRow: 1, dataRowCount: 1 },
    ]);
    const rows = parseEmployeeWorkbook(content, [], [], 'MIDOMAX 2026');
    expect(rows[0]).toMatchObject({
      employeeCode: '00001',
      departmentName: 'Phòng Kinh doanh',
      positionName: 'Chuyên viên bán hàng',
      joinDate: '2024-05-02',
      status: 'active',
      rowNumber: 6,
    });
  });
});
