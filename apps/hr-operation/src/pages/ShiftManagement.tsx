import React, { useState, useEffect } from 'react';
import { Clock, Plus, CalendarDays, MoreHorizontal, Settings2, Moon, Sun, ArrowRight } from 'lucide-react';
import { hrService, Shift } from '../services/hrService';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await hrService.getShifts();
      setShifts(data.length > 0 ? data : [
        { id: '1', company_id: 'c1', name: 'Ca Hành Chính', type: 'fixed', start_time: '08:00:00', end_time: '17:30:00', grace_period_mins: 15 },
        { id: '2', company_id: 'c1', name: 'Ca Sáng', type: 'fixed', start_time: '06:00:00', end_time: '14:00:00', grace_period_mins: 10 },
        { id: '3', company_id: 'c1', name: 'Ca Đêm', type: 'night', start_time: '22:00:00', end_time: '06:00:00', grace_period_mins: 15 },
      ]);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'fixed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'flexible': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'night': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'night': return <Moon className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Quản lý Ca làm việc</h1>
          <p className="text-sm text-slate-500 mt-1">Cấu hình các loại ca (hành chính, xoay ca, ca đêm) và phân bổ cho nhân viên</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm shadow-sm">
            <CalendarDays className="w-4 h-4" />
            Lịch phân ca
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm shadow-indigo-200">
            <Plus className="w-4 h-4" />
            Tạo ca mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shifts List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Danh sách ca ({shifts.length})
            </h2>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2].map(i => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                  <div className="h-5 w-32 bg-slate-200 rounded mb-4"></div>
                  <div className="h-10 bg-slate-100 rounded mb-3"></div>
                  <div className="h-4 w-24 bg-slate-100 rounded"></div>
                </div>
              ))
            ) : shifts.map((shift) => (
              <div key={shift.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getTypeStyle(shift.type)}`}>
                    {getTypeIcon(shift.type)}
                    {shift.type === 'night' ? 'Ca Đêm' : shift.type === 'flexible' ? 'Linh hoạt' : 'Cố định'}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-4">{shift.name}</h3>
                
                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4">
                  <div className="text-center flex-1">
                    <div className="text-xs text-slate-500 mb-1 font-medium">BẮT ĐẦU</div>
                    <div className="text-base font-semibold text-slate-900">{shift.start_time.substring(0, 5)}</div>
                  </div>
                  <div className="px-2 text-slate-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-xs text-slate-500 mb-1 font-medium">KẾT THÚC</div>
                    <div className="text-base font-semibold text-slate-900">{shift.end_time.substring(0, 5)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">TG châm chước đi muộn</span>
                  <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{shift.grace_period_mins} phút</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Assignment / Rules Sidebar */}
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 h-fit shadow-sm">
          <div className="w-12 h-12 bg-white rounded-xl border border-indigo-100 shadow-sm flex items-center justify-center mb-4">
            <CalendarDays className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Quy tắc phân ca</h3>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Hệ thống hỗ trợ gán ca làm việc theo cá nhân hoặc phòng ban. Thời gian làm việc thực tế được đối chiếu từ dữ liệu máy chấm công hoặc thiết bị GPS để tính giờ công & Overtime tự động.
          </p>
          <button className="w-full py-2.5 bg-white border border-indigo-200 text-indigo-700 font-medium rounded-lg text-sm hover:bg-indigo-50 transition-colors shadow-sm">
            Xem lịch phân ca tháng này
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;
