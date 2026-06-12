import React, { useState } from 'react';
import { PackageCheck, Search, Filter, AlertTriangle, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

const GoodsReceiptPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const receipts = [
    { id: 'GR-2405-001', poId: 'PO-2405-003', supplier: 'Cơ sở sản xuất Nhựa Tiền Phong', date: '21/05/2026', totalItems: 1200, status: 'completed', defectCount: 15, wrongBranchCount: 0 },
    { id: 'GR-2405-002', poId: 'PO-2405-004', supplier: 'Công ty TNHH Bao Bì Xanh', date: '18/05/2026', totalItems: 500, status: 'completed', defectCount: 0, wrongBranchCount: 50 },
    { id: 'GR-2405-003', poId: 'PO-2405-001', supplier: 'Công ty TNHH Bao Bì Xanh', date: '27/05/2026', totalItems: 2000, status: 'pending', defectCount: 0, wrongBranchCount: 0 },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><AlertTriangle className="w-3.5 h-3.5"/> Đang kiểm đếm</span>;
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5"/> Đã nhập kho</span>;
      case 'cancelled': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5"/> Đã hủy</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Phiếu Nhận Hàng (Goods Receipts)</h1>
          <p className="text-sm text-slate-500 mt-1">Kiểm đếm số lượng, chất lượng hàng hóa thực tế từ Nhà cung cấp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tổng phiếu tháng này</p>
            <p className="text-2xl font-bold text-slate-800">24</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-rose-600">Sản phẩm Lỗi / Trả về</p>
            <p className="text-2xl font-bold text-rose-700">1.2%</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-600">Giao nhầm chi nhánh</p>
            <p className="text-2xl font-bold text-amber-700">50 <span className="text-sm font-normal">sp</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm mã GR, PO..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium">
            <Filter className="w-4 h-4" />
            Lọc phiếu
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-6 py-4">Mã Phiếu (GR)</th>
                <th className="px-6 py-4">Từ Đơn Hàng (PO)</th>
                <th className="px-6 py-4">Nhà cung cấp</th>
                <th className="px-6 py-4 text-center">Ghi nhận Bất thường</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map(gr => (
                <tr key={gr.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{gr.id}</div>
                    <div className="text-xs text-slate-500 mt-1">{gr.date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-indigo-600 cursor-pointer hover:underline">{gr.poId}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {gr.supplier}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {gr.defectCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                          {gr.defectCount} Lỗi / Hư hỏng
                        </span>
                      )}
                      {gr.wrongBranchCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                          {gr.wrongBranchCount} Nhầm chi nhánh
                        </span>
                      )}
                      {gr.defectCount === 0 && gr.wrongBranchCount === 0 && gr.status === 'completed' && (
                        <span className="text-[10px] font-bold text-slate-400">Không có</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(gr.status)}
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

export default GoodsReceiptPage;
