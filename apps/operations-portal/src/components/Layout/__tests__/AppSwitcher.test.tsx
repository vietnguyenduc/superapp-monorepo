import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('AppSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
    });
    // Mock fetch for status checks
    global.fetch = vi.fn(() => Promise.reject(new Error('fetch failed')));
  });

  it('renders the app launcher button', async () => {
    const AppSwitcher = (await import('../AppSwitcher')).default;
    render(<AppSwitcher />);
    const button = screen.getByTitle('App Launcher');
    expect(button).toBeInTheDocument();
  });

  it('opens the dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    const AppSwitcher = (await import('../AppSwitcher')).default;
    render(<AppSwitcher />);
    
    const button = screen.getByTitle('App Launcher');
    await user.click(button);
    
    expect(screen.getByText('Hệ sinh thái Superapp')).toBeInTheDocument();
  });

  it('displays all app names in the dropdown', async () => {
    const user = userEvent.setup();
    const AppSwitcher = (await import('../AppSwitcher')).default;
    render(<AppSwitcher />);
    
    const button = screen.getByTitle('App Launcher');
    await user.click(button);
    
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByText('Sales & POS')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Cashflow')).toBeInTheDocument();
    expect(screen.getByText('HR & Payroll')).toBeInTheDocument();
    expect(screen.getByText('Accounting')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });
});
