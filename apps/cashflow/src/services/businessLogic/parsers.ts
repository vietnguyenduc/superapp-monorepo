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
 * e.g. 1.000.000 / 1,000,000 / 1 000 000 / (1000) / -1000 / ₫1.000.000
 */
export function parseAmount(value: unknown): number {
  if (value == null) return 0;
  let raw = String(value).trim();
  if (!raw) return 0;

  const isNegative = raw.startsWith("-") || raw.startsWith("(");
  // Strip sign markers and parentheses, keep digits/decimals/separators
  raw = raw.replace(/[()]/g, "").replace(/^-/, "");
  // Remove currency symbols and whitespace
  let str = raw.replace(/[$€£¥₫\s]/g, "");

  // Detect decimal/thousand separator convention
  // 1,234.56 -> comma is thousand, dot is decimal
  // 1.234,56 -> dot is thousand, comma is decimal
  // 1.234 -> dot is thousand (no decimal comma)
  // 1,234 -> comma is thousand (no decimal dot)
  const commaDecimal = /\d,\d{2}$/.test(str);
  const dotDecimal = /\.\d{2}$/.test(str);

  if (commaDecimal) {
    str = str.replace(/\./g, "").replace(/,/g, ".");
  } else if (dotDecimal) {
    str = str.replace(/,/g, "");
  } else {
    // No fractional part: treat both dot and comma as thousand separators
    str = str.replace(/[.,]/g, "");
  }

  const num = Number(str);
  if (!Number.isFinite(num)) return 0;
  return isNegative ? -num : num;
}
