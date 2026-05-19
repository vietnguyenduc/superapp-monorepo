import React, { useState } from 'react';
import { useSpecialOutbound } from '../hooks/useSales';
import { useProductCatalog } from '../hooks/useProductCatalog';
import SpecialOutboundForm from '../components/SpecialOutboundForm';
import SpecialOutboundTable from '../components/SpecialOutboundTable';
import { SpecialOutboundRecord } from '../types';

const SpecialOutboundPage: React.FC = () => {
  const {
    records,
    approvalLogs,
    loading: outboundLoading,
    error: outboundError,
    createRecord,
    updateRecord,
    deleteRecord,
    approveRecord,
    rejectRecord,
    clearError
  } = useSpecialOutbound();

  const {
    products,
    isLoading: productsLoading
  } = useProductCatalog();

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SpecialOutboundRecord | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (data: Omit<SpecialOutboundRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      let result;
      
      if (editingRecord) {
        result = await updateRecord(editingRecord.id, data);
      } else {
        result = await createRecord(data);
      }

      if (result.success) {
        showNotification('success', 
          editingRecord 
            ? 'Cập nhật yêu cầu xuất đặc biệt thành công!' 
            : 'Tạo yêu cầu xuất đặc biệt thành công!'
        );
        setShowForm(false);
        setEditingRecord(null);
      } else {
        showNotification('error', result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại');
    }
  };

  const handleEdit = (record: SpecialOutboundRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa yêu cầu này?')) {
      return;
    }

    const result = await deleteRecord(id);
    if (result.success) {
      showNotification('success', 'Xóa yêu cầu xuất đặc biệt thành công!');
    } else {
      showNotification('error', result.message || 'Không thể xóa yêu cầu');
    }
  };

  const handleApprove = async (id: string, comment?: string) => {
    const result = await approveRecord(id, comment);
    if (result.success) {
      showNotification('success', 'Phê duyệt yêu cầu thành công!');
    } else {
      showNotification('error', result.message || 'Không thể phê duyệt yêu cầu');
    }
  };

  const handleReject = async (id: string, comment: string) => {
    const result = await rejectRecord(id, comment);
    if (result.success) {
      showNotification('success', 'Từ chối yêu cầu thành công!');
    } else {
      showNotification('error', result.message || 'Không thể từ chối yêu cầu');
    }
  };

  const handleViewHistory = (recordId: string) => {
    setShowHistoryModal(recordId);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleAddNew = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  // Clear error when component mounts
  React.useEffect(() => {
    if (outboundError) {
      showNotification('error', outboundError);
      clearError();
    }
  }, [outboundError, clearError]);

  const loading = outboundLoading || productsLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📤</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Xuất đặc biệt</h1>
                <p className="text-gray-600">Quản lý yêu cầu xuất đặc biệt và quy trình phê duyệt (Bảng 3.1)</p>
              </div>
            </div>
            
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Tạo yêu cầu</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`rounded-xl p-4 border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {notification.type === 'success' ? '✅' : '❌'}
              </span>
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <SpecialOutboundForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingRecord || undefined}
            products={products}
            loading={loading}
          />
        )}

        {/* Table */}
        {!showForm && (
          <SpecialOutboundTable
            records={records}
            products={products}
            approvalLogs={approvalLogs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewHistory={handleViewHistory}
            loading={loading}
            currentUserRole="manager" // TODO: Get from auth
          />
        )}

        {/* Loading State */}
        {loading && !showForm && (
          <div className="bg-white rounded-2xl shadow-soft p-12 border border-gray-100">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Lịch sử phê duyệt</h3>
                <button
                  onClick={() => setShowHistoryModal(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {approvalLogs
                  .filter(log => log.record_id === showHistoryModal)
                  .map((log, index) => (
                    <div key={log.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{log.user_name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.action === 'approved' ? 'bg-green-100 text-green-800' :
                            log.action === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {log.action === 'approved' ? 'Phê duyệt' :
                             log.action === 'rejected' ? 'Từ chối' :
                             log.action === 'created' ? 'Tạo mới' : 'Cập nhật'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{log.comment}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))
                }
                
                {approvalLogs.filter(log => log.record_id === showHistoryModal).length === 0 && (
                  <p className="text-center text-gray-500 py-8">Chưa có lịch sử phê duyệt</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialOutboundPage;
