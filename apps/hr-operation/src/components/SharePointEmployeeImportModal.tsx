import { useEffect, useMemo, useState } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { AlertCircle, CheckCircle2, ExternalLink, FileSpreadsheet, LogIn, X } from 'lucide-react';
import type { Department, Employee } from '../services/hrService';
import { hrService } from '../services/hrService';
import {
  isImportableRow,
  inspectEmployeeWorkbook,
  parseEmployeeWorkbook,
  type EmployeeSheetOption,
  type EmployeeImportRow,
} from '../services/employeeImportService';
import { sharePointService } from '../services/sharePointService';

interface Props {
  departments: Department[];
  employees: Employee[];
  companyId: string;
  onClose: () => void;
  onImported: () => Promise<void> | void;
}

const SharePointEmployeeImportModal = ({ departments, employees, companyId, onClose, onImported }: Props) => {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<EmployeeImportRow[]>([]);
  const [workbookContent, setWorkbookContent] = useState<ArrayBuffer | null>(null);
  const [sheetOptions, setSheetOptions] = useState<EmployeeSheetOption[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!sharePointService.isConfigured()) return;
    sharePointService.getSignedInAccount().then(setAccount).catch(() => undefined);
  }, []);

  const importableRows = useMemo(() => rows.filter(isImportableRow), [rows]);
  const blockedCount = rows.filter((row) => row.errors.length > 0).length;
  const skippedCount = rows.filter((row) =>
    row.warnings.some((warning) => warning.startsWith('Mã đã tồn tại')),
  ).length;

  const signIn = async () => {
    setBusy(true);
    setError('');
    try {
      setAccount(await sharePointService.signIn());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đăng nhập Microsoft.');
    } finally {
      setBusy(false);
    }
  };

  const loadPreview = async () => {
    if (!account) return setError('Hãy đăng nhập Microsoft trước.');
    if (!shareUrl.trim()) return setError('Hãy dán link file SharePoint.');
    setBusy(true);
    setError('');
    setSuccess('');
    setRows([]);
    try {
      const file = await sharePointService.downloadSharedFile(shareUrl, account);
      const options = inspectEmployeeWorkbook(file.content);
      if (!options.length) throw new Error('Không tìm thấy sheet danh sách có cả cột mã và tên nhân viên.');
      const defaultSheet = options[0].name;
      setFileName(file.name);
      setWorkbookContent(file.content);
      setSheetOptions(options);
      setSelectedSheet(defaultSheet);
      setRows(parseEmployeeWorkbook(file.content, departments, employees, defaultSheet));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đọc file SharePoint.');
    } finally {
      setBusy(false);
    }
  };

  const changeSheet = (sheetName: string) => {
    setSelectedSheet(sheetName);
    setError('');
    if (!workbookContent) return;
    try {
      setRows(parseEmployeeWorkbook(workbookContent, departments, employees, sheetName));
    } catch (cause) {
      setRows([]);
      setError(cause instanceof Error ? cause.message : 'Không thể đọc sheet đã chọn.');
    }
  };

  const importEmployees = async () => {
    if (!importableRows.length) return;
    setBusy(true);
    setError('');
    try {
      await hrService.bulkCreateEmployees(
        importableRows.map((row) => ({
          employee_code: row.employeeCode,
          full_name: row.fullName,
          base_salary: row.baseSalary,
          status: row.status,
          join_date: row.joinDate || new Date().toISOString().slice(0, 10),
          department_id: row.departmentId,
        })),
        companyId,
      );
      setSuccess(`Đã nhập ${importableRows.length} nhân viên từ ${fileName}.`);
      setRows([]);
      await onImported();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể nhập nhân viên.';
      setError(message.includes('duplicate') ? 'Có mã nhân viên đã tồn tại. Hãy tải lại dữ liệu và thử lại.' : message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="sharepoint-title">
      <div className="bg-white w-full sm:max-w-5xl max-h-[95vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="sharepoint-title" className="text-lg font-semibold text-slate-900">Nhập nhân viên từ SharePoint</h2>
            <p className="text-sm text-slate-500 mt-1">Đăng nhập Microsoft, dán link file rồi kiểm tra dữ liệu trước khi nhập.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {!sharePointService.isConfigured() ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Chưa cấu hình Microsoft</div>
              <p className="mt-1">Quản trị viên cần thêm Microsoft Client ID và Tenant ID cho ứng dụng HR trước khi sử dụng.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900">1. Tài khoản Microsoft</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {account ? `Đã đăng nhập: ${account.username}` : 'Chỉ yêu cầu quyền đọc file mà tài khoản của bạn được phép truy cập.'}
                  </div>
                </div>
                {!account && (
                  <button disabled={busy} onClick={signIn} className="inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-50">
                    <LogIn className="w-4 h-4" /> Đăng nhập Microsoft
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <div className="font-medium text-slate-900">2. Link file SharePoint</div>
              <p className="text-sm text-slate-500 mt-1">Hỗ trợ Excel hoặc CSV. File cần có cột Mã nhân viên và Họ tên.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={shareUrl}
                onChange={(event) => setShareUrl(event.target.value)}
                placeholder="https://...sharepoint.com/..."
                className="min-w-0 flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button disabled={busy || !account} onClick={loadPreview} className="inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">
                <ExternalLink className="w-4 h-4" /> {busy ? 'Đang tải...' : 'Đọc và xem trước'}
              </button>
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
          {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />{success}</div>}

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-900 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> {fileName}</div>
                  <p className="text-sm text-slate-500 mt-1">{importableRows.length} sẵn sàng · {skippedCount} bỏ qua · {blockedCount} cần sửa</p>
                </div>
                {sheetOptions.length > 1 && (
                  <label className="text-sm text-slate-600">
                    Sheet dữ liệu
                    <select value={selectedSheet} onChange={(event) => changeSheet(event.target.value)} className="mt-1 sm:ml-2 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800">
                      {sheetOptions.map((option) => (
                        <option key={option.name} value={option.name}>{option.name} ({option.dataRowCount} dòng)</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr><th className="px-3 py-3">Dòng</th><th className="px-3 py-3">Mã NV</th><th className="px-3 py-3">Họ tên</th><th className="px-3 py-3">Phòng ban / Chức danh</th><th className="px-3 py-3 text-right">Lương cơ bản</th><th className="px-3 py-3">Kết quả</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                      <tr key={`${row.rowNumber}-${row.employeeCode}`} className={row.errors.length ? 'bg-red-50/50' : ''}>
                        <td className="px-3 py-3 text-slate-500">{row.rowNumber}</td>
                        <td className="px-3 py-3 font-medium">{row.employeeCode || '—'}</td>
                        <td className="px-3 py-3">{row.fullName || '—'}</td>
                        <td className="px-3 py-3"><div>{row.departmentName || 'Chưa xếp phòng'}</div>{row.positionName && <div className="text-xs text-slate-500 mt-0.5">{row.positionName}</div>}</td>
                        <td className="px-3 py-3 text-right">{row.baseSalary.toLocaleString('vi-VN')} ₫</td>
                        <td className="px-3 py-3 max-w-xs">
                          {row.errors.length > 0 ? <span className="text-red-700">{row.errors.join('; ')}</span> : row.warnings.length > 0 ? <span className="text-amber-700">{row.warnings.join('; ')}</span> : <span className="text-emerald-700">Sẵn sàng</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 grid grid-cols-2 sm:flex justify-end gap-2 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2.5 border border-slate-300 bg-white rounded-lg text-sm font-medium text-slate-700">Đóng</button>
          <button disabled={busy || importableRows.length === 0} onClick={importEmployees} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {busy ? 'Đang nhập...' : `Nhập ${importableRows.length || ''} nhân viên`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePointEmployeeImportModal;
