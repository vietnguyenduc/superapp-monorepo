import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Camera: () => null,
  MapPin: () => null,
  UploadCloud: () => null,
  Clock: () => null,
  CheckCircle2: () => null,
  History: () => null,
  AlertCircle: () => null,
  FileSpreadsheet: () => null,
}));

describe('AttendancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const AttendancePage = (await import('../AttendancePage')).default;
    render(
      <MemoryRouter>
        <AttendancePage />
      </MemoryRouter>
    );
    expect(screen.getByText('Chấm công')).toBeInTheDocument();
  });

  it('renders all three tabs', async () => {
    const AttendancePage = (await import('../AttendancePage')).default;
    render(
      <MemoryRouter>
        <AttendancePage />
      </MemoryRouter>
    );
    expect(screen.getByText('Check-in Trực tuyến')).toBeInTheDocument();
    expect(screen.getByText('Lịch sử của tôi')).toBeInTheDocument();
    expect(screen.getByText('Import Dữ liệu')).toBeInTheDocument();
  });

  it('renders the check-in tab by default', async () => {
    const AttendancePage = (await import('../AttendancePage')).default;
    render(
      <MemoryRouter>
        <AttendancePage />
      </MemoryRouter>
    );
    expect(screen.getByText('Ca hiện tại')).toBeInTheDocument();
    expect(screen.getByText('Vị trí (GPS)')).toBeInTheDocument();
  });

  it('renders the camera section', async () => {
    const AttendancePage = (await import('../AttendancePage')).default;
    render(
      <MemoryRouter>
        <AttendancePage />
      </MemoryRouter>
    );
    expect(screen.getByText('Mở Camera')).toBeInTheDocument();
  });
});
