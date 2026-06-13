import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockImplementation((fnName: string) => {
      if (fnName === 'admin_get_companies') {
        return Promise.resolve({
          data: [
            { id: 'c1', name: 'Acme Corp', code: 'ACME' },
            { id: 'c2', name: 'Beta Inc', code: 'BETA' },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  },
}));

// Mock @superapp/iam
vi.mock('@superapp/iam', () => ({
  useAuthContext: () => ({
    session: { access_token: 'test-token', user: { id: 'u1' } },
    user: { id: 'u1', email: 'admin@test.com', role: 'admin_master' },
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AdminContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides companies from supabase RPC', async () => {
    const { AdminProvider, useAdminContext } = await import('../AdminContext');

    const TestComponent = () => {
      const { companies, loading } = useAdminContext();
      if (loading) return <div>Loading...</div>;
      return (
        <div>
          {companies.map((c: { id: string; name: string }) => (
            <div key={c.id} data-testid="company">{c.name}</div>
          ))}
        </div>
      );
    };

    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    });
  });

  it('throws error when used outside AdminProvider', async () => {
    const { useAdminContext } = await import('../AdminContext');

    const TestComponent = () => {
      try {
        useAdminContext();
      } catch (e: any) {
        return <div>{e.message}</div>;
      }
      return null;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('useAdminContext must be used within an AdminProvider')).toBeInTheDocument();
    });
  });
});
