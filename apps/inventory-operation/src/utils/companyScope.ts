const UUID_LIKE_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/**
 * Company IDs in production include seeded UUID-shaped values that do not
 * encode RFC version/variant bits, so validate their shape without rejecting
 * those legitimate tenant IDs.
 */
export const isCompanyIdLike = (value: string): boolean => UUID_LIKE_PATTERN.test(value);

export const readSelectedCompanyId = (storage: Pick<Storage, 'getItem'> | null): string | null => {
  if (!storage) return null;
  const value = storage.getItem('selectedCompanyId');
  return value && isCompanyIdLike(value) ? value : null;
};
