import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SAMPLE_PRODUCT_CATALOG_FULL, 
  PRODUCT_CATALOG_FULL_COLUMNS,
  ProductCatalogFullItem,
  formatDate,
  formatBoolean,
  getTinhTrangColor
} from '../types/product-catalog-full';

const ProductCatalogPageFull: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoai, setSelectedLoai] = useState('');

  // Filter products based on search query and category
  const filteredProducts = SAMPLE_PRODUCT_CATALOG_FULL.filter(product => {
    const matchesSearch = 
      product.tenNguyenVatLieu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.maNguyenVatLieu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tenThanhPham.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.maSPKD.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedLoai === '' || product.loai === selectedLoai;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const uniqueLoai = Array.from(new Set(SAMPLE_PRODUCT_CATALOG_FULL.map(p => p.loai)));

  // Statistics
  const stats = {
    total: SAMPLE_PRODUCT_CATALOG_FULL.length,
    dangBan: SAMPLE_PRODUCT_CATALOG_FULL.filter(p => p.tinhTrang === 'Đang bán').length,
    ngungBan: SAMPLE_PRODUCT_CATALOG_FULL.filter(p => p.tinhTrang === 'Ngưng bán').length,
    hetHang: SAMPLE_PRODUCT_CATALOG_FULL.filter(p => p.tinhTrang === 'Hết hàng').length,
    thanhPham: SAMPLE_PRODUCT_CATALOG_FULL.filter(p => p.thanhPham).length,
    nguyenLieu: SAMPLE_PRODUCT_CATALOG_FULL.filter(p => !p.thanhPham).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý danh mục hàng hóa</h1>
          <p className="mt-2 text-gray-600">
            Quản lý danh mục, định mức, quy đổi (Bảng 2) - Cấu trúc đầy đủ theo Excel
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/product-import')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            📊 Nhập hàng loạt
          </button>
          <button
            onClick={() => alert('Tính năng thêm sản phẩm sẽ được tích hợp sau')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            + Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Tổng số</div>
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Đang bán</div>
          <div className="text-2xl font-bold text-green-600">{stats.dangBan}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Ngưng bán</div>
          <div className="text-2xl font-bold text-red-600">{stats.ngungBan}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Hết hàng</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.hetHang}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Thành phẩm</div>
          <div className="text-2xl font-bold text-purple-600">{stats.thanhPham}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Nguyên liệu</div>
          <div className="text-2xl font-bold text-orange-600">{stats.nguyenLieu}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Tìm kiếm
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mã nguyên liệu, thành phẩm..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              📂 Lọc theo loại
            </label>
            <select
              id="category"
              value={selectedLoai}
              onChange={(e) => setSelectedLoai(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả loại</option>
              {uniqueLoai.map(loai => (
                <option key={loai} value={loai}>{loai}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Hiển thị {filteredProducts.length} / {stats.total} sản phẩm
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              📊 Danh mục hàng hóa - Cấu trúc đầy đủ
            </h3>
            <div className="text-sm text-gray-500">
              Dữ liệu từ file Excel thực tế
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  {PRODUCT_CATALOG_FULL_COLUMNS.map((column) => (
                    <th 
                      key={column.key}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: column.width }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(product.ngayCapNhat)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {product.loai}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">
                        {product.maNguyenVatLieu}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 font-medium">
                      {product.tenNguyenVatLieu}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                      {product.thanhPham ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                          TRUE
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">
                          FALSE
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                      {product.dinhLuongXuat}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                      {product.dinhLuongNhap}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-mono">
                        {product.maSPKD}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 font-medium">
                      {product.tenThanhPham}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                        {product.dvtNhap}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                        {product.dvtXuat}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTinhTrangColor(product.tinhTrang)}`}>
                        {product.tinhTrang}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-lg font-medium mb-2">Không tìm thấy sản phẩm</div>
              <div className="text-sm">Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Thông tin cấu trúc dữ liệu:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h5 className="font-medium mb-1">📊 Các trường dữ liệu chính:</h5>
            <ul className="space-y-1">
              <li>• <strong>Nguyên vật liệu:</strong> Mã + Tên nguyên liệu đầu vào</li>
              <li>• <strong>Thành phẩm:</strong> Mã SP KD + Tên sản phẩm cuối</li>
              <li>• <strong>Định lượng:</strong> Tỷ lệ quy đổi nhập/xuất</li>
              <li>• <strong>ĐVT:</strong> Đơn vị tính nhập và xuất khác nhau</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-1">🎯 Thống kê hiện tại:</h5>
            <ul className="space-y-1">
              <li>• <strong>Tổng:</strong> {stats.total} bản ghi</li>
              <li>• <strong>Nguyên liệu:</strong> {stats.nguyenLieu} / Thành phẩm: {stats.thanhPham}</li>
              <li>• <strong>Đang bán:</strong> {stats.dangBan} sản phẩm</li>
              <li>• <strong>Cấu trúc:</strong> Theo file Excel thực tế của bạn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalogPageFull;
