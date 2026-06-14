import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
    render(
      <MemoryRouter>
        <PerformanceDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Hiệu suất (KPI / OKR)')).toBeInTheDocument();
  });

  it('renders the add objective button', async () => {
    const PerformanceDashboard = (await import('../PerformanceDashboard')).default;
    render(
      <MemoryRouter>
        <PerformanceDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Thêm Mục tiêu')).toBeInTheDocument();
  });

  it('renders summary stat cards', async () => {
    const PerformanceDashboard = (await import('../PerformanceDashboard')).default;
    render(
      <MemoryRouter>
        <PerformanceDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Mục tiêu đang chạy')).toBeInTheDocument();
    expect(screen.getByText('Tiến độ Trung bình')).toBeInTheDocument();
    expect(screen.getByText('Quỹ P3 dự kiến')).toBeInTheDocument();
  });

  it('renders the objectives list', async () => {
    const PerformanceDashboard = (await import('../PerformanceDashboard')).default;
    render(
      <MemoryRouter>
        <PerformanceDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Danh sách Mục tiêu')).toBeInTheDocument();
  });

  it('renders mock objectives with key results', async () => {
    const PerformanceDashboard = (await import('../PerformanceDashboard')).default;
    render(
      <MemoryRouter>
        <PerformanceDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Tăng trưởng doanh số Q2')).toBeInTheDocument();
    expect(screen.getByText('Nâng cao chất lượng dịch vụ')).toBeInTheDocument();
  });
});
