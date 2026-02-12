import React, { useState } from 'react';
import { Product, ProductCategory, ProductStatus } from '../types';
import ConversionDisplay from './ConversionDisplay';
import ProductHistory from './ProductHistory';

interface ProductCatalogTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

const ProductCatalogTable: React.FC<ProductCatalogTableProps> = ({
  products,
  onEdit,
  onDelete,
  onSearch,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversionFor, setShowConversionFor] = useState<string | null>(null);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const getCategoryDisplayName = (category: ProductCategory) => {
    const categoryNames = {
      [ProductCategory.FRUIT]: 'Trái cây',
      [ProductCategory.DRY_GOODS]: 'Đồ khô',
      [ProductCategory.PROCESSED]: 'Sơ chế',
      [ProductCategory.FINISHED]: 'Thành phẩm',
      [ProductCategory.BEVERAGE]: 'Đồ uống',
      [ProductCategory.TOBACCO]: 'Thuốc lá',
      [ProductCategory.OTHER]: 'Khác',
    };
    return categoryNames[category] || category;
  };

  const getProductTypeDisplayName = (isFinishedProduct: boolean) => {
    return isFinishedProduct ? 'Thành phẩm' : 'Bán thành phẩm';
  };

  const getProductTypeBadgeClass = (isFinishedProduct: boolean) => {
    return isFinishedProduct
      ? 'bg-blue-100 text-blue-800'
      : 'bg-orange-100 text-orange-800';
  };

  const getStatusDisplayName = (status: ProductStatus) => {
    const statusNames = {
      [ProductStatus.ACTIVE]: 'Đang bán',
      [ProductStatus.INACTIVE]: 'Ngừng bán',
    };
    return statusNames[status] || status;
  };

  const getStatusBadgeClass = (status: ProductStatus) => {
    return status === ProductStatus.ACTIVE
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header with search */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Danh mục hàng hóa ({products.length} sản phẩm)
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? `Không có sản phẩm nào khớp với "${searchQuery}"`
              : 'Bắt đầu bằng cách thêm sản phẩm đầu tiên'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại SP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã SP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Định lượng Nhập
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Định lượng Xuất
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành phẩm liên quan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getCategoryDisplayName(product.category)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProductTypeBadgeClass(product.isFinishedProduct)}`}>
                      {getProductTypeDisplayName(product.isFinishedProduct)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">KD: {product.businessCode}</div>
                      {product.promotionCode && (
                        <div className="text-xs text-gray-500">
                          KM: {product.promotionCode}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <div className="font-medium text-green-800">
                        {product.inputQuantity} {product.inputUnit}
                      </div>
                      <div className="text-xs text-green-600">
                        Định lượng nhập
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <div className="font-medium text-blue-800">
                        {product.outputQuantity} {product.outputUnit}
                      </div>
                      <div className="text-xs text-blue-600">
                        Định lượng xuất
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.finishedProductCode ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                        <div className="font-medium text-purple-800">
                          {product.finishedProductCode}
                        </div>
                        <div className="text-xs text-purple-600">
                          Mã thành phẩm
                        </div>
                        {product.finishedProductCode && products.find(p => p.businessCode === product.finishedProductCode) && (
                          <div className="text-xs text-purple-500 mt-1">
                            → {products.find(p => p.businessCode === product.finishedProductCode)?.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center">
                        <div className="text-lg">-</div>
                        <div className="text-xs">Không có</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(product.status)}`}>
                      {getStatusDisplayName(product.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowConversionFor(product.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2"
                        title="Xem quy đổi"
                      >
                        🔄
                      </button>
                      <button
                        onClick={() => setShowHistoryFor(product.id)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium mr-3"
                        title="Lịch sử thay đổi"
                      >
                        📝
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(product)}
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium mr-3"
                        >
                          Sửa
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(product.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Conversion Display Modal */}
      {showConversionFor && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Thông tin quy đổi
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredProducts.find((p) => p.id === showConversionFor)?.name}
                </p>
              </div>
              <button
                onClick={() => setShowConversionFor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          </div>

          {showConversionFor && (
            <ConversionDisplay
              product={filteredProducts.find((p) => p.id === showConversionFor)!}
            />
          )}

          <div className="flex justify-end mt-6 pt-4 border-t">
            <button
              onClick={() => setShowConversionFor(null)}
              className="btn-primary"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )}

    {/* History Display Modal */}
    {showHistoryFor && (
      <ProductHistory
        product={filteredProducts.find((p) => p.id === showHistoryFor)!}
        onClose={() => setShowHistoryFor(null)}
      />
    )}
    </div>
  );
};

export default ProductCatalogTable;
