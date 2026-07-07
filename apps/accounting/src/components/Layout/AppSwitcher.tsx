/**
 * AppSwitcher – thin wrapper around the shared @repo/ui component.
 *
 * This file exists only to wire up the app's auth context.
 * All URL resolution logic lives in packages/ui/src/AppSwitcher.tsx.
 */
import React from 'react';
import { AppSwitcher as SharedAppSwitcher } from '@repo/ui';
import { useAuthContext } from '@superapp/iam';

const AppSwitcher: React.FC = () => {
  const { user } = useAuthContext();
  const role = (user as any)?.role || user?.app_metadata?.role || null;

  return (
    <SharedAppSwitcher
      userRole={role}
      env={import.meta.env as Record<string, string | undefined>}
    />
  );
};

export default AppSwitcher;
