import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface InventoryExportFormProps {
  products: Product[];
  onExport: (exportData: {
    format: 'excel' | 'pdf';
    template: 'inventory_check' | 'variance_report' | 'summary_report';
    filters: {
      date_from?: string;
      date_to?: string;
      product_ids?: string[];
      include_zero_variance?: boolean;
      include_notes?: boolean;
    };
    notes?: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const InventoryExportForm: React.FC<InventoryExportFormProps> = ({
  products,
  onExport,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    format: 'excel' as 'excel' | 'pdf',
    template: 'inventory_check' as 'inventory_check' | 'variance_report' | 'summary_report',
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    date_to: new Date().toISOString().split('T')[0], // today
    product_ids: [] as string[],
    include_zero_variance: false,
    include_notes: true,
    notes: ''
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const templates = [
    {
      id: 'inventory_check',
      name: 'Phiếu kiểm kho',
      description: 'Mẫu phiếu kiểm kho chuẩn với thông tin sản phẩm, tồn sổ, tồn thực',
      icon: '📋'
    },
    {
      id: 'variance_report',
      name: 'Báo cáo chênh lệch',
      description: 'Báo cáo chi tiết các chênh lệch tồn kho với phân tích nguyên nhân',
      icon: '📊'
    },
    {
      id: 'summary_report',
      name: 'Báo cáo tổng hợp',
      description: 'Tổng hợp tình hình nhập xuất tồn theo kỳ với biểu đồ',
      icon: '📈'
    }
  ];

  const handleProductSelection = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectAll(selected);
    if (selected) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      product_ids: selectedProducts
    }));
  }, [selectedProducts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onExport({
      format: formData.format,
      template: formData.template,
      filters: {
        date_from: formData.date_from,
        date_to: formData.date_to,
        product_ids: formData.product_ids.length > 0 ? formData.product_ids : undefined,
        include_zero_variance: formData.include_zero_variance,
        include_notes: formData.include_notes
      },
      notes: formData.notes
    });
  };

  const selectedTemplate = templates.find(t => t.id === formData.template);

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <span className="text-xl">📄</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Xuất file báo cáo</h2>
            <p className="text-sm text-gray-500">Tạo và xuất file kiểm kho, báo cáo chi tiết</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Chọn mẫu báo cáo <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  formData.template === template.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, template: template.id as any }))}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{template.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                </div>
                {formData.template === template.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Định dạng file <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="excel"
                checked={formData.format === 'excel'}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as 'excel' }))}
                className="text-green-600 focus:ring-green-500"
              />
              <div className="flex items-center space-x-2">
                <span className="text-lg">📊</span>
                <span className="font-medium">Excel (.xlsx)</span>
              </div>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={formData.format === 'pdf'}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as 'pdf' }))}
                className="text-green-600 focus:ring-green-500"
              />
              <div className="flex items-center space-x-2">
                <span className="text-lg">📄</span>
                <span className="font-medium">PDF (.pdf)</span>
              </div>
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={formData.date_from}
              onChange={(e) => setFormData(prev => ({ ...prev, date_from: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={formData.date_to}
              onChange={(e) => setFormData(prev => ({ ...prev, date_to: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Chọn sản phẩm (để trống = tất cả)
          </label>
          <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
            <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-100">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="font-medium text-gray-700">
                Chọn tất cả ({products.length} sản phẩm)
              </span>
            </div>
            <div className="space-y-2">
              {products.map((product) => (
                <label key={product.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={(e) => handleProductSelection(product.id, e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{product.name}</span>
                    <span className="text-sm text-gray-500 ml-2">[{product.businessCode}]</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {selectedProducts.length > 0 && (
            <p className="text-sm text-green-600 mt-2">
              Đã chọn {selectedProducts.length} sản phẩm
            </p>
          )}
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Tùy chọn xuất file</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.include_zero_variance}
                onChange={(e) => setFormData(prev => ({ ...prev, include_zero_variance: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Bao gồm các mục không có chênh lệch</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.include_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, include_notes: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Bao gồm ghi chú và nhận xét</span>
            </label>
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú bổ sung
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
            placeholder="Thêm ghi chú cho báo cáo (tùy chọn)..."
          />
        </div>

        {/* Preview Info */}
        {selectedTemplate && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{selectedTemplate.icon}</div>
              <div>
                <h4 className="font-medium text-blue-900">Xem trước: {selectedTemplate.name}</h4>
                <p className="text-sm text-blue-700 mt-1">{selectedTemplate.description}</p>
                <div className="text-xs text-blue-600 mt-2 space-y-1">
                  <div>• Định dạng: {formData.format.toUpperCase()}</div>
                  <div>• Khoảng thời gian: {formData.date_from} đến {formData.date_to}</div>
                  <div>• Sản phẩm: {selectedProducts.length > 0 ? `${selectedProducts.length} sản phẩm` : 'Tất cả sản phẩm'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

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
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{loading ? 'Đang xuất...' : 'Xuất file'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryExportForm;
