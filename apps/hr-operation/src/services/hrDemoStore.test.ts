import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hrDemoStore } from './hrDemoStore';

const values = new Map<string, string>();

beforeEach(() => {
  values.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

describe('hrDemoStore', () => {
  it('creates a connected organization seed for a new demo company', () => {
    const departments = hrDemoStore.getDepartments('company-a');
    const employees = hrDemoStore.getEmployees('company-a');

    expect(departments).toHaveLength(6);
    expect(employees).toHaveLength(14);
    expect(employees.every((employee) => employee.company_id === 'company-a')).toBe(true);
    expect(employees.find((employee) => employee.employee_code === '1002')?.manager_id).toBe('emp-1001');
  });

  it('keeps imported rows isolated by company and persists their position', () => {
    hrDemoStore.addEmployees('company-a', [{
      employee_code: '2001',
      full_name: 'Nhân viên nhập thử',
      base_salary: 12000000,
      status: 'active',
      join_date: '2026-10-25',
      position: 'Chuyên viên thử nghiệm',
    }]);

    expect(hrDemoStore.getEmployees('company-a')).toHaveLength(15);
    expect(hrDemoStore.getEmployees('company-a').at(-1)?.position).toBe('Chuyên viên thử nghiệm');
    expect(hrDemoStore.getEmployees('company-b')).toHaveLength(14);
  });
});
