import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Database: () => null,
  AlertTriangle: () => null,
  RefreshCw: () => null,
  Trash2: () => null,
  HardDrive: () => null,
  ShieldAlert: () => null,
}));

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock AdminContext
vi.mock('../../contexts/AdminContext', () => ({
  useAdminContext: () => ({
    selectedCompanyId: null,
    companies: [],
  }),
}));

describe('DataLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const DataLifecycle = (await import('../DataLifecycle')).default;
    render(<DataLifecycle />);
    expect(screen.getByText('Data Lifecycle')).toBeInTheDocument();
  });

  it('renders the description text', async () => {
    const DataLifecycle = (await import('../DataLifecycle')).default;
    render(<DataLifecycle />);
    expect(screen.getByText(/Manage database storage/)).toBeInTheDocument();
  });

  it('renders the danger zone section', async () => {
    const DataLifecycle = (await import('../DataLifecycle')).default;
    render(<DataLifecycle />);
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('renders the hard reset section', async () => {
    const DataLifecycle = (await import('../DataLifecycle')).default;
    render(<DataLifecycle />);
    expect(screen.getByText('Hard Reset Operational Data')).toBeInTheDocument();
  });

  it('renders the wipe trial data button', async () => {
    const DataLifecycle = (await import('../DataLifecycle')).default;
    render(<DataLifecycle />);
    expect(screen.getByText('Wipe Trial Data')).toBeInTheDocument();
  });

  it('renders the storage usage section', async () => {
    const DataLifecycle = (await import('../DataLifecycle')).default;
    render(<DataLifecycle />);
    expect(screen.getByText('Storage Usage')).toBeInTheDocument();
  });

  it('renders the factory reset branch section', async () => {
    const DataLifecycle = (await import('../DataLifecycle')).default;
    render(<DataLifecycle />);
    expect(screen.getByText('Factory Reset Branch')).toBeInTheDocument();
  });
});
