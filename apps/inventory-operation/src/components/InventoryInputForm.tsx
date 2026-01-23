import React, { useState } from 'react';
import { InventoryRecord } from '../types';

interface InventoryInputFormProps {
  onSubmit: (data: Partial<InventoryRecord>) => void;
  onCancel: () => void;
  initialData?: Partial<InventoryRecord>;
  isLoading?: boolean;
}

const InventoryInputForm: React.FC<InventoryInputFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<InventoryRecord>>({
    date: new Date(),
    productCode: '',
    productName: '',
    inputQuantity: 0,
    rawMaterialStock: 0,
    rawMaterialUnit: '',
    processedStock: 0,
    processedUnit: '',
    finishedProductStock: 0,
    finishedProductUnit: '',
    notes: '',
    ...initialData,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof InventoryRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="card max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Nhập liệu tồn kho
        </h2>
        <p className="text-gray-600">
          Nhập thông tin tồn kho theo ngày (Bảng 1)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange('date', new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã món <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.productCode || ''}
              onChange={(e) => handleInputChange('productCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Nhập mã món"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.productName || ''}
              onChange={(e) => handleInputChange('productName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Nhập tên hàng"
              required
            />
          </div>
        </div>

        {/* Nhập kho */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Nhập kho</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng nhập
              </label>
              <input
                type="number"
                value={formData.inputQuantity || 0}
                onChange={(e) => handleInputChange('inputQuantity', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Tồn thực NVL */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Tồn thực nguyên vật liệu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tồn thực NVL
              </label>
              <input
                type="number"
                value={formData.rawMaterialStock || 0}
                onChange={(e) => handleInputChange('rawMaterialStock', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ĐVT NVL
              </label>
              <input
                type="text"
                value={formData.rawMaterialUnit || ''}
                onChange={(e) => handleInputChange('rawMaterialUnit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="quả, cây, con..."
              />
            </div>
          </div>
        </div>

        {/* Tồn thực sơ chế */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Tồn thực sơ chế</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tồn thực sơ chế
              </label>
              <input
                type="number"
                value={formData.processedStock || 0}
                onChange={(e) => handleInputChange('processedStock', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ĐVT sơ chế
              </label>
              <input
                type="text"
                value={formData.processedUnit || ''}
                onChange={(e) => handleInputChange('processedUnit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="miếng, lát..."
              />
            </div>
          </div>
        </div>

        {/* Tồn thực thành phẩm */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Tồn thực thành phẩm</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tồn thực thành phẩm
              </label>
              <input
                type="number"
                value={formData.finishedProductStock || 0}
                onChange={(e) => handleInputChange('finishedProductStock', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ĐVT thành phẩm
              </label>
              <input
                type="text"
                value={formData.finishedProductUnit || ''}
                onChange={(e) => handleInputChange('finishedProductUnit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="đĩa, hộp..."
              />
            </div>
          </div>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ghi chú thêm..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryInputForm;
