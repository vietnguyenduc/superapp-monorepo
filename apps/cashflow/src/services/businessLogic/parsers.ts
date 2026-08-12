// Shared parsing/normalization helpers for Cashflow business data.
// Pure functions - no data source dependencies.

/**
 * Normalize a transaction type string to one of the canonical types.
 * Handles common Vietnamese UI labels used in imports.
 */
export function normalizeTransactionType(type: string): string {
  const normalized = type.toLowerCase().trim();
  if (
    [
      "deposit",
      "đặt cọc",
      "dat coc",
      "cọc",
      "coc",
      "đặt cọc trước",
      "dat coc truoc",
      "tạm ứng",
      "tam ung",
      "prepayment",
    ].includes(normalized)
  ) {
    return "deposit";
  }
  if (
    [
      "payment",
      "thu",
      "thanh toán",
      "thanh toan",
      "tiền vào",
      "tien vao",
      "điều chỉnh giảm",
      "dieu chinh giam",
      "phát sinh giảm",
      "phat sinh giam",
    ].includes(normalized)
  ) {
    return "payment";
  }
  if (
    [
      "charge",
      "chi",
      "cho nợ",
      "cho no",
      "tiền ra",
      "tien ra",
      "điều chỉnh tăng",
      "dieu chinh tang",
      "phát sinh tăng",
      "phat sinh tang",
    ].includes(normalized)
  ) {
    return "charge";
  }
  if (["refund", "hoàn tiền", "hoan tien"].includes(normalized)) {
    return "refund";
  }
  if (["adjustment", "điều chỉnh", "dieu chinh"].includes(normalized)) {
    return "adjustment";
  }
  return type;
}

/**
 * Parse an amount from a string/number, handling Vietnamese number formats.
 * Returns `null` for unparseable input so callers can surface validation errors.
 * e.g. 1.000.000 / 1,000,000 / 1 000 000 / (1000) / -1000 / ₫1.000.000
 */
export function parseAmountOrNull(value: unknown): number | null {
  if (value == null) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  let raw = String(value).trim();
  if (!raw) return 0;

  const isNegative = raw.startsWith("-") || raw.startsWith("(");
  // Strip sign markers and parentheses, keep digits/decimals/separators
  raw = raw.replace(/[()]/g, "").replace(/^-/, "");
  // Remove currency symbols and whitespace
  let str = raw.replace(/[$€£¥₫\s]/g, "");
  if (!str) return 0;

  // Detect decimal/thousand separator convention
  // 1,234.56 -> comma is thousand, dot is decimal
  // 1.234,56 -> dot is thousand, comma is decimal
  // 1.234 -> dot is thousand (no decimal comma)
  // 1,234 -> comma is thousand (no decimal dot)
  // A trailing separator with 1 or 2 digits is a decimal marker.
  const lastDot = str.lastIndexOf(".");
  const lastComma = str.lastIndexOf(",");
  const decimalIndex = Math.max(lastDot, lastComma);
  let decimalChar = "";
  if (decimalIndex !== -1) {
    const fraction = str.slice(decimalIndex + 1);
    if (/^\d{1,2}$/.test(fraction)) {
      decimalChar = str[decimalIndex];
    }
  }

  if (decimalChar === ".") {
    str = str.replace(/,/g, "").replace(/\./, ".");
  } else if (decimalChar === ",") {
    str = str.replace(/\./g, "").replace(/,/, ".");
  } else {
    // No fractional part: treat both dot and comma as thousand separators
    str = str.replace(/[.,]/g, "");
  }

  const num = Number(str);
  if (!Number.isFinite(num)) return null;
  return isNegative ? -num : num;
}

/**
 * Convenience wrapper that returns 0 for unparseable input.
 */
export function parseAmount(value: unknown): number {
  return parseAmountOrNull(value) ?? 0;
}
