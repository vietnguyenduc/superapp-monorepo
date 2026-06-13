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
  Clock: () => null,
  Plus: () => null,
  CalendarDays: () => null,
  MoreHorizontal: () => null,
  Settings2: () => null,
  Moon: () => null,
  Sun: () => null,
  ArrowRight: () => null,
}));

// Mock hrService
vi.mock('../../services/hrService', () => ({
  hrService: {
    getShifts: vi.fn().mockResolvedValue([
      {
        id: '1',
        company_id: 'c1',
        name: 'Ca Hành Chính',
        type: 'fixed',
        start_time: '08:00:00',
        end_time: '17:30:00',
        grace_period_mins: 15,
      },
    ]),
  },
}));

describe('ShiftManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const ShiftManagement = (await import('../ShiftManagement')).default;
    render(<ShiftManagement />);
    expect(screen.getByText('Quản lý Ca làm việc')).toBeInTheDocument();
  });

  it('renders shift list after loading', async () => {
    const ShiftManagement = (await import('../ShiftManagement')).default;
    render(<ShiftManagement />);
    const shiftName = await screen.findByText('Ca Hành Chính');
    expect(shiftName).toBeInTheDocument();
  });

  it('renders the create shift button', async () => {
    const ShiftManagement = (await import('../ShiftManagement')).default;
    render(<ShiftManagement />);
    expect(screen.getByText('Tạo ca mới')).toBeInTheDocument();
  });

  it('renders the schedule button', async () => {
    const ShiftManagement = (await import('../ShiftManagement')).default;
    render(<ShiftManagement />);
    expect(screen.getByText('Lịch phân ca')).toBeInTheDocument();
  });
});
