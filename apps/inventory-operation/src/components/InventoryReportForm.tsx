import React, { useState, useEffect } from 'react';
import { InventoryVarianceReport, Product } from '../types';

interface InventoryReportFormProps {
  onSubmit: (data: Omit<InventoryVarianceReport, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  initialData?: InventoryVarianceReport;
  products: Product[];
  loading?: boolean;
}

const InventoryReportForm: React.FC<InventoryReportFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  products,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    product_id: initialData?.product_id || '',
    beginning_inventory: initialData?.beginning_inventory || 0,
    inbound_quantity: initialData?.inbound_quantity || 0,
    sales_quantity: initialData?.sales_quantity || 0,
    promotion_quantity: initialData?.promotion_quantity || 0,
    special_outbound_quantity: initialData?.special_outbound_quantity || 0,
    book_inventory: initialData?.book_inventory || 0,
    actual_inventory: initialData?.actual_inventory || 0,
    variance: initialData?.variance || 0,
    variance_percentage: initialData?.variance_percentage || 0,
    unit: initialData?.unit || '',
    notes: initialData?.notes || '',
    created_by: initialData?.created_by || 'current-user',
    updated_by: 'current-user'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-fill unit when product is selected
  useEffect(() => {
    if (formData.product_id) {
      const selectedProduct = products.find(p => p.id === formData.product_id);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          unit: selectedProduct.outputUnit || selectedProduct.inputUnit
        }));
      }
    }
  }, [formData.product_id, products]);

  // Auto-calculate book inventory and variance
  useEffect(() => {
    if (autoCalculate) {
      const bookInventory = 
        formData.beginning_inventory + 
        formData.inbound_quantity - 
        formData.sales_quantity - 
        formData.promotion_quantity - 
        formData.special_outbound_quantity;

      const variance = formData.actual_inventory - bookInventory;
      const variancePercentage = bookInventory > 0 ? (variance / bookInventory) * 100 : 0;

      setFormData(prev => ({
        ...prev,
        book_inventory: bookInventory,
        variance: variance,
        variance_percentage: variancePercentage
      }));
    }
  }, [
    formData.beginning_inventory,
    formData.inbound_quantity,
    formData.sales_quantity,
    formData.promotion_quantity,
    formData.special_outbound_quantity,
    formData.actual_inventory,
    autoCalculate
  ]);

  const handleSyncSalesData = async () => {
    if (!formData.date || !formData.product_id) {
      setErrors(prev => ({ 
        ...prev, 
        date: !formData.date ? 'Cần chọn ngày để đồng bộ' : '',
        product_id: !formData.product_id ? 'Cần chọn sản phẩm để đồng bộ' : ''
      }));
      return;
    }

    try {
      setIsSyncing(true);
      // Import dynamically to avoid circular dependencies if any, or we can just import at top.
      const { salesService } = await import('../services/salesService');
      const response = await salesService.getSalesRecords({
        dateFrom: formData.date,
        dateTo: formData.date,
        productId: formData.product_id
      });

      if (response.data) {
        const totalSales = response.data.reduce((sum, record) => sum + (record.salesQuantity || 0), 0);
        const totalPromotion = response.data.reduce((sum, record) => sum + (record.promotionQuantity || 0), 0);
        
        setFormData(prev => ({
          ...prev,
          sales_quantity: totalSales,
          promotion_quantity: totalPromotion
        }));

        // Temporary success notification could go here, or we just let it update the inputs.
        // Alert can be a bit intrusive, so maybe just visual change.
      }
    } catch (err) {
      console.error('Lỗi khi đồng bộ số bán:', err);
      // Fallback or show error
    } finally {
      setIsSyncing(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày';
    }

    if (!formData.product_id) {
      newErrors.product_id = 'Vui lòng chọn sản phẩm';
    }

    if (formData.beginning_inventory < 0) {
      newErrors.beginning_inventory = 'Tồn đầu không được âm';
    }

    if (formData.inbound_quantity < 0) {
      newErrors.inbound_quantity = 'Nhập kho không được âm';
    }

    if (formData.sales_quantity < 0) {
      newErrors.sales_quantity = 'Bán hàng không được âm';
    }

    if (formData.promotion_quantity < 0) {
      newErrors.promotion_quantity = 'Khuyến mãi không được âm';
    }

    if (formData.special_outbound_quantity < 0) {
      newErrors.special_outbound_quantity = 'Xuất đặc biệt không được âm';
    }

    if (formData.actual_inventory < 0) {
      newErrors.actual_inventory = 'Tồn thực tế không được âm';
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
      beginning_inventory: Number(formData.beginning_inventory),
      inbound_quantity: Number(formData.inbound_quantity),
      sales_quantity: Number(formData.sales_quantity),
      promotion_quantity: Number(formData.promotion_quantity),
      special_outbound_quantity: Number(formData.special_outbound_quantity),
      book_inventory: Number(formData.book_inventory),
      actual_inventory: Number(formData.actual_inventory),
      variance: Number(formData.variance),
      variance_percentage: Number(formData.variance_percentage)
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

  const getVarianceColor = (variance: number, percentage: number) => {
    const absPercentage = Math.abs(percentage);
    if (absPercentage >= 10) return 'text-red-600 bg-red-50 border-red-200';
    if (absPercentage >= 5) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (absPercentage > 0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return '📈'; // Thừa
    if (variance < 0) return '📉'; // Thiếu
    return '✅'; // Khớp
  };

  const getVarianceLabel = (variance: number) => {
    if (variance > 0) return 'Thừa kho';
    if (variance < 0) return 'Thiếu kho';
    return 'Khớp sổ';
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Chỉnh sửa báo cáo nhập xuất tồn' : 'Thêm báo cáo nhập xuất tồn'}
            </h2>
            <p className="text-sm text-gray-500">So sánh tồn sổ và tồn thực tế</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleSyncSalesData}
            disabled={isSyncing || !formData.date || !formData.product_id}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !formData.date || !formData.product_id 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
            title={(!formData.date || !formData.product_id) ? "Vui lòng chọn Ngày và Sản phẩm trước" : "Lấy số xuất bán từ hệ thống"}
          >
            {isSyncing ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>Đồng bộ xuất sổ</span>
          </button>
          
          <label className="flex items-center space-x-2 border-l border-gray-200 pl-3">
            <input
              type="checkbox"
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Tự động tính toán</span>
          </label>
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
                  [{product.businessCode}] {product.name}
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
                <p className="font-medium text-gray-900">{selectedProduct.inputUnit}</p>
              </div>
              <div>
                <span className="text-gray-600">Đơn vị xuất:</span>
                <p className="font-medium text-gray-900">{selectedProduct.outputUnit}</p>
              </div>
              <div>
                <span className="text-gray-600">Trạng thái:</span>
                <p className={`font-medium ${
                  selectedProduct.businessStatus === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedProduct.businessStatus === 'active' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Data Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tồn đầu kỳ
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.beginning_inventory}
              onChange={(e) => handleInputChange('beginning_inventory', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.beginning_inventory ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="0"
            />
            {errors.beginning_inventory && (
              <p className="mt-1 text-sm text-red-600">{errors.beginning_inventory}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhập kho
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.inbound_quantity}
              onChange={(e) => handleInputChange('inbound_quantity', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.inbound_quantity ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="0"
            />
            {errors.inbound_quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.inbound_quantity}</p>
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

        {/* Outbound Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bán hàng
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
              Khuyến mãi
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
              Xuất đặc biệt
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.special_outbound_quantity}
              onChange={(e) => handleInputChange('special_outbound_quantity', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.special_outbound_quantity ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="0"
            />
            {errors.special_outbound_quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.special_outbound_quantity}</p>
            )}
          </div>
        </div>

        {/* Book vs Actual Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tồn sổ {autoCalculate && <span className="text-xs text-blue-600">(tự động)</span>}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.book_inventory}
              onChange={(e) => handleInputChange('book_inventory', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50"
              placeholder="0"
              readOnly={autoCalculate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tồn thực tế <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.actual_inventory}
              onChange={(e) => handleInputChange('actual_inventory', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.actual_inventory ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              placeholder="0"
            />
            {errors.actual_inventory && (
              <p className="mt-1 text-sm text-red-600">{errors.actual_inventory}</p>
            )}
          </div>
        </div>

        {/* Variance Display */}
        {(formData.book_inventory !== 0 || formData.actual_inventory !== 0) && (
          <div className={`rounded-xl p-4 border ${getVarianceColor(formData.variance, formData.variance_percentage)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getVarianceIcon(formData.variance)}</span>
                <span className="font-medium">{getVarianceLabel(formData.variance)}</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {formData.variance > 0 ? '+' : ''}{Number(formData.variance).toLocaleString('vi-VN')} {formData.unit}
                </div>
                <div className="text-sm">
                  ({formData.variance_percentage > 0 ? '+' : ''}{Number(formData.variance_percentage).toFixed(2)}%)
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mt-3">
              <div>
                <span className="text-gray-600">Tồn sổ:</span>
                <span className="font-medium ml-2">{Number(formData.book_inventory).toLocaleString('vi-VN')} {formData.unit}</span>
              </div>
              <div>
                <span className="text-gray-600">Tồn thực:</span>
                <span className="font-medium ml-2">{Number(formData.actual_inventory).toLocaleString('vi-VN')} {formData.unit}</span>
              </div>
            </div>

            {/* Warning for large variance */}
            {Math.abs(formData.variance_percentage) >= 10 && (
              <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">⚠️</span>
                  <span className="text-sm font-medium text-red-800">
                    Chênh lệch lớn (≥10%) - Cần kiểm tra và tạo phiếu xuất đặc biệt
                  </span>
                </div>
              </div>
            )}
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
            placeholder="Ghi chú về báo cáo nhập xuất tồn..."
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
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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

export default InventoryReportForm;
