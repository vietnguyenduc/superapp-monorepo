import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../AuthProvider';
import type { ReactNode } from 'react';

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders children without crashing', () => {
    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('provides auth context with default values', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    
    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isTrial).toBe(false);
  });

  it('getAccessToken returns null when no session', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    expect(result.current.getAccessToken()).toBeNull();
  });

  it('isTokenExpired returns true when no session', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    expect(result.current.isTokenExpired()).toBe(true);
  });

  it('refreshToken returns success without error', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    const response = await result.current.refreshToken();
    expect(response.error).toBeNull();
  });
});
