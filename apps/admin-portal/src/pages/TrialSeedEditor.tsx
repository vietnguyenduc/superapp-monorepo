import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FlaskConical, Save, Play, Eye, Plus, Trash2, Undo2, Check, AlertCircle, X, Search, ChevronDown, ExternalLink } from 'lucide-react';
import { useAuthContext } from '@superapp/iam';
import { supabase } from '../lib/supabase';

const genId = () => crypto.randomUUID?.()?.slice(0, 8) || Math.random().toString(36).slice(2, 10);

// ─── Types ───────────────────────────────────────────────────────────────

interface SeedRecord {
  id: string;
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field?: string;
  message: string;
}

interface TableInfo {
  name: string;
  label: string;
  app: string;
}

// ─── App → Table mapping ─────────────────────────────────────────────────

const APP_TABLES: Record<string, { icon: string; tables: TableInfo[] }> = {
  Cashflow: {
    icon: '💰',
    tables: [
      { name: 'companies', label: 'Công ty', app: 'Cashflow' },
      { name: 'branches', label: 'Chi nhánh', app: 'Cashflow' },
      { name: 'users', label: 'Người dùng', app: 'Cashflow' },
      { name: 'customers', label: 'Khách hàng', app: 'Cashflow' },
      { name: 'transactions', label: 'Giao dịch', app: 'Cashflow' },
      { name: 'transaction_types', label: 'Loại giao dịch', app: 'Cashflow' },
      { name: 'bank_accounts', label: 'Tài khoản ngân hàng', app: 'Cashflow' },
    ],
  },
  'Kế toán': {
    icon: '📊',
    tables: [
      { name: 'companies', label: 'Công ty', app: 'Kế toán' },
      { name: 'branches', label: 'Chi nhánh', app: 'Kế toán' },
      { name: 'customers', label: 'Khách hàng', app: 'Kế toán' },
      { name: 'transactions', label: 'Giao dịch', app: 'Kế toán' },
      { name: 'transaction_types', label: 'Loại giao dịch', app: 'Kế toán' },
      { name: 'bank_accounts', label: 'Tài khoản NH', app: 'Kế toán' },
    ],
  },
  'Nhân sự': {
    icon: '👤',
    tables: [
      { name: 'departments', label: 'Phòng ban', app: 'Nhân sự' },
      { name: 'employees', label: 'Nhân viên', app: 'Nhân sự' },
      { name: 'shifts', label: 'Ca làm việc', app: 'Nhân sự' },
      { name: 'employee_shifts', label: 'Phân ca', app: 'Nhân sự' },
      { name: 'attendance_logs', label: 'Chấm công', app: 'Nhân sự' },
      { name: 'leave_requests', label: 'Đơn nghỉ', app: 'Nhân sự' },
      { name: 'payrolls', label: 'Bảng lương', app: 'Nhân sự' },
      { name: 'payroll_items', label: 'Chi tiết lương', app: 'Nhân sự' },
    ],
  },
  'Kho': {
    icon: '📦',
    tables: [
      { name: 'products', label: 'Sản phẩm', app: 'Kho' },
      { name: 'inventory_records', label: 'Tồn kho', app: 'Kho' },
      { name: 'sales_records', label: 'Bán hàng', app: 'Kho' },
      { name: 'special_outbound_records', label: 'Xuất kho đặc biệt', app: 'Kho' },
      { name: 'approval_workflows', label: 'Luồng duyệt', app: 'Kho' },
      { name: 'approval_logs', label: 'Nhật ký duyệt', app: 'Kho' },
    ],
  },
  'Vận hành': {
    icon: '🔧',
    tables: [
      { name: 'operation_checkins', label: 'Check-in', app: 'Vận hành' },
      { name: 'operation_tickets', label: 'Ticket', app: 'Vận hành' },
      { name: 'operation_assets', label: 'Tài sản', app: 'Vận hành' },
      { name: 'operation_consumables', label: 'Vật tư', app: 'Vận hành' },
      { name: 'operation_documents', label: 'Văn bản', app: 'Vận hành' },
      { name: 'operation_emergency_contacts', label: 'Liên hệ khẩn cấp', app: 'Vận hành' },
      { name: 'operation_training_courses', label: 'Khóa đào tạo', app: 'Vận hành' },
      { name: 'operation_training_materials', label: 'Tài liệu', app: 'Vận hành' },
      { name: 'operation_training_questions', label: 'Câu hỏi', app: 'Vận hành' },
      { name: 'operation_training_progress', label: 'Tiến độ', app: 'Vận hành' },
      { name: 'operation_chat_groups', label: 'Nhóm chat', app: 'Vận hành' },
      { name: 'operation_chat_members', label: 'Thành viên', app: 'Vận hành' },
      { name: 'operation_chat_messages', label: 'Tin nhắn', app: 'Vận hành' },
    ],
  },
};

