const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/^'+/, "")
    .toLocaleLowerCase("vi-VN");

export const normalizeCustomerCode = (value: unknown): string => normalizeText(value);

const numericIdentity = (value: unknown): string | null => {
  const normalized = normalizeCustomerCode(value);
  if (!/^\d+$/.test(normalized)) return null;
  return normalized.replace(/^0+(?=\d)/, "");
};

/**
 * Resolve an imported customer code against tenant-scoped codes.
 * Exact matches always win. Excel-stripped leading zeroes are accepted only
 * when they identify one unique stored code, preventing ambiguous matches.
 */
export const matchCustomerCode = (
  input: unknown,
  candidates: Iterable<unknown>,
): string | null => {
  const normalizedInput = normalizeCustomerCode(input);
  if (!normalizedInput) return null;

  const codes = Array.from(candidates)
    .map((candidate) => String(candidate ?? "").trim())
    .filter(Boolean);
  const exact = codes.find(
    (candidate) => normalizeCustomerCode(candidate) === normalizedInput,
  );
  if (exact) return exact;

  const inputNumeric = numericIdentity(normalizedInput);
  if (inputNumeric === null) return null;
  const numericMatches = codes.filter(
    (candidate) => numericIdentity(candidate) === inputNumeric,
  );
  return numericMatches.length === 1 ? numericMatches[0] : null;
};
