import React, { useState } from 'react';
import { Product } from '../types';
import { ConversionEngine } from '../utils/conversionLogic';

interface ConversionDisplayProps {
  product: Product;
}

const ConversionDisplay: React.FC<ConversionDisplayProps> = ({ product }) => {
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [result, setResult] = useState<any>(null);

  const availableUnits = ConversionEngine.getAllUnits(product);
  const conversionSummary = ConversionEngine.getConversionSummary(product);
  const validation = ConversionEngine.validateConversions(product);

  const handleConvert = () => {
    if (fromUnit && toUnit) {
      const conversionResult = ConversionEngine.convert(product, fromUnit, toUnit, quantity);
      setResult(conversionResult);
    }
  };

  return (
    <div className="space-y-6">
      {/* Conversion Summary */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-3">
          Tóm tắt quy đổi
        </h4>
        {conversionSummary.length === 0 ? (
          <p className="text-sm text-blue-700">Chưa có thông tin quy đổi</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {conversionSummary.map((summary, index) => (
              <div key={index} className="text-sm text-blue-700 bg-white px-3 py-2 rounded">
                {summary}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {!validation.isValid && (
        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-red-900 mb-3">
            ⚠️ Cảnh báo quy đổi
          </h4>
          <div className="space-y-1">
            {validation.errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700">{error}</p>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Converter */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Công cụ quy đổi
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ đơn vị
            </label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Chọn đơn vị</option>
              {availableUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sang đơn vị
            </label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Chọn đơn vị</option>
              {availableUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleConvert}
              disabled={!fromUnit || !toUnit}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Quy đổi
            </button>
          </div>
        </div>

        {/* Conversion Result */}
        {result && (
          <div className="mt-4 p-3 bg-white rounded-lg border">
            {result.success ? (
              <div>
                <div className="text-lg font-medium text-green-800">
                  {quantity} {fromUnit} = {result.convertedValue.toFixed(4)} {toUnit}
                </div>
                {result.conversionPath.length > 2 && (
                  <div className="text-sm text-gray-600 mt-1">
                    Đường dẫn quy đổi: {result.conversionPath.join(' → ')}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-800">
                <div className="font-medium">Không thể quy đổi</div>
                <div className="text-sm">{result.error}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available Units */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Đơn vị có sẵn
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableUnits.map(unit => (
            <span
              key={unit}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              {unit}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversionDisplay;
