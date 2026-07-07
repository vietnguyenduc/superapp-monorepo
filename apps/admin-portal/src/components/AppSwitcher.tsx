/**
 * AppSwitcher – thin wrapper around the shared @repo/ui component.
 *
 * Admin Portal uses the shared AppSwitcher but does NOT show the Admin tile
 * (since the user is already in Admin Portal).
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
