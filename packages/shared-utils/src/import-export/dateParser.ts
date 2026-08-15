/**
 * Robust date parser for Vietnamese locale (DD/MM/YYYY) and common formats.
 */
export function parseDate(input: string | Date | number | undefined | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(input).trim();
  if (!str) return null;

  // ISO-like YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const m = str.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (m && m[1] && m[2] && m[3]) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const year = parseInt(m[3], 10);
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
  }

  // Fallback to native parser (covers MM/DD/YYYY when unambiguous)
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function parseDateOrNow(input: string | Date | number | undefined | null): Date {
  return parseDate(input) || new Date();
}
