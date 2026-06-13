﻿import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  useLocation: () => ({ pathname: '/companies' }),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Building2: () => null,
  Plus: () => null,
  Power: () => null,
  Users: () => null,
  Activity: () => null,
}));

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe('CompanyManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title after loading', async () => {
    const CompanyManagement = (await import('../CompanyManagement')).default;
    render(<CompanyManagement />);
    expect(await screen.findByText('Company Management')).toBeInTheDocument();
  });

  it('renders the create company button after loading', async () => {
    const CompanyManagement = (await import('../CompanyManagement')).default;
    render(<CompanyManagement />);
    expect(await screen.findByText('Create Company')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    const CompanyManagement = (await import('../CompanyManagement')).default;
    render(<CompanyManagement />);
    expect(screen.getByText('Loading company stats...')).toBeInTheDocument();
  });
});
