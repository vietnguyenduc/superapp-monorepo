import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import type { Employee } from '../services/hrService';
import { hrService } from '../services/hrService';
import {
  isApplicableAssignment,
  parseAssignmentWorkbook,
  type AssignmentAction,
  type AssignmentImportRow,
} from '../services/assignmentImportService';

interface Props {
  companyId: string;
  employees: Employee[];
  onClose: () => void;
  onApplied: () => Promise<void> | void;
}

const actionLabel: Record<AssignmentAction, string> = {
  insert: 'Thêm mới',
  update: 'Cập nhật',
  unchanged: 'Không đổi',
  conflict: 'Xung đột',
};

const actionTone: Record<AssignmentAction, string> = {
  insert: 'bg-blue-50 text-blue-700',
  update: 'bg-amber-50 text-amber-700',
  unchanged: 'bg-slate-100 text-slate-600',
  conflict: 'bg-red-50 text-red-700',
};

const AssignmentImportModal = ({ companyId, employees, onClose, onApplied }: Props) => {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<AssignmentImportRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const counts = useMemo(() => rows.reduce<Record<AssignmentAction, number>>((result, row) => {
    result[row.action] += 1;
    return result;
  }, { insert: 0, update: 0, unchanged: 0, conflict: 0 }), [rows]);
  const applicable = rows.filter(isApplicableAssignment);

  const chooseFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (!/\.(xlsx|xls)$/i.test(file.name)) throw new Error('Hãy chọn file Excel chứa bảng phân công.');
      const parsed = parseAssignmentWorkbook(await file.arrayBuffer(), employees);
      if (!parsed.length) throw new Error('File không có dòng phân công nào.');
      setFileName(file.name);
      setRows(parsed);
    } catch (cause) {
      setRows([]);
      setError(cause instanceof Error ? cause.message : 'Không thể đọc file phân công.');
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!applicable.length) return;
    setBusy(true);
    setError('');
    try {
      await hrService.applyAssignmentImport(applicable, companyId);
      setSuccess(`Đã áp dụng ${applicable.length} thay đổi phân công từ ${fileName}.`);
      await onApplied();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể cập nhật phân công.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="assignment-import-title">
      <div className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-6xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div><h2 id="assignment-import-title" className="text-lg font-semibold text-slate-900">Cập nhật phân công & chức danh</h2><p className="mt-1 text-sm text-slate-500">Đối chiếu theo mã nhân viên trước khi cập nhật cơ cấu tổ chức.</p></div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
          <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-5 text-center">
            <Upload className="mx-auto h-7 w-7 text-indigo-500" />
            <div className="mt-2 font-medium text-slate-900">Chọn file Job Titles / Assignment</div>
            <p className="mt-1 text-sm text-slate-500">App đọc sheet Database và so sánh mã, phòng ban, chức danh, lương và cấp trên.</p>
            <label className="mt-3 inline-flex cursor-pointer rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white">
              {busy ? 'Đang xử lý...' : 'Chọn file Excel'}
              <input type="file" accept=".xlsx,.xls" className="sr-only" disabled={busy} onChange={(event) => void chooseFile(event.target.files?.[0])} />
            </label>
          </div>

          {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          {success && <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</div>}

          {rows.length > 0 && (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 font-medium text-slate-900"><FileSpreadsheet className="h-4 w-4" />{fileName}</div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {(Object.keys(actionLabel) as AssignmentAction[]).map((action) => <div key={action} className={`rounded-lg px-2 py-1.5 ${actionTone[action]}`}><strong className="block text-sm">{counts[action]}</strong>{actionLabel[action]}</div>)}
                </div>
              </div>
              <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-[920px] w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Dòng</th><th className="px-3 py-3">Nhân viên</th><th className="px-3 py-3">Chức danh</th><th className="px-3 py-3">Phòng / Bộ phận</th><th className="px-3 py-3">Cấp trên</th><th className="px-3 py-3">Thay đổi</th><th className="px-3 py-3">Kiểm tra</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={`${row.rowNumber}-${row.employeeCode}`} className={row.action === 'conflict' ? 'bg-red-50/50' : ''}><td className="px-3 py-3 text-slate-500">{row.rowNumber}</td><td className="px-3 py-3"><div className="font-medium">{row.fullName}</div><div className="text-xs text-slate-500">{row.employeeCode}</div></td><td className="px-3 py-3"><div>{row.position || '—'}</div><div className="text-xs text-slate-500">{row.grade && `Ngạch ${row.grade}`}{row.level && ` · Cấp ${row.level}`}</div></td><td className="px-3 py-3"><div>{row.departmentName || '—'}</div><div className="text-xs text-slate-500">{row.teamName}</div></td><td className="px-3 py-3">{row.managerName || '—'}</td><td className="px-3 py-3"><span className={`rounded-md px-2 py-1 text-xs font-medium ${actionTone[row.action]}`}>{actionLabel[row.action]}</span></td><td className="max-w-xs px-3 py-3 text-xs">{row.errors.length ? <span className="text-red-700">{row.errors.join('; ')}</span> : row.warnings.length ? <span className="text-amber-700">{row.warnings.join('; ')}</span> : <span className="text-emerald-700">Hợp lệ</span>}</td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex sm:justify-end sm:px-6">
          <button onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">Đóng</button>
          <button disabled={busy || applicable.length === 0} onClick={apply} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy ? 'Đang áp dụng...' : `Áp dụng ${applicable.length || ''} thay đổi`}</button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentImportModal;
