import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Crown, Network, Search, UserRound, Users } from 'lucide-react';
import { useCompany } from '@superapp/iam';
import { hrService, type Department, type Employee } from '../services/hrService';
import AssignmentImportModal from '../components/AssignmentImportModal';

interface UnitCardProps {
  department: Department;
  departments: Department[];
  employees: Employee[];
  depth?: number;
}

const UnitCard = ({ department, departments, employees, depth = 0 }: UnitCardProps) => {
  const children = departments.filter((item) => item.parent_id === department.id);
  const members = employees.filter((employee) => employee.department_id === department.id);
  const manager = employees.find((employee) => employee.id === department.manager_id);

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-indigo-200 pl-4 sm:ml-8 sm:pl-6' : ''}>
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Building2 className="h-4 w-4" /></span>
              <div>
                <h3 className="font-semibold text-slate-900">{department.name}</h3>
                <p className="text-xs text-slate-500">{members.length} nhân sự · {children.length} đơn vị trực thuộc</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <Crown className="h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wide text-amber-700">Phụ trách</div>
              <div className="truncate font-medium">{manager?.full_name || 'Chưa phân công'}</div>
            </div>
          </div>
        </div>

        {members.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((employee) => (
              <div key={employee.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-indigo-700 ring-1 ring-slate-200">
                  {employee.full_name.split(' ').slice(-1)[0]?.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-800">{employee.full_name}</div>
                  <div className="truncate text-xs text-slate-500">{employee.position || 'Chưa có chức danh'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {children.length > 0 && (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <UnitCard key={child.id} department={child} departments={departments} employees={employees} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const OrganizationChart = () => {
  const { selectedCompany, loading: companyLoading } = useCompany();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'units' | 'reporting'>('units');
  const [search, setSearch] = useState('');
  const [showAssignmentImport, setShowAssignmentImport] = useState(false);

  const load = useCallback(async () => {
    if (!selectedCompany?.id) {
      setDepartments([]);
      setEmployees([]);
      setLoading(companyLoading);
      return;
    }
    setLoading(true);
    try {
      const [departmentRows, employeeRows] = await Promise.all([
        hrService.getDepartments(selectedCompany.id),
        hrService.getEmployees(selectedCompany.id),
      ]);
      setDepartments(departmentRows);
      setEmployees(employeeRows);
    } finally {
      setLoading(false);
    }
  }, [companyLoading, selectedCompany?.id]);

  useEffect(() => { void load(); }, [load]);

  const roots = useMemo(() => {
    const ids = new Set(departments.map((item) => item.id));
    return departments.filter((item) => !item.parent_id || !ids.has(item.parent_id));
  }, [departments]);

  const reportingRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('vi');
    return employees.filter((employee) => {
      const manager = employees.find((candidate) => candidate.id === employee.manager_id);
      return !term || [employee.full_name, employee.position, employee.department?.name, manager?.full_name]
        .some((value) => value?.toLocaleLowerCase('vi').includes(term));
    });
  }, [employees, search]);

  const assignedCount = employees.filter((employee) => employee.department_id).length;
  const managerCount = new Set(employees.map((employee) => employee.manager_id).filter(Boolean)).size;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-600"><Network className="h-4 w-4" /> Organization design</div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Cơ cấu tổ chức</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi đơn vị, người phụ trách, chức danh và tuyến báo cáo trong một nơi.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <button disabled={!selectedCompany} onClick={() => setShowAssignmentImport(true)} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-50">Cập nhật phân công</button>
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <button onClick={() => setView('units')} className={`rounded-md px-3 py-2 text-sm font-medium ${view === 'units' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}>Đơn vị</button>
            <button onClick={() => setView('reporting')} className={`rounded-md px-3 py-2 text-sm font-medium ${view === 'reporting' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}>Tuyến quản lý</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Đơn vị', value: departments.length, icon: Building2, tone: 'text-indigo-600 bg-indigo-50' },
          { label: 'Nhân sự', value: employees.length, icon: Users, tone: 'text-blue-600 bg-blue-50' },
          { label: 'Đã xếp đơn vị', value: assignedCount, icon: UserRound, tone: 'text-emerald-600 bg-emerald-50' },
          { label: 'Quản lý trực tiếp', value: managerCount, icon: Crown, tone: 'text-amber-600 bg-amber-50' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`inline-flex rounded-lg p-2 ${item.tone}`}><item.icon className="h-4 w-4" /></div>
            <div className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Đang dựng cơ cấu tổ chức...</div>
      ) : departments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Network className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-900">Chưa có dữ liệu tổ chức</h2>
          <p className="mt-1 text-sm text-slate-500">Tạo phòng ban hoặc nhập dữ liệu nhân sự để bắt đầu.</p>
        </div>
      ) : view === 'units' ? (
        <div className="space-y-4">
          {roots.map((root) => <UnitCard key={root.id} department={root} departments={departments} employees={employees} />)}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm nhân viên, quản lý, đơn vị..." className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {reportingRows.map((employee) => {
              const manager = employees.find((candidate) => candidate.id === employee.manager_id);
              return (
                <div key={employee.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1.1fr_1fr_1fr] sm:items-center">
                  <div><div className="font-medium text-slate-900">{employee.full_name}</div><div className="text-xs text-slate-500">{employee.employee_code} · {employee.position || 'Chưa có chức danh'}</div></div>
                  <div className="text-sm text-slate-600">{employee.department?.name || 'Chưa xếp đơn vị'}</div>
                  <div className="text-sm"><span className="text-slate-400">Báo cáo cho: </span><span className="font-medium text-slate-700">{manager?.full_name || 'Cấp cao nhất'}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showAssignmentImport && selectedCompany && <AssignmentImportModal companyId={selectedCompany.id} employees={employees} onClose={() => setShowAssignmentImport(false)} onApplied={load} />}
    </div>
  );
};

export default OrganizationChart;
