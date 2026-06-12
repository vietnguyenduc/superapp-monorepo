import React, { useState } from 'react';
import PageHeader from '../components/UI/PageHeader';
import SearchBar from '../components/UI/SearchBar';
import IssueInvoiceSlideOver from '../components/Invoice/IssueInvoiceSlideOver';
import InvoicePreviewModal from '../components/Invoice/InvoicePreviewModal';

const MOCK_INVOICES = [
  {
    id: 'INV-001',
    orderId: 'ORD-2026-001',
    customerName: 'Công ty ABC',
    totalAmount: 1080000,
    status: 'ISSUED',
    issueDate: '2026-05-27T10:00:00Z',
    provider: 'MISA',
    lookupCode: 'MISA-XYZ123'
  },
  {
    id: 'INV-002',
    orderId: 'ORD-2026-002',
    customerName: 'Công ty XYZ',
    totalAmount: 5400000,
    status: 'PENDING',
    issueDate: null,
    provider: 'VIETTEL',
    lookupCode: null
  },
  {
    id: 'INV-003',
    orderId: 'ORD-2026-003',
    customerName: 'Cửa hàng Minh Khang',
    totalAmount: 2160000,
    status: 'ERROR',
    issueDate: null,
    provider: 'VNPT',
    lookupCode: null
  }
];

const InvoiceManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const handleIssueInvoiceClick = () => {
    setIsSlideOverOpen(true);
  };

  const handleViewInvoiceClick = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsPreviewModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Đã phát hành</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Chờ phát hành</span>;
      case 'ERROR':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Lỗi phát hành</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Không xác định</span>;
    }
  };

  const filteredInvoices = MOCK_INVOICES.filter(inv => 
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader 
            title="Quản lý Hóa đơn điện tử" 
            description="Theo dõi và phát hành hóa đơn cho khách hàng"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleIssueInvoiceClick}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Xuất Hóa đơn mới
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Hóa đơn đã phát hành</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white mt-2">1,245</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Doanh số xuất hóa đơn</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">1.25B ₫</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Hóa đơn lỗi/chờ xử lý</span>
            <span className="text-2xl font-bold text-red-500 dark:text-red-400 mt-2">12</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-96">
            <SearchBar 
              placeholder="Tìm kiếm theo mã HĐ, khách hàng..." 
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="">Tất cả nhà cung cấp</option>
              <option value="MISA">MISA meInvoice</option>
              <option value="VIETTEL">Viettel S-Invoice</option>
              <option value="VNPT">VNPT Invoice</option>
            </select>
            <select className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="">Tất cả trạng thái</option>
              <option value="ISSUED">Đã phát hành</option>
              <option value="PENDING">Chờ phát hành</option>
              <option value="ERROR">Lỗi</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Mã Hóa Đơn</th>
                  <th className="px-6 py-4 font-semibold">Khách Hàng</th>
                  <th className="px-6 py-4 font-semibold">Tổng Tiền</th>
                  <th className="px-6 py-4 font-semibold">Ngày Cấp</th>
                  <th className="px-6 py-4 font-semibold">Trạng Thái</th>
                  <th className="px-6 py-4 font-semibold">Nhà Cung Cấp</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {inv.id}
                      <div className="text-xs text-gray-500 font-normal">{inv.orderId}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{inv.customerName}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      {inv.totalAmount.toLocaleString()} ₫
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-semibold">
                        {inv.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.status === 'ISSUED' ? (
                        <button 
                          onClick={() => handleViewInvoiceClick(inv)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Xem / Gửi
                        </button>
                      ) : (
                        <button className="text-amber-600 hover:text-amber-700 font-medium text-sm bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 px-3 py-1.5 rounded-lg transition-colors">
                          Thử lại
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <IssueInvoiceSlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
      />

      <InvoicePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        invoiceData={selectedInvoice}
      />
    </div>
  );
};

export default InvoiceManagementPage;
