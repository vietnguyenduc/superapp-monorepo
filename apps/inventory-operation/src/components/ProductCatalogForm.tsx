import React, { useState } from 'react';
import { Product, ProductCategory, ProductStatus } from '../types';
import ProductConversionForm from './ProductConversionForm';

interface ProductCatalogFormProps {
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
  initialData?: Partial<Product>;
  isLoading?: boolean;
}

const ProductCatalogForm: React.FC<ProductCatalogFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    category: ProductCategory.FRUIT,
    businessCode: '',
    promotionCode: '',
    name: '',
    isFinishedProduct: false,
    outputQuantity: 1,
    inputQuantity: 1,
    finishedProductCode: '',
    inputUnit: '',
    outputUnit: '',
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    ...initialData,
  });
  const [showConversionForm, setShowConversionForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="card max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {initialData ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h2>
        <p className="text-gray-600">
          Quản lý danh mục hàng hóa và định mức quy đổi (Bảng 2)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại sản phẩm <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category || ''}
              onChange={(e) => handleInputChange('category', e.target.value as ProductCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value={ProductCategory.FRUIT}>Trái cây</option>
              <option value={ProductCategory.DRY_GOODS}>Đồ khô</option>
              <option value={ProductCategory.PROCESSED}>Sơ chế</option>
              <option value={ProductCategory.FINISHED}>Thành phẩm</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value as ProductStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value={ProductStatus.ACTIVE}>Đang bán</option>
              <option value={ProductStatus.INACTIVE}>Ngừng bán</option>
            </select>
          </div>
        </div>

        {/* Mã sản phẩm */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã SP KD <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.businessCode || ''}
              onChange={(e) => handleInputChange('businessCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Nhập mã SP kinh doanh"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã SP KM
            </label>
            <input
              type="text"
              value={formData.promotionCode || ''}
              onChange={(e) => handleInputChange('promotionCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Mã SP khuyến mãi (nếu có)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Nhập tên sản phẩm"
              required
            />
          </div>
        </div>

        {/* Thành phẩm checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFinishedProduct"
            checked={formData.isFinishedProduct || false}
            onChange={(e) => handleInputChange('isFinishedProduct', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isFinishedProduct" className="ml-2 block text-sm text-gray-900">
            Đây là thành phẩm
          </label>
        </div>

        {/* Định mức quy đổi */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Định mức quy đổi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Định lượng Xuất <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.outputQuantity || 0}
                onChange={(e) => handleInputChange('outputQuantity', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                step="0.01"
                placeholder="Số miếng để tạo 1 thành phẩm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Định lượng Nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.inputQuantity || 0}
                onChange={(e) => handleInputChange('inputQuantity', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                step="0.01"
                placeholder="1 quả → 8 miếng"
                required
              />
            </div>
          </div>
        </div>

        {/* Đơn vị */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Đơn vị tính</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ĐVT Nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.inputUnit || ''}
                onChange={(e) => handleInputChange('inputUnit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="quả, cây, con..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ĐVT Xuất <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.outputUnit || ''}
                onChange={(e) => handleInputChange('outputUnit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="miếng, lát, đĩa..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã Thành phẩm
              </label>
              <input
                type="text"
                value={formData.finishedProductCode || ''}
                onChange={(e) => handleInputChange('finishedProductCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Mã thành phẩm (nếu có)"
              />
            </div>
          </div>
        </div>

        {/* Business Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái kinh doanh *
          </label>
          <select
            value={formData.businessStatus || 'active'}
            onChange={(e) => setFormData(prev => ({ ...prev, businessStatus: e.target.value as 'active' | 'inactive' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="active">Đang kinh doanh</option>
            <option value="inactive">Ngừng kinh doanh</option>
          </select>
        </div>

        {/* Advanced Conversion Management */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              Quản lý quy đổi nâng cao
            </h4>
            <button
              type="button"
              onClick={() => setShowConversionForm(true)}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              Thiết lập quy đổi
            </button>
          </div>
          <p className="text-xs text-gray-600">
            Thiết lập các tỷ lệ quy đổi phức tạp giữa nhiều đơn vị khác nhau
          </p>
        </div>

        {/* Conversion Form Modal */}
        {showConversionForm && formData.id && (
          <ProductConversionForm
            productId={formData.id}
            productName={formData.name || 'Sản phẩm'}
            conversions={formData.conversions || []}
            onAddConversion={(conversion) => {
              setFormData(prev => ({
                ...prev,
                conversions: [...(prev.conversions || []), { ...conversion, productId: prev.id! }]
              }));
            }}
            onRemoveConversion={(index) => {
              setFormData(prev => ({
                ...prev,
                conversions: prev.conversions?.filter((_: any, i: number) => i !== index) || []
              }));
            }}
            onClose={() => setShowConversionForm(false)}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : (initialData ? 'Cập nhật' : 'Thêm mới')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductCatalogForm;
