import React, { useState } from 'react';
import { LineChart, Search, Filter, AlertTriangle, ArrowRight, RefreshCw, ShoppingCart, TrendingDown } from 'lucide-react';

const InventoryMRPPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dohView, setDohView] = useState<'7days' | '30days'>('30days');

  // Mock data for MRP & DOH
  const mrpItems = [
    { 
      id: 'PROD-001', 
      name: 'Thùng carton 5 lớp 50x50x50', 
      category: 'Bao bì',
      supplier: 'Công ty TNHH Bao Bì Xanh',
      currentStock: 1200, 
      salesRate7d: 150, 
      salesRate30d: 120, 
      creditDays: 30, // Supplier allows 30 days debt
      leadTime: 5,
      unitPrice: 15000
    },
    { 
      id: 'PROD-002', 
      name: 'Băng keo trong 5cm', 
      category: 'Vật tư đóng gói',
      supplier: 'Nhà phân phối Hàng Gia Dụng ABC',
      currentStock: 450, 
      salesRate7d: 80, 
      salesRate30d: 60, 
      creditDays: 15, // Supplier allows 15 days debt
      leadTime: 3,
      unitPrice: 12000
    },
    { 
      id: 'PROD-003', 
      name: 'Màng PE bọc hàng 50cm', 
      category: 'Vật tư đóng gói',
      supplier: 'Cơ sở sản xuất Nhựa Tiền Phong',
      currentStock: 50, 
      salesRate7d: 25, 
      salesRate30d: 20, 
      creditDays: 30,
      leadTime: 7,
      unitPrice: 85000
    }
  ];

  const calculateDOH = (stock: number, rate: number) => {
    return rate > 0 ? Math.round(stock / rate) : 999;
  };

  const calculateSuggestedOrder = (item: any, targetDoh: number) => {
    const rate = dohView === '7days' ? item.salesRate7d : item.salesRate30d;
    // We want stock to reach targetDoh + leadTime
    const targetStock = rate * (targetDoh + item.leadTime);
    const deficit = targetStock - item.currentStock;
    return deficit > 0 ? deficit : 0;
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Vòng quay tồn kho & MRP</h1>
          <p className="text-sm text-slate-500 mt-1">Phân tích DOH và tự động đề xuất lượng nhập hàng theo chu kỳ nợ</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setDohView('7days')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dohView === '7days' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tốc độ bán 7 ngày
          </button>
          <button 
            onClick={() => setDohView('30days')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dohView === '30days' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tốc độ bán 30 ngày
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">DOH Trung bình toàn kho</p>
            <p className="text-2xl font-bold text-slate-800">18.5 <span className="text-sm font-normal text-slate-500">ngày</span></p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-rose-600">Cảnh báo Đứt hàng (Out of stock)</p>
            <p className="text-2xl font-bold text-rose-700">1 <span className="text-sm font-normal">sản phẩm</span></p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-600">Đề xuất mua hàng (PO)</p>
            <p className="text-2xl font-bold text-emerald-700">2 <span className="text-sm font-normal">nhà cung cấp</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm sản phẩm, NCC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            />
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <button className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium">
              <Filter className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Lọc</span>
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium shadow-sm whitespace-nowrap">
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Tạo PO</span>
              <span className="sm:hidden">PO</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-4 py-4 w-10 text-center"><input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /></th>
                <th className="px-6 py-4">Sản phẩm / NCC</th>
                <th className="px-6 py-4 text-right">Tồn hiện tại</th>
                <th className="px-6 py-4 text-right">Tốc độ bán<br/>({dohView === '7days' ? '7 ngày' : '30 ngày'}/ngày)</th>
                <th className="px-6 py-4 text-center">DOH Thực tế</th>
                <th className="px-6 py-4 text-center">Nợ NCC / Lead Time</th>
                <th className="px-6 py-4 bg-indigo-50/30 text-indigo-800 border-l border-indigo-100">Gợi ý Đặt (MRP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mrpItems.map(item => {
                const rate = dohView === '7days' ? item.salesRate7d : item.salesRate30d;
                const doh = calculateDOH(item.currentStock, rate);
                const suggestedOrder = calculateSuggestedOrder(item, item.creditDays);
                const isOutOfStock = doh <= item.leadTime;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-4 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.supplier}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {item.currentStock.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {rate} / ngày
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold text-lg ${isOutOfStock ? 'text-rose-600' : 'text-slate-800'}`}>
                          {doh}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">ngày</span>
                        {isOutOfStock && <span className="text-[10px] font-bold text-rose-600 mt-1 bg-rose-50 px-2 py-0.5 rounded">Rủi ro đứt hàng</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md inline-block">
                        {item.creditDays} ngày nợ
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-center gap-1">
                        <ArrowRight className="w-3 h-3" /> Giao: {item.leadTime} ngày
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-indigo-50/30 border-l border-indigo-100">
                      <div className="flex flex-col gap-1 items-start">
                        {suggestedOrder > 0 ? (
                          <>
                            <div className="font-bold text-indigo-700 text-lg">+{suggestedOrder.toLocaleString()}</div>
                            <div className="text-xs text-slate-500">~ {(suggestedOrder * item.unitPrice).toLocaleString()} đ</div>
                          </>
                        ) : (
                          <div className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Đủ tồn kho
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Local component since lucide-react CheckCircle2 is used but not imported in the top level if I missed it
const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className || "w-6 h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

export default InventoryMRPPage;
