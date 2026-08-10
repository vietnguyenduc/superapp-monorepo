import React, { useState, useEffect } from 'react';
import { APP_DEFINITIONS, resolveAppUrl, type AppDefinition } from '@superapp/shared-utils';

interface AppSwitcherProps {
  /** Roles that can see the Admin Portal tile */
  adminRoles?: string[];
  /** Current user's role (from auth context) */
  userRole?: string | null;
  /** Vite env object – pass `import.meta.env` from the host app */
  env?: Record<string, string | undefined>;
}

/**
 * Shared AppSwitcher component.
 *
 * - In **production** (*.appforyou.xyz): links resolve to https://{key}.appforyou.xyz
 * - In **dev** (localhost): links resolve to http://localhost:{devPort}
 *
 * Individual apps can still override URLs via their VITE_* env vars.
 */
const AppSwitcher: React.FC<AppSwitcherProps> = ({
  adminRoles = ['admin_master', 'admin_company'],
  userRole = null,
  env = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, boolean | undefined>>({});

  const isAdmin = userRole ? adminRoles.includes(userRole) : false;

  const visibleApps: (AppDefinition & { url: string })[] = APP_DEFINITIONS
    .filter(app => !app.hidden && (app.id !== 'admin' || isAdmin))
    .map(app => ({ ...app, url: resolveAppUrl(app, env) }));

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();

    visibleApps.forEach(app => {
      fetch(app.url, { mode: 'no-cors', signal: controller.signal })
        .then(() => setStatuses(prev => ({ ...prev, [app.id]: true })))
        .catch(() => setStatuses(prev => ({ ...prev, [app.id]: false })));
    });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        title="App Launcher"
        aria-label="Open app launcher"
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">App Ecosystem</h3>
            </div>

            <div className="p-2 grid grid-cols-1 gap-1">
              {visibleApps.map(app => (
                <a
                  key={app.id}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg ${app.color} flex items-center justify-center font-bold text-lg`}>
                    {app.name[0]}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {app.name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {statuses[app.id] === undefined ? (
                        <span className="text-xs text-gray-400">Checking status...</span>
                      ) : statuses[app.id] ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400">Operational</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-xs text-red-600 dark:text-red-400">Offline</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px] ml-2 font-mono">
                    {new URL(app.url).hostname}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AppSwitcher;
