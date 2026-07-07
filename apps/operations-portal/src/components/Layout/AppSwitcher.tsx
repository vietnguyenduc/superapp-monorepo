/**
 * AppSwitcher – thin wrapper around the shared @repo/ui component.
 *
 * This file exists only to wire up the app's auth context.
 * All URL resolution logic lives in packages/ui/src/AppSwitcher.tsx.
 */
import React from 'react';
import { AppSwitcher as SharedAppSwitcher } from '@repo/ui';

// operations-portal reads session from localStorage similar to hr-operation
const AppSwitcher: React.FC = () => {
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
