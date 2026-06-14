import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  },
  TABLES: {
    OPERATION_ASSETS: 'operation_assets',
    OPERATION_CONSUMABLES: 'operation_consumables',
  },
  STORAGE: { OPERATIONS_MEDIA: 'operations_media' },
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
  getCurrentUserId: vi.fn().mockResolvedValue('test-user'),
}));

// Mock trialData
vi.mock('../../lib/trialData', () => ({
  isTrialMode: vi.fn(() => false),
  mockAssets: [],
  mockConsumables: [],
}));

describe('AssetsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const AssetsPage = (await import('../AssetsPage')).default;
    render(
      <MemoryRouter>
        <AssetsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Tài sản & Vật tư')).toBeInTheDocument();
  });

  it('renders both tabs', async () => {
    const AssetsPage = (await import('../AssetsPage')).default;
    render(
      <MemoryRouter>
        <AssetsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Tài sản cố định')).toBeInTheDocument();
    expect(screen.getByText('Vật tư tiêu hao')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    const AssetsPage = (await import('../AssetsPage')).default;
    render(
      <MemoryRouter>
        <AssetsPage />
      </MemoryRouter>
    );
    const loadingElements = screen.getAllByText('Đang tải...');
    expect(loadingElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no data', async () => {
    const AssetsPage = (await import('../AssetsPage')).default;
    render(
      <MemoryRouter>
        <AssetsPage />
      </MemoryRouter>
    );
    const emptyText = await screen.findByText('Chưa có dữ liệu');
    expect(emptyText).toBeInTheDocument();
  });
});
