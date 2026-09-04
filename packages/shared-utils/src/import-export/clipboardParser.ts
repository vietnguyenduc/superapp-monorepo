/**
 * Clipboard parsing utilities for paste handlers in editable tables/grids.
 *
 * The key problem this solves: when a user pastes a value like `1,000,002`
 * (a number with comma thousand separators) into a single cell, naive
 * `row.split(/\t|,/)` logic splits it into 3 values (`1`, `000`, `002`)
 * that spread across adjacent columns. `parseClipboardRow` detects when
 * every comma segment is number-like (digits/dots only) and keeps the
 * value intact.
 */

/**
 * Parse a clipboard row into cell values, handling tab-separated (Excel),
 * comma-separated (CSV), and numbers with comma thousand separators.
 *
 * Behavior:
 *  - Tab-separated rows (Excel format) → split by tab.
 *  - No tabs but has commas, and every comma segment is number-like
 *    (digits/dots only) → keep the whole row as a single value
 *    (e.g. `1,000,002` or `1,000,002.50`).
 *  - No tabs but has commas, with at least one non-numeric segment →
 *    split by comma (genuine CSV).
 *  - No separators → single value.
 *
 * @example
 * parseClipboardRow("1,000,002")        // => ["1,000,002"]
 * parseClipboardRow("1.000.002,50")     // => ["1.000.002,50"]
 * parseClipboardRow("KH001\tBank1")     // => ["KH001", "Bank1"]
 * parseClipboardRow("KH001,Bank1,pay")  // => ["KH001", "Bank1", "pay"]
 * parseClipboardRow("Hello World")      // => ["Hello World"]
 */
export function parseClipboardRow(row: string): string[] {
  // Excel format: tab-separated
  if (row.includes("\t")) {
    return row.split("\t");
  }
  // No tabs but has commas: detect numbers with comma thousand separators
  if (row.includes(",")) {
    const segments = row.split(",");
    if (
      segments.length > 1 &&
      segments.every((seg) => /^[\d.\s]+$/.test(seg.trim()))
    ) {
      return [row];
    }
    return row.split(",");
  }
  return [row];
}

/**
 * Parse clipboard text (potentially multi-line) into a 2D array of cell
 * values. Each line is parsed via `parseClipboardRow`. Empty lines are
 * dropped.
 *
 * @example
 * parseClipboardRows("KH001\t1000002\nKH002\t1,000,003")
 * // => [["KH001", "1000002"], ["KH002", "1,000,003"]]
 */
export function parseClipboardRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseClipboardRow);
}
