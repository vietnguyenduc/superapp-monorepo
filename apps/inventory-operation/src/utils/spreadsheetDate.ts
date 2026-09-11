const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Convert Excel serial dates and common text dates to an HTML date value. */
export function normalizeSpreadsheetDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value ?? '').trim();
  const serial = Number(text);
  if (text && Number.isFinite(serial) && serial >= 1 && serial < 100000) {
    return new Date(EXCEL_EPOCH_UTC + Math.floor(serial) * DAY_MS)
      .toISOString()
      .slice(0, 10);
  }

  const vietnameseDate = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (vietnameseDate) {
    const [, day, month, year] = vietnameseDate;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return text;
}
