import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { company_id: 'test-company' }, error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
      })),
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  },
  TABLES: {
    OPERATION_CHECKINS: 'operation_checkins',
    USERS: 'users',
  },
  STORAGE: { OPERATIONS_MEDIA: 'operations_media' },
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
  getCurrentUserId: vi.fn().mockResolvedValue('test-user'),
}));

describe('CheckInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the check-in page title', async () => {
    const CheckInPage = (await import('../CheckInPage')).default;
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Check-in Vận hành')).toBeInTheDocument();
  });

  it('renders the check-in type select', async () => {
    const CheckInPage = (await import('../CheckInPage')).default;
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Loại Check-in')).toBeInTheDocument();
    expect(screen.getByText('Vệ sinh hàng ngày')).toBeInTheDocument();
  });

  it('renders the submit button', async () => {
    const CheckInPage = (await import('../CheckInPage')).default;
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Gửi Check-in')).toBeInTheDocument();
  });

  it('renders the photo upload area', async () => {
    const CheckInPage = (await import('../CheckInPage')).default;
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Nhấn để chụp ảnh hoặc tải lên')).toBeInTheDocument();
  });

  it('renders the notes textarea', async () => {
    const CheckInPage = (await import('../CheckInPage')).default;
    render(
      <MemoryRouter>
        <CheckInPage />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Nhập ghi chú nếu có...')).toBeInTheDocument();
  });
});
