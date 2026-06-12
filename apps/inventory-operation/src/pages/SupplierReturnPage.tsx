import React, { useState } from 'react';
import { ArrowLeftRight, Search, Filter, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';

const SupplierReturnPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const returns = [
    { id: 'RET-2405-001', grId: 'GR-2405-001', supplier: 'Cơ sở sản xuất Nhựa Tiền Phong', date: '22/05/2026', items: 15, amount: 250000, type: 'return', status: 'approved' },
    { id: 'RET-2405-002', grId: 'GR-2405-002', supplier: 'Công ty TNHH Bao Bì Xanh', date: '19/05/2026', items: 50, amount: 1200000, type: 'exchange', status: 'completed' },
    { id: 'RET-2405-003', grId: null, supplier: 'Công ty Cổ phần Thực phẩm Toàn Cầu', date: '26/05/2026', items: 5, amount: 800000, type: 'return', status: 'pending' },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5"/> Chờ duyệt</span>;
      case 'approved': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5"/> Đã duyệt - Chờ trả</span>;
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5"/> Hoàn tất</span>;
      case 'cancelled': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5"/> Đã hủy</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Trả / Đổi hàng NCC (Supplier Returns)</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý việc xuất trả hàng bị lỗi, nhầm lẫn hoặc yêu cầu đổi hàng với Nhà cung cấp</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm mã Trả hàng, NCC..." 
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
                <th className="px-6 py-4">Mã Phiếu Trả</th>
                <th className="px-6 py-4">Loại Yêu Cầu</th>
                <th className="px-6 py-4">Nhà cung cấp</th>
                <th className="px-6 py-4">Số lượng / Giá trị</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map(ret => (
                <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{ret.id}</div>
                    <div className="text-xs text-slate-500 mt-1">{ret.date}</div>
                    {ret.grId && <div className="text-[10px] text-indigo-500 mt-1">Từ {ret.grId}</div>}
                  </td>
                  <td className="px-6 py-4">
                    {ret.type === 'return' ? (
                      <span className="text-rose-700 font-medium">Trả lấy tiền (Hoàn công nợ)</span>
                    ) : (
                      <span className="text-indigo-700 font-medium">Đổi hàng mới</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {ret.supplier}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{ret.items} sản phẩm</div>
                    <div className="text-xs text-slate-500 mt-0.5">{ret.amount.toLocaleString()} đ</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(ret.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-200 hover:border-indigo-200">
                      <ChevronRight className="w-4 h-4" />
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

export default SupplierReturnPage;
