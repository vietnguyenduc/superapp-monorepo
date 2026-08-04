import { apiClient } from "./supabase";

/**
 * Remove columns that the live Supabase schema does not recognise yet.
 * Unknown fields are dropped rather than stuffed into a `notes` column, because
 * most Cashflow tables do not have a `notes` text column and attempting to
 * write to it causes an infinite retry loop.
 */
export function sanitizePayload(
  payload: Record<string, unknown>,
  colsToRemove: string[],
): Record<string, unknown> {
  const copy = { ...payload };
  for (const col of colsToRemove) {
    delete copy[col];
  }
  return copy;
}

/**
 * Parse a Supabase "column does not exist" error and return the column name.
 * `table` is used to make the regex specific to the target table.
 */
export function parseMissingColumn(
  error: unknown,
  table: string,
): string | null {
  const err = error as {
    message?: string;
    details?: string;
    hint?: string;
  };
  const message =
    err?.message || err?.details || err?.hint || String(error || "");
  const patterns = [
    new RegExp(
      `could not find the '([^']+)' column of '${table}' in the schema cache`,
      "i",
    ),
    new RegExp(
      `column "([^"]+)" of relation "${table}" does not exist`,
      "i",
    ),
    /Could not find a column with the name '([^']+)'/i,
    /column "([^"]+)" does not exist/i,
  ];
  for (const re of patterns) {
    const m = message.match(re);
    if (m) return m[1];
  }
  return null;
}

/**
 * Update a row, retrying with the unknown column removed if Supabase complains
 * the schema is missing a field. Unknown columns are dropped; they should not be
 * silently appended to `notes` because many Cashflow tables lack that column.
 */
export async function updateWithFallback(
  table: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<{ data: unknown; error: unknown }> {
  const removed: string[] = [];
  const attempt = async (): Promise<{ data: unknown; error: unknown }> =>
    (await apiClient
      .from(table)
      .update(sanitizePayload(payload, removed))
      .eq("id", id)
      .select()
      .single()) as { data: unknown; error: unknown };

  for (let i = 0; i < 10; i++) {
    const res = await attempt();
    if (!res.error) return res;
    const missing = parseMissingColumn(res.error, table);
    if (!missing || removed.includes(missing)) return res;
    removed.push(missing);
  }
  return attempt();
}

/**
 * Insert a single row with the same missing-column fallback as `updateWithFallback`.
 * Unknown columns are dropped so the insert succeeds against the live schema.
 */
export async function insertWithFallback(
  table: string,
  payload: Record<string, unknown>,
): Promise<{ data: unknown; error: unknown }> {
  const removed: string[] = [];
  const attempt = async (): Promise<{ data: unknown; error: unknown }> =>
    (await apiClient
      .from(table)
      .insert(sanitizePayload(payload, removed))
      .select()
      .single()) as { data: unknown; error: unknown };

  for (let i = 0; i < 10; i++) {
    const res = await attempt();
    if (!res.error) return res;
    const missing = parseMissingColumn(res.error, table);
    if (!missing || removed.includes(missing)) return res;
    removed.push(missing);
  }
  return attempt();
}

/**
 * Bulk insert rows with missing-column fallback.
 * Unknown columns are dropped so the insert succeeds against the live schema.
 */
export async function bulkInsertWithFallback(
  table: string,
  payloads: Record<string, unknown>[],
): Promise<{ data: unknown; error: unknown }> {
  const removed: string[] = [];
  const attempt = async (): Promise<{ data: unknown; error: unknown }> =>
    (await apiClient
      .from(table)
      .insert(payloads.map((p) => sanitizePayload(p, removed)))
      .select()) as { data: unknown; error: unknown };

  for (let i = 0; i < 10; i++) {
    const res = await attempt();
    if (!res.error) return res;
    const missing = parseMissingColumn(res.error, table);
    if (!missing || removed.includes(missing)) return res;
    removed.push(missing);
  }
  return attempt();
}
