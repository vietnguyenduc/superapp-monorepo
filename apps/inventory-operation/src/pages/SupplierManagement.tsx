import React, { useState } from 'react';
import { Users, Plus, Search, Building2, Wallet, Phone, Mail, FileText, ArrowUpRight } from 'lucide-react';

const SupplierManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for UI presentation
  const suppliers = [
    { id: 1, code: 'SUP001', name: 'Công ty TNHH Bao Bì Xanh', credit_amount: 50000000, credit_days: 30, on_time: 98, defect: 1.2, status: 'active' },
    { id: 2, code: 'SUP002', name: 'Nhà phân phối Hàng Gia Dụng ABC', credit_amount: 120000000, credit_days: 45, on_time: 85, defect: 5.4, status: 'active' },
    { id: 3, code: 'SUP003', name: 'Công ty Cổ phần Thực phẩm Toàn Cầu', credit_amount: 0, credit_days: 0, on_time: 99, defect: 0.5, status: 'inactive' },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Nhà cung cấp (Suppliers)</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý đối tác mua hàng, công nợ và đánh giá hiệu suất giao hàng</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm">
          <Plus className="w-4 h-4" />
          Thêm Nhà cung cấp
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tổng số đối tác</p>
            <p className="text-2xl font-bold text-slate-800">45</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tổng hạn mức nợ (Limit)</p>
            <p className="text-2xl font-bold text-slate-800">1.2 Tỷ</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tỷ lệ đúng hạn (Avg)</p>
            <p className="text-2xl font-bold text-slate-800">94%</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm theo tên, mã NCC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-6 py-4">Nhà cung cấp</th>
                <th className="px-6 py-4">Hạn mức Nợ</th>
                <th className="px-6 py-4">KPI Đúng hạn</th>
                <th className="px-6 py-4">Tỷ lệ Lỗi</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{sup.name}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{sup.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">{sup.credit_amount.toLocaleString()} đ</div>
                    <div className="text-xs text-slate-500 mt-1">Tối đa {sup.credit_days} ngày</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${sup.on_time > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${sup.on_time}%` }}></div>
                      </div>
                      <span className="font-medium">{sup.on_time}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${sup.defect > 3 ? 'text-red-600' : 'text-slate-700'}`}>
                      {sup.defect}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {sup.status === 'active' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang giao dịch
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Tạm ngưng
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-900 font-medium text-xs bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                      Bảng giá
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

export default SupplierManagement;
