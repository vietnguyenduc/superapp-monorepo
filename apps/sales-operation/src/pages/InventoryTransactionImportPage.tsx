import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import InventoryInputForm from '../components/InventoryInputForm';
import { useInventory } from '../hooks/useInventory';
import { useAuthContext } from '@superapp/iam';
import { useProducts } from '../hooks/useProducts';
import appSettingsService from '../services/appSettingsService';
import { UserRole } from '../types/UserRole';
import { InventoryRecord } from '../types';

type ImportTab = 'single' | 'multiple' | 'bulk';
type ViewRole = 'warehouse_keeper' | 'warehouse_accountant';

const TAB_CONFIG: { id: ImportTab; label: string; icon: string; desc: string }[] = [
  { id: 'single', label: 'Nhập từng mục', icon: '📝', desc: 'Nhập 1 giao dịch qua form' },
  { id: 'multiple', label: 'Nhập multiple', icon: '📊', desc: 'Nhập nhiều dòng kiểu Excel (paste từ bảng tính)' },
  { id: 'bulk', label: 'Nhập bulk', icon: '📁', desc: 'Upload file Excel/CSV' },
];

/* ───────── Role config ───────── */
const ROLE_CONFIG: Record<ViewRole, { label: string; emoji: string; color: string; bgColor: string; fields: string[] }> = {
  warehouse_keeper: {
    label: 'Thủ kho', emoji: '👷', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200',
    fields: ['rawMaterialStock', 'processedStock', 'finishedProductStock'],
  },
  warehouse_accountant: {
    label: 'Kế toán kho', emoji: '📊', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200',
    fields: ['inputQuantity'],
  },
};

/* ───────── Grid columns (change based on role) ───────── */
const BASE_COLS = [
  { key: 'date', label: 'Ngày', type: 'date', width: 130 },
  { key: 'productCode', label: 'Mã hàng *', type: 'text', width: 100 },
  { key: 'productName', label: 'Tên hàng', type: 'text', width: 160 },
];

const KEEPER_COLS = [
  ...BASE_COLS,
  { key: 'inputQuantity', label: 'Số nhập', type: 'number', width: 100 },
  { key: 'rawMaterialStock', label: 'Tồn NVL', type: 'number', width: 100 },
  { key: 'processedStock', label: 'Tồn SC', type: 'number', width: 100 },
  { key: 'finishedProductStock', label: 'Tồn TP', type: 'number', width: 100 },
  { key: 'notes', label: 'Ghi chú', type: 'text', width: 140 },
];

const ACCOUNTANT_COLS = [
  ...BASE_COLS,
  { key: 'inputQuantity', label: 'Nhập sổ', type: 'number', width: 100 },
  { key: 'unitPrice', label: 'Giá nhập', type: 'number', width: 100 },
  { key: 'outputQuantity', label: 'Xuất sổ', type: 'number', width: 100 },
  { key: 'notes', label: 'Ghi chú', type: 'text', width: 160 },
];

/* ───────── Excel-like grid ───────── */
interface GridRow { id: string; [key: string]: string }
const emptyRow = (i: number): GridRow => ({
  id: `r${i}`, date: new Date().toISOString().split('T')[0],
  productCode: '', productName: '', inputQuantity: '', rawMaterialStock: '',
  processedStock: '', finishedProductStock: '', outputQuantity: '', notes: '',
});

