import React, { useState, useEffect } from 'react';
import { googleSheetsService } from '../../services/googleSheetsService';
import { Product, InventoryRecord, SalesRecord } from '../../types';

interface GoogleSheetsIntegrationProps {
  onDataImported?: (data: {
    products?: Product[];
    inventory?: InventoryRecord[];
    sales?: SalesRecord[];
  }) => void;
}

export const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({
  onDataImported
}) => {
  const [apiKey, setApiKey] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [range, setRange] = useState('Sheet1!A:Z');
  const [dataType, setDataType] = useState<'products' | 'inventory' | 'sales'>('products');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null);

  // Validate API key when it changes
  useEffect(() => {
    const validateKey = async () => {
      if (apiKey.length > 10) {
        googleSheetsService.setApiKey(apiKey);
        try {
          const isValid = await googleSheetsService.validateApiKey();
          setIsApiKeyValid(isValid);
        } catch {
          setIsApiKeyValid(false);
        }
      } else {
        setIsApiKeyValid(null);
      }
    };

    const timeoutId = setTimeout(validateKey, 500);
    return () => clearTimeout(timeoutId);
  }, [apiKey]);

  const handleImport = async () => {
    if (!apiKey || !spreadsheetUrl || !range) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const spreadsheetId = googleSheetsService.extractSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      setError('URL Google Sheets không hợp lệ');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      googleSheetsService.setApiKey(apiKey);
      const sheetData = await googleSheetsService.readSheet(spreadsheetId, range);
      
      if (!sheetData || !sheetData.values || sheetData.values.length === 0) {
        throw new Error('Không có dữ liệu trong sheet hoặc range không đúng');
      }

      let importedData: any = {};

      switch (dataType) {
        case 'products':
          const products = googleSheetsService.parseProductsFromSheet(sheetData);
          importedData.products = products;
          setSuccess(`Đã import thành công ${products.length} sản phẩm`);
          break;
        
        case 'inventory':
          const inventory = googleSheetsService.parseInventoryFromSheet(sheetData);
          importedData.inventory = inventory;
          setSuccess(`Đã import thành công ${inventory.length} bản ghi tồn kho`);
          break;
        
        case 'sales':
          const sales = googleSheetsService.parseSalesFromSheet(sheetData);
          importedData.sales = sales;
          setSuccess(`Đã import thành công ${sales.length} bản ghi bán hàng`);
          break;
      }

      if (onDataImported) {
        onDataImported(importedData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi import dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTemplate = () => {
    let template: string[][];
    
    switch (dataType) {
      case 'products':
        template = googleSheetsService.generateProductTemplate();
        break;
      case 'inventory':
        template = googleSheetsService.generateInventoryTemplate();
        break;
      case 'sales':
        template = googleSheetsService.generateSalesTemplate();
        break;
      default:
        return;
    }

    // Convert to CSV and download
    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `template_${dataType}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,3H5C3.9,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.9 20.1,3 19,3M19,19H5V5H19V19Z" />
            <path d="M14,17V15.5H9.5V17H14M14,13.5V12H9.5V13.5H14M14,10V8.5H9.5V10H14Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Google Sheets Integration</h3>
          <p className="text-sm text-gray-600">Import dữ liệu trực tiếp từ Google Sheets</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Sheets API Key
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Nhập Google Sheets API Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {isApiKeyValid !== null && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isApiKeyValid ? (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Lấy API key từ Google Cloud Console → APIs & Services → Credentials
          </p>
        </div>

        {/* Spreadsheet URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Sheets URL
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="url"
            value={spreadsheetUrl}
            onChange={(e) => setSpreadsheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Range (Vùng dữ liệu)
          </label>
          <input
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="Sheet1!A:Z"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ví dụ: Sheet1!A:Z (toàn bộ sheet), Sheet1!A1:E100 (vùng cụ thể)
          </p>
        </div>

        {/* Data Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại dữ liệu
          </label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="products">Danh mục sản phẩm</option>
            <option value="inventory">Tồn kho</option>
            <option value="sales">Bán hàng</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            onClick={handleImport}
            disabled={isLoading || !apiKey || !spreadsheetUrl || isApiKeyValid === false}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang import...
              </>
            ) : (
              'Import từ Google Sheets'
            )}
          </button>

          <button
            onClick={generateTemplate}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Tải template
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-800">Lỗi</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-green-800">Thành công</h4>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Hướng dẫn sử dụng:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Tạo Google Sheets API key từ Google Cloud Console</li>
            <li>Tạo Google Sheets và chia sẻ công khai (hoặc với service account)</li>
            <li>Copy URL của Google Sheets vào ô trên</li>
            <li>Chọn loại dữ liệu và range phù hợp</li>
            <li>Nhấn "Import từ Google Sheets" để bắt đầu</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsIntegration;
