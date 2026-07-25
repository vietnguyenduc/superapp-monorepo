/**
 * `lazyWithRetry` — React.lazy with automatic recovery from stale Vite chunks.
 *
 * Problem: after a deploy, old chunk hashes (e.g. `CustomerImport-DKWywbCN.js`)
 * are deleted from the server. A user whose browser cached the old `index.js`
 * still references the old hash → `Failed to fetch dynamically imported module`
 * → blank page / Sentry error.
 *
 * Fix: on that specific error, reload the page. The reload fetches fresh HTML
 * with the new chunk hashes, so the next import succeeds.
 *
 * Usage (drop-in replacement for `React.lazy`):
 *   const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
 */

import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const STALE_CHUNK_PATTERNS = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "error loading dynamically imported module",
];

// Guard so we only reload once per page load (avoid infinite reload loop).
let reloadedForStaleChunk = false;

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? "");
      const isStaleChunk = STALE_CHUNK_PATTERNS.some((p) =>
        message.toLowerCase().includes(p.toLowerCase())
      );

      if (isStaleChunk && !reloadedForStaleChunk) {
        reloadedForStaleChunk = true;
        // Reload fetches fresh HTML → fresh index.js → fresh chunk hashes.
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }

      throw error;
    }
  });
}
