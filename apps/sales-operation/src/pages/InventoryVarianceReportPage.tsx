import React, { useState, useEffect } from 'react';
import InventoryReportForm from '../components/InventoryReportForm';
import InventoryReportTable from '../components/InventoryReportTable';
import { useInventoryVarianceReports, useInventoryVarianceAlerts } from '../hooks/useInventoryVariance';
import { useProducts } from '../hooks/useProducts';
import { InventoryVarianceReport, InventoryVarianceReportCreateInput } from '../types';

const InventoryVarianceReportPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<InventoryVarianceReport | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
    fetchReports,
    createReport,
    updateReport,
    deleteReport
  } = useInventoryVarianceReports();

  const {
    generateSpecialOutboundSuggestion,
    loading: alertsLoading
  } = useInventoryVarianceAlerts();

  const {
    products,
    loading: productsLoading,
    fetchProducts
  } = useProducts();

  useEffect(() => {
    fetchReports();
    fetchProducts();
  }, [fetchReports, fetchProducts]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (data: InventoryVarianceReportCreateInput) => {
    try {
      if (editingReport) {
        await updateReport(editingReport.id, data);
        showNotification('success', 'Cập nhật báo cáo thành công!');
      } else {
        await createReport(data);
        showNotification('success', 'Thêm báo cáo thành công!');
      }
      
      setShowForm(false);
      setEditingReport(null);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (report: InventoryVarianceReport) => {
    setEditingReport(report);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
      return;
    }

    try {
      await deleteReport(id);
      showNotification('success', 'Xóa báo cáo thành công!');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Có lỗi xảy ra');
    }
  };

  const handleCreateSpecialOutbound = async (report: InventoryVarianceReport) => {
    try {
      const suggestion = await generateSpecialOutboundSuggestion(report.id);
      
      // Here you would typically navigate to special outbound form with pre-filled data
      // For now, we'll show a notification with the suggestion
      showNotification('info', 
        `Gợi ý tạo phiếu xuất đặc biệt: ${suggestion.suggested_quantity} ${report.unit} - ${suggestion.suggested_reason}`
      );
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Có lỗi xảy ra');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReport(null);
  };

  const handleAddNew = () => {
    setEditingReport(null);
    setShowForm(true);
  };

  if (reportsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-gray-600 mb-4">{reportsError}</p>
            <button
              onClick={() => fetchReports()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Báo cáo nhập xuất tồn</h1>
                <p className="text-sm text-gray-500">So sánh tồn sổ và tồn thực tế</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Thêm báo cáo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`rounded-xl p-4 ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {notification.type === 'success' ? '✅' : 
                 notification.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-auto text-current hover:opacity-70"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Form */}
          {showForm && (
            <InventoryReportForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              initialData={editingReport || undefined}
              products={products}
              loading={reportsLoading}
            />
          )}

          {/* Table */}
          <InventoryReportTable
            reports={reports}
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateSpecialOutbound={handleCreateSpecialOutbound}
            loading={reportsLoading || productsLoading || alertsLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default InventoryVarianceReportPage;
