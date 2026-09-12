import React from 'react';
import type { BulkImportReceipt } from '../services/bulkImportHistoryService';

interface BulkImportHistoryPanelProps {
  directionLabel: 'nhập' | 'xuất';
  history: BulkImportReceipt[];
  loading?: boolean;
}

const BulkImportHistoryPanel: React.FC<BulkImportHistoryPanelProps> = ({ directionLabel, history, loading }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white">Lịch sử lô {directionLabel} gần đây</h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Đọc từ sổ kho máy chủ; vẫn còn sau khi đổi thiết bị.</p>
      </div>
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        {history.length} lô
      </span>
    </div>

    {loading ? (
      <div className="py-6 text-center text-sm text-gray-500">Đang tải lịch sử lô...</div>
    ) : history.length === 0 ? (
      <div className="py-6 text-center text-sm text-gray-500">Chưa có lô {directionLabel} hàng loạt.</div>
    ) : (
      <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
        {history.map((receipt) => (
          <div key={receipt.batchId} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <div className="truncate font-mono text-xs text-gray-700 dark:text-gray-200" title={receipt.batchId}>{receipt.batchId}</div>
              <div className="mt-1 text-xs text-gray-500">{new Date(receipt.savedAt).toLocaleString('vi-VN')}</div>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{receipt.created} dòng</div>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default BulkImportHistoryPanel;