const ALL_TABLES = Object.values(APP_TABLES).flatMap((a) => a.tables);

// ─── Field validators ───────────────────────────────────────────────────

const FIELD_TYPES: Record<string, Record<string, string>> = {
  products: { price: 'number', stock: 'number', sort_order: 'number' },
  transactions: { amount: 'number' },
  employees: { salary: 'number' },
  bank_accounts: { balance: 'number' },
  operation_consumables: { quantity: 'number' },
  inventory_records: { quantity: 'number' },
  sales_records: { quantity: 'number', total: 'number' },
};

const REQUIRED_FIELDS: Record<string, string[]> = {
  products: ['name', 'price'],
  customers: ['full_name'],
  employees: ['full_name'],
  users: ['email', 'full_name'],
  companies: ['name'],
  branches: ['name'],
  transactions: ['amount'],
};

function validateRecords(table: string, records: SeedRecord[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  records.forEach((rec, i) => {
    if (!rec.id) {
      errors.push({ row: i + 1, message: 'Thiếu trường "id"' });
    } else if (seenIds.has(rec.id)) {
      errors.push({ row: i + 1, field: 'id', message: `id "${rec.id}" bị trùng` });
    }
    seenIds.add(rec.id);

    // Check required fields
    const required = REQUIRED_FIELDS[table] || [];
    for (const field of required) {
      if (rec[field] === undefined || rec[field] === null || rec[field] === '') {
        errors.push({ row: i + 1, field, message: `Thiếu "${field}"` });
      }
    }

    // Check field types
    const types = FIELD_TYPES[table] || {};
    for (const [field, type] of Object.entries(types)) {
      if (rec[field] !== undefined && rec[field] !== null) {
        if (type === 'number' && isNaN(Number(rec[field]))) {
          errors.push({ row: i + 1, field, message: `"${field}" phải là số` });
        }
      }
    }
  });

  return errors;
}

// ─── Editable Cell ──────────────────────────────────────────────────────

function EditableCell({
  value,
  field,
  fieldType,
  onChange,
  error,
}: {
  value: any;
  field: string;
  fieldType?: string;
  onChange: (val: any) => void;
  error?: string;
}) {
  const [editValue, setEditValue] = useState(value !== undefined ? String(value) : '');

  useEffect(() => {
    setEditValue(value !== undefined ? String(value) : '');
  }, [value]);

  const handleBlur = () => {
    let parsed: any = editValue;
    if (fieldType === 'number') {
      parsed = editValue === '' ? undefined : Number(editValue);
    }
    onChange(parsed);
  };

  return (
    <div className="relative">
      <input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        className={`w-full px-2 py-1.5 text-sm border rounded transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
          error
            ? 'border-red-300 bg-red-50'
            : fieldType === 'number' && value !== undefined && isNaN(Number(editValue))
            ? 'border-yellow-300 bg-yellow-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        placeholder={fieldType === 'number' ? '0' : '...'}
      />
      {error && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-500 whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Record Preview Card ────────────────────────────────────────────────

function RecordPreview({ record, table }: { record: SeedRecord | null; table: string }) {
  if (!record) {
    return (
      <div className="text-center text-gray-400 py-8 text-sm">
        Chọn một record để xem trước
      </div>
    );
  }

  const previewFields = ['name', 'full_name', 'title', 'label', 'description', 'price', 'amount', 'email', 'phone', 'status', 'role', 'priority'];
  const entries = Object.entries(record)
    .filter(([k]) => !['id', 'created_at', 'updated_at', 'company_id', 'branch_id'].includes(k))
    .filter(([k]) => !k.startsWith('_'))
    .slice(0, 8);

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {table}
      </div>
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-500 w-24 shrink-0 truncate">
            {key}
          </span>
          <span className="text-sm text-gray-900 break-words">
            {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function TrialSeedEditor() {
  const { session } = useAuthContext();
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set(['Cashflow']));
  const [selectedTable, setSelectedTable] = useState<string>('products');
  const [records, setRecords] = useState<SeedRecord[]>([]);
  const [originalRecords, setOriginalRecords] = useState<SeedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SeedRecord | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewApp, setPreviewApp] = useState<string>('Cashflow');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  // Filter tables by selected apps
  const availableTables = useMemo(() => {
    const tables = new Set<string>();
    selectedApps.forEach((app) => {
      APP_TABLES[app]?.tables.forEach((t) => tables.add(t.name));
    });
    return ALL_TABLES.filter((t) => tables.has(t.name));
  }, [selectedApps]);

  // Auto-select first table when selection changes
  useEffect(() => {
    if (availableTables.length > 0 && !availableTables.find((t) => t.name === selectedTable)) {
      setSelectedTable(availableTables[0].name);
    }
  }, [availableTables, selectedTable]);

  // Fetch seed data
  const fetchSeed = useCallback(async () => {
    setLoading(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_TRIAL_API_URL || 'http://localhost:3001'}/api/trial/${selectedTable}`);
      const json = await res.json();
      const data = json.data || [];
      setRecords(data);
      setOriginalRecords(JSON.parse(JSON.stringify(data)));
      setValidationErrors(validateRecords(selectedTable, data));
    } catch (err) {
      console.error('Failed to load trial seed:', err);
      setSaveMessage({ type: 'error', text: 'Không thể tải dữ liệu từ API. API server đang chạy?' });
      setRecords([]);
      setOriginalRecords([]);
    }
    setLoading(false);
  }, [selectedTable]);

  useEffect(() => {
    fetchSeed();
  }, [fetchSeed]);

  // Re-validate on records change
  useEffect(() => {
    setValidationErrors(validateRecords(selectedTable, records));
  }, [records, selectedTable]);

  const handleCellChange = (index: number, field: string, value: any) => {
    setRecords((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddRow = () => {
    const newRecord: SeedRecord = { id: `new-${genId()}` };
    if (records.length > 0) {
      // Copy fields from last record (except id)
      const lastRecord = records[records.length - 1];
      for (const [key, val] of Object.entries(lastRecord)) {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          newRecord[key] = val;
        }
      }
    }
    setRecords((prev) => [...prev, newRecord]);
    setSelectedRecord(newRecord);
  };

  const handleDeleteRow = (index: number) => {
    setRecords((prev) => prev.filter((_, i) => i !== index));
    setSelectedRecord(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    const errors = validateRecords(selectedTable, records);
    setValidationErrors(errors);
    if (errors.length > 0) {
      setSaveMessage({ type: 'error', text: `Có ${errors.length} lỗi, không thể lưu. Sửa các ô báo lỗi trước.` });
      setSaving(false);
      return;
    }

    try {
      const token = session?.access_token;
      const res = await fetch(`${import.meta.env.VITE_TRIAL_API_URL || 'http://localhost:3001'}/api/trial/${selectedTable}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(records),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Save failed');
      }

      setSaveMessage({ type: 'success', text: `Đã lưu ${records.length} records cho "${selectedTable}"` });
      setOriginalRecords(JSON.parse(JSON.stringify(records)));
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: `Lỗi: ${err.message}` });
    }
    setSaving(false);
  };

  const hasChanges = JSON.stringify(records) !== JSON.stringify(originalRecords);

  // Derive columns from records
  const columns = useMemo(() => {
    const colSet = new Set<string>();
    colSet.add('id');
    records.forEach((r) => Object.keys(r).forEach((k) => colSet.add(k)));
    return Array.from(colSet).filter((k) => k !== 'created_at' && k !== 'updated_at' && !k.startsWith('_'));
  }, [records]);

  // Filter records by search
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const term = searchTerm.toLowerCase();
    return records.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(term))
    );
  }, [records, searchTerm]);

  // Error map for quick lookup
  const errorMap = useMemo(() => {
    const map: Record<string, ValidationError[]> = {};
    validationErrors.forEach((e) => {
      const key = `${e.row}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [validationErrors]);

  // Get apps for "preview" button
  const previewAppUrls: Record<string, string> = {
    Cashflow: import.meta.env.VITE_CASHFLOW_APP_URL || 'http://localhost:5174',
    'Kế toán': import.meta.env.VITE_ACCOUNTING_APP_URL || 'http://localhost:5178',
    'Nhân sự': import.meta.env.VITE_HR_APP_URL || 'http://localhost:5177',
    Kho: import.meta.env.VITE_INVENTORY_APP_URL || 'http://localhost:5175',
    'Vận hành': import.meta.env.VITE_OPERATIONS_APP_URL || 'http://localhost:3006',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-indigo-500" />
            Dữ liệu dùng thử
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý dữ liệu mẫu cho chế độ trial của tất cả apps
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSeed}
            disabled={loading}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {loading ? 'Đang tải...' : '⟳ Tải lại'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasChanges
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            saveMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {saveMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {saveMessage.text}
          <button onClick={() => setSaveMessage(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* App Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Chọn app để quản lý dữ liệu trial
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(APP_TABLES).map(([app, info]) => (
            <button
              key={app}
              onClick={() => {
                setSelectedApps((prev) => {
                  const next = new Set(prev);
                  if (next.has(app)) next.delete(app);
                  else next.add(app);
                  return next;
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedApps.has(app)
                  ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span>{info.icon}</span>
              {app}
            </button>
          ))}
        </div>
      </div>

      {/* Table Selector + Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Chọn bảng dữ liệu
          </label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="w-full border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {availableTables.map((t) => (
              <option key={t.name} value={t.name}>
                {t.label} ({t.name})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Tìm kiếm trong records
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Gõ để tìm..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main editor + Preview */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Grid Editor */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${showPreview ? 'lg:w-3/4' : 'w-full'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-700">
                {ALL_TABLES.find((t) => t.name === selectedTable)?.label || selectedTable}
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {records.length} records
              </span>
              {hasChanges && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                  Chưa lưu
                </span>
              )}
            </div>
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Thêm
            </button>
          </div>

          {/* Validation summary */}
          {validationErrors.length > 0 && (
            <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationErrors.length} lỗi — hover vào ô để xem chi tiết
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 z-10 bg-gray-50 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      #
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1">
                          {col}
                          {FIELD_TYPES[selectedTable]?.[col] && (
                            <span className="text-gray-300 font-normal">
                              ({FIELD_TYPES[selectedTable][col]})
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      <span className="sr-only">Xoá</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={columns.length + 2} className="text-center py-8 text-gray-400 text-sm">
                        Chưa có dữ liệu. Nhấn "Thêm" để tạo record mới.
                      </td>
                    </tr>
                  )}
                  {filteredRecords.map((rec, i) => {
                    const rowErrors = errorMap[`${i + 1}`] || [];
                    const hasError = rowErrors.length > 0;
                    const actualIndex = records.indexOf(rec);
                    return (
                      <tr
                        key={rec.id || i}
                        onClick={() => setSelectedRecord(rec)}
                        className={`transition-colors ${
                          selectedRecord?.id === rec.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        } ${hasError ? 'bg-red-50/30' : ''}`}
                      >
                        <td className="sticky left-0 z-10 bg-inherit px-2 py-1.5 text-xs text-gray-400">
                          {actualIndex + 1}
                        </td>
                        {columns.map((col) => {
                          const cellError = rowErrors.find((e) => e.field === col);
                          return (
                            <td key={col} className="px-2 py-1.5 min-w-[120px] max-w-[200px]">
                              <EditableCell
                                value={rec[col]}
                                field={col}
                                fieldType={FIELD_TYPES[selectedTable]?.[col]}
                                onChange={(val) => handleCellChange(actualIndex, col, val)}
                                error={cellError?.message}
                              />
                            </td>
                          );
                        })}
                        <td className="px-2 py-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRow(actualIndex);
                            }}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="lg:w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                Xem thử
              </h3>
              <button
                onClick={() => {
                  setSelectedApps(new Set([previewApp]));
                  setShowPreview(false);
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Ẩn
              </button>
            </div>

            {/* Preview of selected record */}
            <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <RecordPreview record={selectedRecord} table={selectedTable} />
            </div>

            {/* Open in trial */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Mở thử trong app:</p>
              {Object.entries(previewAppUrls).map(([app, url]) => {
                const hasTable = APP_TABLES[app]?.tables.some((t) => t.name === selectedTable);
                if (!hasTable && !selectedApps.has(app)) return null;
                const previewUrl = `${url}?trial_preview=true`;
                return (
                  <a
                    key={app}
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      // Clear existing trial session to force fresh seed data fetch
                      localStorage.removeItem('cashflow_trial_user');
                      sessionStorage.removeItem('trial_seed_cache');
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-base">{APP_TABLES[app]?.icon || '📱'}</span>
                    <span className="text-gray-700 group-hover:text-indigo-600">{app}</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-gray-300 group-hover:text-indigo-400" />
                  </a>
                );
              })}
            </div>

            {/* Diff indicator */}
            {hasChanges && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="text-xs text-amber-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Có thay đổi chưa lưu
                </div>
                <button
                  onClick={() => setRecords(JSON.parse(JSON.stringify(originalRecords)))}
                  className="mt-2 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Undo2 className="w-3 h-3" />
                  Khôi phục
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toggle preview */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
      >
        {showPreview ? '◀ Ẩn preview' : '▶ Hiện preview'}
      </button>

      {/* Open apps dropdown */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">🚀 Mở thử:</span>
        {Object.entries(previewAppUrls).map(([app, url]) => (
          <a
            key={app}
            href={`${url}?trial_preview=true`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              localStorage.removeItem('cashflow_trial_user');
              sessionStorage.removeItem('trial_seed_cache');
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            {APP_TABLES[app]?.icon} {app}
            <ExternalLink className="w-3 h-3 text-gray-300" />
          </a>
        ))}
      </div>
    </div>
  );
}
