﻿import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null, count: 0 })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  },
  TABLES: {
    OPERATION_CHECKINS: 'operation_checkins',
    OPERATION_DOCUMENTS: 'operation_documents',
    OPERATION_CHAT_GROUPS: 'operation_chat_groups',
  },
  STORAGE: { OPERATIONS_MEDIA: 'operations_media' },
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
  getCurrentUserId: vi.fn().mockResolvedValue('test-user'),
}));

// Mock trialData
vi.mock('../../lib/trialData', () => ({
  isTrialMode: vi.fn(() => false),
  mockDashboardStats: { checkinsToday: 12, newNotices: 5, activeGroups: 3 },
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard title', async () => {
    const Dashboard = (await import('../Dashboard')).default;
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Tổng quan Vận hành')).toBeInTheDocument();
  });

  it('renders stat cards with correct labels', async () => {
    const Dashboard = (await import('../Dashboard')).default;
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Check-in hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Thông báo mới (7 ngày qua)')).toBeInTheDocument();
    expect(screen.getByText('Group Chat hoạt động')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    const Dashboard = (await import('../Dashboard')).default;
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    const loadingElements = screen.getAllByText('Đang tải...');
    expect(loadingElements).toHaveLength(3);
  });
});
