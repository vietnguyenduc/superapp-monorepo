// @ts-nocheck
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// ─── Mock Data (Trial Mode) ───
const MOCK_ORDERS = [
  { id: '1', code: 'SO-001', customer: 'Nguyễn Văn A', channel: 'pos', amount: 2500000, status: 'delivered', date: '2024-12-15', salesperson: 'Trần B', items: 3 },
  { id: '2', code: 'SO-002', customer: 'Công ty ABC', channel: 'b2b', amount: 15200000, status: 'confirmed', date: '2024-12-15', salesperson: 'Lê C', items: 8 },
  { id: '3', code: 'SO-003', customer: 'Trần Thị D', channel: 'online', amount: 450000, status: 'pending', date: '2024-12-14', salesperson: 'Trần B', items: 1 },
  { id: '4', code: 'SO-004', customer: 'Công ty XYZ', channel: 'b2b', amount: 32000000, status: 'delivered', date: '2024-12-14', salesperson: 'Lê C', items: 12 },
  { id: '5', code: 'SO-005', customer: 'Khách vãng lai', channel: 'pos', amount: 780000, status: 'delivered', date: '2024-12-13', salesperson: 'Trần B', items: 2 },
  { id: '6', code: 'SO-006', customer: 'Cửa hàng MĐ', channel: 'agent', amount: 8900000, status: 'delivered', date: '2024-12-13', salesperson: 'Phạm E', items: 5 },
  { id: '7', code: 'SO-007', customer: 'Shop Online', channel: 'marketplace', amount: 3200000, status: 'confirmed', date: '2024-12-12', salesperson: 'Lê C', items: 4 },
  { id: '8', code: 'SO-008', customer: 'Quán F', channel: 'delivery', amount: 1850000, status: 'delivered', date: '2024-12-12', salesperson: 'Trần B', items: 3 },
];

const REVENUE_TREND = [
  { date: '10/12', revenue: 12500000, orders: 8 },
  { date: '11/12', revenue: 18200000, orders: 12 },
  { date: '12/12', revenue: 15800000, orders: 10 },
  { date: '13/12', revenue: 22400000, orders: 15 },
  { date: '14/12', revenue: 35600000, orders: 18 },
  { date: '15/12', revenue: 28900000, orders: 14 },
];

