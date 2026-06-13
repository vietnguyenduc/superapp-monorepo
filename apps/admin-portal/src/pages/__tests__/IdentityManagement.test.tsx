import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: () => null,
  useLocation: () => ({ pathname: '/identity' }),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Search: () => null,
  Check: () => null,
  X: () => null,
  ShieldAlert: () => null,
  Loader2: () => null,
}));

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

// Mock AdminContext
vi.mock('../../contexts/AdminContext', () => ({
  useAdminContext: () => ({
    companies: [],
    selectedCompanyId: null,
    setSelectedCompanyId: vi.fn(),
    loading: false,
  }),
  AdminProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock @superapp/iam
vi.mock('@superapp/iam', () => ({
  useAuthContext: () => ({
    session: { access_token: 'test-token' },
    user: { id: 'u1', email: 'admin@test.com', role: 'admin_master' },
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('IdentityManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const IdentityManagement = (await import('../IdentityManagement')).default;
    render(<IdentityManagement />);
    expect(screen.getByText('Access Matrix')).toBeInTheDocument();
  });

  it('renders the search input', async () => {
    const IdentityManagement = (await import('../IdentityManagement')).default;
    render(<IdentityManagement />);
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('renders the refresh button', async () => {
    const IdentityManagement = (await import('../IdentityManagement')).default;
    render(<IdentityManagement />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });
});
