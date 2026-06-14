﻿﻿import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock react-router-dom to avoid React version mismatch
vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/settings' }),
}));

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
    render(<HRSettings />);
    expect(screen.getByText('Cài đặt Hệ thống HR')).toBeInTheDocument();
  });

  it('renders the performance framework section', async () => {
    const HRSettings = (await import('../HRSettings')).default;
    render(<HRSettings />);
    expect(screen.getByText('Mô hình đánh giá (Performance Framework)')).toBeInTheDocument();
  });

  it('renders both framework options', async () => {
    const HRSettings = (await import('../HRSettings')).default;
    render(<HRSettings />);
    expect(screen.getByText('OKR (Mục tiêu & Kết quả Then chốt)')).toBeInTheDocument();
    expect(screen.getByText('BSC KPI (Thẻ điểm Cân bằng)')).toBeInTheDocument();
  });

  it('renders the 3P salary configuration section', async () => {
    const HRSettings = (await import('../HRSettings')).default;
    render(<HRSettings />);
    expect(screen.getByText('Cấu hình Lương 3P (Quỹ P3)')).toBeInTheDocument();
  });

  it('renders the save button', async () => {
    const HRSettings = (await import('../HRSettings')).default;
    render(<HRSettings />);
    expect(screen.getByText('Lưu cài đặt')).toBeInTheDocument();
  });
});
