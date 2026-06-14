﻿﻿import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock react-router-dom to avoid React version mismatch
vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/performance' }),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Target: () => null,
  Plus: () => null,
  ChevronDown: () => null,
  CheckCircle2: () => null,
  Circle: () => null,
}));

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const PerformanceDashboard = (await import('../PerformanceDashboard')).default;
    render(<PerformanceDashboard />);
    expect(screen.getByText('Hiệu suất (KPI / OKR)')).toBeInTheDocument();
  });

  it('renders the add objective button', async () => {
    const PerformanceDashboard = (await import('../PerformanceDashboard')).default;
    render(<PerformanceDashboard />);
    expect(screen.getByText('Thêm Mục tiêu')).toBeInTheDocument();
  });

  it('renders summary stat cards', async () => {
    const PerformanceDashboard = (await import('../PerformanceDashboard')).default;
    render(<PerformanceDashboard />);
    expect(screen.getByText('Mục tiêu đang chạy')).toBeInTheDocument();
    expect(screen.getByText('Tiến độ Trung bình')).toBeInTheDocument();
    expect(screen.getByText('Quỹ P3 dự kiến')).toBeInTheDocument();
  });

  it('renders the objectives list', async () => {
    const PerformanceDashboard = (await import('../PerformanceDashboard')).default;
    render(<PerformanceDashboard />);
    expect(screen.getByText('Danh sách Mục tiêu')).toBeInTheDocument();
  });

  it('renders mock objectives with key results', async () => {
    const PerformanceDashboard = (await import('../PerformanceDashboard')).default;
    render(<PerformanceDashboard />);
    expect(screen.getByText('Tăng trưởng doanh số Q2')).toBeInTheDocument();
    expect(screen.getByText('Nâng cao chất lượng dịch vụ')).toBeInTheDocument();
  });
});
