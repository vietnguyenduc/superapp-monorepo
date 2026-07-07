/**
 * AppSwitcher – thin wrapper around the shared @superapp/ui component.
 *
 * This file exists only to wire up the app's auth context.
 * All URL resolution logic lives in packages/ui/src/AppSwitcher.tsx.
 */
import React from 'react';
import { AppSwitcher as SharedAppSwitcher } from '@superapp/ui';

/**
 * hr-operation does not use useAuthContext at the switcher level.
 * The shared component handles admin-role gating internally.
 * If you want to pass the role, import from your auth hook here.
 */
const AppSwitcher: React.FC = () => {
  // Try to read user role from localStorage session (hr-operation pattern)
  let role: string | null = null;
  try {
    const key = Object.keys(localStorage).find(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (key) {
      const session = JSON.parse(localStorage.getItem(key) || '{}');
      const user = session?.user;
      role = user?.role || user?.app_metadata?.role || null;
    }
  } catch {
    role = null;
  }

  return (
    <SharedAppSwitcher
      userRole={role}
      env={import.meta.env as Record<string, string | undefined>}
    />
  );
};

export default AppSwitcher;
