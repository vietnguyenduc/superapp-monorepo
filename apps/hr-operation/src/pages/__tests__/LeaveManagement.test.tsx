﻿import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  FileText: () => null,
  Plus: () => null,
  CheckCircle: () => null,
  XCircle: () => null,
  Clock: () => null,
  Calendar: () => null,
  Filter: () => null,
}));

describe('LeaveManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const LeaveManagement = (await import('../LeaveManagement')).default;
    render(<LeaveManagement />);
    expect(screen.getByText('Quản lý Đơn từ')).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    const LeaveManagement = (await import('../LeaveManagement')).default;
    render(<LeaveManagement />);
    expect(screen.getByText('Phép năm còn lại')).toBeInTheDocument();
    expect(screen.getByText('OT Tháng này')).toBeInTheDocument();
    expect(screen.getByText('Đơn chờ duyệt (Quản lý)')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    const LeaveManagement = (await import('../LeaveManagement')).default;
    render(<LeaveManagement />);
    expect(screen.getByText('Đơn của tôi')).toBeInTheDocument();
    expect(screen.getByText('Cần phê duyệt')).toBeInTheDocument();
  });

  it('renders the create request button', async () => {
    const LeaveManagement = (await import('../LeaveManagement')).default;
    render(<LeaveManagement />);
    expect(screen.getByText('Tạo đơn mới')).toBeInTheDocument();
  });
});
