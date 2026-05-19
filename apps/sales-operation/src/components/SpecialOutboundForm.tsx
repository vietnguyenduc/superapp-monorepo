import React, { useState, useEffect } from 'react';
import { SpecialOutboundRecord, Product } from '../types';

interface SpecialOutboundFormProps {
  onSubmit: (data: Omit<SpecialOutboundRecord, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  initialData?: SpecialOutboundRecord;
  products: Product[];
  loading?: boolean;
}

const OUTBOUND_REASONS = [
  { value: 'damaged', label: 'Hàng hỏng', icon: '💔' },
  { value: 'expired', label: 'Hết hạn', icon: '⏰' },
  { value: 'sample', label: 'Lấy mẫu', icon: '🧪' },
  { value: 'gift', label: 'Tặng khách hàng', icon: '🎁' },
  { value: 'internal_use', label: 'Sử dụng nội bộ', icon: '🏢' },
  { value: 'loss', label: 'Thất thoát', icon: '📉' },
  { value: 'return', label: 'Trả hàng nhà cung cấp', icon: '↩️' },
  { value: 'other', label: 'Lý do khác', icon: '📝' }
];

const SpecialOutboundForm: React.FC<SpecialOutboundFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  products,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    product_id: initialData?.product_id || '',
    quantity: initialData?.quantity || 0,
    unit: initialData?.unit || '',
    reason: initialData?.reason || '',
    reason_detail: initialData?.reason_detail || '',
    approval_status: initialData?.approval_status || 'pending',
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

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Số lượng phải lớn hơn 0';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Vui lòng nhập đơn vị';
    }

    if (!formData.reason) {
      newErrors.reason = 'Vui lòng chọn lý do xuất';
    }

    if (formData.reason === 'other' && !formData.reason_detail.trim()) {
      newErrors.reason_detail = 'Vui lòng mô tả chi tiết lý do';
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
      quantity: Number(formData.quantity)
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
  const selectedReason = OUTBOUND_REASONS.find(r => r.value === formData.reason);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <span className="text-xl">📤</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Chỉnh sửa xuất đặc biệt' : 'Tạo phiếu xuất đặc biệt'}
            </h2>
            <p className="text-sm text-gray-500">Yêu cầu phê duyệt cho xuất kho đặc biệt</p>
          </div>
        </div>
        
        {initialData && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(formData.approval_status)}`}>
            {getStatusLabel(formData.approval_status)}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Product Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày xuất <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.date ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              disabled={formData.approval_status === 'approved'}
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
              disabled={formData.approval_status === 'approved'}
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

        {/* Quantity and Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.quantity ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="0"
              disabled={formData.approval_status === 'approved'}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
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
              disabled={formData.approval_status === 'approved'}
            />
            {errors.unit && (
              <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
            )}
          </div>
        </div>

        {/* Reason Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Lý do xuất <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {OUTBOUND_REASONS.map((reason) => (
              <button
                key={reason.value}
                type="button"
                onClick={() => handleInputChange('reason', reason.value)}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  formData.reason === reason.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${formData.approval_status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={formData.approval_status === 'approved'}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{reason.icon}</span>
                  <span className="text-sm font-medium">{reason.label}</span>
                </div>
              </button>
            ))}
          </div>
          {errors.reason && (
            <p className="mt-2 text-sm text-red-600">{errors.reason}</p>
          )}
        </div>

        {/* Reason Detail (for "other" reason) */}
        {formData.reason === 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chi tiết lý do <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.reason_detail}
              onChange={(e) => handleInputChange('reason_detail', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.reason_detail ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="Mô tả chi tiết lý do xuất đặc biệt..."
              disabled={formData.approval_status === 'approved'}
            />
            {errors.reason_detail && (
              <p className="mt-1 text-sm text-red-600">{errors.reason_detail}</p>
            )}
          </div>
        )}

        {/* Summary */}
        {formData.quantity > 0 && selectedReason && (
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700">Tóm tắt yêu cầu:</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-orange-600">Xuất:</span>
                <span className="font-semibold text-orange-800">
                  {Number(formData.quantity).toLocaleString('vi-VN')} {formData.unit}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-orange-600">Lý do:</span>
                <span className="font-medium text-orange-800">
                  {selectedReason.icon} {selectedReason.label}
                </span>
              </div>
              {formData.reason === 'other' && formData.reason_detail && (
                <div className="flex items-start space-x-2">
                  <span className="text-orange-600">Chi tiết:</span>
                  <span className="font-medium text-orange-800">{formData.reason_detail}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú thêm
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            placeholder="Ghi chú thêm về yêu cầu xuất đặc biệt..."
            disabled={formData.approval_status === 'approved'}
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
          
          {formData.approval_status !== 'approved' && (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>
                {initialData 
                  ? (formData.approval_status === 'pending' ? 'Cập nhật yêu cầu' : 'Cập nhật')
                  : 'Tạo yêu cầu'
                }
              </span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SpecialOutboundForm;
