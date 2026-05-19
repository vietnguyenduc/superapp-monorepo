import React, { useState, useMemo } from 'react';
import PageHeader from '../components/UI/PageHeader';

interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  type: 'individual' | 'company';
  totalOrders: number;
  totalSpent: number;
  debt: number;
  lastOrderDate: string;
  status: 'active' | 'inactive';
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', code: 'KH001', name: 'Nguyễn Văn A', phone: '0901234567', email: 'nva@email.com', type: 'individual', totalOrders: 12, totalSpent: 15600000, debt: 2500000, lastOrderDate: '2024-12-15', status: 'active' },
  { id: '2', code: 'KH002', name: 'Công ty TNHH ABC', phone: '028-1234567', email: 'info@abc.vn', type: 'company', totalOrders: 45, totalSpent: 125000000, debt: 32000000, lastOrderDate: '2024-12-15', status: 'active' },
  { id: '3', code: 'KH003', name: 'Trần Thị B', phone: '0987654321', email: 'ttb@email.com', type: 'individual', totalOrders: 3, totalSpent: 1200000, debt: 0, lastOrderDate: '2024-12-10', status: 'active' },
  { id: '4', code: 'KH004', name: 'Công ty XYZ', phone: '028-9876543', email: 'sales@xyz.vn', type: 'company', totalOrders: 28, totalSpent: 89000000, debt: 15000000, lastOrderDate: '2024-12-14', status: 'active' },
  { id: '5', code: 'KH005', name: 'Lê Hoàng C', phone: '0912345678', email: '', type: 'individual', totalOrders: 1, totalSpent: 450000, debt: 0, lastOrderDate: '2024-11-20', status: 'inactive' },
  { id: '6', code: 'KH006', name: 'Cửa hàng Minh Đức', phone: '0908765432', email: 'minhduc@shop.vn', type: 'company', totalOrders: 67, totalSpent: 230000000, debt: 8500000, lastOrderDate: '2024-12-15', status: 'active' },
];

const CustomerManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [customers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', type: 'individual' as const });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
      return true;
    });
  }, [customers, typeFilter, search]);

  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    totalDebt: customers.reduce((s, c) => s + c.debt, 0),
    totalRevenue: customers.reduce((s, c) => s + c.totalSpent, 0),
  }), [customers]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PageHeader
        title="Quản lý Khách Hàng"
        description="Danh sách khách hàng, theo dõi công nợ và lịch sử mua hàng."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng KH</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
          <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Đang hoạt động</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30 shadow-sm">
          <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">Tổng doanh thu</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{(stats.totalRevenue / 1000000).toFixed(0)}M</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-red-100 dark:border-red-900/30 shadow-sm">
          <div className="text-xs font-bold text-red-500 uppercase tracking-wider">Tổng công nợ</div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{(stats.totalDebt / 1000000).toFixed(1)}M</div>
        </div>
      </div>

      {/* Filters + Add */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Tìm tên, mã KH, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
          />
          <div className="flex gap-2">
            {['all', 'individual', 'company'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  typeFilter === t
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {t === 'all' ? 'Tất cả' : t === 'individual' ? 'Cá nhân' : 'Doanh nghiệp'}
              </button>
            ))}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Thêm KH
            </button>
          </div>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="space-y-3">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 ${
                customer.type === 'company' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              }`}>
                {customer.type === 'company' ? '🏢' : customer.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{customer.name}</span>
                  <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md">{customer.code}</span>
                  {customer.status === 'inactive' && (
                    <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md">Ngừng HĐ</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {customer.phone && <span>📞 {customer.phone}</span>}
                  {customer.email && <span>✉️ {customer.email}</span>}
                  <span>🛒 {customer.totalOrders} đơn</span>
                  <span>📅 {new Date(customer.lastOrderDate).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              {/* Financial */}
              <div className="flex gap-6 items-center text-right">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Đã mua</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{(customer.totalSpent / 1000000).toFixed(1)}M</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Công nợ</div>
                  <div className={`text-sm font-black ${customer.debt > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {customer.debt > 0 ? `${(customer.debt / 1000000).toFixed(1)}M` : '0'}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" title="Xem chi tiết">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Chỉnh sửa">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-bold">Không tìm thấy khách hàng</div>
            <div className="text-sm mt-1">Thử thay đổi bộ lọc hoặc thêm khách hàng mới</div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thêm Khách Hàng Mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên khách hàng *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white"
                  placeholder="Nhập tên khách hàng"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white"
                    placeholder="0901234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại khách hàng</label>
                <div className="flex gap-2">
                  {[{ v: 'individual', l: '👤 Cá nhân' }, { v: 'company', l: '🏢 Doanh nghiệp' }].map(t => (
                    <button
                      key={t.v}
                      onClick={() => setNewCustomer(p => ({ ...p, type: t.v as 'individual' | 'company' }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        newCustomer.type === t.v
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Hủy</button>
              <button
                onClick={() => {
                  alert('Đã thêm khách hàng: ' + newCustomer.name);
                  setIsAddModalOpen(false);
                  setNewCustomer({ name: '', phone: '', email: '', type: 'individual' });
                }}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
              >
                Lưu khách hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagementPage;