const CHANNEL_COLORS: Record<string, string> = {
  pos: '#10b981', b2b: '#3b82f6', online: '#8b5cf6', marketplace: '#f59e0b',
  agent: '#ec4899', delivery: '#06b6d4', social: '#f97316', wholesale: '#6366f1',
};
const CHANNEL_LABELS: Record<string, string> = {
  pos: 'POS', b2b: 'B2B', online: 'Online', marketplace: 'Marketplace',
  agent: 'Đại lý', delivery: 'Delivery', social: 'Social', wholesale: 'Chợ',
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Chờ', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { label: 'Xác nhận', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  delivered: { label: 'Giao', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Hủy', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const fmt = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(0)}K` : n.toString();

const DashboardPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'day'|'week'|'month'>('week');

  const stats = useMemo(() => {
    const active = MOCK_ORDERS.filter(o => o.status !== 'cancelled');
    const delivered = active.filter(o => o.status === 'delivered');
    const totalRevenue = active.reduce((s, o) => s + o.amount, 0);
    const avgOrder = active.length > 0 ? totalRevenue / active.length : 0;
    const uniqueCustomers = new Set(active.map(o => o.customer)).size;
    const completionRate = active.length > 0 ? (delivered.length / active.length * 100) : 0;
    const totalDebt = active.filter(o => o.status !== 'delivered').reduce((s, o) => s + o.amount, 0);
    return { totalRevenue, orderCount: active.length, avgOrder, newCustomers: uniqueCustomers, completionRate, totalDebt };
  }, []);

  // Channel distribution
  const channelData = useMemo(() => {
    const map: Record<string, number> = {};
    MOCK_ORDERS.filter(o => o.status !== 'cancelled').forEach(o => {
      map[o.channel] = (map[o.channel] || 0) + o.amount;
    });
    return Object.entries(map).map(([k, v]) => ({ name: CHANNEL_LABELS[k] || k, value: v, color: CHANNEL_COLORS[k] || '#999' }));
  }, []);

  // Top salesperson
  const topSales = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; orders: number; commission: number }> = {};
    MOCK_ORDERS.filter(o => o.status !== 'cancelled').forEach(o => {
      if (!map[o.salesperson]) map[o.salesperson] = { name: o.salesperson, revenue: 0, orders: 0, commission: 0 };
      map[o.salesperson].revenue += o.amount;
      map[o.salesperson].orders += 1;
      map[o.salesperson].commission += o.amount * 0.03;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, []);

  // Target progress
  const targetRevenue = 100000000;
  const achievementRate = (stats.totalRevenue / targetRevenue) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 w-full transition-colors duration-300">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard Bán Hàng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tổng quan doanh thu, đơn hàng và hiệu suất bán hàng</p>
          </div>
          <div className="flex gap-2">
            {(['day','week','month'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${period === p ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
                {p === 'day' ? 'Hôm nay' : p === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-12">
        {/* ═══ KPI Cards ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Doanh thu', value: fmt(stats.totalRevenue), change: '+18%', color: 'emerald', icon: '💰' },
            { label: 'Số đơn hàng', value: stats.orderCount.toString(), change: '+12%', color: 'blue', icon: '📦' },
            { label: 'TB / đơn', value: fmt(stats.avgOrder), change: '+5%', color: 'purple', icon: '📊' },
            { label: 'KH mới', value: stats.newCustomers.toString(), change: '+3', color: 'amber', icon: '👤' },
            { label: 'Tỷ lệ giao', value: `${stats.completionRate.toFixed(0)}%`, change: '+2%', color: 'teal', icon: '✅' },
            { label: 'Công nợ', value: fmt(stats.totalDebt), change: '', color: 'red', icon: '🔴' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{kpi.icon}</span>
                {kpi.change && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${kpi.color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>{kpi.change}</span>}
              </div>
              <div className="text-xl font-black text-gray-900 dark:text-white">{kpi.value}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ═══ Target Progress ═══ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">🎯 Chỉ tiêu tháng này</h3>
              <p className="text-xs text-gray-400 mt-0.5">Target: {fmt(targetRevenue)}</p>
            </div>
            <span className={`text-sm font-black ${achievementRate >= 100 ? 'text-emerald-600' : achievementRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
              {achievementRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all duration-700 ${achievementRate >= 100 ? 'bg-emerald-500' : achievementRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(achievementRate, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
            <span>Đã đạt: {fmt(stats.totalRevenue)}</span>
            <span>Còn thiếu: {fmt(Math.max(0, targetRevenue - stats.totalRevenue))}</span>
          </div>
        </div>

        {/* ═══ Charts Row ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Revenue Trend */}
          <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">📈 Xu hướng doanh thu</h3>
            </div>
            <div className="p-4" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_TREND}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString('vi-VN') + 'đ', 'Doanh thu']} contentStyle={{ borderRadius: 12, fontSize: 13, backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Pie */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">🏪 Kênh bán hàng</h3>
            </div>
            <div className="p-4" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {channelData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [fmt(v), 'Doanh thu']} contentStyle={{ borderRadius: 12, fontSize: 12, backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ═══ Tables Row ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Recent Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">📋 Đơn hàng gần đây</h3>
              <button onClick={() => navigate('/sales-orders')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Xem tất cả →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-700/50">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase">Mã đơn</th>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase">KH</th>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase">Kênh</th>
                    <th className="px-4 py-2 text-right text-[10px] font-black text-gray-400 uppercase">Giá trị</th>
                    <th className="px-4 py-2 text-center text-[10px] font-black text-gray-400 uppercase">TT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {MOCK_ORDERS.slice(0, 6).map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{o.code}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{o.customer}</td>
                      <td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: (CHANNEL_COLORS[o.channel] || '#999') + '20', color: CHANNEL_COLORS[o.channel] }}>{CHANNEL_LABELS[o.channel]}</span></td>
                      <td className="px-4 py-2.5 text-xs font-bold text-gray-900 dark:text-white text-right">{o.amount.toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-2.5 text-center"><span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${STATUS_MAP[o.status]?.cls}`}>{STATUS_MAP[o.status]?.label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Salespeople */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">🏆 Top nhân viên bán hàng</h3>
            </div>
            <div className="p-4 space-y-3">
              {topSales.map((sp, i) => {
                const maxRev = topSales[0]?.revenue || 1;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${i === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : `#${i+1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{sp.name}</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{fmt(sp.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${(sp.revenue / maxRev) * 100}%` }} />
                      </div>
                      <div className="flex gap-4 mt-1.5 text-[10px] font-bold text-gray-400">
                        <span>{sp.orders} đơn</span>
                        <span>HH: {fmt(sp.commission)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Tạo đơn mới', icon: '➕', href: '/sales-order-create', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
            { label: 'Khách hàng', icon: '👥', href: '/customers', color: 'bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700' },
            { label: 'Đơn hàng', icon: '📋', href: '/sales-orders', color: 'bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700' },
            { label: 'Cài đặt', icon: '⚙️', href: '/settings', color: 'bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700' },
          ].map((a, i) => (
            <button key={i} onClick={() => navigate(a.href)} className={`${a.color} rounded-2xl p-4 text-left transition-all shadow-sm hover:shadow-md`}>
              <span className="text-xl">{a.icon}</span>
              <div className="text-sm font-bold mt-2">{a.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPageEnhanced;
