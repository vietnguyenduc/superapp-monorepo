import React, { useState, useEffect } from 'react';
import { productLookupService } from '../services/productLookupService';

interface BulkPasteItem {
  name: string;
  code: string;
  isValid: boolean;
  message: string;
  suggestedCode?: string;
  suggestedName?: string;
}

interface BulkPasteValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (validatedItems: BulkPasteItem[]) => void;
  pastedData: string[];
}

const BulkPasteValidationModal: React.FC<BulkPasteValidationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pastedData
}) => {
  const [validatedItems, setValidatedItems] = useState<BulkPasteItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    validPercentage: 0
  });

  // Validate pasted data when modal opens
  useEffect(() => {
    if (isOpen && pastedData.length > 0) {
      // Parse pasted data - assume format: "Product Name" or "Product Name | Product Code"
      const items = pastedData.map(item => {
        const parts = item.split('|').map(p => p.trim());
        const name = parts[0] || '';
        const code = parts[1] || '';
        
        // If no code provided, try to lookup from name
        const lookupCode = code || productLookupService.getCodeByName(name) || '';
        
        return { name, code: lookupCode };
      });

      // Bulk validate
      const validation = productLookupService.bulkValidate(items);
      
      // Combine results
      const allItems: BulkPasteItem[] = [
        ...validation.valid.map(item => ({
          name: item.name,
          code: item.code,
          isValid: true,
          message: item.message
        })),
        ...validation.invalid.map(item => ({
          name: item.name,
          code: item.code,
          isValid: false,
          message: item.message,
          suggestedCode: item.suggestedCode,
          suggestedName: item.suggestedName
        }))
      ];

      setValidatedItems(allItems);
      setStats(validation.stats);
    }
  }, [isOpen, pastedData]);

  // Handle suggestion acceptance
  const handleAcceptSuggestion = (index: number, type: 'code' | 'name') => {
    const updatedItems = [...validatedItems];
    const item = updatedItems[index];
    
    if (type === 'code' && item.suggestedCode) {
      item.code = item.suggestedCode;
    } else if (type === 'name' && item.suggestedName) {
      item.name = item.suggestedName;
    }
    
    // Re-validate this item
    const validation = productLookupService.validateMapping(item.name, item.code);
    item.isValid = validation.isValid;
    item.message = validation.message;
    item.suggestedCode = validation.suggestedCode;
    item.suggestedName = validation.suggestedName;
    
    setValidatedItems(updatedItems);
    
    // Update stats
    const validCount = updatedItems.filter(i => i.isValid).length;
    const invalidCount = updatedItems.length - validCount;
    setStats({
      total: updatedItems.length,
      valid: validCount,
      invalid: invalidCount,
      validPercentage: Math.round((validCount / updatedItems.length) * 100)
    });
  };

  // Handle manual edit
  const handleManualEdit = (index: number, field: 'name' | 'code', value: string) => {
    const updatedItems = [...validatedItems];
    const item = updatedItems[index];
    
    item[field] = value;
    
    // Re-validate
    const validation = productLookupService.validateMapping(item.name, item.code);
    item.isValid = validation.isValid;
    item.message = validation.message;
    item.suggestedCode = validation.suggestedCode;
    item.suggestedName = validation.suggestedName;
    
    setValidatedItems(updatedItems);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                📋 Kiểm tra dữ liệu dán hàng loạt
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Xác minh mapping giữa tên sản phẩm và mã sản phẩm
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Tổng cộng</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
              <div className="text-sm text-gray-600">Hợp lệ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
              <div className="text-sm text-gray-600">Lỗi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.validPercentage}%</div>
              <div className="text-sm text-gray-600">Độ chính xác</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {validatedItems.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  item.isValid 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Status and message */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-sm font-medium ${
                        item.isValid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {item.message}
                      </span>
                    </div>

                    {/* Product info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Tên sản phẩm
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleManualEdit(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Mã sản phẩm
                        </label>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleManualEdit(index, 'code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Suggestions */}
                    {!item.isValid && (item.suggestedCode || item.suggestedName) && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-xs font-medium text-yellow-800 mb-2">
                          💡 Gợi ý sửa lỗi:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.suggestedCode && (
                            <button
                              onClick={() => handleAcceptSuggestion(index, 'code')}
                              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200"
                            >
                              Dùng mã: {item.suggestedCode}
                            </button>
                          )}
                          {item.suggestedName && (
                            <button
                              onClick={() => handleAcceptSuggestion(index, 'name')}
                              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200"
                            >
                              Dùng tên: {item.suggestedName}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {stats.invalid > 0 ? (
                <span className="text-red-600">
                  ⚠️ Còn {stats.invalid} lỗi cần sửa trước khi áp dụng
                </span>
              ) : (
                <span className="text-green-600">
                  ✅ Tất cả dữ liệu đã hợp lệ
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => onConfirm(validatedItems)}
                disabled={stats.invalid > 0}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  stats.invalid > 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Áp dụng ({stats.valid} sản phẩm)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkPasteValidationModal;