const MultipleGrid: React.FC<{ onSave: (rows: GridRow[]) => void; onCancel: () => void; viewRole: ViewRole }> = ({ onSave, onCancel, viewRole }) => {
  const [rows, setRows] = useState<GridRow[]>(() => Array.from({ length: 8 }, (_, i) => emptyRow(i)));
  const cols = viewRole === 'warehouse_keeper' ? KEEPER_COLS : ACCOUNTANT_COLS;
  const tableRef = useRef<HTMLDivElement>(null);

  const handleChange = (ri: number, key: string, val: string) => {
    setRows(prev => prev.map((r, i) => i === ri ? { ...r, [key]: val } : r));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const lines = text.split('\n').filter(l => l.trim());
    const keys = cols.map(c => c.key);
    const newRows: GridRow[] = lines.map((line, i) => {
      const cells = line.split('\t');
      const row = emptyRow(Date.now() + i);
      keys.forEach((k, ki) => { if (cells[ki] !== undefined) (row as any)[k] = cells[ki].trim(); });
      return row;
    });
    setRows(prev => {
      const merged = [...newRows];
      while (merged.length < 8) merged.push(emptyRow(merged.length));
      return merged;
    });
  };

  const validRows = rows.filter(r => r.productCode.trim() && r.date);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-semibold mb-2 flex items-center">
          <span className="mr-2">💡</span> Hướng dẫn nhập nhanh từ Excel/Google Sheets
        </h4>
        <ul className="list-disc pl-8 space-y-1 mb-3">
          <li>Sắp xếp cột trong file Excel theo đúng thứ tự: <strong>{cols.map(c => c.label.replace(' *', '')).join(' · ')}</strong></li>
          <li>Bôi đen các dòng dữ liệu trong Excel, nhấn <strong>Ctrl+C</strong></li>
          <li>Bấm vào khung lưới bên dưới và nhấn <strong>Ctrl+V</strong> để dán toàn bộ dữ liệu.</li>
        </ul>
        <div className="bg-white/60 p-2 rounded text-xs">
          <strong>Lưu ý vai trò: </strong>
          {viewRole === 'warehouse_keeper' 
            ? 'Bạn đang ở góc nhìn Thủ kho. Hãy đếm và nhập chính xác Số lượng thực tế đang có trong kho.'
            : 'Bạn đang ở góc nhìn Kế toán kho. Hãy nhập theo đúng chứng từ Xuất/Nhập hợp lệ.'}
        </div>
      </div>

      <div ref={tableRef} className="overflow-x-auto border border-gray-200 rounded-xl" onPaste={handlePaste} tabIndex={0}>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-8">#</th>
              {cols.map(c => (
                <th key={c.key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: c.width }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.map((row, ri) => (
              <tr key={row.id} className={row.productCode.trim() ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-3 py-1.5 text-xs text-gray-400">{ri + 1}</td>
                {cols.map(col => (
                  <td key={col.key} className="px-2 py-1">
                    <input
                      type={col.type === 'number' ? 'text' : col.type}
                      value={(row as any)[col.key] || ''}
                      onChange={e => handleChange(ri, col.key, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
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
        <button onClick={() => setRows(prev => [...prev, ...Array.from({ length: 5 }, (_, i) => emptyRow(prev.length + i))])}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-1">
          + Thêm dòng
        </button>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Hủy</button>
          <button onClick={() => onSave(validRows)} disabled={validRows.length === 0}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
            Lưu {validRows.length} dòng
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────── Bulk upload with template download + validation ───────── */
const BulkUpload: React.FC<{ onImport: (rows: any[]) => Promise<{ ok: number; total: number; errors: string[] }>; onCancel: () => void; viewRole: ViewRole }> = ({ onImport, onCancel, viewRole }) => {
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ ok: number; total: number; errors: string[] } | null>(null);

  const cols = viewRole === 'warehouse_keeper' ? KEEPER_COLS : ACCOUNTANT_COLS;
  const colHeaders = cols.map(c => c.label.replace(' *', ''));

  const downloadTemplate = () => {
    const sampleData = viewRole === 'warehouse_keeper'
      ? [
          [new Date().toISOString().split('T')[0], 'NVL-XO01', 'Xoài cát Hòa Lộc', 20, 15, 40, 8, 'Nhập lô mới'],
          [new Date().toISOString().split('T')[0], 'NVL-DH01', 'Dưa hấu không hạt', 10, 8, 36, 5, ''],
        ]
      : [
          [new Date().toISOString().split('T')[0], 'NVL-XO01', 'Xoài cát Hòa Lộc', 20, 15, 'Nhập sổ'],
          [new Date().toISOString().split('T')[0], 'NVL-DH01', 'Dưa hấu không hạt', 10, 8, ''],
        ];

    const ws = XLSX.utils.aoa_to_sheet([colHeaders, ...sampleData]);
    // Set column widths
    ws['!cols'] = colHeaders.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `import_template_${viewRole === 'warehouse_keeper' ? 'thu_kho' : 'ke_toan'}.xlsx`);
  };

  const parse = async (file: File) => {
    setProcessing(true);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const keys = cols.map(c => c.key);
      const rows = json.slice(1).filter((r: any[]) => r[1]).map((r: any[]) => {
        const obj: any = {};
        keys.forEach((k, i) => { obj[k] = r[i] ?? ''; });
        return obj;
      });
      setPreview(rows);
      setFileName(file.name);
    } finally { setProcessing(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    if (e.dataTransfer.files[0]) parse(e.dataTransfer.files[0]);
  };

  const handleConfirmImport = async () => {
    setProcessing(true);
    const res = await onImport(preview);
    setResult(res);
    setProcessing(false);
  };

  return (
    <div className="space-y-5">
      {/* Template download + column info */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <h4 className="font-semibold mb-2 flex items-center">
            <span className="mr-2">📋</span> Hướng dẫn upload file Excel
          </h4>
          <ul className="list-disc pl-8 space-y-1 mb-3">
            <li>Tải file mẫu về máy và điền dữ liệu. <strong>Không thay đổi tên cột hoặc thứ tự cột</strong>.</li>
            <li>Dòng đầu tiên là tiêu đề (hệ thống sẽ bỏ qua khi import).</li>
            <li>Cột cấu trúc yêu cầu: <strong>{colHeaders.join(' · ')}</strong></li>
          </ul>
          <div className="bg-white/60 p-2 rounded text-xs">
            <strong>Lưu ý vai trò: </strong>
            {viewRole === 'warehouse_keeper' 
              ? 'Thủ kho nhập: Số lượng thực nhận, Tồn thực NVL, Tồn thực sơ chế, Tồn thực thành phẩm.'
              : 'Kế toán nhập: Số lượng nhập sổ, Số lượng xuất sổ (Dựa theo chứng từ).'}
          </div>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Tải file mẫu
        </button>
      </div>

      {/* Validation result */}
      {result && (
        <div className={`rounded-xl p-4 border ${result.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <span>{result.errors.length > 0 ? '⚠️' : '✅'}</span>
            <span>Kết quả: {result.ok}/{result.total} dòng thành công</span>
          </div>
          {result.errors.length > 0 && (
            <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
              {result.errors.map((err, i) => <li key={i}>❌ {err}</li>)}
            </ul>
          )}
        </div>
      )}

      {!preview.length ? (
        <div
          onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)}
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-14 text-center transition-colors ${drag ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input type="file" id="inv-file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={e => e.target.files?.[0] && parse(e.target.files[0])} />
          <label htmlFor="inv-file" className="cursor-pointer space-y-3 block">
            <div className="w-14 h-14 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-800">{processing ? 'Đang xử lý...' : 'Kéo thả file vào đây'}</p>
            <p className="text-sm text-gray-500">hoặc click để chọn file .xlsx / .xls / .csv</p>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            ✅ <strong>{fileName}</strong> — {preview.length} dòng hợp lệ
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {colHeaders.map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {preview.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    {cols.map(c => <td key={c.key} className="px-4 py-1.5 text-sm">{(r as any)[c.key]}</td>)}
                  </tr>
                ))}
                {preview.length > 10 && (
                  <tr><td colSpan={cols.length} className="px-4 py-2 text-xs text-center text-gray-500">... và {preview.length - 10} dòng nữa</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 justify-between">
            <button onClick={() => { setPreview([]); setFileName(''); setResult(null); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
              ← Chọn file khác
            </button>
            <button onClick={handleConfirmImport} disabled={processing}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300">
              {processing ? 'Đang xử lý...' : `Xác nhận nhập ${preview.length} dòng`}
            </button>
          </div>
        </div>
      )}

      {!preview.length && (
        <div className="flex justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Hủy</button>
        </div>
      )}
    </div>
  );
};

/* ───────── Main page ───────── */
const InventoryTransactionImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as ImportTab) || 'single';
  const [activeTab, setActiveTab] = useState<ImportTab>(initialTab);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { user, isTrial } = useAuthContext();
  const userRole = user?.role || 'staff';
  const isAdmin = isTrial || userRole === 'admin' || userRole === UserRole.ADMIN_MASTER || userRole === UserRole.ADMIN_COMPANY;

  // Determine view role
  const [viewRole, setViewRole] = useState<ViewRole>(
    userRole === UserRole.WAREHOUSE_KEEPER ? 'warehouse_keeper' : 'warehouse_accountant'
  );

  const { createRecord, isLoading } = useInventory({ autoLoad: false });
  const { products } = useProducts();

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTabChange = (tab: ImportTab) => {
    setActiveTab(tab);
    setSearchParams(new URLSearchParams([['tab', tab]]));
  };

  const handleSingle = async (data: Partial<InventoryRecord>) => {
    const result = await createRecord(data as Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>);
    if (result.success) notify('success', 'Đã lưu giao dịch thành công!');
    else notify('error', result.error || 'Có lỗi xảy ra.');
  };

  const handleMultiple = async (rows: any[]) => {
    let ok = 0;
    const config = appSettingsService.getSettings().priceVarianceConfig;
    
    for (const row of rows) {
      let approvalStatus = undefined;
      let priceVariancePercentage = undefined;
      
      if (viewRole === 'warehouse_accountant' && row.unitPrice) {
        const product = products.find(p => p.businessCode === row.productCode);
        if (product && product.standardInputPrice) {
          const standard = product.standardInputPrice;
          const actual = Number(row.unitPrice);
          const variance = ((actual - standard) / standard) * 100;
          priceVariancePercentage = variance;
          if (config) {
            approvalStatus = Math.abs(variance) > config.tolerancePercentage ? 'pending' : 'approved';
          }
        }
      }
      
      const result = await createRecord({
        productCode: row.productCode, productName: row.productName || '',
        date: new Date(row.date), inputQuantity: Number(row.inputQuantity) || 0,
        unitPrice: Number(row.unitPrice) || 0,
        rawMaterialStock: Number(row.rawMaterialStock) || 0, rawMaterialUnit: '',
        processedStock: Number(row.processedStock) || 0, processedUnit: '',
        finishedProductStock: Number(row.finishedProductStock) || 0, finishedProductUnit: '',
        notes: row.notes || '', createdBy: 'system', updatedBy: 'system',
        approvalStatus: approvalStatus as any,
        priceVariancePercentage,
      });
      if (result.success) ok++;
    }
    notify('success', `Đã lưu thành công ${ok}/${rows.length} dòng.`);
  };

  const handleBulkImport = async (rows: any[]): Promise<{ ok: number; total: number; errors: string[] }> => {
    let ok = 0;
    const errors: string[] = [];
    const config = appSettingsService.getSettings().priceVarianceConfig;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.productCode) {
        errors.push(`Dòng ${i + 1}: Thiếu mã hàng`);
        continue;
      }
      
      let approvalStatus = undefined;
      let priceVariancePercentage = undefined;
      
      if (viewRole === 'warehouse_accountant' && row.unitPrice) {
        const product = products.find(p => p.businessCode === row.productCode);
        if (product && product.standardInputPrice) {
          const standard = product.standardInputPrice;
          const actual = Number(row.unitPrice);
          const variance = ((actual - standard) / standard) * 100;
          priceVariancePercentage = variance;
          if (config) {
            approvalStatus = Math.abs(variance) > config.tolerancePercentage ? 'pending' : 'approved';
          }
        }
      }
      
      const result = await createRecord({
        productCode: row.productCode, productName: row.productName || '',
        date: new Date(row.date || Date.now()), inputQuantity: Number(row.inputQuantity) || 0,
        unitPrice: Number(row.unitPrice) || 0,
        rawMaterialStock: Number(row.rawMaterialStock) || 0, rawMaterialUnit: '',
        processedStock: Number(row.processedStock) || 0, processedUnit: '',
        finishedProductStock: Number(row.finishedProductStock) || 0, finishedProductUnit: '',
        notes: row.notes || '', createdBy: 'system', updatedBy: 'system',
        approvalStatus: approvalStatus as any,
        priceVariancePercentage,
      });
      if (result.success) ok++;
      else errors.push(`Dòng ${i + 1} (${row.productCode}): ${result.error || 'Lỗi không xác định'}`);
    }
    return { ok, total: rows.length, errors };
  };

  const roleInfo = ROLE_CONFIG[viewRole];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/inventory-records')}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Import Giao dịch Xuất Nhập Tồn</h1>
                <p className="text-sm text-gray-500">Chọn phương thức nhập phù hợp</p>
              </div>
            </div>

            {/* Role badge + switcher */}
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${roleInfo.bgColor} ${roleInfo.color}`}>
                <span>{roleInfo.emoji}</span>
                {roleInfo.label}
              </span>
              {isAdmin && (
                <button
                  onClick={() => setViewRole(prev => prev === 'warehouse_keeper' ? 'warehouse_accountant' : 'warehouse_keeper')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-colors"
                  title="Chuyển đổi vai trò xem"
                >
                  ⇄ Chuyển vai trò
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`rounded-2xl shadow-2xl p-4 pr-12 border flex items-center gap-3 min-w-[320px] ${
              notification.type === 'success' ? 'bg-white border-green-200' : 'bg-white border-red-200'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {notification.type === 'success' ? '✅' : '❌'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Thông báo</span>
                <span className="font-bold text-gray-900 text-sm leading-tight">{notification.message}</span>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {TAB_CONFIG.map(tab => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-3.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-b-2 border-transparent'
                }`}>
                <span className="text-base">{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm text-gray-500">{TAB_CONFIG.find(t => t.id === activeTab)?.desc}</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {activeTab === 'single' && (
            <InventoryInputForm
              onSubmit={handleSingle}
              onCancel={() => navigate('/inventory-records')}
              isLoading={isLoading}
              viewRole={viewRole}
            />
          )}
          {activeTab === 'multiple' && (
            <MultipleGrid
              onSave={handleMultiple}
              onCancel={() => navigate('/inventory-records')}
              viewRole={viewRole}
            />
          )}
          {activeTab === 'bulk' && (
            <BulkUpload
              onImport={handleBulkImport}
              onCancel={() => navigate('/inventory-records')}
              viewRole={viewRole}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryTransactionImportPage;
