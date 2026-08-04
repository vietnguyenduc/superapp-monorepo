import { apiClient } from "./supabase";

/**
 * Remove columns that the live Supabase schema does not recognise yet and
 * append their original values to a `notes` field so no data is silently lost.
 */
export function sanitizePayload(
  payload: Record<string, unknown>,
  colsToRemove: string[],
): Record<string, unknown> {
  const copy = { ...payload };
  const removedParts: string[] = [];
  for (const col of colsToRemove) {
    if (col in copy) {
      const val = copy[col];
      if (val !== undefined && val !== null && val !== "") {
        removedParts.push(`${col}: ${val}`);
      }
      delete copy[col];
    }
  }
  if (removedParts.length > 0) {
    const existing = copy.notes ? String(copy.notes) : "";
    copy.notes = existing
      ? `${existing}\n${removedParts.join("; ")}`
      : removedParts.join("; ");
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
 * the schema is missing a field. This makes partial edits resilient against
 * stale production schemas without dropping data (it is appended to `notes`).
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
