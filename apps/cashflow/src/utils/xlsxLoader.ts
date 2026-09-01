/**
 * Lazy loader for the `xlsx` library (~400KB minified).
 *
 * Why: statically importing `xlsx` at the top of a page pulls the entire
 * library into that page's chunk, even when the user never exports/imports.
 * Dynamic-importing it only inside export/import handlers keeps the initial
 * page chunk small and makes navigation between pages much faster.
 *
 * Stale-chunk recovery: after a Vercel deploy, old chunk hashes are deleted
 * from the server. A user whose browser cached the old `index.js` still
 * references the old hash → "Failed to fetch dynamically imported module".
 * On that specific error we reload the page (same pattern as `lazyWithRetry`
 * in `packages/shared-utils/src/lazy.ts`) so the next import fetches fresh
 * chunk hashes.
 *
 * Usage (inside an async handler):
 *   const XLSX = await getXLSX();
 *   const ws = XLSX.utils.aoa_to_sheet(rows);
 *
 * The module is cached after the first successful load, so subsequent calls
 * are free. Callers MUST wrap `await getXLSX()` in try/catch + toast.error
 * so the user sees a message if the chunk fails to load.
 */
export type XLSXModule = typeof import("xlsx");

const STALE_CHUNK_PATTERNS = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "error loading dynamically imported module",
];

// Guard so we only reload once per page load (avoid infinite reload loop).
let reloadedForStaleChunk = false;

let cached: Promise<XLSXModule> | null = null;

export function getXLSX(): Promise<XLSXModule> {
  if (!cached) {
    cached = import("xlsx").catch((error) => {
      const message =
        error instanceof Error ? error.message : String(error ?? "");
      const isStaleChunk = STALE_CHUNK_PATTERNS.some((p) =>
        message.toLowerCase().includes(p.toLowerCase()),
      );

      if (isStaleChunk && !reloadedForStaleChunk) {
        reloadedForStaleChunk = true;
        // Reload fetches fresh HTML → fresh index.js → fresh chunk hashes.
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }

      // Clear cache so a subsequent call (e.g. after manual reload) retries.
      cached = null;
      throw error;
    });
  }
  return cached;
}
