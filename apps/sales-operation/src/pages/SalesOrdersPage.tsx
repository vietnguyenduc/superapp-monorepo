import React, { useState, useMemo } from 'react';
import PageHeader from '../components/UI/PageHeader';

interface SalesOrder {
  id: string;
  orderCode: string;
  customerName: string;
  date: string;
  items: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
}

const MOCK_ORDERS: SalesOrder[] = [
  { id: '1', orderCode: 'SO-2024001', customerName: 'Nguyễn Văn A', date: '2024-12-15', items: 3, totalAmount: 2500000, status: 'confirmed', paymentStatus: 'paid' },
  { id: '2', orderCode: 'SO-2024002', customerName: 'Công ty TNHH ABC', date: '2024-12-15', items: 8, totalAmount: 15200000, status: 'delivered', paymentStatus: 'partial' },
  { id: '3', orderCode: 'SO-2024003', customerName: 'Trần Thị B', date: '2024-12-14', items: 1, totalAmount: 450000, status: 'pending', paymentStatus: 'unpaid' },
  { id: '4', orderCode: 'SO-2024004', customerName: 'Công ty XYZ', date: '2024-12-14', items: 12, totalAmount: 32000000, status: 'confirmed', paymentStatus: 'unpaid' },
  { id: '5', orderCode: 'SO-2024005', customerName: 'Lê Hoàng C', date: '2024-12-13', items: 2, totalAmount: 780000, status: 'cancelled', paymentStatus: 'unpaid' },
  { id: '6', orderCode: 'SO-2024006', customerName: 'Khách vãng lai', date: '2024-12-13', items: 5, totalAmount: 1950000, status: 'delivered', paymentStatus: 'paid' },
];

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: 'Chờ xử lý', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { label: 'Đã xác nhận', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  delivered: { label: 'Đã giao', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const paymentConfig: Record<string, { label: string; class: string }> = {
  unpaid: { label: 'Chưa thanh toán', class: 'text-red-600 dark:text-red-400' },
  partial: { label: 'Thanh toán một phần', class: 'text-amber-600 dark:text-amber-400' },
  paid: { label: 'Đã thanh toán', class: 'text-emerald-600 dark:text-emerald-400' },
};

const SalesOrdersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders] = useState<SalesOrder[]>(MOCK_ORDERS);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search && !o.orderCode.toLowerCase().includes(search.toLowerCase()) && !o.customerName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [orders, statusFilter, search]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    totalRevenue: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0),
    unpaid: orders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0),
  }), [orders]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PageHeader
        title="Danh sách Đơn Hàng"
        description="Quản lý đơn hàng bán ra, theo dõi trạng thái giao hàng và công nợ."
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng đơn</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30 shadow-sm">
          <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">Chờ xử lý</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
          <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Doanh thu</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{(stats.totalRevenue / 1000000).toFixed(1)}M</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-red-100 dark:border-red-900/30 shadow-sm">
          <div className="text-xs font-bold text-red-500 uppercase tracking-wider">Công nợ</div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{(stats.unpaid / 1000000).toFixed(1)}M</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Tìm mã đơn, tên khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
          />
          <div className="flex gap-2">
            {['all', 'pending', 'confirmed', 'delivered', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {s === 'all' ? 'Tất cả' : statusConfig[s]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-gray-400">Mã đơn</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-gray-400">Khách hàng</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-gray-400">Ngày</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-400">SP</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider text-gray-400">Thành tiền</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-400">Trạng thái</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-400">Thanh toán</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">{order.orderCode}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{order.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-gray-700 dark:text-gray-300">{order.items}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-white">{order.totalAmount.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${statusConfig[order.status].class}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${paymentConfig[order.paymentStatus].class}`}>
                      {paymentConfig[order.paymentStatus].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" title="Xem chi tiết">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500" title="In hóa đơn">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-gray-600 italic">Không tìm thấy đơn hàng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesOrdersPage;
