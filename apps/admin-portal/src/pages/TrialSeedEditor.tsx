/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FlaskConical, Save, Eye, Plus, Trash2, Undo2, Check, AlertCircle, X, Search, ExternalLink, Columns, Upload } from 'lucide-react';
import { useAuthContext } from '@superapp/iam';

const genId = () => crypto.randomUUID?.()?.slice(0, 8) || Math.random().toString(36).slice(2, 10);

// Field schema definition helper
interface FieldDef { name: string; label: string; type: string; required?: boolean; }

// Build schema using compact helper to keep file size manageable
const SCHEMA: Record<string, FieldDef[]> = {};

function def(table: string, fields: FieldDef[]) { SCHEMA[table] = fields; }

// ── Cashflow ──────────────────────────────────────────────────────
def('companies', [
  { name: 'name', label: 'Tên cty', type: 'string', required: true },
  { name: 'address', label: 'Địa chỉ', type: 'string' },
  { name: 'phone', label: 'SĐT', type: 'string' },
  { name: 'email', label: 'Email', type: 'string' },
  { name: 'is_active', label: 'Kích hoạt', type: 'boolean' },
]);
def('branches', [
  { name: 'name', label: 'Tên CN', type: 'string', required: true },
  { name: 'code', label: 'Mã CN', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
  { name: 'address', label: 'Địa chỉ', type: 'string' },
  { name: 'phone', label: 'SĐT', type: 'string' },
  { name: 'is_active', label: 'Kích hoạt', type: 'boolean' },
]);
def('users', [
  { name: 'email', label: 'Email', type: 'string', required: true },
  { name: 'full_name', label: 'Họ tên', type: 'string', required: true },
  { name: 'role', label: 'Vai trò', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
  { name: 'branch_id', label: 'CN ID', type: 'string' },
  { name: 'is_active', label: 'Kích hoạt', type: 'boolean' },
]);
def('customers', [
  { name: 'full_name', label: 'Tên KH', type: 'string', required: true },
  { name: 'customer_code', label: 'Mã KH', type: 'string' },
  { name: 'phone', label: 'SĐT', type: 'string' },
  { name: 'email', label: 'Email', type: 'string' },
  { name: 'total_balance', label: 'Dư nợ', type: 'number' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
  { name: 'is_active', label: 'Kích hoạt', type: 'boolean' },
]);
def('transactions', [
  { name: 'amount', label: 'Số tiền', type: 'number', required: true },
  { name: 'description', label: 'Mô tả', type: 'string' },
  { name: 'transaction_type_id', label: 'Loại GD', type: 'string' },
  { name: 'customer_id', label: 'KH ID', type: 'string' },
  { name: 'customer_name', label: 'Tên KH', type: 'string' },
  { name: 'bank_account_id', label: 'TK ID', type: 'string' },
  { name: 'transaction_date', label: 'Ngày GD', type: 'string' },
  { name: 'status', label: 'Trạng thái', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
  { name: 'branch_id', label: 'CN ID', type: 'string' },
]);
def('transaction_types', [
  { name: 'name', label: 'Tên loại', type: 'string', required: true },
  { name: 'math_factor', label: 'Hệ số', type: 'number' },
  { name: 'impact_type', label: 'Tác động', type: 'string' },
  { name: 'color', label: 'Màu', type: 'string' },
  { name: 'is_active', label: 'Kích hoạt', type: 'boolean' },
]);
def('bank_accounts', [
  { name: 'account_name', label: 'Tên TK', type: 'string', required: true },
  { name: 'account_number', label: 'Số TK', type: 'string' },
  { name: 'bank_name', label: 'Ngân hàng', type: 'string' },
  { name: 'balance', label: 'Số dư', type: 'number' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
  { name: 'is_active', label: 'Kích hoạt', type: 'boolean' },
]);

// ── Kho ───────────────────────────────────────────────────────────
def('products', [
  { name: 'name', label: 'Tên SP', type: 'string', required: true },
  { name: 'code', label: 'Mã SP', type: 'string' },
  { name: 'category', label: 'Danh mục', type: 'string' },
  { name: 'price', label: 'Đơn giá', type: 'number', required: true },
  { name: 'unit', label: 'ĐVT', type: 'string' },
  { name: 'stock', label: 'Tồn kho', type: 'number' },
  { name: 'description', label: 'Mô tả', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
  { name: 'is_active', label: 'Kích hoạt', type: 'boolean' },
]);
def('inventory_records', [
  { name: 'product_id', label: 'SP ID', type: 'string', required: true },
  { name: 'product_code', label: 'Mã SP', type: 'string' },
  { name: 'product_name', label: 'Tên SP', type: 'string' },
  { name: 'warehouse', label: 'Kho', type: 'string' },
  { name: 'input_date', label: 'Ngày nhập', type: 'string' },
  { name: 'quantity', label: 'Số lượng', type: 'number', required: true },
  { name: 'batch_number', label: 'Số lô', type: 'string' },
  { name: 'unit', label: 'ĐVT', type: 'string' },
  { name: 'notes', label: 'Ghi chú', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
]);
def('sales_records', [
  { name: 'product_id', label: 'SP ID', type: 'string', required: true },
  { name: 'product_code', label: 'Mã SP', type: 'string' },
  { name: 'quantity', label: 'Số lượng', type: 'number', required: true },
  { name: 'total', label: 'Thành tiền', type: 'number' },
  { name: 'customer_id', label: 'KH ID', type: 'string' },
  { name: 'sale_date', label: 'Ngày bán', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
]);
def('special_outbound_records', [
  { name: 'product_code', label: 'Mã SP', type: 'string' },
  { name: 'output_date', label: 'Ngày xuất', type: 'string' },
  { name: 'quantity', label: 'Số lượng', type: 'number', required: true },
  { name: 'reason', label: 'Lý do', type: 'string' },
  { name: 'notes', label: 'Ghi chú', type: 'string' },
  { name: 'status', label: 'Trạng thái', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
]);

// ── Nhân sự ──────────────────────────────────────────────────────
def('departments', [
  { name: 'name', label: 'Tên PB', type: 'string', required: true },
  { name: 'code', label: 'Mã PB', type: 'string' },
  { name: 'manager_id', label: 'Trưởng PB ID', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
]);
def('employees', [
  { name: 'full_name', label: 'Họ tên', type: 'string', required: true },
  { name: 'email', label: 'Email', type: 'string' },
  { name: 'phone', label: 'SĐT', type: 'string' },
  { name: 'department_id', label: 'PB ID', type: 'string' },
  { name: 'position', label: 'Chức vụ', type: 'string' },
  { name: 'salary', label: 'Lương', type: 'number' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
  { name: 'branch_id', label: 'CN ID', type: 'string' },
  { name: 'is_active', label: 'Kích hoạt', type: 'boolean' },
]);
def('shifts', [
  { name: 'name', label: 'Tên ca', type: 'string', required: true },
  { name: 'start_time', label: 'Bắt đầu', type: 'string' },
  { name: 'end_time', label: 'Kết thúc', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
]);
def('leave_requests', [
  { name: 'employee_id', label: 'NV ID', type: 'string' },
  { name: 'leave_type', label: 'Loại nghỉ', type: 'string' },
  { name: 'start_date', label: 'Ngày BD', type: 'string' },
  { name: 'end_date', label: 'Ngày KT', type: 'string' },
  { name: 'status', label: 'Trạng thái', type: 'string' },
  { name: 'reason', label: 'Lý do', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
]);
def('employee_shifts', [
  { name: 'employee_id', label: 'NV ID', type: 'string' },
  { name: 'shift_id', label: 'Ca ID', type: 'string' },
  { name: 'date', label: 'Ngày', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
]);
def('attendance_logs', [
  { name: 'employee_id', label: 'NV ID', type: 'string' },
  { name: 'date', label: 'Ngày', type: 'string' },
  { name: 'check_in', label: 'Check-in', type: 'string' },
  { name: 'check_out', label: 'Check-out', type: 'string' },
  { name: 'status', label: 'TT', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
]);
def('payrolls', [
  { name: 'employee_id', label: 'NV ID', type: 'string' },
  { name: 'month', label: 'Tháng', type: 'string' },
  { name: 'basic_salary', label: 'Lương CB', type: 'number' },
  { name: 'allowances', label: 'Phụ cấp', type: 'number' },
  { name: 'deductions', label: 'Khấu trừ', type: 'number' },
  { name: 'net_salary', label: 'Thực nhận', type: 'number' },
  { name: 'status', label: 'TT', type: 'string' },
  { name: 'company_id', label: 'Cty ID', type: 'string' },
]);

// ── Vận hành ──────────────────────────────────────────────────────
def('operation_tickets', [
  { name: 'title', label: 'Tiêu đề', type: 'string', required: true },
  { name: 'description', label: 'Mô tả', type: 'string' },
  { name: 'status', label: 'TT', type: 'string' },
  { name: 'priority', label: 'Ưu tiên', type: 'string' },
  { name: 'assigned_to', label: 'Giao cho', type: 'string' },
]);
def('operation_assets', [
  { name: 'name', label: 'Tên TS', type: 'string', required: true },
  { name: 'category', label: 'Loại', type: 'string' },
  { name: 'location', label: 'VT', type: 'string' },
  { name: 'status', label: 'TT', type: 'string' },
  { name: 'price', label: 'Giá', type: 'number' },
]);
def('operation_consumables', [
  { name: 'name', label: 'Tên VT', type: 'string', required: true },
  { name: 'location', label: 'VT', type: 'string' },
  { name: 'quantity', label: 'SL', type: 'number', required: true },
  { name: 'unit', label: 'ĐVT', type: 'string' },
]);

// ── Labels & App Map ──────────────────────────────────────────────
const LABELS: Record<string, string> = {
  companies:'Cty', branches:'CN', users:'User', customers:'KH',
  transactions:'GD', transaction_types:'Loại GD', bank_accounts:'TK NH',
  products:'SP', inventory_records:'Tồn kho', sales_records:'Bán hàng',
  special_outbound_records:'XK ĐB',
  departments:'PB', employees:'NV', shifts:'Ca', leave_requests:'Đơn nghỉ',
  employee_shifts:'Phân ca', attendance_logs:'Chấm công',
  payrolls:'Bảng lương', payroll_items:'Chi tiết lương',
  operation_tickets:'Ticket', operation_assets:'TS', operation_consumables:'VT',
};

const APP_MAP: Record<string, { icon: string; tables: string[] }> = {
  Cashflow: { icon: '💰', tables: ['companies','branches','users','customers','transactions','transaction_types','bank_accounts'] },
  Kho: { icon: '📦', tables: ['products','inventory_records','sales_records','special_outbound_records','approval_workflows','approval_logs'] },
  'Nhân sự': { icon: '👤', tables: ['departments','employees','shifts','employee_shifts','attendance_logs','leave_requests','payrolls','payroll_items'] },
  'Vận hành': { icon: '🔧', tables: ['operation_tickets','operation_assets','operation_consumables','operation_documents','operation_emergency_contacts','operation_training_courses','operation_training_materials','operation_training_progress','operation_chat_groups','operation_chat_messages','operation_checkins','operation_training_questions','operation_chat_members'] },
};

const ALL_TBL = Object.entries(APP_MAP).flatMap(([a, i]) => i.tables.map((n) => ({ name: n, label: LABELS[n] || n, app: a })));
const API_URL = () => import.meta.env.VITE_TRIAL_API_URL || 'http://localhost:3001';

// ── Editable Cell ─────────────────────────────────────────────────
function EditableCell({ value, fieldType, onChange, error }: { value: any; fieldType: string; onChange: (v: any) => void; error?: string }) {
  const [s, setS] = useState(value != null ? String(value) : '');
  useEffect(() => { setS(value != null ? String(value) : ''); }, [value]);
  const commit = () => {
    let v: any = s;
    if (fieldType === 'number') v = s === '' ? undefined : Number(s);
    else if (s === '') v = undefined;
    onChange(v);
  };
  return (
    <div className="relative">
      <input value={s} onChange={(e) => setS(e.target.value)} onBlur={commit}
        className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
        placeholder={fieldType === 'number' ? '0' : '...'} />
      {error && <div className="absolute -bottom-5 left-0 text-xs text-red-500 whitespace-nowrap">{error}</div>}
    </div>
  );
}

function RecordPreview({ record }: { record: Record<string, any> | null }) {
  if (!record) return <div className="text-center text-gray-400 py-6 text-sm">Chọn record</div>;
  return (
    <div className="space-y-1">
      {Object.entries(record).filter(([k]) => !['id', 'created_at', 'updated_at'].includes(k)).slice(0, 12).map(([k, v]) => (
        <div key={k} className="flex gap-1.5">
          <span className="text-xs font-medium text-gray-500 w-20 shrink-0 truncate">{k}</span>
          <span className="text-sm break-words">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function TrialSeedEditor() {
  const { session } = useAuthContext();
  const [apps, setApps] = useState<Set<string>>(new Set(['Cashflow', 'Kho']));
  const [table, setTable] = useState('inventory_records');
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [orig, setOrig] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [side, setSide] = useState(true);
  const [showSchema, setShowSchema] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const avail = useMemo(() => {
    const s = new Set<string>();
    apps.forEach((a) => APP_MAP[a]?.tables.forEach((t) => s.add(t)));
    return ALL_TBL.filter((t) => s.has(t.name));
  }, [apps]);
  useEffect(() => { if (avail.length > 0 && !avail.find((t) => t.name === table)) setTable(avail[0].name); }, [avail]);

  const loadData = useCallback(async () => {
    setLoading(true); setMsg(null);
    try { const r = await globalThis.fetch(API_URL() + '/api/trial/' + table); const j = await r.json(); const d = j.data || []; setRows(d); setOrig(JSON.parse(JSON.stringify(d))); }
    catch { setMsg({ ok: false, text: 'Lỗi kết nối API. Chạy API server?' }); setRows([]); setOrig([]); }
    setLoading(false);
  }, [table]);
  useEffect(() => { loadData(); }, [loadData]);

  const cols = useMemo(() => {
    const sc = ['id', ...(SCHEMA[table] || []).map((f) => f.name).filter((n) => n !== 'id')];
    const extra = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => extra.add(k)));
    ['id', 'created_at', 'updated_at'].forEach((k) => extra.delete(k));
    sc.forEach((c) => extra.delete(c));
    return [...sc, ...Array.from(extra).filter((k) => !k.startsWith('_'))];
  }, [table, rows]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
  }, [rows, search]);

  const changed = JSON.stringify(rows) !== JSON.stringify(orig);

  const handleCell = (idx: number, field: string, val: any) => {
    setRows((prev) => { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n; });
  };

  const handleAdd = () => {
    const schema = SCHEMA[table] || [];
    const rec: Record<string, any> = { id: 'new-' + genId() };
    schema.forEach((f) => { if (!['id', 'created_at', 'updated_at'].includes(f.name)) rec[f.name] = ''; });
    setRows((prev) => [...prev, rec]);
    setSelId(rec.id);
  };

  const handleDel = (idx: number) => {
    const id = rows[idx]?.id;
    setRows((prev) => prev.filter((_, i) => i !== idx));
    if (selId === id) setSelId(null);
  };

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      const token = session?.access_token;
      const r = await fetch(API_URL() + '/api/trial/' + table, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify(rows),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Lưu thất bại');
      setMsg({ ok: true, text: 'Đã lưu ' + rows.length + ' records' });
      setOrig(JSON.parse(JSON.stringify(rows)));
    } catch (err: any) { setMsg({ ok: false, text: 'Lỗi: ' + err.message }); }
    setSaving(false);
  };

  const handleImport = () => {
    setImportErrors([]);
    let data: any[];
    try {
      // Support both JSON array and TSV (tab-separated)
      const trimmed = importText.trim();
      if (trimmed.startsWith('[')) {
        data = JSON.parse(trimmed);
        if (!Array.isArray(data)) throw new Error('Phải là mảng JSON');
      } else {
        // TSV: first line = headers, rest = rows
        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) throw new Error('Cần ít nhất header + 1 dòng dữ liệu');
        const headers = lines[0].split('\t');
        data = lines.slice(1).map((line) => {
          const vals = line.split('\t');
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => { obj[h.trim()] = vals[i]?.trim() || ''; });
          return obj;
        });
      }
    } catch (e: any) {
      setImportErrors(['Lỗi parse: ' + e.message]);
      return;
    }

    // Validate & merge
    const schema = SCHEMA[table] || [];
    const errors: string[] = [];
    const valid: Record<string, any>[] = [];
    data.forEach((item, i) => {
      // Auto-generate id if missing
      if (!item.id) item.id = 'imp-' + genId();
      // Type coercion for schema fields
      schema.forEach((f) => {
        if (item[f.name] !== undefined && f.type === 'number') {
          const n = Number(item[f.name]);
          if (isNaN(n)) errors.push('Dòng ' + (i + 1) + ': "' + f.name + '" không phải số');
          else item[f.name] = n;
        }
      });
      valid.push(item);
    });

    if (errors.length > 0) {
      setImportErrors(errors);
      return;
    }

    setRows((prev) => [...prev, ...valid]);
    setImportErrors([]);
    setImportText('');
    setShowImport(false);
    setMsg({ ok: true, text: 'Đã thêm ' + valid.length + ' records từ import' });
  };

  const selected = rows.find((r) => r.id === selId);
  const pvUrls: Record<string, string> = {
    Cashflow: import.meta.env.VITE_CASHFLOW_APP_URL || 'http://localhost:5174',
    Kho: import.meta.env.VITE_INVENTORY_APP_URL || 'http://localhost:5175',
    'Nhân sự': import.meta.env.VITE_HR_APP_URL || 'http://localhost:5177',
    'Vận hành': import.meta.env.VITE_OPERATIONS_APP_URL || 'http://localhost:3006',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-indigo-500" /> Dữ liệu dùng thử
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Quản lý dữ liệu trial — tất cả apps</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetch} disabled={loading}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{loading ? '...' : '↻'}</button>
          <button onClick={handleSave} disabled={saving || !changed}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ' + (changed ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
            <Save className="w-4 h-4" />{saving ? '...' : 'Lưu'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={'flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ' + (msg.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
          {msg.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* App pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(APP_MAP).map(([app, info]) => (
          <button key={app} onClick={() => setApps((p) => { const n = new Set(p); if (n.has(app)) n.delete(app); else n.add(app); return n; })}
            className={'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (apps.has(app) ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100')}>
            <span>{info.icon}</span>{app}
          </button>
        ))}
      </div>

      {/* Table + search + buttons */}
      <div className="flex items-center gap-3">
        <select value={table} onChange={(e) => setTable(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          {avail.map((t) => <option key={t.name} value={t.name}>{t.label}</option>)}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button onClick={() => setShowSchema(!showSchema)}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-200 rounded-lg">
          <Columns className="w-3 h-3" />{showSchema ? 'Ẩn' : 'Xem'} schema
        </button>
        <button onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
          <Plus className="w-3.5 h-3.5" /> Thêm
        </button>
        <button onClick={() => { setShowImport(!showImport); setImportErrors([]); setImportText(''); }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
          <Upload className="w-3.5 h-3.5" /> Nhập hàng loạt
        </button>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="bg-white border border-emerald-200 rounded-xl overflow-hidden">
          <div className="bg-emerald-50 px-4 py-2 flex items-center justify-between border-b border-emerald-100">
            <span className="text-sm font-medium text-emerald-700 flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> Nhập hàng loạt — {ALL_TBL.find((t) => t.name === table)?.label || table}
            </span>
            <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-500">
              Paste <strong>JSON array</strong> hoặc <strong>TSV (tab-separated)</strong> từ Excel/Google Sheets.
              Dòng đầu tiên là tên trường (theo schema bên cạnh).
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
                  placeholder={'[' +
  '\n  {"product_id":"prod-1","product_code":"SP001","product_name":"Bưởi","warehouse":"Kho chính","quantity":100}' +
  '\n]}'}
                  className="w-full h-40 px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  spellCheck={false} />
              </div>
              <div className="w-48 shrink-0 bg-gray-50 rounded-lg p-2 text-xs text-gray-500 overflow-y-auto max-h-40">
                <div className="font-medium text-gray-700 mb-1">Các trường:</div>
                {(SCHEMA[table] || []).map((f) => (
                  <div key={f.name} className="flex items-center gap-1">
                    <span className="font-mono text-indigo-600">{f.name}</span>
                    <span className="text-gray-400">({f.type})</span>
                    {f.required && <span className="text-red-400">*</span>}
                  </div>
                ))}
              </div>
            </div>
            {importErrors.length > 0 && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 space-y-0.5">
                {importErrors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setImportText(''); setImportErrors([]); }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Xoá</button>
              <button onClick={handleImport} disabled={!importText.trim()}
                className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schema panel */}
      {showSchema && SCHEMA[table] && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs">
          <table className="w-full">
            <thead><tr className="text-gray-400 uppercase"><th className="pb-1 pr-4">Trường</th><th className="pb-1 pr-4">Kiểu</th><th className="pb-1">Bắt buộc</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {SCHEMA[table].map((f) => (
                <tr key={f.name}><td className="py-1 pr-4 font-mono text-indigo-600">{f.name}</td><td className="py-1 pr-4 text-gray-500">{f.type}</td><td className="py-1">{f.required ? '✓' : ''}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-gray-400">{rows.length} records · {cols.length - 1} trường</div>
        </div>
      )}

      {/* Main grid */}
      <div className="flex gap-4">
        <div className={side ? 'w-3/4' : 'w-full'}>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50">
                    <th className="px-2 py-2 text-xs text-gray-500 w-8">#</th>
                    {cols.map((c) => {
                      const fd = SCHEMA[table]?.find((f) => f.name === c);
                      const isExtra = !fd && c !== 'id';
                      return (
                        <th key={c} className={'px-2 py-2 text-left text-xs font-medium uppercase whitespace-nowrap min-w-[120px] ' + (isExtra ? 'text-purple-500' : 'text-gray-500')}>
                          {fd?.label || c}{fd?.type ? <span className="text-gray-300 font-normal ml-1 text-[10px]">({fd.type})</span> : ''}{fd?.required ? <span className="text-red-400 ml-0.5">*</span> : ''}
                        </th>
                      );
                    })}
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 && (
                    <tr><td colSpan={cols.length + 2} className="text-center py-12 text-gray-400 text-sm">
                      Chưa có dữ liệu.{(SCHEMA[table]?.length ? ' Bảng này có ' + SCHEMA[table].length + ' trường.' : '')}
                      <button onClick={handleAdd} className="block mx-auto mt-2 text-indigo-600 font-medium">+ Thêm record đầu tiên</button>
                    </td></tr>
                  )}
                  {filtered.map((rec, i) => {
                    const idx = rows.indexOf(rec);
                    return (
                      <tr key={rec.id || i} onClick={() => setSelId(rec.id)}
                        className={'cursor-pointer transition-colors ' + (selId === rec.id ? 'bg-indigo-50' : 'hover:bg-gray-50')}>
                        <td className="px-2 py-1.5 text-xs text-gray-400">{idx + 1}</td>
                        {cols.map((c) => (
                          <td key={c} className="px-2 py-1.5 max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                            <EditableCell value={rec[c]} fieldType={SCHEMA[table]?.find((f) => f.name === c)?.type || 'string'} onChange={(v) => handleCell(idx, c, v)} />
                          </td>
                        ))}
                        <td onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleDel(idx)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side panel */}
        {side && (
          <div className="w-1/4 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Eye className="w-4 h-4" /> Xem thử</h3>
              <button onClick={() => setSide(false)} className="text-xs text-gray-400 hover:text-gray-600">Ẩn</button>
            </div>
            <RecordPreview record={selected} />
            {changed && (
              <div className="p-2 bg-amber-50 rounded border border-amber-100 text-xs text-amber-700">
                <div className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Chưa lưu</div>
                <button onClick={() => { setRows(JSON.parse(JSON.stringify(orig))); setSelId(null); }}
                  className="text-amber-600 hover:text-amber-700 font-medium mt-1 flex items-center gap-1"><Undo2 className="w-3 h-3" /> Khôi phục</button>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">🚀 Mở thử:</p>
              {Object.entries(pvUrls).map(([app, url]) => {
                if (!APP_MAP[app]?.tables.includes(table)) return null;
                return (
                  <a key={app} href={url + '?trial_preview=true'} target="_blank" rel="noopener noreferrer"
                    onClick={() => { localStorage.removeItem('cashflow_trial_user'); sessionStorage.removeItem('trial_seed_cache'); }}
                    className="flex items-center gap-1.5 px-2 py-1 text-sm rounded hover:bg-gray-50 transition-colors group">
                    <span>{APP_MAP[app]?.icon || '📱'}</span>
                    <span className="text-gray-700 group-hover:text-indigo-600">{app}</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-gray-300" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!side && <button onClick={() => setSide(true)} className="text-sm text-gray-400 hover:text-gray-600">▶ Hiện preview</button>}
    </div>
  );
}
