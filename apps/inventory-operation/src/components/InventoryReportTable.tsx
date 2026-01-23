import React, { useState } from 'react';
import { InventoryVarianceReport, Product } from '../types';

interface InventoryReportTableProps {
  reports: InventoryVarianceReport[];
  products: Product[];
  onEdit: (report: InventoryVarianceReport) => void;
  onDelete: (id: string) => void;
  onCreateSpecialOutbound: (report: InventoryVarianceReport) => void;
  loading?: boolean;
}

const InventoryReportTable: React.FC<InventoryReportTableProps> = ({
  reports,
  products,
  onEdit,
  onDelete,
  onCreateSpecialOutbound,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [varianceFilter, setVarianceFilter] = useState('');

  // Get product info by ID
  const getProductInfo = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const product = getProductInfo(report.product_id);
    const matchesSearch = !searchTerm || 
      product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.businessCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || report.date === dateFilter;
    const matchesProduct = !productFilter || report.product_id === productFilter;
    
    let matchesVariance = true;
    if (varianceFilter === 'positive') matchesVariance = report.variance > 0;
    else if (varianceFilter === 'negative') matchesVariance = report.variance < 0;
    else if (varianceFilter === 'zero') matchesVariance = report.variance === 0;
    else if (varianceFilter === 'high') matchesVariance = Math.abs(report.variance_percentage) >= 10;

    return matchesSearch && matchesDate && matchesProduct && matchesVariance;
  });

  // Calculate statistics
  const stats = filteredReports.reduce((acc, report) => {
    acc.totalReports++;
    acc.totalBookInventory += report.book_inventory;
    acc.totalActualInventory += report.actual_inventory;
    acc.totalVariance += Math.abs(report.variance);
    
    if (report.variance > 0) acc.positiveVariance++;
    else if (report.variance < 0) acc.negativeVariance++;
    else acc.zeroVariance++;
    
    if (Math.abs(report.variance_percentage) >= 10) acc.highVariance++;
    
    return acc;
  }, {
    totalReports: 0,
    totalBookInventory: 0,
    totalActualInventory: 0,
    totalVariance: 0,
    positiveVariance: 0,
    negativeVariance: 0,
    zeroVariance: 0,
    highVariance: 0
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  const getVarianceColor = (variance: number, percentage: number) => {
    const absPercentage = Math.abs(percentage);
    if (absPercentage >= 10) return 'text-red-600 bg-red-50';
    if (absPercentage >= 5) return 'text-orange-600 bg-orange-50';
    if (absPercentage > 0) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return '📈';
    if (variance < 0) return '📉';
    return '✅';
  };

  const getVarianceLabel = (variance: number) => {
    if (variance > 0) return 'Thừa';
    if (variance < 0) return 'Thiếu';
    return 'Khớp';
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Báo cáo nhập xuất tồn</h3>
              <p className="text-sm text-gray-500">
                {filteredReports.length} báo cáo • {stats.highVariance} chênh lệch cao
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
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả sản phẩm</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  [{product.businessCode}] {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={varianceFilter}
              onChange={(e) => setVarianceFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả chênh lệch</option>
              <option value="positive">Thừa kho</option>
              <option value="negative">Thiếu kho</option>
              <option value="zero">Khớp sổ</option>
              <option value="high">Chênh lệch cao (≥10%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Tổng báo cáo</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalReports}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Thừa kho</p>
                <p className="text-2xl font-bold text-green-700">{stats.positiveVariance}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Thiếu kho</p>
                <p className="text-2xl font-bold text-red-700">{stats.negativeVariance}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📉</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Chênh lệch cao</p>
                <p className="text-2xl font-bold text-orange-700">{stats.highVariance}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">⚠️</span>
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
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có báo cáo nhập xuất tồn</h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchTerm || dateFilter || productFilter || varianceFilter 
                ? 'Không tìm thấy báo cáo nào phù hợp với bộ lọc hiện tại.'
                : 'Thêm báo cáo nhập xuất tồn đầu tiên để bắt đầu theo dõi chênh lệch kho.'
              }
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 font-medium text-gray-700">Ngày</th>
                <th className="text-left p-4 font-medium text-gray-700">Sản phẩm</th>
                <th className="text-right p-4 font-medium text-gray-700">Tồn sổ</th>
                <th className="text-right p-4 font-medium text-gray-700">Tồn thực</th>
                <th className="text-center p-4 font-medium text-gray-700">Chênh lệch</th>
                <th className="text-left p-4 font-medium text-gray-700">Ghi chú</th>
                <th className="text-center p-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const product = getProductInfo(report.product_id);
                
                return (
                  <tr key={report.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{formatDate(report.date)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{product?.name || 'N/A'}</span>
                        <span className="text-sm text-gray-500">[{product?.businessCode}]</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-blue-600">
                          {formatNumber(report.book_inventory)}
                        </span>
                        <span className="text-sm text-gray-500">{report.unit}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-green-600">
                          {formatNumber(report.actual_inventory)}
                        </span>
                        <span className="text-sm text-gray-500">{report.unit}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${getVarianceColor(report.variance, report.variance_percentage)}`}>
                        <span>{getVarianceIcon(report.variance)}</span>
                        <div className="text-center">
                          <div className="font-semibold">
                            {report.variance > 0 ? '+' : ''}{formatNumber(report.variance)}
                          </div>
                          <div className="text-xs">
                            ({report.variance_percentage > 0 ? '+' : ''}{report.variance_percentage.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600">
                        {report.notes ? (
                          report.notes.length > 30 
                            ? `${report.notes.substring(0, 30)}...`
                            : report.notes
                        ) : '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Create Special Outbound for high variance */}
                        {Math.abs(report.variance_percentage) >= 10 && (
                          <button
                            onClick={() => onCreateSpecialOutbound(report)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Tạo phiếu xuất đặc biệt"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => onEdit(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDelete(report.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
      {(searchTerm || dateFilter || productFilter || varianceFilter) && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFilter('');
              setProductFilter('');
              setVarianceFilter('');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default InventoryReportTable;
