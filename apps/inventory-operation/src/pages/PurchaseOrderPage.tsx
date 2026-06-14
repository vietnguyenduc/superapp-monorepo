﻿﻿﻿﻿﻿﻿import React, { useState } from 'react';
import { ShoppingCart, Plus, Search, Filter, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const PurchaseOrderPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const purchaseOrders = [
    { id: 'PO-2405-001', supplier: 'Công ty TNHH Bao Bì Xanh', date: '25/05/2026', amount: 45000000, status: 'sent', expectedDate: '30/05/2026' },
    { id: 'PO-2405-002', supplier: 'Nhà phân phối Hàng Gia Dụng ABC', date: '26/05/2026', amount: 12000000, status: 'draft', expectedDate: '02/06/2026' },
    { id: 'PO-2405-003', supplier: 'Cơ sở sản xuất Nhựa Tiền Phong', date: '20/05/2026', amount: 89000000, status: 'partial_received', expectedDate: '22/05/2026' },
    { id: 'PO-2405-004', supplier: 'Công ty TNHH Bao Bì Xanh', date: '15/05/2026', amount: 23000000, status: 'received', expectedDate: '18/05/2026' },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">Bản nháp</span>;
      case 'sent': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Đã gửi NCC</span>;
      case 'partial_received': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Nhận 1 phần</span>;
      case 'received': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Hoàn tất</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-800 tracking-tight truncate">Đơn đặt hàng (Purchase Orders)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Lập kế hoạch và theo dõi quá trình mua hàng từ Nhà cung cấp</p>
        </div>
        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-xs sm:text-sm shadow-sm whitespace-nowrap flex-shrink-0 relative z-30">
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Tạo Đơn Hàng (PO)</span>
          <span className="xs:hidden">Tạo PO</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] sm:text-xs lg:text-sm font-medium text-slate-500 mb-0.5 sm:mb-1 truncate">Đang soạn thảo</div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">12</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm">
          <div className="text-[10px] sm:text-xs lg:text-sm font-medium text-blue-600 mb-0.5 sm:mb-1 truncate">Đã gửi (Đợi giao)</div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">8</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <div className="text-[10px] sm:text-xs lg:text-sm font-medium text-amber-600 mb-0.5 sm:mb-1 truncate">Giao thiếu / Trễ hạn</div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-900">3</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <div className="text-[10px] sm:text-xs lg:text-sm font-medium text-emerald-600 mb-0.5 sm:mb-1 truncate">Hoàn tất tháng này</div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-900">45</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 sm:gap-3 justify-between items-center">
          <div className="relative flex-1 min-w-0 max-w-full sm:max-w-md">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm PO, tên NCC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm transition-all"
            />
          </div>
          <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-xs sm:text-sm font-medium">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Lọc</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-4 sm:px-6 py-4">Mã Đơn / NCC</th>
                <th className="px-4 sm:px-6 py-4">Ngày đặt</th>
                <th className="hidden sm:table-cell px-4 sm:px-6 py-4">Dự kiến giao</th>
                <th className="px-4 sm:px-6 py-4">Tổng tiền</th>
                <th className="px-4 sm:px-6 py-4">Trạng thái</th>
                <th className="px-4 sm:px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map(po => (
                <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">{po.id}</div>
                    <div className="text-xs text-slate-500 mt-1 truncate max-w-[120px] sm:max-w-none">{po.supplier}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 font-medium text-slate-700 text-xs sm:text-sm">{po.date}</td>
                  <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
                    <div className={`font-medium flex items-center gap-1.5 text-xs sm:text-sm ${po.status === 'partial_received' ? 'text-amber-600' : 'text-slate-700'}`}>
                      {po.status === 'partial_received' && <AlertCircle className="w-3.5 h-3.5" />}
                      {po.expectedDate}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 font-semibold text-slate-800 text-xs sm:text-sm">
                    {po.amount.toLocaleString()} đ
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    {getStatusBadge(po.status)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <button className="text-slate-600 hover:text-indigo-600 font-medium text-xs bg-slate-50 hover:bg-indigo-50 px-2 sm:px-3 py-1.5 rounded-lg transition-colors">
                        Chi tiết
                      </button>
                      {po.status === 'sent' || po.status === 'partial_received' ? (
                        <button className="flex items-center gap-1 text-emerald-700 font-medium text-xs bg-emerald-50 hover:bg-emerald-100 px-2 sm:px-3 py-1.5 rounded-lg transition-colors">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Nhận hàng</span>
                        </button>
                      ) : null}
                    </div>
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

export default PurchaseOrderPage;
