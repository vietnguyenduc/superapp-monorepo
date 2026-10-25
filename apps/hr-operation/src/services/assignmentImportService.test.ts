import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { parseAssignmentWorkbook } from './assignmentImportService';
import type { Employee } from './hrService';

const existing: Employee[] = [{
  id: 'employee-1',
  company_id: 'company-a',
  employee_code: '0001',
  full_name: 'Nguyễn An',
  base_salary: 10000000,
  status: 'active',
  join_date: '2024-01-01',
  created_at: '2024-01-01T00:00:00.000Z',
  position: 'Nhân viên',
}];

const workbookBuffer = () => {
  const rows = [
    ['Tiêu đề'],
    ['TT', 'Mã Nhân viên', 'Tên nhân viên / Employee Name', 'Vị trí – Tiếng Việt / Position – Vietnamese', 'Position – English', 'Ngạch / Grade', 'Chi nhánh', 'Tên cấp trên trực tiếp', 'Phân cấp', 'Cấp bậc', 'Note', 'Bộ phận – Tiếng Việt / Team – Vietnamese', 'Team – English', 'Phòng ban – Tiếng Việt / Department – Vietnamese', 'Department – English', '', 'TỔNG LƯƠNG CỨNG'],
    [1, '1', 'Nguyễn An', 'Trưởng nhóm', 'Team Lead', '3', 'HN', '', '', '3.1', '', 'Sản phẩm', 'Product', 'Phòng Sản phẩm', 'Product Department', '', 15000000],
    [2, '2', 'Trần Bình', 'Chuyên viên', 'Specialist', '2', 'HN', 'Nguyễn An', '', '2.1', '', 'Sản phẩm', 'Product', 'Phòng Sản phẩm', 'Product Department', '', 12000000],
    [3, '2', 'Trần Bình', 'Chuyên viên', 'Specialist', '2', 'HN', 'Nguyễn An', '', '2.1', '', 'Sản phẩm', 'Product', 'Phòng Sản phẩm', 'Product Department', '', 12000000],
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Database');
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return output instanceof ArrayBuffer ? output : output.buffer;
};

describe('parseAssignmentWorkbook', () => {
  it('classifies enrichment, insertion, and duplicate conflicts by canonical employee code', () => {
    const rows = parseAssignmentWorkbook(workbookBuffer(), existing);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ employeeCode: '1', action: 'update', position: 'Trưởng nhóm', baseSalary: 15000000 });
    expect(rows[1]).toMatchObject({ employeeCode: '2', action: 'insert', managerName: 'Nguyễn An' });
    expect(rows[2].action).toBe('conflict');
    expect(rows[2].errors).toContain('Mã nhân viên bị trùng trong file');
  });
});
