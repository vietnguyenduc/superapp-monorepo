import React, { useState, useRef, useCallback } from 'react';
import { getXLSX } from '../utils/xlsxLoader';

export interface BulkGoodsIssueRow {
  date: string;
  product_code: string;
  quantity: string;
  reason: string;
  notes: string;
}

interface GoodsIssueBulkGridProps {
  onSave: (rows: BulkGoodsIssueRow[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const COLS = [
  { key: 'date', label: 'Ngày', width: 130 },
  { key: 'product_code', label: 'Mã hàng *', width: 110 },
  { key: 'quantity', label: 'Số lượng', width: 100 },
  { key: 'reason', label: 'Lý do', width: 140 },
  { key: 'notes', label: 'Ghi chú', width: 160 },
] as const;

const emptyRow = (_i: number): BulkGoodsIssueRow => ({
  date: new Date().toISOString().split('T')[0],
  product_code: '',
  quantity: '',
  reason: '',
  notes: '',
});

const GoodsIssueBulkGrid: React.FC<GoodsIssueBulkGridProps> = ({
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [rows, setRows] = useState<BulkGoodsIssueRow[]>(() =>
    Array.from({ length: 8 }, (_, i) => emptyRow(i))
  );
  const tableRef = useRef<HTMLDivElement>(null);

  const handleChange = (ri: number, key: string, val: string) => {
    setRows((prev) => prev.map((r, i) => (i === ri ? { ...r, [key]: val } : r)));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const lines = text.split('\n').filter((l) => l.trim());
    const keys = COLS.map((c) => c.key);
    const newRows: BulkGoodsIssueRow[] = lines.map((line, i) => {
      const cells = line.split('\t');
      const row = emptyRow(Date.now() + i);
      keys.forEach((k, ki) => {
        if (cells[ki] !== undefined) (row as any)[k] = cells[ki].trim();
      });
      return row;
    });
    setRows(() => {
      const merged = [...newRows];
      while (merged.length < 8) merged.push(emptyRow(merged.length));
      return merged;
    });
  };

  const validRows = rows.filter((r) => r.product_code.trim() && r.date);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const XLSX = await getXLSX();
      const headers = COLS.map((c) => c.label);
      const sample = [
        ['2026-01-15', 'SP001', '100', 'Xuất bán', ''],
        ['2026-01-16', 'SP002', '50', 'Xuất sản xuất', ''],
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_xuat_hang.xlsx');
    } catch (err) {
      console.error('Lỗi tải template:', err);
      alert('Không thể tải template. Vui lòng thử lại.');
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const XLSX = await getXLSX();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (json.length < 2) return;

      const keys = COLS.map((c) => c.key);
      const dataRows = json.slice(1).filter((r) => r.some((c) => c !== null && c !== ''));
      const newRows: BulkGoodsIssueRow[] = dataRows.map((cells, i) => {
        const row = emptyRow(Date.now() + i);
        keys.forEach((k, ki) => {
          if (cells[ki] !== undefined && cells[ki] !== null) (row as any)[k] = String(cells[ki]).trim();
        });
        return row;
      });
      if (newRows.length > 0) {
        setRows(newRows);
      }
    } catch (err) {
      console.error('Lỗi đọc file:', err);
      alert('Không thể đọc file. Vui lòng kiểm tra định dạng Excel/CSV.');
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
        <h4 className="font-semibold mb-2 flex items-center">
          <span className="mr-2">💡</span> Hướng dẫn nhập nhanh
        </h4>
        <ul className="list-disc pl-8 space-y-1 mb-3">
          <li>
            Sắp xếp cột theo thứ tự: <strong>{COLS.map((c) => c.label).join(' · ')}</strong>
          </li>
          <li>
            Bôi đen dòng trong Excel, nhấn <strong>Ctrl+C</strong>, bấm vào lưới và <strong>Ctrl+V</strong>
          </li>
        </ul>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            📥 Tải template Excel
          </button>
          <label className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer">
            📁 Upload file
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
          </label>
        </div>
      </div>

      <div
        ref={tableRef}
        className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl"
        onPaste={handlePaste}
        tabIndex={0}
      >
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-8">#</th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                  style={{ minWidth: c.width }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row, ri) => (
              <tr key={ri} className={row.product_code.trim() ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'}>
                <td className="px-3 py-1.5 text-xs text-gray-400">{ri + 1}</td>
                {COLS.map((col) => (
                  <td key={col.key} className="px-2 py-1">
                    <input
                      type={col.key === 'date' ? 'date' : 'text'}
                      value={(row as any)[col.key] || ''}
                      onChange={(e) => handleChange(ri, col.key, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      style={{ minWidth: col.width - 16 }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            setRows((prev) => [...prev, ...Array.from({ length: 5 }, (_, i) => emptyRow(prev.length + i))])
          }
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
        >
          + Thêm dòng
        </button>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(validRows)}
            disabled={validRows.length === 0 || isLoading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang lưu...' : `Lưu ${validRows.length} dòng`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoodsIssueBulkGrid;
