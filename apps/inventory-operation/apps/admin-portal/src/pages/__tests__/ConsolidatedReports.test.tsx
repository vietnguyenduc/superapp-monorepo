import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  BarChart3: () => null,
  TrendingUp: () => null,
  DollarSign: () => null,
  Package: () => null,
  AlertCircle: () => null,
  Download: () => null,
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

describe('ConsolidatedReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const ConsolidatedReports = (await import('../ConsolidatedReports')).default;
    render(<ConsolidatedReports />);
    expect(screen.getByText('Consolidated Reports')).toBeInTheDocument();
  });

  it('renders the description text', async () => {
    const ConsolidatedReports = (await import('../ConsolidatedReports')).default;
    render(<ConsolidatedReports />);
    expect(screen.getByText(/Unified view across/)).toBeInTheDocument();
  });

  it('renders the export button', async () => {
    const ConsolidatedReports = (await import('../ConsolidatedReports')).default;
    render(<ConsolidatedReports />);
    expect(screen.getByText('Export All Data (.xlsx)')).toBeInTheDocument();
  });

  it('renders all metric cards', async () => {
    const ConsolidatedReports = (await import('../ConsolidatedReports')).default;
    render(<ConsolidatedReports />);
    expect(screen.getByText('Total Revenue (All Branches)')).toBeInTheDocument();
    expect(screen.getByText('Total Receivables')).toBeInTheDocument();
    expect(screen.getByText('Inventory Value')).toBeInTheDocument();
    expect(screen.getByText('Total Payables')).toBeInTheDocument();
  });

  it('renders chart sections', async () => {
    const ConsolidatedReports = (await import('../ConsolidatedReports')).default;
    render(<ConsolidatedReports />);
    expect(screen.getByText('Revenue vs Target')).toBeInTheDocument();
    expect(screen.getByText('Top Branches Performance')).toBeInTheDocument();
  });
});
