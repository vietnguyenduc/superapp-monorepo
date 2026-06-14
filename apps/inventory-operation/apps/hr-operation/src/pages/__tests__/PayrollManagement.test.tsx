import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Banknote: () => null,
  Calculator: () => null,
  Download: () => null,
  CheckCircle: () => null,
  Search: () => null,
  ChevronRight: () => null,
  FileDown: () => null,
  Filter: () => null,
  X: () => null,
}));

describe('PayrollManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const PayrollManagement = (await import('../PayrollManagement')).default;
    render(
      <MemoryRouter>
        <PayrollManagement />
      </MemoryRouter>
    );
    expect(screen.getByText('Tính lương & Phụ cấp')).toBeInTheDocument();
  });

  it('renders the summary cards', async () => {
    const PayrollManagement = (await import('../PayrollManagement')).default;
    render(
      <MemoryRouter>
        <PayrollManagement />
      </MemoryRouter>
    );
    expect(screen.getByText('Tổng quỹ lương (Net)')).toBeInTheDocument();
    expect(screen.getByText('Lương P1 (Vị trí)')).toBeInTheDocument();
    expect(screen.getByText('Thưởng P3 (Hiệu suất)')).toBeInTheDocument();
    expect(screen.getByText('Trạng thái')).toBeInTheDocument();
  });

  it('renders the search input', async () => {
    const PayrollManagement = (await import('../PayrollManagement')).default;
    render(
      <MemoryRouter>
        <PayrollManagement />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Tìm nhân viên...')).toBeInTheDocument();
  });

  it('renders the export button', async () => {
    const PayrollManagement = (await import('../PayrollManagement')).default;
    render(
      <MemoryRouter>
        <PayrollManagement />
      </MemoryRouter>
    );
    expect(screen.getByText('Xuất Excel')).toBeInTheDocument();
  });

  it('renders employee names in the table', async () => {
    const PayrollManagement = (await import('../PayrollManagement')).default;
    render(
      <MemoryRouter>
        <PayrollManagement />
      </MemoryRouter>
    );
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    expect(screen.getByText('Lê Văn Luyện')).toBeInTheDocument();
  });
});
