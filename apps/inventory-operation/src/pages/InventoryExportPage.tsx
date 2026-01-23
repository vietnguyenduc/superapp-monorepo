import React, { useState, useEffect } from 'react';
import InventoryExportForm from '../components/InventoryExportForm';
import { useInventoryExport, useExportLogs } from '../hooks/useExport';
import { useProducts } from '../hooks/useProducts';
import { ExportData } from '../services/exportService';

const InventoryExportPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const {
    loading: exportLoading,
    error: exportError,
    exportReports,
    clearError: clearExportError
  } = useInventoryExport();

  const {
    logs,
    loading: logsLoading,
    error: logsError,
    fetchLogs
  } = useExportLogs();

  const {
    products,
    loading: productsLoading,
    fetchProducts
  } = useProducts();

  useEffect(() => {
    fetchProducts();
    fetchLogs();
  }, [fetchProducts, fetchLogs]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleExport = async (exportData: ExportData) => {
    try {
      const result = await exportReports(exportData);
      showNotification('success', `Xuất file thành công: ${result.fileName}`);
      setShowForm(false);
      // Refresh logs after export
      fetchLogs();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Có lỗi xảy ra khi xuất file');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    clearExportError();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getTemplateIcon = (template: string): string => {
    switch (template) {
      case 'inventory_check': return '📋';
      case 'variance_report': return '📊';
      case 'summary_report': return '📈';
      default: return '📄';
    }
  };

  const getTemplateName = (template: string): string => {
    switch (template) {
      case 'inventory_check': return 'Phiếu kiểm kho';
      case 'variance_report': return 'Báo cáo chênh lệch';
      case 'summary_report': return 'Báo cáo tổng hợp';
      default: return 'Báo cáo';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Xuất file báo cáo</h1>
                <p className="text-sm text-gray-500">Tạo và xuất file kiểm kho, báo cáo chi tiết</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Xuất file mới</span>
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
          {/* Export Form */}
          {showForm && (
            <InventoryExportForm
              products={products}
              onExport={handleExport}
              onCancel={handleCancel}
              loading={exportLoading}
            />
          )}

          {/* Export History */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📚</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Lịch sử xuất file</h3>
                    <p className="text-sm text-gray-500">
                      {logs.length} file đã xuất
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => fetchLogs()}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Làm mới"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Đang tải lịch sử...</span>
                  </div>
                </div>
              ) : logsError ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">❌</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải lịch sử</h3>
                  <p className="text-gray-500 text-center max-w-md mb-4">{logsError}</p>
                  <button
                    onClick={() => fetchLogs()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có file nào được xuất</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Tạo file báo cáo đầu tiên bằng cách nhấn nút "Xuất file mới" ở trên.
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-4 font-medium text-gray-700">Loại báo cáo</th>
                      <th className="text-left p-4 font-medium text-gray-700">Tên file</th>
                      <th className="text-left p-4 font-medium text-gray-700">Định dạng</th>
                      <th className="text-right p-4 font-medium text-gray-700">Kích thước</th>
                      <th className="text-left p-4 font-medium text-gray-700">Ngày tạo</th>
                      <th className="text-left p-4 font-medium text-gray-700">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getTemplateIcon(log.export_type)}</span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {getTemplateName(log.export_type)}
                              </div>
                              <div className="text-sm text-gray-500">{log.export_type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm text-gray-700">{log.file_name}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.format === 'excel' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.format.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-sm text-gray-600">
                            {formatFileSize(log.file_size)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(log.created_at)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">
                            {log.notes ? (
                              log.notes.length > 30 
                                ? `${log.notes.substring(0, 30)}...`
                                : log.notes
                            ) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryExportPage;
