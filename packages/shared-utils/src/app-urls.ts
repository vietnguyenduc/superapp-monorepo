/**
 * App URL resolver – environment-aware routing for the App Switcher.
 *
 * Rules:
 *  - Production / Staging  (hostname ends with .appforyou.xyz or is appforyou.xyz)
 *      → https://<appKey>.appforyou.xyz
 *  - Local dev (localhost / 127.0.0.1 / *.localhost)
 *      → http://localhost:<devPort>
 *
 * Every app also respects its explicit VITE_* env-var override so that
 * individual deployments can point to custom domains when needed.
 */

export interface AppDefinition {
  id: string;
  name: string;
  /** Subdomain key on the production domain, e.g. "cashflow" → cashflow.appforyou.xyz */
  key: string;
  /** Dev-mode localhost port */
  devPort: number;
  /** Optional VITE_ env-var override (takes precedence over auto-detection) */
  envVar?: string;
  color: string;
}

/** Canonical list of all superapp applications. */
export const APP_DEFINITIONS: AppDefinition[] = [
  {
    id: 'admin',
    name: 'Admin Portal',
    key: 'admin',
    devPort: 5173,
    envVar: 'VITE_ADMIN_PORTAL_URL',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 'sales',
    name: 'Sales & POS',
    key: 'sales-operation',
    devPort: 5176,
    envVar: 'VITE_SALES_APP_URL',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'inventory',
    name: 'Inventory',
    key: 'inventory-operation',
    devPort: 5175,
    envVar: 'VITE_INVENTORY_APP_URL',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 'cashflow',
    name: 'Cashflow',
    key: 'cashflow',
    devPort: 5174,
    envVar: 'VITE_CASHFLOW_APP_URL',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'hr',
    name: 'HR & Payroll',
    key: 'hr-operation',
    devPort: 5177,
    envVar: 'VITE_HR_APP_URL',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    id: 'accounting',
    name: 'Accounting',
    key: 'accounting',
    devPort: 5178,
    envVar: 'VITE_ACCOUNTING_APP_URL',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'operations',
    name: 'Operations',
    key: 'operations-portal',
    devPort: 3006,
    envVar: 'VITE_OPERATIONS_APP_URL',
    color: 'bg-cyan-100 text-cyan-600',
  },
];

/** Root production domain (without leading dot). */
const PROD_DOMAIN = 'appforyou.xyz';

/**
 * Returns true when the current page is running on the production/staging domain.
 * Safe to call during SSR (falls back to false when `window` is unavailable).
 */
export function isProductionEnv(): boolean {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname === PROD_DOMAIN || hostname.endsWith(`.${PROD_DOMAIN}`);
}

/**
 * Resolves the base URL for a given app based on the current environment.
 *
 * Priority:
 *  1. Explicit VITE_ env-var override (already baked in at build time via import.meta.env)
 *  2. Production auto-detection  → https://<key>.appforyou.xyz
 *  3. Dev fallback               → http://localhost:<devPort>
 *
 * @param app  - The AppDefinition to resolve.
 * @param env  - Pass `import.meta.env` from the calling Vite app.
 */
export function resolveAppUrl(app: AppDefinition, env: Record<string, string | undefined> = {}): string {
  // 1. Explicit env-var override
  if (app.envVar && env[app.envVar]) {
    return env[app.envVar] as string;
  }

  // 2. Production: use subdomain routing
  if (isProductionEnv()) {
    return `https://${app.key}.${PROD_DOMAIN}`;
  }

  // 3. Dev: localhost port
  return `http://localhost:${app.devPort}`;
}
