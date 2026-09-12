import { apiClient, getCurrentCompanyId } from '../lib/supabase';
import { BaseService, ServiceResponse } from './baseService';

export type BulkImportDirection = 'input' | 'output';

export interface BulkImportReceipt {
  batchId: string;
  created: number;
  errors: number;
  savedAt: string;
}

interface BulkImportRecordRow {
  reference_id: string | null;
  created_at: string | null;
}

const HISTORY_LIMIT = 10;

export function groupBulkImportRows(
  rows: BulkImportRecordRow[],
  limit = HISTORY_LIMIT,
): BulkImportReceipt[] {
  const batches = new Map<string, BulkImportReceipt>();

  for (const row of rows) {
    if (!row.reference_id) continue;
    const existing = batches.get(row.reference_id);
    if (existing) {
      existing.created += 1;
      if (row.created_at && row.created_at > existing.savedAt) existing.savedAt = row.created_at;
      continue;
    }
    batches.set(row.reference_id, {
      batchId: row.reference_id,
      created: 1,
      errors: 0,
      savedAt: row.created_at || new Date(0).toISOString(),
    });
  }

  return Array.from(batches.values())
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, limit);
}

function historyKey(direction: BulkImportDirection) {
  return `inventory_${direction}_batch_history`;
}

function legacyReceiptKey(direction: BulkImportDirection) {
  return direction === 'input' ? 'inventory_last_input_receipt' : 'inventory_last_output_receipt';
}

function readTrialHistory(direction: BulkImportDirection): BulkImportReceipt[] {
  try {
    const stored = JSON.parse(localStorage.getItem(historyKey(direction)) || '[]');
    if (Array.isArray(stored) && stored.length > 0) return stored.slice(0, HISTORY_LIMIT);
    const legacy = JSON.parse(localStorage.getItem(legacyReceiptKey(direction)) || 'null');
    return legacy?.batchId ? [legacy] : [];
  } catch {
    return [];
  }
}

export class BulkImportHistoryService extends BaseService {
  static rememberReceipt(direction: BulkImportDirection, receipt: BulkImportReceipt): BulkImportReceipt[] {
    const history = readTrialHistory(direction).filter((item) => item.batchId !== receipt.batchId);
    const next = [receipt, ...history].slice(0, HISTORY_LIMIT);
    localStorage.setItem(historyKey(direction), JSON.stringify(next));
    localStorage.setItem(legacyReceiptKey(direction), JSON.stringify(receipt));
    return next;
  }

  static async getHistory(
    direction: BulkImportDirection,
    limit = HISTORY_LIMIT,
  ): Promise<ServiceResponse<BulkImportReceipt[]>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        if (!companyId) return { data: null, error: { message: 'Vui lòng chọn công ty trước khi xem lịch sử lô' } };

        const quantityColumn = direction === 'input' ? 'input_quantity' : 'output_quantity';
        const { data, error } = await apiClient
          .from('inventory_records')
          .select('reference_id, created_at')
          .eq('company_id', companyId)
          .eq('source_type', 'bulk_import')
          .gt(quantityColumn, 0)
          .not('reference_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5000);

        return { data: error ? null : groupBulkImportRows(data || [], limit), error };
      },
      async () => ({ data: readTrialHistory(direction).slice(0, limit), error: null }),
    );
  }
}

export const bulkImportHistoryService = BulkImportHistoryService;
