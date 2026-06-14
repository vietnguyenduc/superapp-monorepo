import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      single: vi.fn(() => Promise.resolve({ data: { company_id: 'test-company' }, error: null })),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  },
  TABLES: {
    OPERATION_TICKETS: 'operation_tickets',
    USERS: 'users',
  },
  STORAGE: { OPERATIONS_MEDIA: 'operations_media' },
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
  getCurrentUserId: vi.fn().mockResolvedValue('test-user'),
}));

// Mock trialData
vi.mock('../../lib/trialData', () => ({
  isTrialMode: vi.fn(() => false),
  mockTickets: [],
}));

describe('TicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const TicketsPage = (await import('../TicketsPage')).default;
    render(
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Sự cố & Bảo trì')).toBeInTheDocument();
  });

  it('renders the create ticket button', async () => {
    const TicketsPage = (await import('../TicketsPage')).default;
    render(
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('+ Báo sự cố mới')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    const TicketsPage = (await import('../TicketsPage')).default;
    render(
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });
});
