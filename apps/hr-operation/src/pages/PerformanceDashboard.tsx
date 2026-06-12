import React, { useState } from 'react';
import { Target, Plus, ChevronDown, CheckCircle2, Circle } from 'lucide-react';

const MOCK_OBJECTIVES = [
  {
    id: 1,
    title: 'Tăng trưởng doanh số Q2',
    perspective: 'Tài chính',
    progress: 75,
    keyResults: [
      { id: 101, title: 'Đạt doanh thu 5 tỷ VNĐ', target: '5B', actual: '3.75B', progress: 75 },
      { id: 102, title: 'Ký hợp đồng với 10 đối tác mới', target: '10', actual: '8', progress: 80 }
    ]
  },
  {
    id: 2,
    title: 'Nâng cao chất lượng dịch vụ',
    perspective: 'Khách hàng',
    progress: 40,
    keyResults: [
      { id: 201, title: 'CSAT đạt 95%', target: '95%', actual: '85%', progress: 40 }
    ]
  }
];

const PerformanceDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hiệu suất (KPI / OKR)</h1>
          <p className="text-slate-500 mt-1">Quản lý mục tiêu và theo dõi tiến độ</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Thêm Mục tiêu
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Mục tiêu đang chạy</p>
            <p className="text-2xl font-bold text-slate-800">12</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tiến độ Trung bình</p>
            <p className="text-2xl font-bold text-slate-800">68%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Quỹ P3 dự kiến</p>
            <p className="text-2xl font-bold text-slate-800">150M VNĐ</p>
          </div>
        </div>
      </div>

      {/* Objectives List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Danh sách Mục tiêu</h2>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Kỳ đánh giá: Tháng 5, 2026 <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {MOCK_OBJECTIVES.map(obj => (
            <div key={obj.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      {obj.perspective}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{obj.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-indigo-600">{obj.progress}%</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${obj.progress}%` }}></div>
              </div>

              {/* Key Results */}
              <div className="space-y-3 pl-4 border-l-2 border-slate-100">
                {obj.keyResults.map(kr => (
                  <div key={kr.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {kr.progress >= 100 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                      <span className="font-medium text-slate-700">{kr.title}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm">
                        <span className="text-slate-400">Thực tế:</span> <span className="font-semibold">{kr.actual}</span>
                        <span className="text-slate-300 mx-2">/</span>
                        <span className="text-slate-400">Mục tiêu:</span> <span className="font-semibold">{kr.target}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-600 w-12 text-right">{kr.progress}%</span>
                    </div>
                  </div>
                ))}
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-2">
                  <Plus className="w-4 h-4" /> Thêm Kết quả Then chốt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
