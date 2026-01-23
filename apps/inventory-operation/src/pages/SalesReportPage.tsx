import React, { useState } from 'react';
import { useSalesReport } from '../hooks/useSales';
import { useProductCatalog } from '../hooks/useProductCatalog';
import SalesReportForm from '../components/SalesReportForm';
import SalesReportTable from '../components/SalesReportTable';
import { SalesRecord } from '../types';

const SalesReportPage: React.FC = () => {
  const {
    salesRecords,
    loading: salesLoading,
    error: salesError,
    createSalesRecord,
    updateSalesRecord,
    deleteSalesRecord,
    clearError
  } = useSalesReport();

  const {
    products,
    isLoading: productsLoading
  } = useProductCatalog();

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalesRecord | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (data: Omit<SalesRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      let result;
      
      if (editingRecord) {
        result = await updateSalesRecord(editingRecord.id, data);
      } else {
        result = await createSalesRecord(data);
      }

      if (result.success) {
        showNotification('success', 
          editingRecord 
            ? 'Cập nhật báo cáo bán hàng thành công!' 
            : 'Thêm báo cáo bán hàng thành công!'
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

  const handleEdit = (record: SalesRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
      return;
    }

    const result = await deleteSalesRecord(id);
    if (result.success) {
      showNotification('success', 'Xóa báo cáo bán hàng thành công!');
    } else {
      showNotification('error', result.message || 'Không thể xóa báo cáo');
    }
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
    if (salesError) {
      showNotification('error', salesError);
      clearError();
    }
  }, [salesError, clearError]);

  const loading = salesLoading || productsLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Báo cáo bán hàng</h1>
                <p className="text-gray-600">Quản lý nhập liệu bán hàng và xuất khuyến mãi (Bảng 3)</p>
              </div>
            </div>
            
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Thêm báo cáo</span>
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
          <SalesReportForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingRecord || undefined}
            products={products}
            loading={loading}
          />
        )}

        {/* Table */}
        {!showForm && (
          <SalesReportTable
            salesRecords={salesRecords}
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        )}

        {/* Loading State */}
        {loading && !showForm && (
          <div className="bg-white rounded-2xl shadow-soft p-12 border border-gray-100">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReportPage;
