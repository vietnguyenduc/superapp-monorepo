import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Save: () => null,
  Settings: () => null,
  Info: () => null,
}));

describe('HRSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const HRSettings = (await import('../HRSettings')).default;
    render(
      <MemoryRouter>
        <HRSettings />
      </MemoryRouter>
    );
    expect(screen.getByText('Cài đặt Hệ thống HR')).toBeInTheDocument();
  });

  it('renders the performance framework section', async () => {
    const HRSettings = (await import('../HRSettings')).default;
    render(
      <MemoryRouter>
        <HRSettings />
      </MemoryRouter>
    );
    expect(screen.getByText('Mô hình đánh giá (Performance Framework)')).toBeInTheDocument();
  });

  it('renders both framework options', async () => {
    const HRSettings = (await import('../HRSettings')).default;
    render(
      <MemoryRouter>
        <HRSettings />
      </MemoryRouter>
    );
    expect(screen.getByText('OKR (Mục tiêu & Kết quả Then chốt)')).toBeInTheDocument();
    expect(screen.getByText('BSC KPI (Thẻ điểm Cân bằng)')).toBeInTheDocument();
  });

  it('renders the 3P salary configuration section', async () => {
    const HRSettings = (await import('../HRSettings')).default;
    render(
      <MemoryRouter>
        <HRSettings />
      </MemoryRouter>
    );
    expect(screen.getByText('Cấu hình Lương 3P (Quỹ P3)')).toBeInTheDocument();
  });

  it('renders the save button', async () => {
    const HRSettings = (await import('../HRSettings')).default;
    render(
      <MemoryRouter>
        <HRSettings />
      </MemoryRouter>
    );
    expect(screen.getByText('Lưu cài đặt')).toBeInTheDocument();
  });
});
