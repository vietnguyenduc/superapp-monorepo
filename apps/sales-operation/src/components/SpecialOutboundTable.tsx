import React, { useState } from 'react';
import { SpecialOutboundRecord, Product, ApprovalLog } from '../types';

interface SpecialOutboundTableProps {
  records: SpecialOutboundRecord[];
  products: Product[];
  approvalLogs: ApprovalLog[];
  onEdit: (record: SpecialOutboundRecord) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment: string) => void;
  onViewHistory: (recordId: string) => void;
  loading?: boolean;
  currentUserRole?: string;
}

const OUTBOUND_REASONS = {
  'damaged': { label: 'Hàng hỏng', icon: '💔', color: 'text-red-600' },
  'expired': { label: 'Hết hạn', icon: '⏰', color: 'text-orange-600' },
  'sample': { label: 'Lấy mẫu', icon: '🧪', color: 'text-purple-600' },
  'gift': { label: 'Tặng khách hàng', icon: '🎁', color: 'text-pink-600' },
  'internal_use': { label: 'Sử dụng nội bộ', icon: '🏢', color: 'text-blue-600' },
  'loss': { label: 'Thất thoát', icon: '📉', color: 'text-gray-600' },
  'return': { label: 'Trả hàng nhà cung cấp', icon: '↩️', color: 'text-indigo-600' },
  'other': { label: 'Lý do khác', icon: '📝', color: 'text-gray-600' }
};

const SpecialOutboundTable: React.FC<SpecialOutboundTableProps> = ({
  records,
  products,
  approvalLogs,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onViewHistory,
  loading = false,
  currentUserRole = 'staff'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState<{
    recordId: string;
    action: 'approve' | 'reject';
  } | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Get product info by ID
  const getProductInfo = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    const product = getProductInfo(record.product_id);
    const matchesSearch = !searchTerm || 
      product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.business_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.reason_detail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || record.approval_status === statusFilter;
    const matchesReason = !reasonFilter || record.reason === reasonFilter;
    const matchesDate = !dateFilter || record.date === dateFilter;

    return matchesSearch && matchesStatus && matchesReason && matchesDate;
  });

  // Calculate statistics
  const stats = records.reduce((acc, record) => {
    acc.total++;
    acc[record.approval_status]++;
    acc.totalQuantity += record.quantity;
    return acc;
  }, { 
    total: 0, 
    pending: 0, 
    approved: 0, 
    rejected: 0, 
    totalQuantity: 0 
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  const canApprove = (record: SpecialOutboundRecord) => {
    return currentUserRole === 'manager' || currentUserRole === 'admin';
  };

  const canEdit = (record: SpecialOutboundRecord) => {
    return record.approval_status === 'pending' || record.approval_status === 'rejected';
  };

  const handleApprovalAction = (recordId: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      onApprove(recordId, approvalComment);
    } else {
      if (!approvalComment.trim()) {
        alert('Vui lòng nhập lý do từ chối');
        return;
      }
      onReject(recordId, approvalComment);
    }
    
    setShowApprovalModal(null);
    setApprovalComment('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📤</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Danh sách xuất đặc biệt</h3>
              <p className="text-sm text-gray-500">
                {filteredRecords.length} yêu cầu • {stats.pending} chờ duyệt • {stats.approved} đã duyệt
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, mã, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
          <div>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả lý do</option>
              {Object.entries(OUTBOUND_REASONS).map(([key, reason]) => (
                <option key={key} value={key}>
                  {reason.icon} {reason.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Tổng yêu cầu</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Từ chối</p>
                <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">❌</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Đang tải dữ liệu...</span>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📤</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có yêu cầu xuất đặc biệt</h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchTerm || statusFilter || reasonFilter || dateFilter 
                ? 'Không tìm thấy yêu cầu nào phù hợp với bộ lọc hiện tại.'
                : 'Tạo yêu cầu xuất đặc biệt đầu tiên để bắt đầu quy trình phê duyệt.'
              }
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 font-medium text-gray-700">Ngày</th>
                <th className="text-left p-4 font-medium text-gray-700">Sản phẩm</th>
                <th className="text-right p-4 font-medium text-gray-700">Số lượng</th>
                <th className="text-left p-4 font-medium text-gray-700">Lý do</th>
                <th className="text-center p-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-left p-4 font-medium text-gray-700">Ghi chú</th>
                <th className="text-center p-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const product = getProductInfo(record.product_id);
                const reason = OUTBOUND_REASONS[record.reason as keyof typeof OUTBOUND_REASONS];
                
                return (
                  <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{formatDate(record.date)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{product?.name || 'N/A'}</span>
                        <span className="text-sm text-gray-500">[{product?.business_code}]</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-red-600">
                          {formatNumber(record.quantity)}
                        </span>
                        <span className="text-sm text-gray-500">{record.unit}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{reason?.icon}</span>
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${reason?.color}`}>
                            {reason?.label}
                          </span>
                          {record.reason === 'other' && record.reason_detail && (
                            <span className="text-xs text-gray-500 truncate max-w-32">
                              {record.reason_detail}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(record.approval_status)}`}>
                        {getStatusLabel(record.approval_status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600">
                        {record.notes ? (
                          record.notes.length > 30 
                            ? `${record.notes.substring(0, 30)}...`
                            : record.notes
                        ) : '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        {/* View History */}
                        <button
                          onClick={() => onViewHistory(record.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Xem lịch sử"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        {/* Edit */}
                        {canEdit(record) && (
                          <button
                            onClick={() => onEdit(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}

                        {/* Approve */}
                        {canApprove(record) && record.approval_status === 'pending' && (
                          <button
                            onClick={() => setShowApprovalModal({ recordId: record.id, action: 'approve' })}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Phê duyệt"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}

                        {/* Reject */}
                        {canApprove(record) && record.approval_status === 'pending' && (
                          <button
                            onClick={() => setShowApprovalModal({ recordId: record.id, action: 'reject' })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Từ chối"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}

                        {/* Delete */}
                        {canEdit(record) && (
                          <button
                            onClick={() => onDelete(record.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Clear Filters */}
      {(searchTerm || statusFilter || reasonFilter || dateFilter) && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setReasonFilter('');
              setDateFilter('');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showApprovalModal.action === 'approve' ? 'Phê duyệt yêu cầu' : 'Từ chối yêu cầu'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {showApprovalModal.action === 'approve' ? 'Ghi chú (tùy chọn)' : 'Lý do từ chối *'}
              </label>
              <textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={
                  showApprovalModal.action === 'approve' 
                    ? 'Ghi chú thêm về việc phê duyệt...'
                    : 'Nhập lý do từ chối yêu cầu...'
                }
              />
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => {
                  setShowApprovalModal(null);
                  setApprovalComment('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleApprovalAction(showApprovalModal.recordId, showApprovalModal.action)}
                className={`px-4 py-2 text-white rounded-xl font-medium transition-colors ${
                  showApprovalModal.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {showApprovalModal.action === 'approve' ? 'Phê duyệt' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialOutboundTable;
