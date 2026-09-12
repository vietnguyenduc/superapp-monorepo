import { apiClient, getCurrentCompanyId } from '../lib/supabase';
import { BaseService, ServiceResponse } from './baseService';
import { bulkHistoryKey, legacyBulkReceiptKey, readStoredBulkHistory } from '../utils/bulkImportHistoryStorage';

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

export class BulkImportHistoryService extends BaseService {
  static rememberReceipt(direction: BulkImportDirection, receipt: BulkImportReceipt): BulkImportReceipt[] {
    const history = readStoredBulkHistory(direction).filter((item) => item.batchId !== receipt.batchId);
    const next = [receipt, ...history].slice(0, HISTORY_LIMIT);
    localStorage.setItem(bulkHistoryKey(direction), JSON.stringify(next));
    localStorage.setItem(legacyBulkReceiptKey(direction), JSON.stringify(receipt));
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
        const pageSize = 1000;
        const rows: BulkImportRecordRow[] = [];
        let offset = 0;

        while (true) {
          const { data, error } = await apiClient
            .from('inventory_records')
            .select('reference_id, created_at')
            .eq('company_id', companyId)
            .eq('source_type', 'bulk_import')
            .gt(quantityColumn, 0)
            .not('reference_id', 'is', null)
            .order('created_at', { ascending: false })
            .order('reference_id', { ascending: true })
            .range(offset, offset + pageSize - 1);

          if (error) return { data: null, error };
          const page = data || [];
          rows.push(...page);
          const distinctBatches = new Set(rows.map((row) => row.reference_id).filter(Boolean));
          if (page.length < pageSize || distinctBatches.size > limit) break;
          offset += pageSize;
        }

        return { data: groupBulkImportRows(rows, limit), error: null };
      },
      async () => ({ data: readStoredBulkHistory(direction, limit), error: null }),
    );
  }
}

export const bulkImportHistoryService = BulkImportHistoryService;
