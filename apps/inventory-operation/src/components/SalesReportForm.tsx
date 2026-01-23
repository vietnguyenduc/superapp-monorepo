import React, { useState, useEffect } from 'react';
import { SalesRecord, Product } from '../types';

interface SalesReportFormProps {
  onSubmit: (data: Omit<SalesRecord, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  initialData?: SalesRecord;
  products: Product[];
  loading?: boolean;
}

const SalesReportForm: React.FC<SalesReportFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  products,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    product_id: initialData?.product_id || '',
    sales_quantity: initialData?.sales_quantity || 0,
    promotion_quantity: initialData?.promotion_quantity || 0,
    unit: initialData?.unit || '',
    notes: initialData?.notes || '',
    created_by: initialData?.created_by || 'current-user', // TODO: Get from auth
    updated_by: 'current-user' // TODO: Get from auth
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill unit when product is selected
  useEffect(() => {
    if (formData.product_id) {
      const selectedProduct = products.find(p => p.id === formData.product_id);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          unit: selectedProduct.output_unit || selectedProduct.input_unit
        }));
      }
    }
  }, [formData.product_id, products]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày';
    }

    if (!formData.product_id) {
      newErrors.product_id = 'Vui lòng chọn sản phẩm';
    }

    if (formData.sales_quantity < 0) {
      newErrors.sales_quantity = 'Số lượng bán không được âm';
    }

    if (formData.promotion_quantity < 0) {
      newErrors.promotion_quantity = 'Số lượng khuyến mãi không được âm';
    }

    if (formData.sales_quantity === 0 && formData.promotion_quantity === 0) {
      newErrors.sales_quantity = 'Phải có ít nhất một trong hai: bán hàng hoặc khuyến mãi';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Vui lòng nhập đơn vị';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      ...formData,
      sales_quantity: Number(formData.sales_quantity),
      promotion_quantity: Number(formData.promotion_quantity)
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Chỉnh sửa báo cáo bán hàng' : 'Thêm báo cáo bán hàng'}
            </h2>
            <p className="text-sm text-gray-500">Nhập số liệu bán hàng và khuyến mãi</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Product Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày báo cáo <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.date ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sản phẩm <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => handleInputChange('product_id', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.product_id ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            >
              <option value="">Chọn sản phẩm...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  [{product.business_code}] {product.name}
                </option>
              ))}
            </select>
            {errors.product_id && (
              <p className="mt-1 text-sm text-red-600">{errors.product_id}</p>
            )}
          </div>
        </div>

        {/* Product Info Display */}
        {selectedProduct && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-blue-700">Thông tin sản phẩm:</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Danh mục:</span>
                <p className="font-medium text-gray-900">{selectedProduct.category}</p>
              </div>
              <div>
                <span className="text-gray-600">Đơn vị nhập:</span>
                <p className="font-medium text-gray-900">{selectedProduct.input_unit}</p>
              </div>
              <div>
                <span className="text-gray-600">Đơn vị xuất:</span>
                <p className="font-medium text-gray-900">{selectedProduct.output_unit}</p>
              </div>
              <div>
                <span className="text-gray-600">Trạng thái:</span>
                <p className={`font-medium ${
                  selectedProduct.business_status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedProduct.business_status === 'active' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quantities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng bán
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.sales_quantity}
              onChange={(e) => handleInputChange('sales_quantity', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.sales_quantity ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="0"
            />
            {errors.sales_quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.sales_quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng khuyến mãi
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.promotion_quantity}
              onChange={(e) => handleInputChange('promotion_quantity', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.promotion_quantity ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="0"
            />
            {errors.promotion_quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.promotion_quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đơn vị <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.unit ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="kg, lít, cái..."
            />
            {errors.unit && (
              <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
            )}
          </div>
        </div>

        {/* Total Summary */}
        {(formData.sales_quantity > 0 || formData.promotion_quantity > 0) && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Tổng xuất:</span>
              <span className="text-lg font-semibold text-green-800">
                {(Number(formData.sales_quantity) + Number(formData.promotion_quantity)).toLocaleString('vi-VN')} {formData.unit}
              </span>
            </div>
            <div className="mt-2 text-xs text-green-600">
              Bán hàng: {Number(formData.sales_quantity).toLocaleString('vi-VN')} {formData.unit} • 
              Khuyến mãi: {Number(formData.promotion_quantity).toLocaleString('vi-VN')} {formData.unit}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            placeholder="Ghi chú thêm về báo cáo bán hàng..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{initialData ? 'Cập nhật' : 'Thêm mới'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesReportForm;
