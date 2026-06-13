﻿﻿﻿import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom to avoid React version mismatch with hoisted packages
vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: () => null,
}));

// Mock lucide-react icons to avoid React version mismatch
vi.mock('lucide-react', () => ({
  Users: () => null,
  Building: () => null,
  Plus: () => null,
  Search: () => null,
  MoreVertical: () => null,
  Briefcase: () => null,
  Calendar: () => null,
  CheckCircle: () => null,
}));

// Mock hrService
vi.mock('../../services/hrService', () => ({
  hrService: {
    getEmployees: vi.fn().mockResolvedValue([
      {
        id: '1',
        company_id: 'c1',
        employee_code: 'EMP001',
        full_name: 'Nguyễn Văn A',
        base_salary: 15000000,
        status: 'active',
        join_date: '2023-01-15',
        created_at: '',
        department: { name: 'Phòng Kỹ thuật' },
        position: 'Chuyên viên Bậc 2',
        p2_allowance: 2000000,
      },
    ]),
    getDepartments: vi.fn().mockResolvedValue([]),
  },
}));

describe('EmployeeDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const EmployeeDirectory = (await import('../EmployeeDirectory')).default;
    render(<EmployeeDirectory />);
    expect(screen.getByText('Hồ sơ Nhân sự')).toBeInTheDocument();
  });

  it('renders employee list after loading', async () => {
    const EmployeeDirectory = (await import('../EmployeeDirectory')).default;
    render(<EmployeeDirectory />);
    // Wait for the employee name to appear
    const employeeName = await screen.findByText('Nguyễn Văn A');
    expect(employeeName).toBeInTheDocument();
  });

  it('renders the search input', async () => {
    const EmployeeDirectory = (await import('../EmployeeDirectory')).default;
    render(<EmployeeDirectory />);
    const searchInput = await screen.findByPlaceholderText('Tìm kiếm theo tên, mã NV...');
    expect(searchInput).toBeInTheDocument();
  });
});
