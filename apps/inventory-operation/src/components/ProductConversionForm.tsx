import React, { useState } from 'react';
import { ProductConversion } from '../types';

interface ProductConversionFormProps {
  productId: string;
  productName: string;
  conversions: ProductConversion[];
  onAddConversion: (conversion: Omit<ProductConversion, 'productId'>) => void;
  onRemoveConversion: (index: number) => void;
  onClose: () => void;
}

const ProductConversionForm: React.FC<ProductConversionFormProps> = ({
  productId,
  productName,
  conversions,
  onAddConversion,
  onRemoveConversion,
  onClose,
}) => {
  const [newConversion, setNewConversion] = useState({
    fromUnit: '',
    toUnit: '',
    conversionRate: 1,
    description: '',
  });

  const handleAddConversion = (e: React.FormEvent) => {
    e.preventDefault();
    if (newConversion.fromUnit && newConversion.toUnit && newConversion.conversionRate > 0) {
      onAddConversion(newConversion);
      setNewConversion({
        fromUnit: '',
        toUnit: '',
        conversionRate: 1,
        description: '',
      });
    }
  };

  const commonUnits = [
    'quả', 'cây', 'con', 'kg', 'gram',
    'miếng', 'lát', 'khúc', 'thanh',
    'đĩa', 'hộp', 'túi', 'gói', 'chai'
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Định mức quy đổi - {productName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Thiết lập tỷ lệ quy đổi giữa các đơn vị khác nhau
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Current Conversions */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Tỷ lệ quy đổi hiện tại
          </h4>
          {conversions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔄</div>
              <p>Chưa có tỷ lệ quy đổi nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversions.map((conversion, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      1 {conversion.fromUnit} = {conversion.conversionRate} {conversion.toUnit}
                    </div>
                    {conversion.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {conversion.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveConversion(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Conversion */}
        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Thêm tỷ lệ quy đổi mới
          </h4>
          <form onSubmit={handleAddConversion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Từ đơn vị
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="fromUnits"
                    value={newConversion.fromUnit}
                    onChange={(e) => setNewConversion(prev => ({ ...prev, fromUnit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="quả, kg..."
                    required
                  />
                  <datalist id="fromUnits">
                    {commonUnits.map(unit => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sang đơn vị
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="toUnits"
                    value={newConversion.toUnit}
                    onChange={(e) => setNewConversion(prev => ({ ...prev, toUnit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="miếng, gram..."
                    required
                  />
                  <datalist id="toUnits">
                    {commonUnits.map(unit => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỷ lệ
                </label>
                <input
                  type="number"
                  value={newConversion.conversionRate}
                  onChange={(e) => setNewConversion(prev => ({ ...prev, conversionRate: parseFloat(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full btn-primary"
                >
                  Thêm
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả (tùy chọn)
              </label>
              <input
                type="text"
                value={newConversion.description}
                onChange={(e) => setNewConversion(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ví dụ: 1 quả cam = 8 miếng"
              />
            </div>

            {/* Preview */}
            {newConversion.fromUnit && newConversion.toUnit && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Xem trước:</strong> 1 {newConversion.fromUnit} = {newConversion.conversionRate} {newConversion.toUnit}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Nghịch đảo: 1 {newConversion.toUnit} = {(1 / newConversion.conversionRate).toFixed(4)} {newConversion.fromUnit}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Actions */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Hoàn thành
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductConversionForm;
