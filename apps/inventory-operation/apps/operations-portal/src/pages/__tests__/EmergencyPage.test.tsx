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
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  },
  TABLES: {
    OPERATION_EMERGENCY_CONTACTS: 'operation_emergency_contacts',
  },
  STORAGE: { OPERATIONS_MEDIA: 'operations_media' },
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
  getCurrentUserId: vi.fn().mockResolvedValue('test-user'),
}));

// Mock trialData
vi.mock('../../lib/trialData', () => ({
  isTrialMode: vi.fn(() => false),
  mockEmergencyContacts: [],
}));

describe('EmergencyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const EmergencyPage = (await import('../EmergencyPage')).default;
    render(
      <MemoryRouter>
        <EmergencyPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Danh bạ khẩn cấp')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    const EmergencyPage = (await import('../EmergencyPage')).default;
    render(
      <MemoryRouter>
        <EmergencyPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Đang tải danh bạ...')).toBeInTheDocument();
  });

  it('shows empty state when no contacts', async () => {
    const EmergencyPage = (await import('../EmergencyPage')).default;
    render(
      <MemoryRouter>
        <EmergencyPage />
      </MemoryRouter>
    );
    const emptyText = await screen.findByText('Chưa có số liên lạc khẩn cấp nào.');
    expect(emptyText).toBeInTheDocument();
  });
});
