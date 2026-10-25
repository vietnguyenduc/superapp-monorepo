import { describe, expect, it } from 'vitest';
import {
  markMicrosoftConnectionUsed,
  readMicrosoftConnection,
  removeMicrosoftConnection,
  saveMicrosoftConnection,
  type MicrosoftConnectionRecord,
} from './microsoftConnectionStore';

const memoryStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => { data.delete(key); },
    setItem: (key, value) => { data.set(key, value); },
  };
};

const connection: MicrosoftConnectionRecord = {
  schemaVersion: 1,
  companyId: 'company-a',
  userId: 'user-a',
  homeAccountId: 'microsoft-account-a',
  tenantId: 'tenant-a',
  username: 'user@example.com',
  displayName: 'User A',
  scopes: ['Files.Read'],
  connectedAt: '2026-10-25T00:00:00.000Z',
  lastUsedAt: null,
};

describe('microsoftConnectionStore', () => {
  it('keeps connection metadata isolated by company and app user', () => {
    const storage = memoryStorage();
    saveMicrosoftConnection(storage, connection);

    expect(readMicrosoftConnection(storage, 'company-a', 'user-a')).toEqual(connection);
    expect(readMicrosoftConnection(storage, 'company-b', 'user-a')).toBeNull();
    expect(readMicrosoftConnection(storage, 'company-a', 'user-b')).toBeNull();
  });

  it('updates last-use time without changing the connection owner', () => {
    const storage = memoryStorage();
    saveMicrosoftConnection(storage, connection);

    const updated = markMicrosoftConnectionUsed(
      storage,
      'company-a',
      'user-a',
      '2026-10-25T01:00:00.000Z',
    );

    expect(updated?.lastUsedAt).toBe('2026-10-25T01:00:00.000Z');
    expect(updated?.companyId).toBe('company-a');
    expect(updated?.userId).toBe('user-a');
  });

  it('clears corrupt state and supports explicit disconnect', () => {
    const storage = memoryStorage();
    storage.setItem(
      'hr:microsoft-connection:v1:company-a:user-a',
      JSON.stringify({ ...connection, userId: 'another-user' }),
    );
    expect(readMicrosoftConnection(storage, 'company-a', 'user-a')).toBeNull();

    saveMicrosoftConnection(storage, connection);
    removeMicrosoftConnection(storage, 'company-a', 'user-a');
    expect(readMicrosoftConnection(storage, 'company-a', 'user-a')).toBeNull();
  });
});
