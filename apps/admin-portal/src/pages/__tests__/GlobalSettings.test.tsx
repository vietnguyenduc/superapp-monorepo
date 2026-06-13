import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Building2: () => null,
  Settings: () => null,
  Image: () => null,
  Save: () => null,
  ImageIcon: () => null,
}));

describe('GlobalSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const GlobalSettings = (await import('../GlobalSettings')).default;
    render(<GlobalSettings />);
    expect(screen.getByText('Global Settings')).toBeInTheDocument();
  });

  it('renders the save changes button', async () => {
    const GlobalSettings = (await import('../GlobalSettings')).default;
    render(<GlobalSettings />);
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('renders company identity section', async () => {
    const GlobalSettings = (await import('../GlobalSettings')).default;
    render(<GlobalSettings />);
    expect(screen.getByText('Company Identity')).toBeInTheDocument();
  });

  it('renders branding section', async () => {
    const GlobalSettings = (await import('../GlobalSettings')).default;
    render(<GlobalSettings />);
    expect(screen.getByText('Logo & Branding')).toBeInTheDocument();
  });
});
