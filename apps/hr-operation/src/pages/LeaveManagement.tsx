import React, { useState } from 'react';
import { FileText, Plus, CheckCircle, XCircle, Clock, Calendar, Filter } from 'lucide-react';

const MOCK_APPROVALS = [
  { id: 1, type: 'Xin đi trễ', name: 'Lê Văn Luyện', initial: 'L', time: '08:00 - 09:30 (20/06/2026)', reason: 'Đưa con đi khám bệnh', status: 'pending' },
  { id: 2, type: 'Nghỉ phép năm', name: 'Trần Thị B', initial: 'B', time: 'Cả ngày (21/06/2026)', reason: 'Việc gia đình', status: 'pending' },
  { id: 3, type: 'Đăng ký OT', name: 'Nguyễn Văn A', initial: 'A', time: '18:00 - 21:00 (19/06/2026)', reason: 'Hỗ trợ deploy', status: 'pending' }
];

const LeaveManagement = () => {
  const [activeTab, setActiveTab] = useState<'my_requests' | 'approvals'>('my_requests');
  const [approvals, setApprovals] = useState(MOCK_APPROVALS);

  const handleAction = (id: number, action: 'approved' | 'rejected') => {
    setApprovals(prev => prev.map(req => req.id === id ? { ...req, status: action } : req));
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Quản lý Đơn từ</h1>
          <p className="text-sm text-slate-500 mt-1">Xin nghỉ phép, làm thêm giờ (OT) và phê duyệt đơn từ của nhân viên</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm shadow-indigo-200">
          <Plus className="w-4 h-4" />
          Tạo đơn mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Phép năm còn lại</p>
            <p className="text-2xl font-bold text-slate-800">10 <span className="text-sm font-medium text-slate-400">/ 12 ngày</span></p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">OT Tháng này</p>
            <p className="text-2xl font-bold text-slate-800">12.5 <span className="text-sm font-medium text-slate-400">giờ</span></p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Đơn chờ duyệt (Quản lý)</p>
            <p className="text-2xl font-bold text-slate-800">3 <span className="text-sm font-medium text-slate-400">đơn</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex gap-6 px-6">
            <button 
              onClick={() => setActiveTab('my_requests')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my_requests' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Đơn của tôi
            </button>
            <button 
              onClick={() => setActiveTab('approvals')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'approvals' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Cần phê duyệt
              {approvals.filter(a => a.status === 'pending').length > 0 && (
                <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">
                  {approvals.filter(a => a.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 flex justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm shadow-sm">
              <Filter className="w-4 h-4" /> Lọc trạng thái
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-6 py-4">Loại đơn</th>
                {activeTab === 'approvals' && <th className="px-6 py-4">Nhân viên</th>}
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Lý do</th>
                <th className="px-6 py-4">Trạng thái</th>
                {activeTab === 'approvals' && <th className="px-6 py-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Dummy data based on tab */}
              {activeTab === 'my_requests' ? (
                <>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">Nghỉ phép năm</td>
                    <td className="px-6 py-4 text-slate-600">12/06/2026 - 13/06/2026</td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">Giải quyết việc gia đình</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle className="w-3 h-3" /> Đã duyệt
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">Đăng ký OT</td>
                    <td className="px-6 py-4 text-slate-600">18:00 - 20:30 (15/06/2026)</td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">Hoàn thành release dự án</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock className="w-3 h-3" /> Chờ duyệt
                      </span>
                    </td>
                  </tr>
                </>
              ) : (
                <>
                  {approvals.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{req.type}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{req.initial}</div>
                          <span className="font-medium text-slate-700">{req.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{req.time}</td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{req.reason}</td>
                      <td className="px-6 py-4">
                        {req.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            <Clock className="w-3 h-3" /> Chờ duyệt
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle className="w-3 h-3" /> Đã duyệt
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            <XCircle className="w-3 h-3" /> Đã từ chối
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleAction(req.id, 'approved')}
                              className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors" 
                              title="Duyệt"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAction(req.id, 'rejected')}
                              className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors" 
                              title="Từ chối"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
