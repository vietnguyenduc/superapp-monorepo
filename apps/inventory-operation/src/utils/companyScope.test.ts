import { describe, expect, it } from 'vitest';
import { isCompanyIdLike, readSelectedCompanyId } from './companyScope';

describe('company scope', () => {
  it('accepts the seeded TPL company id even without RFC variant bits', () => {
    expect(isCompanyIdLike('22222222-2222-2222-2222-222222222222')).toBe(true);
  });

  it('rejects malformed selected company ids', () => {
    const storage = { getItem: () => 'not-a-company-id' };
    expect(readSelectedCompanyId(storage)).toBeNull();
  });
});
