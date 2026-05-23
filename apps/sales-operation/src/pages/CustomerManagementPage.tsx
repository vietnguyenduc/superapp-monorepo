import React, { useState, useMemo } from 'react';
import PageHeader from '../components/UI/PageHeader';

interface Customer {
  id: string; code: string; name: string; phone: string; email: string;
  type: 'individual'|'company'; segment: 'vip'|'regular'|'new'|'inactive';
  totalOrders: number; totalSpent: number; debt: number; avgOrder: number;
  lastOrderDate: string; acquisitionChannel: string; acquisitionCost: number;
  orders: { code: string; date: string; amount: number; status: string }[];
}

const SEGMENTS: Record<string, { label: string; color: string; bg: string }> = {
  vip: { label: '⭐ VIP', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  regular: { label: '🔵 Thường xuyên', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  new: { label: '🆕 Mới', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  inactive: { label: '⚪ Ngừng HĐ', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700' },
};

const MOCK: Customer[] = [
  { id:'1',code:'KH001',name:'Công ty TNHH ABC',phone:'028-1234567',email:'info@abc.vn',type:'company',segment:'vip',totalOrders:45,totalSpent:125000000,debt:32000000,avgOrder:2777778,lastOrderDate:'2024-12-15',acquisitionChannel:'B2B direct',acquisitionCost:500000,
    orders:[{code:'SO-002',date:'2024-12-15',amount:15200000,status:'confirmed'},{code:'SO-011',date:'2024-12-10',amount:18500000,status:'delivered'},{code:'SO-018',date:'2024-12-05',amount:22000000,status:'delivered'}]},
  { id:'2',code:'KH002',name:'Cửa hàng Minh Đức',phone:'0908765432',email:'minhduc@shop.vn',type:'company',segment:'vip',totalOrders:67,totalSpent:230000000,debt:8500000,avgOrder:3432836,lastOrderDate:'2024-12-15',acquisitionChannel:'Agent referral',acquisitionCost:200000,
    orders:[{code:'SO-006',date:'2024-12-13',amount:8900000,status:'delivered'},{code:'SO-015',date:'2024-12-08',amount:12300000,status:'delivered'}]},
  { id:'3',code:'KH003',name:'Nguyễn Văn A',phone:'0901234567',email:'nva@email.com',type:'individual',segment:'regular',totalOrders:12,totalSpent:15600000,debt:2500000,avgOrder:1300000,lastOrderDate:'2024-12-15',acquisitionChannel:'POS walk-in',acquisitionCost:0,
    orders:[{code:'SO-001',date:'2024-12-15',amount:2500000,status:'delivered'},{code:'SO-010',date:'2024-12-11',amount:1800000,status:'delivered'}]},
  { id:'4',code:'KH004',name:'Công ty XYZ',phone:'028-9876543',email:'sales@xyz.vn',type:'company',segment:'regular',totalOrders:28,totalSpent:89000000,debt:15000000,avgOrder:3178571,lastOrderDate:'2024-12-14',acquisitionChannel:'Facebook Ads',acquisitionCost:1200000,
    orders:[{code:'SO-004',date:'2024-12-14',amount:32000000,status:'confirmed'}]},
  { id:'5',code:'KH005',name:'Trần Thị D',phone:'0987654321',email:'ttd@email.com',type:'individual',segment:'new',totalOrders:3,totalSpent:1200000,debt:450000,avgOrder:400000,lastOrderDate:'2024-12-14',acquisitionChannel:'Online order',acquisitionCost:50000,
    orders:[{code:'SO-003',date:'2024-12-14',amount:450000,status:'pending'}]},
  { id:'6',code:'KH006',name:'Lê Hoàng C',phone:'0912345678',email:'',type:'individual',segment:'inactive',totalOrders:1,totalSpent:450000,debt:0,avgOrder:450000,lastOrderDate:'2024-11-20',acquisitionChannel:'Walk-in',acquisitionCost:0,orders:[]},
];

const fmt = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(0)}K` : n.toLocaleString('vi-VN') + 'đ';

const CustomerManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCust, setNewCust] = useState({name:'',phone:'',email:'',type:'individual' as const, segment:'new' as const});

  const filtered = useMemo(() => MOCK.filter(c => {
    if (segmentFilter !== 'all' && c.segment !== segmentFilter) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
    return true;
  }), [segmentFilter, typeFilter, search]);

  const stats = useMemo(() => ({
    total: MOCK.length,
    vip: MOCK.filter(c => c.segment === 'vip').length,
    totalRevenue: MOCK.reduce((s, c) => s + c.totalSpent, 0),
    totalDebt: MOCK.reduce((s, c) => s + c.debt, 0),
    totalMarketingCost: MOCK.reduce((s, c) => s + c.acquisitionCost, 0),
  }), []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <PageHeader title="Quản lý Khách Hàng" description="Phân khúc, lịch sử mua hàng, công nợ và chi phí marketing." />
        <button onClick={() => setIsAddOpen(true)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 flex items-center gap-2">
          <span className="text-lg">+</span> Thêm KH
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label:'Tổng KH', value: stats.total, icon:'👥', c:'gray' },
          { label:'VIP', value: stats.vip, icon:'⭐', c:'amber' },
          { label:'Tổng DT', value: fmt(stats.totalRevenue), icon:'💰', c:'emerald' },
          { label:'Công nợ', value: fmt(stats.totalDebt), icon:'🔴', c:'red' },
          { label:'CP Marketing', value: fmt(stats.totalMarketingCost), icon:'📢', c:'purple' },
        ].map((s,i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2"><span>{s.icon}</span><span className="text-[10px] font-bold text-gray-400 uppercase">{s.label}</span></div>
            <div className="text-xl font-black text-gray-900 dark:text-white mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="search" placeholder="Tìm tên, mã KH, SĐT..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none dark:text-white" />
          <div className="flex gap-2 flex-wrap">
            {['all','vip','regular','new','inactive'].map(s => (
              <button key={s} onClick={() => setSegmentFilter(s)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${segmentFilter===s?'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20':'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {s === 'all' ? 'Tất cả' : SEGMENTS[s]?.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[{v:'all',l:'Tất cả'},{v:'individual',l:'👤 Cá nhân'},{v:'company',l:'🏢 DN'}].map(t => (
              <button key={t.v} onClick={() => setTypeFilter(t.v)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${typeFilter===t.v?'bg-blue-600 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{t.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="space-y-3">
        {filtered.map(c => {
          const seg = SEGMENTS[c.segment];
          const isExpanded = expandedId === c.id;
          return (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all">
              <button type="button" onClick={() => setExpandedId(isExpanded ? null : c.id)} className="w-full text-left p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 ${c.type === 'company' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                    {c.type === 'company' ? '🏢' : c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</span>
                      <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-md">{c.code}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${seg?.bg} ${seg?.color}`}>{seg?.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                      {c.phone && <span>📞 {c.phone}</span>}
                      <span>🛒 {c.totalOrders} đơn</span>
                      <span>📊 TB: {fmt(c.avgOrder)}/đơn</span>
                      {c.acquisitionChannel && <span>📢 {c.acquisitionChannel}</span>}
                    </div>
                  </div>
                  <div className="flex gap-6 items-center text-right flex-shrink-0">
                    <div><div className="text-[10px] font-bold text-gray-400 uppercase">Đã mua</div><div className="text-sm font-bold text-gray-900 dark:text-white">{fmt(c.totalSpent)}</div></div>
                    <div><div className="text-[10px] font-bold text-gray-400 uppercase">Công nợ</div><div className={`text-sm font-black ${c.debt > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'}`}>{c.debt > 0 ? fmt(c.debt) : '0'}</div></div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded?'rotate-180':''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
              </button>

              {/* Expanded: Order History + Marketing */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Order History */}
                    <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">📋 Lịch sử đơn hàng gần đây</div>
                      {c.orders.length > 0 ? (
                        <div className="space-y-2">
                          {c.orders.map((o, i) => (
                            <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-xs">
                              <div><span className="font-mono font-bold text-emerald-600">{o.code}</span><span className="text-gray-400 ml-2">{new Date(o.date).toLocaleDateString('vi-VN')}</span></div>
                              <div className="font-bold text-gray-900 dark:text-white">{fmt(o.amount)}</div>
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-xs text-gray-400 italic">Chưa có đơn hàng</div>}
                    </div>
                    {/* Marketing & Info */}
                    <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">📢 Chi phí & Thông tin</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between bg-white dark:bg-gray-800 rounded-xl px-3 py-2">
                          <span className="text-gray-500">Kênh tiếp cận</span><span className="font-bold text-gray-900 dark:text-white">{c.acquisitionChannel || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between bg-white dark:bg-gray-800 rounded-xl px-3 py-2">
                          <span className="text-gray-500">Chi phí marketing</span><span className="font-bold text-purple-600">{c.acquisitionCost > 0 ? fmt(c.acquisitionCost) : 'Miễn phí'}</span>
                        </div>
                        <div className="flex justify-between bg-white dark:bg-gray-800 rounded-xl px-3 py-2">
                          <span className="text-gray-500">ROI khách hàng</span><span className="font-bold text-emerald-600">{c.acquisitionCost > 0 ? `${(c.totalSpent / c.acquisitionCost).toFixed(0)}x` : '∞'}</span>
                        </div>
                        <div className="flex justify-between bg-white dark:bg-gray-800 rounded-xl px-3 py-2">
                          <span className="text-gray-500">Email</span><span className="font-bold text-gray-900 dark:text-white">{c.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">🔍</div><div className="font-bold">Không tìm thấy khách hàng</div></div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thêm Khách Hàng</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên *</label>
                <input type="text" value={newCust.name} onChange={e => setNewCust(p=>({...p,name:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white" placeholder="Nhập tên KH" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">SĐT</label>
                  <input type="tel" value={newCust.phone} onChange={e => setNewCust(p=>({...p,phone:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white" /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input type="email" value={newCust.email} onChange={e => setNewCust(p=>({...p,email:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white" /></div>
              </div>
              <div className="flex gap-2">{[{v:'individual',l:'👤 Cá nhân'},{v:'company',l:'🏢 Doanh nghiệp'}].map(t=>(
                <button key={t.v} onClick={()=>setNewCust(p=>({...p,type:t.v as any}))} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${newCust.type===t.v?'bg-emerald-600 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{t.l}</button>
              ))}</div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phân khúc</label>
                <div className="flex gap-2">{Object.entries(SEGMENTS).map(([k,v])=>(
                  <button key={k} onClick={()=>setNewCust(p=>({...p,segment:k as any}))} className={`flex-1 py-2 rounded-xl text-[11px] font-bold ${newCust.segment===k?'bg-emerald-600 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{v.label}</button>
                ))}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setIsAddOpen(false)} className="px-4 py-2 text-sm text-gray-500">Hủy</button>
              <button onClick={()=>{alert('Đã thêm: '+newCust.name);setIsAddOpen(false);}} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagementPage;
