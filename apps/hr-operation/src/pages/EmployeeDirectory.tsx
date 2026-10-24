import React, { useState, useEffect, useCallback } from 'react';
import { Users, Building, Plus, Search, MoreVertical, Briefcase, FileSpreadsheet } from 'lucide-react';
import { hrService, Employee, Department } from '../services/hrService';
import SharePointEmployeeImportModal from '../components/SharePointEmployeeImportModal';
import { useCompany } from '@superapp/iam';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSharePointImport, setShowSharePointImport] = useState(false);
  const { selectedCompany, loading: companyLoading } = useCompany();

  const fetchData = useCallback(async () => {
    if (!selectedCompany?.id) {
      setEmployees([]);
      setDepartments([]);
      setLoading(companyLoading);
      return;
    }
    try {
      setLoading(true);
      const [empData, departmentData] = await Promise.all([
        hrService.getEmployees(selectedCompany.id),
        hrService.getDepartments(selectedCompany.id),
      ]);
      setEmployees(empData);
      setDepartments(departmentData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, companyLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Hồ sơ Nhân sự</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý danh sách nhân viên, phòng ban và chức vụ</p>
        </div>
        <div className="grid grid-cols-1 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button disabled={!selectedCompany} title={!selectedCompany ? 'Hãy chọn công ty trước' : undefined} onClick={() => setShowSharePointImport(true)} className="flex justify-center items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <FileSpreadsheet className="w-4 h-4" />
            Nhập từ SharePoint
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm shadow-sm">
            <Building className="w-4 h-4" />
            Phòng ban
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm shadow-indigo-200">
            <Plus className="w-4 h-4" />
            Thêm nhân viên
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên, mã NV..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">{filteredEmployees.length}</span> nhân viên
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Phòng ban</th>
                <th className="px-6 py-4">Vị trí (P1)</th>
                <th className="px-6 py-4 text-right">Phụ cấp (P2)</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      <div className="text-xs">Đang tải dữ liệu...</div>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold border border-indigo-100">
                        {emp.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{emp.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3" /> {emp.employee_code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700">{emp.department?.name || 'Chưa xếp phòng'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700 font-medium">{(emp as any).position || 'Chưa thiết lập'}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                    +{(emp as any).p2_allowance?.toLocaleString() || '0'} ₫
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!loading && filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">Không tìm thấy nhân viên</h3>
              <p className="text-sm text-slate-500 mt-1">Hãy thử thay đổi từ khóa tìm kiếm</p>
            </div>
          )}
        </div>
      </div>
      {showSharePointImport && selectedCompany && (
        <SharePointEmployeeImportModal
          departments={departments}
          employees={employees}
          companyId={selectedCompany.id}
          onClose={() => setShowSharePointImport(false)}
          onImported={fetchData}
        />
      )}
    </div>
  );
};

export default EmployeeDirectory;
