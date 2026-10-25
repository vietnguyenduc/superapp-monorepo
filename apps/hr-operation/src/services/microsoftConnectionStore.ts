export const MICROSOFT_CONNECTION_SCOPES = ['Files.Read'] as const;

export interface MicrosoftConnectionRecord {
  schemaVersion: 1;
  companyId: string;
  userId: string;
  homeAccountId: string;
  tenantId: string;
  username: string;
  displayName: string;
  scopes: string[];
  connectedAt: string;
  lastUsedAt: string | null;
}

const keyFor = (companyId: string, userId: string) =>
  `hr:microsoft-connection:v1:${encodeURIComponent(companyId)}:${encodeURIComponent(userId)}`;

const isConnectionRecord = (
  value: unknown,
  companyId: string,
  userId: string,
): value is MicrosoftConnectionRecord => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<MicrosoftConnectionRecord>;
  return (
    record.schemaVersion === 1 &&
    record.companyId === companyId &&
    record.userId === userId &&
    typeof record.homeAccountId === 'string' &&
    Boolean(record.homeAccountId) &&
    typeof record.tenantId === 'string' &&
    typeof record.username === 'string' &&
    typeof record.displayName === 'string' &&
    Array.isArray(record.scopes) &&
    typeof record.connectedAt === 'string' &&
    (record.lastUsedAt === null || typeof record.lastUsedAt === 'string')
  );
};

export const readMicrosoftConnection = (
  storage: Storage,
  companyId: string,
  userId: string,
): MicrosoftConnectionRecord | null => {
  const key = keyFor(companyId, userId);
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isConnectionRecord(parsed, companyId, userId)) return parsed;
  } catch {
    // Invalid browser state is cleared below and requires a fresh connection.
  }
  storage.removeItem(key);
  return null;
};

export const saveMicrosoftConnection = (
  storage: Storage,
  connection: MicrosoftConnectionRecord,
) => {
  storage.setItem(keyFor(connection.companyId, connection.userId), JSON.stringify(connection));
};

export const removeMicrosoftConnection = (
  storage: Storage,
  companyId: string,
  userId: string,
) => {
  storage.removeItem(keyFor(companyId, userId));
};

export const markMicrosoftConnectionUsed = (
  storage: Storage,
  companyId: string,
  userId: string,
  usedAt = new Date().toISOString(),
) => {
  const connection = readMicrosoftConnection(storage, companyId, userId);
  if (!connection) return null;
  const updated = { ...connection, lastUsedAt: usedAt };
  saveMicrosoftConnection(storage, updated);
  return updated;
};
