/**
 * error-tracking — Thin wrapper around @sentry/browser.
 *
 * Design goal: safe to import and call in ALL 7 apps even before a Sentry
 * project/DSN exists. If VITE_SENTRY_DSN is not set, every function here is
 * a no-op (falls back to console logging), so there is zero risk of
 * breaking an app that hasn't been given a DSN yet.
 *
 * Usage:
 *   // main.tsx
 *   import { initErrorTracking } from "@superapp/shared-utils";
 *   initErrorTracking({ appName: "cashflow" });
 *
 *   // ErrorBoundary.tsx componentDidCatch
 *   import { captureException } from "@superapp/shared-utils";
 *   captureException(error, { extra: { componentStack: errorInfo.componentStack } });
 */

import * as Sentry from '@sentry/browser';

let _initialized = false;

export interface InitErrorTrackingOptions {
  /** Name of the app (e.g. "cashflow", "accounting") — tagged on every event. */
  appName: string;
  /** Override DSN explicitly instead of reading import.meta.env.VITE_SENTRY_DSN. */
  dsn?: string;
  /** Environment name, defaults to import.meta.env.MODE (development/production). */
  environment?: string;
  /** Fraction of transactions to sample for performance tracing (0..1). Defaults to 0.1 in production, 0 in dev. */
  tracesSampleRate?: number;
}

export function initErrorTracking(opts: InitErrorTrackingOptions): void {
  const dsn = opts.dsn ?? (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SENTRY_DSN : undefined);

  if (!dsn) {
    // No DSN configured yet — this is expected until a Sentry project is created.
    // Errors still get logged to the console via captureException()'s fallback.
    console.info(`[error-tracking] No VITE_SENTRY_DSN set for "${opts.appName}" — Sentry disabled, using console fallback.`);
    return;
  }

  const environment = opts.environment ?? (typeof import.meta !== 'undefined' ? (import.meta as any).env?.MODE : 'production');

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: opts.tracesSampleRate ?? (environment === 'production' ? 0.1 : 0),
    initialScope: {
      tags: { app: opts.appName },
    },
    // Don't send events from local dev by default unless explicitly testing Sentry.
    enabled: environment !== 'development' || opts.dsn !== undefined,
    beforeSend(event) {
      // Ignore expected auth noise (stale refresh tokens, wrong passwords).
      const message =
        (event.exception?.values?.[0]?.value ?? "") ||
        (event.message ?? "");
      const ignored = [
        "Invalid Refresh Token",
        "Refresh Token Not Found",
        "Invalid login credentials",
      ];
      if (ignored.some((m) => message.includes(m))) {
        return null;
      }
      return event;
    },
  });

  _initialized = true;
  console.info(`[error-tracking] Sentry initialized for "${opts.appName}" (env: ${environment}).`);
}

export function isErrorTrackingEnabled(): boolean {
  return _initialized;
}

/**
 * Reports an exception. Always logs to console as well (so nothing is lost
 * when Sentry isn't configured), and forwards to Sentry when initialized.
 */
export function captureException(error: unknown, context?: Record<string, any>): void {
  console.error('[error-tracking] Exception captured:', error, context);
  if (_initialized) {
    Sentry.captureException(error, context);
  }
}

/** Attach extra user/app context to all subsequent events (e.g. after login). */
export function setErrorTrackingUser(user: { id: string; email?: string; role?: string } | null): void {
  if (!_initialized) return;
  Sentry.setUser(user);
}

/** Add a breadcrumb (e.g. "user clicked export") for debugging context on next error. */
export function addErrorBreadcrumb(message: string, data?: Record<string, any>): void {
  if (!_initialized) return;
  Sentry.addBreadcrumb({ message, data, level: 'info' });
}
