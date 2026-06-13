import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase module BEFORE importing hrService
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { company_id: 'test-company' }, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'new-id', name: 'Test' }, error: null })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  },
  TABLES: {
    DEPARTMENTS: 'departments',
    EMPLOYEES: 'employees',
    SHIFTS: 'shifts',
    EMPLOYEE_SHIFTS: 'employee_shifts',
    ATTENDANCE_LOGS: 'attendance_logs',
    LEAVE_REQUESTS: 'leave_requests',
    PAYROLLS: 'payrolls',
    PAYROLL_ITEMS: 'payroll_items',
    USERS: 'users',
    COMPANIES: 'companies',
  },
  handleSupabaseError: vi.fn((error: any) => error?.message || 'Đã xảy ra lỗi không xác định'),
  isAuthenticated: vi.fn().mockResolvedValue(true),
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
  getCurrentUserId: vi.fn().mockResolvedValue('test-user'),
}));

describe('hrService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDepartments', () => {
    it('should return a list of departments', async () => {
      const { hrService } = await import('../hrService');
      const departments = await hrService.getDepartments();
      expect(Array.isArray(departments)).toBe(true);
    });

    it('should throw error when supabase fails', async () => {
      const { supabase } = await import('../../lib/supabase');
      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB error') })),
        })),
      }));

      const { hrService } = await import('../hrService');
      await expect(hrService.getDepartments()).rejects.toThrow('DB error');
    });
  });

  describe('createDepartment', () => {
    it('should create a department and return it', async () => {
      const { hrService } = await import('../hrService');
      const result = await hrService.createDepartment({ name: 'Engineering', manager_id: 'mgr-1' } as any);
      expect(result).toBeDefined();
      expect(result.id).toBe('new-id');
    });
  });

  describe('getEmployees', () => {
    it('should return a list of employees with department', async () => {
      const { hrService } = await import('../hrService');
      const employees = await hrService.getEmployees();
      expect(Array.isArray(employees)).toBe(true);
    });
  });

  describe('getShifts', () => {
    it('should return a list of shifts', async () => {
      const { hrService } = await import('../hrService');
      const shifts = await hrService.getShifts();
      expect(Array.isArray(shifts)).toBe(true);
    });
  });
});
