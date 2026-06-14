﻿﻿﻿﻿﻿﻿import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock react-router-dom to avoid React version mismatch (hoisted react-router uses React 19)
vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ element }: { element: React.ReactNode }) => <>{element}</>,
  Navigate: () => null,
  useLocation: () => ({ pathname: '/employees' }),
}));

// Mock lucide-react to avoid React version mismatch
vi.mock('lucide-react', () => ({
  Users: () => null,
  CalendarDays: () => null,
  Clock: () => null,
  FileText: () => null,
  DollarSign: () => null,
  BarChart3: () => null,
  Settings: () => null,
  BookOpen: () => null,
  Menu: () => null,
  X: () => null,
  ChevronDown: () => null,
  ChevronRight: () => null,
  Search: () => null,
  Bell: () => null,
  LogOut: () => null,
  LayoutGrid: () => null,
  ExternalLink: () => null,
  CheckCircle2: () => null,
  XCircle: () => null,
  AlertCircle: () => null,
  ArrowUpDown: () => null,
  ArrowUp: () => null,
  ArrowDown: () => null,
  Filter: () => null,
  Download: () => null,
  Upload: () => null,
  Plus: () => null,
  Edit: () => null,
  Trash2: () => null,
  Eye: () => null,
  MoreHorizontal: () => null,
  Loader2: () => null,
  RefreshCw: () => null,
  Banknote: () => null,
  Target: () => null,
  ShieldCheck: () => null,
}));

// Mock all page components
vi.mock('../EmployeeDirectory', () => ({ default: () => <div>Employee Directory Page</div> }));
vi.mock('../ShiftManagement', () => ({ default: () => <div>Shift Management Page</div> }));
vi.mock('../AttendancePage', () => ({ default: () => <div>Attendance Page</div> }));
vi.mock('../LeaveManagement', () => ({ default: () => <div>Leave Management Page</div> }));
vi.mock('../PayrollManagement', () => ({ default: () => <div>Payroll Management Page</div> }));
vi.mock('../PerformanceDashboard', () => ({ default: () => <div>Performance Dashboard Page</div> }));
vi.mock('../HRSettings', () => ({ default: () => <div>HR Settings Page</div> }));
vi.mock('../Manual/Manual', () => ({ default: () => <div>Manual Page</div> }));

// Mock Layout components
vi.mock('../../components/Layout/AppSwitcher', () => ({ default: () => <div>AppSwitcher</div> }));
vi.mock('../../components/Layout/MobileBottomNav', () => ({ default: () => null }));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app header with title', async () => {
    const App = (await import('../../App')).default;
    render(<App />);
    expect(screen.getByText('HR & Payroll')).toBeInTheDocument();
  });

  it('renders the sidebar with navigation', async () => {
    const App = (await import('../../App')).default;
    render(<App />);
    expect(screen.getByText('Quản lý chung')).toBeInTheDocument();
  });

  it('renders all navigation links', async () => {
    const App = (await import('../../App')).default;
    render(<App />);
    expect(screen.getByText('Hồ sơ Nhân sự')).toBeInTheDocument();
    expect(screen.getByText('Xếp ca')).toBeInTheDocument();
    expect(screen.getByText('Chấm công')).toBeInTheDocument();
    expect(screen.getByText('Đơn từ')).toBeInTheDocument();
    expect(screen.getByText('Bảng lương 3P')).toBeInTheDocument();
    expect(screen.getByText('KPI & OKR')).toBeInTheDocument();
    expect(screen.getByText('Cài đặt')).toBeInTheDocument();
    expect(screen.getByText('Hướng dẫn sử dụng')).toBeInTheDocument();
  });

  it('renders the AppSwitcher component', async () => {
    const App = (await import('../../App')).default;
    render(<App />);
    expect(screen.getByText('AppSwitcher')).toBeInTheDocument();
  });

  it('renders the employee directory page by default', async () => {
    const App = (await import('../../App')).default;
    render(<App />);
    expect(screen.getByText('Employee Directory Page')).toBeInTheDocument();
  });
});
