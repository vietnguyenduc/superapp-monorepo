import React, { useState } from 'react';
import { SalesRecord, Product } from '../types';

interface SalesReportTableProps {
  salesRecords: SalesRecord[];
  products: Product[];
  onEdit: (record: SalesRecord) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const SalesReportTable: React.FC<SalesReportTableProps> = ({
  salesRecords,
  products,
  onEdit,
  onDelete,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  // Get product info by ID
  const getProductInfo = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  // Filter records
  const filteredRecords = salesRecords.filter(record => {
    const product = getProductInfo(record.product_id);
    const matchesSearch = !searchTerm || 
      product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.business_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || record.date === dateFilter;
    const matchesProduct = !productFilter || record.product_id === productFilter;

    return matchesSearch && matchesDate && matchesProduct;
  });

  // Calculate totals
  const totals = filteredRecords.reduce((acc, record) => {
    acc.sales += record.sales_quantity;
    acc.promotion += record.promotion_quantity;
    acc.total += record.sales_quantity + record.promotion_quantity;
    return acc;
  }, { sales: 0, promotion: 0, total: 0 });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Danh sách báo cáo bán hàng</h3>
              <p className="text-sm text-gray-500">
                {filteredRecords.length} bản ghi • Tổng xuất: {formatNumber(totals.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  [{product.business_code}] {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Tổng bán hàng</p>
                <p className="text-2xl font-bold text-blue-700">{formatNumber(totals.sales)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Tổng khuyến mãi</p>
                <p className="text-2xl font-bold text-orange-700">{formatNumber(totals.promotion)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎁</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Tổng xuất</p>
                <p className="text-2xl font-bold text-green-700">{formatNumber(totals.total)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📦</span>
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
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có báo cáo bán hàng</h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchTerm || dateFilter || productFilter 
                ? 'Không tìm thấy báo cáo nào phù hợp với bộ lọc hiện tại.'
                : 'Thêm báo cáo bán hàng đầu tiên để bắt đầu theo dõi doanh số.'
              }
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 font-medium text-gray-700">Ngày</th>
                <th className="text-left p-4 font-medium text-gray-700">Sản phẩm</th>
                <th className="text-right p-4 font-medium text-gray-700">Bán hàng</th>
                <th className="text-right p-4 font-medium text-gray-700">Khuyến mãi</th>
                <th className="text-right p-4 font-medium text-gray-700">Tổng xuất</th>
                <th className="text-left p-4 font-medium text-gray-700">Đơn vị</th>
                <th className="text-left p-4 font-medium text-gray-700">Ghi chú</th>
                <th className="text-center p-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const product = getProductInfo(record.product_id);
                const totalQuantity = record.sales_quantity + record.promotion_quantity;
                
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
                      <span className="font-medium text-blue-600">
                        {formatNumber(record.sales_quantity)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-medium text-orange-600">
                        {formatNumber(record.promotion_quantity)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-green-600">
                        {formatNumber(totalQuantity)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-700">{record.unit}</span>
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
                        <button
                          onClick={() => onEdit(record)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(record.id)}
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
      {(searchTerm || dateFilter || productFilter) && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFilter('');
              setProductFilter('');
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

export default SalesReportTable;
