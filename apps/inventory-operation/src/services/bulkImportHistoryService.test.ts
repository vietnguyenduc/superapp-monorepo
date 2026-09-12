import { beforeEach, describe, expect, it } from 'vitest';
import { groupBulkImportRows } from './bulkImportHistoryService';
import { BULK_IMPORT_HISTORY_KEYS, clearStoredBulkHistory } from '../utils/bulkImportHistoryStorage';

beforeEach(() => localStorage.clear());

describe('groupBulkImportRows', () => {
  it('groups ledger rows by server batch and sorts newest first', () => {
    const result = groupBulkImportRows([
      { reference_id: 'batch-old', created_at: '2026-09-10T08:00:00Z' },
      { reference_id: 'batch-new', created_at: '2026-09-12T08:00:00Z' },
      { reference_id: 'batch-new', created_at: '2026-09-12T08:00:01Z' },
      { reference_id: null, created_at: '2026-09-12T09:00:00Z' },
    ]);

    expect(result).toEqual([
      { batchId: 'batch-new', created: 2, errors: 0, savedAt: '2026-09-12T08:00:01Z' },
      { batchId: 'batch-old', created: 1, errors: 0, savedAt: '2026-09-10T08:00:00Z' },
    ]);
  });

  it('limits the number of receipts returned', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      reference_id: `batch-${index}`,
      created_at: `2026-09-${String(index + 1).padStart(2, '0')}T08:00:00Z`,
    }));
    expect(groupBulkImportRows(rows, 3)).toHaveLength(3);
  });
});

describe('clearStoredBulkHistory', () => {
  it('removes inbound, outbound and legacy receipts during trial reset', () => {
    BULK_IMPORT_HISTORY_KEYS.forEach((key) => localStorage.setItem(key, 'saved'));
    clearStoredBulkHistory();
    BULK_IMPORT_HISTORY_KEYS.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
  });
});
