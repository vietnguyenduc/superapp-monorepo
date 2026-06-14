﻿﻿﻿﻿﻿﻿﻿﻿import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
// Mock react-router-dom and react-router to avoid React version mismatch (hoisted packages use React 19)
vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ element }: { element: React.ReactNode }) => <>{element}</>,
  Navigate: () => null,
  useLocation: () => ({ pathname: '/reports' }),
}));
vi.mock('react-router', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/reports' }),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Shield: () => <span>ShieldIcon</span>,
  Users: () => null,
  Settings: () => null,
  Database: () => null,
  Activity: () => null,
  LogOut: () => <span>LogoutIcon</span>,
  BookOpen: () => null,
  Menu: () => null,
  X: () => null,
  LayoutGrid: () => null,
  ExternalLink: () => null,
  CheckCircle2: () => null,
  XCircle: () => null,
  LayoutDashboard: () => null,
  Building2: () => null,
  ChevronDown: () => null,
  ChevronRight: () => null,
  Search: () => null,
  Bell: () => null,
  AlertCircle: () => null,
  ArrowUpDown: () => null,
  ArrowUp: () => null,
  ArrowDown: () => null,
  Filter: () => null,
  Download: () => null,
  Upload: () => null,
  Plus: () => null,
  Edit: () => null,
  Trash2: () => null,
  Eye: () => null,
  MoreHorizontal: () => null,
  Loader2: () => null,
  RefreshCw: () => null,
  FileText: () => null,
  DollarSign: () => null,
  BarChart3: () => null,
  CalendarDays: () => null,
  Clock: () => null,
}));

// Mock @superapp/iam
vi.mock('@superapp/iam', () => ({
  useAuthContext: () => ({
    session: { access_token: 'test-token' },
    user: { id: 'u1', email: 'admin@test.com', role: 'admin_master' },
    loading: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    auth: {
      signOut: vi.fn(),
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

// Mock page components
vi.mock('../ConsolidatedReports', () => ({ default: () => <div>Consolidated Reports Page</div> }));
vi.mock('../CompanyManagement', () => ({ default: () => <div>Company Management Page</div> }));
vi.mock('../IdentityManagement', () => ({ default: () => <div>Identity Management Page</div> }));
vi.mock('../DataLifecycle', () => ({ default: () => <div>Data Lifecycle Page</div> }));
vi.mock('../GlobalSettings', () => ({ default: () => <div>Global Settings Page</div> }));
vi.mock('../Manual', () => ({ default: () => <div>Manual Page</div> }));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the admin layout with sidebar', async () => {
    const App = (await import('../../App')).default;
    render(<App />);
    expect(screen.getAllByText('Superapp Admin').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all navigation items in sidebar', async () => {
    const App = (await import('../../App')).default;
    render(<App />);
    expect(screen.getAllByText('Consolidated Reports').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Company Management').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Identity & Access').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Data Lifecycle').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Global Settings').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('User Manual').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the logout button', async () => {
    const App = (await import('../../App')).default;
    render(<App />);
    expect(screen.getAllByText('Logout').length).toBeGreaterThanOrEqual(1);
  });
});
