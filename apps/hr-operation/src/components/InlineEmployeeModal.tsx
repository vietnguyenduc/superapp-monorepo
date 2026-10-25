import { useMemo, useState } from 'react';
import { Plus, UserPlus, X } from 'lucide-react';
import { hrService, type Department, type Employee } from '../services/hrService';
import { normalizeAssignmentEmployeeCode } from '../services/assignmentImportService';

interface InlineEmployeeModalProps {
  companyId: string;
  departments: Department[];
  employees: Employee[];
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

const today = () => new Date().toISOString().slice(0, 10);

const InlineEmployeeModal = ({ companyId, departments, employees, onClose, onCreated }: InlineEmployeeModalProps) => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [joinDate, setJoinDate] = useState(today());
  const [status, setStatus] = useState<Employee['status']>('active');
  const [baseSalary, setBaseSalary] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const duplicateCode = useMemo(() => {
    const code = normalizeAssignmentEmployeeCode(employeeCode);
    return Boolean(code && employees.some((employee) => normalizeAssignmentEmployeeCode(employee.employee_code) === code));
  }, [employeeCode, employees]);
  const salary = baseSalary.trim() ? Number(baseSalary.replace(/[^\d-]/g, '')) : 0;
  const fieldErrors = {
    employeeCode: !employeeCode.trim() ? 'Nhập mã nhân viên' : duplicateCode ? 'Mã nhân viên đã tồn tại' : '',
    fullName: !fullName.trim() ? 'Nhập họ và tên' : '',
    newDepartment: departmentId === '__new__' && !newDepartment.trim() ? 'Nhập tên phòng ban mới' : '',
    baseSalary: !Number.isFinite(salary) || salary < 0 ? 'Lương phải là số không âm' : '',
  };
  const hasErrors = Object.values(fieldErrors).some(Boolean);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setError('');
    if (hasErrors) return;
    setSaving(true);
    try {
      let resolvedDepartmentId = departmentId && departmentId !== '__new__' ? departmentId : undefined;
      if (departmentId === '__new__') {
        const [created] = await hrService.ensureDepartments([newDepartment], companyId);
        const refreshed = await hrService.getDepartments(companyId);
        resolvedDepartmentId = created?.id || refreshed.find((item) => item.name.trim().toLocaleLowerCase('vi') === newDepartment.trim().toLocaleLowerCase('vi'))?.id;
      }
      await hrService.bulkCreateEmployees([{
        employee_code: employeeCode.trim(),
        full_name: fullName.trim(),
        department_id: resolvedDepartmentId,
        position: position.trim() || undefined,
        join_date: joinDate,
        status,
        base_salary: salary,
      }], companyId);
      await onCreated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể tạo nhân viên. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';
  const errorText = (message: string) => submitted && message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="inline-employee-title">
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600"><UserPlus className="h-4 w-4" /> Nhập trực tiếp</div>
            <h2 id="inline-employee-title" className="mt-1 text-xl font-semibold text-slate-900">Thêm hồ sơ nhân viên</h2>
            <p className="mt-1 text-sm text-slate-500">Dùng khi nhập từng người và không cần file Excel hoặc SharePoint.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Các trường có dấu <span className="font-semibold">*</span> là bắt buộc. Dữ liệu sẽ được kiểm tra trước khi lưu vào công ty đang chọn.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Mã nhân viên *
              <input autoFocus value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} placeholder="Ví dụ: MDX001" className={inputClass} />
              {errorText(fieldErrors.employeeCode)}
            </label>
            <label className="text-sm font-medium text-slate-700">Họ và tên *
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nhập họ và tên" className={inputClass} />
              {errorText(fieldErrors.fullName)}
            </label>
            <label className="text-sm font-medium text-slate-700">Phòng ban
              <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className={inputClass}>
                <option value="">Chưa xếp phòng ban</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                <option value="__new__">＋ Tạo phòng ban mới</option>
              </select>
            </label>
            {departmentId === '__new__' ? (
              <label className="text-sm font-medium text-slate-700">Tên phòng ban mới *
                <input value={newDepartment} onChange={(event) => setNewDepartment(event.target.value)} placeholder="Ví dụ: Phát triển sản phẩm" className={inputClass} />
                {errorText(fieldErrors.newDepartment)}
              </label>
            ) : (
              <label className="text-sm font-medium text-slate-700">Chức danh
                <input value={position} onChange={(event) => setPosition(event.target.value)} placeholder="Ví dụ: Chuyên viên phát triển" className={inputClass} />
              </label>
            )}
            {departmentId === '__new__' && (
              <label className="text-sm font-medium text-slate-700 sm:col-start-2">Chức danh
                <input value={position} onChange={(event) => setPosition(event.target.value)} placeholder="Ví dụ: Chuyên viên phát triển" className={inputClass} />
              </label>
            )}
            <label className="text-sm font-medium text-slate-700">Ngày vào làm
              <input type="date" value={joinDate} onChange={(event) => setJoinDate(event.target.value)} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-slate-700">Trạng thái
              <select value={status} onChange={(event) => setStatus(event.target.value as Employee['status'])} className={inputClass}>
                <option value="active">Đang làm việc</option>
                <option value="on_leave">Tạm nghỉ</option>
                <option value="inactive">Đã nghỉ việc</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Lương cơ bản
              <input inputMode="numeric" value={baseSalary} onChange={(event) => setBaseSalary(event.target.value)} placeholder="Ví dụ: 15000000" className={inputClass} />
              {errorText(fieldErrors.baseSalary)}
              <span className="mt-1 block text-xs text-slate-500">Có thể để trống và cập nhật sau trong hồ sơ hoặc bảng lương.</span>
            </label>
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Hủy</button>
            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              <Plus className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Tạo nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InlineEmployeeModal;
