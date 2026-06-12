import React, { useState } from 'react';
import { Save, Settings, Info } from 'lucide-react';

const HRSettings = () => {
  const [framework, setFramework] = useState<'okr' | 'bsc'>('okr');
  const [profitPercent, setProfitPercent] = useState('5');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Đã lưu cấu hình thành công!');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cài đặt Hệ thống HR</h1>
        <p className="text-slate-500 mt-1">Cấu hình mô hình đánh giá hiệu suất và quỹ lương 3P</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Section 1: Performance Framework */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-indigo-500" />
              Mô hình đánh giá (Performance Framework)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${framework === 'okr' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => setFramework('okr')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">OKR (Mục tiêu & Kết quả Then chốt)</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${framework === 'okr' ? 'border-indigo-500' : 'border-slate-300'}`}>
                    {framework === 'okr' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                  </div>
                </div>
                <p className="text-sm text-slate-500">Phù hợp cho quản trị linh hoạt, tập trung vào tăng trưởng và đổi mới.</p>
              </div>

              <div 
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${framework === 'bsc' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => setFramework('bsc')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">BSC KPI (Thẻ điểm Cân bằng)</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${framework === 'bsc' ? 'border-indigo-500' : 'border-slate-300'}`}>
                    {framework === 'bsc' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                  </div>
                </div>
                <p className="text-sm text-slate-500">Tiếp cận 4 khía cạnh: Tài chính, Khách hàng, Quy trình nội bộ, Học tập & Phát triển.</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: 3P Salary Configuration */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Cấu hình Lương 3P (Quỹ P3)</h2>
            <div className="flex flex-col max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  % Trích xuất từ Lợi nhuận Hệ thống
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={profitPercent}
                    onChange={(e) => setProfitPercent(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-medium">%</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  Quỹ lương P3 (Thưởng Hiệu suất) sẽ được trích từ Lợi nhuận/Doanh thu của hệ thống và chia theo điểm KPI của từng nhân sự.
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRSettings;
