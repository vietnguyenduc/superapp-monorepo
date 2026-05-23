import React, { useState, useMemo } from 'react';
import PageHeader from '../components/UI/PageHeader';
import { useNavigate } from 'react-router-dom';

interface OrderItem { name: string; qty: number; price: number; total: number; }
interface SalesOrder {
  id: string; orderCode: string; customerName: string; date: string; items: OrderItem[];
  totalAmount: number; status: string; paymentStatus: string;
  channel: string; salesperson: string; commission: number; discount: number; notes: string;
}

const CHANNELS: Record<string, { label: string; color: string }> = {
  pos: { label: 'POS', color: '#10b981' }, b2b: { label: 'B2B', color: '#3b82f6' },
  online: { label: 'Online', color: '#8b5cf6' }, marketplace: { label: 'Marketplace', color: '#f59e0b' },
  agent: { label: 'Đại lý', color: '#ec4899' }, delivery: { label: 'Delivery', color: '#06b6d4' },
  social: { label: 'Social', color: '#f97316' },
};
const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Nháp', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  pending: { label: 'Chờ xử lý', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { label: 'Xác nhận', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Đang xử lý', cls: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  delivered: { label: 'Đã giao', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};
const PAY: Record<string, { label: string; cls: string }> = {
  unpaid: { label: 'Chưa TT', cls: 'text-red-600 dark:text-red-400' },
  partial: { label: 'TT một phần', cls: 'text-amber-600 dark:text-amber-400' },
  paid: { label: 'Đã TT', cls: 'text-emerald-600 dark:text-emerald-400' },
};

const MOCK: SalesOrder[] = [
  { id:'1', orderCode:'SO-001', customerName:'Nguyễn Văn A', date:'2024-12-15', channel:'pos', salesperson:'Trần B', commission: 75000, discount: 0, notes:'', paymentStatus:'paid', status:'delivered', totalAmount: 2500000,
    items:[{name:'Cà phê sữa',qty:10,price:35000,total:350000},{name:'Bánh mì thịt',qty:20,price:25000,total:500000},{name:'Nước ép cam',qty:50,price:33000,total:1650000}]},
  { id:'2', orderCode:'SO-002', customerName:'Công ty TNHH ABC', date:'2024-12-15', channel:'b2b', salesperson:'Lê C', commission: 456000, discount: 500000, notes:'Đơn sỉ tháng 12', paymentStatus:'partial', status:'confirmed', totalAmount: 15200000,
    items:[{name:'Cà phê rang xay 1kg',qty:50,price:180000,total:9000000},{name:'Trà sen 500g',qty:40,price:120000,total:4800000},{name:'Siro đường nâu',qty:20,price:70000,total:1400000}]},
  { id:'3', orderCode:'SO-003', customerName:'Trần Thị D', date:'2024-12-14', channel:'online', salesperson:'Trần B', commission: 13500, discount: 0, notes:'', paymentStatus:'unpaid', status:'pending', totalAmount: 450000,
    items:[{name:'Trà sữa trân châu',qty:5,price:45000,total:225000},{name:'Matcha latte',qty:5,price:45000,total:225000}]},
  { id:'4', orderCode:'SO-004', customerName:'Công ty XYZ', date:'2024-12-14', channel:'b2b', salesperson:'Lê C', commission: 960000, discount: 1000000, notes:'Đơn sỉ Q4', paymentStatus:'unpaid', status:'confirmed', totalAmount: 32000000,
    items:[{name:'Cà phê rang xay 5kg',qty:20,price:850000,total:17000000},{name:'Bột cacao',qty:30,price:200000,total:6000000},{name:'Sữa tươi thùng',qty:100,price:90000,total:9000000}]},
  { id:'5', orderCode:'SO-005', customerName:'Khách vãng lai', date:'2024-12-13', channel:'pos', salesperson:'Trần B', commission: 23400, discount: 0, notes:'', paymentStatus:'paid', status:'delivered', totalAmount: 780000,
    items:[{name:'Cà phê đen đá',qty:3,price:30000,total:90000},{name:'Bánh flan',qty:10,price:25000,total:250000},{name:'Sinh tố bơ',qty:10,price:44000,total:440000}]},
  { id:'6', orderCode:'SO-006', customerName:'Cửa hàng Minh Đức', date:'2024-12-13', channel:'agent', salesperson:'Phạm E', commission: 267000, discount: 200000, notes:'CTV khu vực Q7', paymentStatus:'paid', status:'delivered', totalAmount: 8900000,
    items:[{name:'Combo trà sữa x10',qty:20,price:350000,total:7000000},{name:'Topping mix',qty:10,price:190000,total:1900000}]},
];

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

const SalesOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => MOCK.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (channelFilter !== 'all' && o.channel !== channelFilter) return false;
    if (search && !o.orderCode.toLowerCase().includes(search.toLowerCase()) && !o.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [statusFilter, channelFilter, search]);

  const stats = useMemo(() => {
    const active = MOCK.filter(o => o.status !== 'cancelled');
    return {
      total: MOCK.length, pending: MOCK.filter(o => o.status === 'pending').length,
      revenue: active.reduce((s, o) => s + o.totalAmount, 0),
      commission: active.reduce((s, o) => s + o.commission, 0),
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <PageHeader title="Đơn Hàng Bán Ra" description="Quản lý đơn hàng, kênh bán hàng và hoa hồng nhân viên." />
        <button onClick={() => navigate('/sales-order-create')} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 flex items-center gap-2">
          <span className="text-lg">+</span> Tạo đơn mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Tổng đơn', value: stats.total, icon: '📦', color: 'gray' },
          { label: 'Chờ xử lý', value: stats.pending, icon: '⏳', color: 'amber' },
          { label: 'Doanh thu', value: (stats.revenue/1e6).toFixed(1)+'M', icon: '💰', color: 'emerald' },
          { label: 'Hoa hồng', value: (stats.commission/1e6).toFixed(2)+'M', icon: '🎁', color: 'purple' },
        ].map((s,i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2"><span>{s.icon}</span><span className="text-[10px] font-bold text-gray-400 uppercase">{s.label}</span></div>
            <div className="text-xl font-black text-gray-900 dark:text-white mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <input type="search" placeholder="Tìm mã đơn, tên KH..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none dark:text-white focus:ring-2 focus:ring-emerald-500" />
          <div className="flex gap-2 flex-wrap">
            {['all','pending','confirmed','delivered','cancelled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${statusFilter===s ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {s === 'all' ? 'Tất cả' : STATUS[s]?.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all','pos','b2b','online','marketplace','agent'].map(c => (
              <button key={c} onClick={() => setChannelFilter(c)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${channelFilter===c ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {c === 'all' ? '🏪 Tất cả' : CHANNELS[c]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.map(order => {
          const ch = CHANNELS[order.channel];
          const st = STATUS[order.status];
          const py = PAY[order.paymentStatus];
          const isExpanded = expandedId === order.id;
          return (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              <button type="button" onClick={() => setExpandedId(isExpanded ? null : order.id)} className="w-full text-left p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">{order.orderCode}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${st?.cls}`}>{st?.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{backgroundColor:(ch?.color||'#999')+'20',color:ch?.color}}>{ch?.label}</span>
                      <span className={`text-[10px] font-bold ${py?.cls}`}>{py?.label}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{order.customerName}</div>
                    <div className="flex gap-4 mt-1 text-[11px] text-gray-400">
                      <span>📅 {new Date(order.date).toLocaleDateString('vi-VN')}</span>
                      <span>👤 {order.salesperson}</span>
                      <span>🛒 {order.items.length} SP</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-black text-gray-900 dark:text-white">{fmt(order.totalAmount)}</div>
                    {order.commission > 0 && <div className="text-[10px] font-bold text-purple-500">HH: {fmt(order.commission)}</div>}
                    {order.discount > 0 && <div className="text-[10px] font-bold text-amber-500">CK: -{fmt(order.discount)}</div>}
                  </div>
                  <div className="flex-shrink-0"><svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded?'rotate-180':''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg></div>
                </div>
              </button>

              {/* Drill-down */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Chi tiết sản phẩm</div>
                  <table className="w-full text-sm">
                    <thead><tr className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2">Sản phẩm</th><th className="text-right py-2">SL</th><th className="text-right py-2">Đơn giá</th><th className="text-right py-2">Thành tiền</th>
                    </tr></thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="py-2 font-semibold text-gray-900 dark:text-white">{item.name}</td>
                          <td className="py-2 text-right text-gray-600 dark:text-gray-300">{item.qty}</td>
                          <td className="py-2 text-right text-gray-600 dark:text-gray-300">{fmt(item.price)}</td>
                          <td className="py-2 text-right font-bold text-gray-900 dark:text-white">{fmt(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="font-black text-emerald-600 dark:text-emerald-400">
                      <td className="pt-2" colSpan={3}>Tổng cộng</td><td className="pt-2 text-right">{fmt(order.totalAmount)}</td>
                    </tr></tfoot>
                  </table>
                  {order.notes && <div className="mt-3 text-xs text-gray-500 italic">📝 {order.notes}</div>}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">🔍</div><div className="font-bold">Không tìm thấy đơn hàng</div></div>
        )}
      </div>
    </div>
  );
};

export default SalesOrdersPage;
