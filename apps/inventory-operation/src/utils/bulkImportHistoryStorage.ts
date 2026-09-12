import type { BulkImportDirection, BulkImportReceipt } from '../services/bulkImportHistoryService';

export const BULK_IMPORT_HISTORY_KEYS = [
  'inventory_input_batch_history',
  'inventory_output_batch_history',
  'inventory_last_input_receipt',
  'inventory_last_output_receipt',
] as const;

export function bulkHistoryKey(direction: BulkImportDirection) {
  return `inventory_${direction}_batch_history`;
}

export function legacyBulkReceiptKey(direction: BulkImportDirection) {
  return direction === 'input' ? 'inventory_last_input_receipt' : 'inventory_last_output_receipt';
}

export function readStoredBulkHistory(direction: BulkImportDirection, limit = 10): BulkImportReceipt[] {
  try {
    const stored = JSON.parse(localStorage.getItem(bulkHistoryKey(direction)) || '[]');
    if (Array.isArray(stored) && stored.length > 0) return stored.slice(0, limit);
    const legacy = JSON.parse(localStorage.getItem(legacyBulkReceiptKey(direction)) || 'null');
    return legacy?.batchId ? [legacy] : [];
  } catch {
    return [];
  }
}

export function clearStoredBulkHistory() {
  BULK_IMPORT_HISTORY_KEYS.forEach((key) => localStorage.removeItem(key));
}
