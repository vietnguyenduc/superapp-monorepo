import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
    render(
      <MemoryRouter initialEntries={['/employees']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('HR & Payroll')).toBeInTheDocument();
  });

  it('renders the sidebar with navigation', async () => {
    const App = (await import('../../App')).default;
    render(
      <MemoryRouter initialEntries={['/employees']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Quản lý chung')).toBeInTheDocument();
  });

  it('renders all navigation links', async () => {
    const App = (await import('../../App')).default;
    render(
      <MemoryRouter initialEntries={['/employees']}>
        <App />
      </MemoryRouter>
    );
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
    render(
      <MemoryRouter initialEntries={['/employees']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('AppSwitcher')).toBeInTheDocument();
  });

  it('renders the employee directory page by default', async () => {
    const App = (await import('../../App')).default;
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Employee Directory Page')).toBeInTheDocument();
  });
});
