import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SupplierForm from '../components/Form/SupplierForm';
import { supplierService, SupplierInput } from '../services/supplierService';
import { getXLSX } from '../utils/xlsxLoader';

type ImportMode = 'single' | 'bulk';

const MODE_CONFIG: { id: ImportMode; label: string; icon: string }[] = [
  { id: 'single', label: 'Nhập từng dòng', icon: '📝' },
  { id: 'bulk', label: 'Nhập hàng loạt', icon: '📊' },
];

interface BulkSupplierRow {
  customer_code: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const COLS = [
  { key: 'customer_code', label: 'Mã NCC *', width: 110 },
  { key: 'full_name', label: 'Tên NCC *', width: 200 },
  { key: 'phone', label: 'Điện thoại', width: 120 },
  { key: 'email', label: 'Email', width: 160 },
  { key: 'address', label: 'Địa chỉ', width: 200 },
  { key: 'notes', label: 'Ghi chú', width: 160 },
] as const;

const emptyRow = (): BulkSupplierRow => ({
  customer_code: '',
  full_name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
});

const MAX_BULK_ROWS = 2000;

const SupplierImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = (searchParams.get('tab') as ImportMode) || 'single';

  const [activeMode, setActiveMode] = useState<ImportMode>(initialMode);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Bulk grid state
  const [rows, setRows] = useState<BulkSupplierRow[]>(() =>
    Array.from({ length: 8 }, () => emptyRow())
  );
  const tableRef = useRef<HTMLDivElement>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleModeChange = (mode: ImportMode) => {
    setActiveMode(mode);
    setSearchParams({ tab: mode });
  };

  const handleSingleSubmit = async (data: SupplierInput) => {
    setIsSaving(true);
    try {
      const res = await supplierService.createSupplier(data);
      if (res.success) {
        showNotification('success', 'Thêm nhà cung cấp thành công!');
      } else {
        showNotification('error', res.error || 'Có lỗi xảy ra');
      }
    } catch {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (ri: number, key: string, val: string) => {
    setRows((prev) => prev.map((r, i) => (i === ri ? { ...r, [key]: val } : r)));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const lines = text.split('\n').filter((l) => l.trim());
    const keys = COLS.map((c) => c.key);
    const newRows: BulkSupplierRow[] = lines.slice(0, MAX_BULK_ROWS).map((line) => {
      const cells = line.split('\t');
      const row = emptyRow();
      keys.forEach((k, ki) => {
        if (cells[ki] !== undefined) (row as any)[k] = cells[ki].trim();
      });
      return row;
    });
    setRows(() => {
      const merged = [...newRows];
      while (merged.length < 8) merged.push(emptyRow());
      return merged;
    });
  };

  const validRows = rows.filter((r) => r.customer_code.trim() && r.full_name.trim());

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const XLSX = await getXLSX();
      const headers = COLS.map((c) => c.label);
      const sample = [
        ['NCC001', 'Công ty TNHH Bao Bì Xanh', '0901234567', 'info@baobixanh.com', 'HN', ''],
        ['NCC002', 'Nhà phân phối ABC', '0912345678', '', 'HCM', 'NCC chính'],
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_nha_cung_cap.xlsx');
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
      const newRows: BulkSupplierRow[] = dataRows.slice(0, MAX_BULK_ROWS).map((cells) => {
        const row = emptyRow();
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

  const handleBulkSave = async () => {
    setIsSaving(true);
    try {
      const inputs: SupplierInput[] = validRows.map((r) => ({
        customer_code: r.customer_code,
        full_name: r.full_name,
        partner_type: 'supplier',
        phone: r.phone || null,
        email: r.email || null,
        address: r.address || null,
        notes: r.notes || null,
      }));
      const res = await supplierService.bulkCreateSuppliers(inputs);
      if (res.success && res.data) {
        const { created, errors } = res.data;
        if (errors.length > 0) {
          showNotification('error', `Đã lưu ${created} NCC. Lỗi: ${errors.length} dòng.`);
        } else {
          showNotification('success', `Đã lưu ${created} nhà cung cấp thành công!`);
        }
      }
    } catch {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/supplier-management')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
              title="Quay lại"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl">
              🏢
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Import Nhà cung cấp</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Chọn phương thức nhập phù hợp</p>
            </div>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
          <div className="flex gap-2 mb-4">
            {MODE_CONFIG.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeMode === mode.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>

          {/* Notification */}
          {notification && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                notification.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {notification.message}
            </div>
          )}

          {activeMode === 'single' ? (
            <SupplierForm
              onSubmit={handleSingleSubmit}
              onCancel={() => navigate('/supplier-management')}
              isLoading={isSaving}
            />
          ) : (
            <div className="space-y-4">
              {/* Instructions */}
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
                  <li>Tối đa {MAX_BULK_ROWS} dòng mỗi lần nhập</li>
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

              {/* Grid */}
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
                      <tr key={ri} className={row.customer_code.trim() ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'}>
                        <td className="px-3 py-1.5 text-xs text-gray-400">{ri + 1}</td>
                        {COLS.map((col) => (
                          <td key={col.key} className="px-2 py-1">
                            <input
                              type="text"
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

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setRows((prev) => [...prev, ...Array.from({ length: 5 }, () => emptyRow())])}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  + Thêm dòng
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/supplier-management')}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleBulkSave}
                    disabled={validRows.length === 0 || isSaving}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Đang lưu...' : `Lưu ${validRows.length} dòng`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierImportPage;
