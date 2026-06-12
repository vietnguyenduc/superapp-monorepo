import React, { useState } from 'react';
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
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Đơn đặt hàng (Purchase Orders)</h1>
          <p className="text-sm text-slate-500 mt-1">Lập kế hoạch và theo dõi quá trình mua hàng từ Nhà cung cấp</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm">
          <Plus className="w-4 h-4" />
          Tạo Đơn Hàng (PO)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Đang soạn thảo</div>
          <div className="text-2xl font-bold text-slate-800">12</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm">
          <div className="text-sm font-medium text-blue-600 mb-1">Đã gửi (Đợi giao)</div>
          <div className="text-2xl font-bold text-blue-900">8</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <div className="text-sm font-medium text-amber-600 mb-1">Giao thiếu / Trễ hạn</div>
          <div className="text-2xl font-bold text-amber-900">3</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <div className="text-sm font-medium text-emerald-600 mb-1">Hoàn tất tháng này</div>
          <div className="text-2xl font-bold text-emerald-900">45</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 justify-between items-center">
          <div className="relative max-w-md w-full sm:w-auto flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm theo mã PO, tên NCC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-6 py-4">Mã Đơn / NCC</th>
                <th className="px-6 py-4">Ngày đặt</th>
                <th className="px-6 py-4">Dự kiến giao</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map(po => (
                <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{po.id}</div>
                    <div className="text-xs text-slate-500 mt-1">{po.supplier}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{po.date}</td>
                  <td className="px-6 py-4">
                    <div className={`font-medium flex items-center gap-1.5 ${po.status === 'partial_received' ? 'text-amber-600' : 'text-slate-700'}`}>
                      {po.status === 'partial_received' && <AlertCircle className="w-3.5 h-3.5" />}
                      {po.expectedDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {po.amount.toLocaleString()} đ
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(po.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-slate-600 hover:text-indigo-600 font-medium text-xs bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                        Chi tiết
                      </button>
                      {po.status === 'sent' || po.status === 'partial_received' ? (
                        <button className="flex items-center gap-1 text-emerald-700 font-medium text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Nhận hàng
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
