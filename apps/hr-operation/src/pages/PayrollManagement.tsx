import React, { useState } from 'react';
import { Calculator, Download, Search, FileDown, Filter } from 'lucide-react';

const PayrollManagement = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('06/2026');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 tracking-tight">Tính lương & Phụ cấp</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Quản lý kỳ lương, chốt công, tính toán thu nhập</p>
        </div>
        {/* Mobile: filter toggle */}
        <button 
          className="sm:hidden flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium w-full justify-center"
          onClick={() => setShowMobileFilter(!showMobileFilter)}
        >
          <Filter className="w-4 h-4" />
          {showMobileFilter ? 'Ẩn tuỳ chọn' : 'Tuỳ chọn kỳ lương'}
        </button>
        {/* Desktop: full controls */}
        <div className="hidden sm:flex items-center gap-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="06/2026">Kỳ lương Tháng 06/2026</option>
            <option value="05/2026">Kỳ lương Tháng 05/2026</option>
            <option value="04/2026">Kỳ lương Tháng 04/2026</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm shadow-indigo-200">
            <Calculator className="w-4 h-4" />
            Tính lương tự động
          </button>
        </div>
      </div>

      {/* Mobile expanded controls */}
      {showMobileFilter && (
        <div className="sm:hidden bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="06/2026">Kỳ lương Tháng 06/2026</option>
            <option value="05/2026">Kỳ lương Tháng 05/2026</option>
            <option value="04/2026">Kỳ lương Tháng 04/2026</option>
          </select>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm">
            <Calculator className="w-4 h-4" />
            Tính lương tự động
          </button>
        </div>
      )}

      {/* Summary Cards - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng quỹ lương */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-4 sm:p-5 rounded-xl text-white shadow-md shadow-indigo-200">
          <p className="text-indigo-100 text-xs sm:text-sm font-medium mb-1">Tổng quỹ lương (Net)</p>
          <p className="text-xl sm:text-2xl font-bold">145,000,000 ₫</p>
          <div className="mt-3 sm:mt-4 text-[10px] sm:text-xs bg-white/20 inline-block px-2 py-1 rounded text-white font-medium">
            24 Nhân sự
          </div>
        </div>
        
        {/* Card 2: P1 */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">Lương P1 (Vị trí)</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800">100M <span className="text-xs sm:text-sm font-medium text-slate-400">VNĐ</span></p>
        </div>
        
        {/* Card 3: P3 */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">Thưởng P3 (Hiệu suất)</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800">30.5M <span className="text-xs sm:text-sm font-medium text-slate-400">VNĐ</span></p>
        </div>

        {/* Card 4: Trạng thái */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">Trạng thái</p>
            <p className="text-base sm:text-lg font-bold text-amber-600 flex items-center gap-2">
              Bản nháp
            </p>
          </div>
          <button className="w-full mt-2 sm:mt-3 py-1.5 bg-emerald-50 text-emerald-700 font-medium text-xs sm:text-sm rounded border border-emerald-100 hover:bg-emerald-100 transition-colors">
            Chốt & Gửi Payslip
          </button>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Search + Export bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm nhân viên..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm transition-colors sm:self-auto">
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
        </div>

        {/* Mobile: card view */}
        <div className="sm:hidden divide-y divide-slate-100">
          {[
            { name: 'Nguyễn Văn A', p1: 15000000, p2: 2000000, kpi: 95, p3: 4500000, allw: 500000, ded: 500000, net: 21500000 },
            { name: 'Trần Thị B', p1: 12000000, p2: 1000000, kpi: 80, p3: 2000000, allw: 500000, ded: 800000, net: 14700000 },
            { name: 'Lê Văn Luyện', p1: 8000000, p2: 500000, kpi: 100, p3: 5000000, allw: 0, ded: 0, net: 13500000 },
          ].map((p, i) => (
            <div key={i} className="p-4 hover:bg-slate-50/80 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">KPI: <span className="font-medium text-indigo-600">{p.kpi}%</span></p>
                </div>
                <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="Xem chi tiết Payslip">
                  <FileDown className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">P1 (Vị trí)</span>
                  <span className="text-slate-700 font-medium">{p.p1.toLocaleString()} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">P2 (Năng lực)</span>
                  <span className="text-slate-700 font-medium">{p.p2.toLocaleString()} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">P3 (Thưởng)</span>
                  <span className="text-indigo-600 font-medium">+{p.p3.toLocaleString()} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phụ cấp</span>
                  <span className="text-emerald-600 font-medium">+{p.allw.toLocaleString()} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khấu trừ</span>
                  <span className="text-red-500 font-medium">-{p.ded.toLocaleString()} ₫</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5 col-span-2">
                  <span className="text-slate-600 font-medium">Thực nhận</span>
                  <span className="font-bold text-slate-900">{p.net.toLocaleString()} ₫</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-4 py-4">Nhân viên</th>
                <th className="px-4 py-4 text-right">P1 (Vị trí)</th>
                <th className="px-4 py-4 text-right">P2 (Năng lực)</th>
                <th className="px-4 py-4 text-center">Điểm KPI</th>
                <th className="px-4 py-4 text-right text-indigo-600">P3 (Thưởng)</th>
                <th className="px-4 py-4 text-right text-emerald-600">Phụ cấp khác</th>
                <th className="px-4 py-4 text-right text-red-500">Khấu trừ</th>
                <th className="px-4 py-4 text-right">Thực nhận (Net)</th>
                <th className="px-4 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Nguyễn Văn A', p1: 15000000, p2: 2000000, kpi: 95, p3: 4500000, allw: 500000, ded: 500000, net: 21500000 },
                { name: 'Trần Thị B', p1: 12000000, p2: 1000000, kpi: 80, p3: 2000000, allw: 500000, ded: 800000, net: 14700000 },
                { name: 'Lê Văn Luyện', p1: 8000000, p2: 500000, kpi: 100, p3: 5000000, allw: 0, ded: 0, net: 13500000 },
              ].map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{p.p1.toLocaleString()} ₫</td>
                  <td className="px-4 py-3 text-right text-slate-600">{p.p2.toLocaleString()} ₫</td>
                  <td className="px-4 py-3 text-center font-medium text-indigo-600 bg-indigo-50/30">{p.kpi}%</td>
                  <td className="px-4 py-3 text-right font-medium text-indigo-600">+{p.p3.toLocaleString()} ₫</td>
                  <td className="px-4 py-3 text-right text-emerald-600">+{p.allw.toLocaleString()} ₫</td>
                  <td className="px-4 py-3 text-right text-red-500">-{p.ded.toLocaleString()} ₫</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{p.net.toLocaleString()} ₫</td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors" title="Xem chi tiết Payslip">
                      <FileDown className="w-5 h-5 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollManagement;
