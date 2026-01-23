import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { excelImportService, ImportResult } from '../../services/excelImportService';
import { databaseService } from '../../services/databaseService';
import { Product, InventoryRecord, SalesRecord } from '../../types';
import ClipboardPasteInput from '../ClipboardPaste/ClipboardPasteInput';
import GoogleSheetsIntegration from '../GoogleSheets/GoogleSheetsIntegration';
import EditableDataGrid from './EditableDataGrid';

type ImportType = 'products' | 'inventory' | 'sales';

interface ImportStatus {
  isImporting: boolean;
  type: ImportType | null;
  result: ImportResult<any> | null;
  error: string | null;
}

const ImportExportPage: React.FC = () => {
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    isImporting: false,
    type: null,
    result: null,
    error: null,
  });

  const [selectedType, setSelectedType] = useState<ImportType>('products');
  const [clipboardData, setClipboardData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'excel' | 'clipboard' | 'googlesheets'>('excel');

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setImportStatus({
      isImporting: true,
      type: selectedType,
      result: null,
      error: null,
    });

    try {
      let importResult: ImportResult<any>;

      // Import based on selected type
      switch (selectedType) {
        case 'products':
          importResult = await excelImportService.importProducts(file);
          break;
        case 'inventory':
          importResult = await excelImportService.importInventoryRecords(file);
          break;
        case 'sales':
          importResult = await excelImportService.importSalesRecords(file);
          break;
        default:
          throw new Error('Invalid import type');
      }

      // If import successful, save to database
      if (importResult.success && importResult.data.length > 0) {
        let dbResult;
        
        switch (selectedType) {
          case 'products':
            dbResult = await databaseService.bulkInsertProducts(importResult.data);
            break;
          case 'inventory':
            dbResult = await databaseService.bulkInsertInventoryRecords(importResult.data);
            break;
          case 'sales':
            dbResult = await databaseService.bulkInsertSalesRecords(importResult.data);
            break;
        }

        if (dbResult?.error) {
          importResult.errors.push(`Lỗi lưu database: ${dbResult.error}`);
          importResult.success = false;
        }
      }

      setImportStatus({
        isImporting: false,
        type: selectedType,
        result: importResult,
        error: null,
      });

    } catch (error) {
      setImportStatus({
        isImporting: false,
        type: selectedType,
        result: null,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      });
    }
  }, [selectedType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
    disabled: importStatus.isImporting,
  });

  // Handle template download
  const handleDownloadTemplate = (type: ImportType) => {
    excelImportService.generateTemplate(type);
  };

  // Handle clipboard data
  const handleClipboardData = async (data: any[]) => {
    setClipboardData([]);
  };

  // Handle Google Sheets data import
  const handleGoogleSheetsImport = async (data: {
    products?: Product[];
    inventory?: InventoryRecord[];
    sales?: SalesRecord[];
  }) => {
    try {
      let dbResult;
      let importedData: any[] = [];
      let dataType: ImportType;
      
      switch (selectedType) {
        case 'products':
          dbResult = await databaseService.bulkInsertProducts(data);
          break;
        case 'inventory':
          dbResult = await databaseService.bulkInsertInventoryRecords(data);
          break;
        case 'sales':
          dbResult = await databaseService.bulkInsertSalesRecords(data);
          break;
      }

      if (dbResult?.error) {
        alert(`Lỗi lưu database: ${dbResult.error}`);
      } else {
        alert(`Đã import thành công ${data.length} dòng dữ liệu!`);
      }
    } catch (error) {
      alert(`Lỗi xử lý dữ liệu: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Get expected columns for clipboard paste
  const getExpectedColumns = (type: ImportType): string[] => {
    switch (type) {
      case 'products':
        return ['businessCode', 'name', 'category', 'inputUnit', 'outputUnit', 'inputQuantity', 'outputQuantity'];
      case 'inventory':
        return ['date', 'productCode', 'inputQuantity', 'actualQuantity', 'unit'];
      case 'sales':
        return ['date', 'productId', 'salesQuantity', 'promotionQuantity'];
      default:
        return [];
    }
  };

  // Handle export
  const handleExport = async (type: ImportType) => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'products':
          const productsResult = await databaseService.getProducts();
          if (productsResult.data) {
            data = productsResult.data;
            filename = 'danh-sach-san-pham';
          }
          break;
        case 'inventory':
          const inventoryResult = await databaseService.getInventoryRecords();
          if (inventoryResult.data) {
            data = inventoryResult.data;
            filename = 'bao-cao-ton-kho';
          }
          break;
        case 'sales':
          const salesResult = await databaseService.getSalesRecords();
          if (salesResult.data) {
            data = salesResult.data;
            filename = 'bao-cao-ban-hang';
          }
          break;
      }

      if (data.length > 0) {
        excelImportService.exportToExcel(data, filename);
      } else {
        alert('Không có dữ liệu để xuất');
      }
    } catch (error) {
      alert(`Lỗi xuất file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearResult = () => {
    setImportStatus({
      isImporting: false,
      type: null,
      result: null,
      error: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Import/Export Dữ Liệu
        </h1>
        <p className="text-gray-600 mt-1">
          Nhập và xuất dữ liệu từ file Excel
        </p>
      </div>

      {/* Type Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Chọn Loại Dữ Liệu
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { type: 'products' as ImportType, label: 'Sản Phẩm', icon: DocumentArrowUpIcon },
            { type: 'inventory' as ImportType, label: 'Tồn Kho', icon: DocumentArrowUpIcon },
            { type: 'sales' as ImportType, label: 'Bán Hàng', icon: DocumentArrowUpIcon },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Icon className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Clipboard Paste Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <ClipboardPasteInput
          onDataParsed={handleClipboardData}
          expectedColumns={getExpectedColumns(selectedType)}
          placeholder={`Paste dữ liệu ${selectedType === 'products' ? 'sản phẩm' : selectedType === 'inventory' ? 'tồn kho' : 'bán hàng'} từ Excel/Google Sheets vào đây...`}
        />
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Import File Excel
          </h2>
          <button
            onClick={() => handleDownloadTemplate(selectedType)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Tải Template
          </button>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : importStatus.isImporting
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          
          {importStatus.isImporting ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Đang xử lý file...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">
                {isDragActive
                  ? 'Thả file vào đây...'
                  : 'Kéo thả file Excel vào đây hoặc click để chọn'}
              </p>
              <p className="text-sm text-gray-500">
                Hỗ trợ file .xlsx, .xls
              </p>
            </div>
          )}
        </div>

        {/* Import Result */}
        {(importStatus.result || importStatus.error) && (
          <div className="mt-6 p-4 rounded-lg border">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {importStatus.error ? (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-0.5" />
                ) : importStatus.result?.success ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mt-0.5" />
                )}
                
                <div className="flex-1">
                  {importStatus.error ? (
                    <div>
                      <h3 className="font-medium text-red-800">Lỗi Import</h3>
                      <p className="text-red-700 mt-1">{importStatus.error}</p>
                    </div>
                  ) : importStatus.result ? (
                    <div>
                      <h3 className={`font-medium ${
                        importStatus.result.success ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {importStatus.result.success ? 'Import Thành Công' : 'Import Có Lỗi'}
                      </h3>
                      
                      <div className="mt-2 space-y-1 text-sm">
                        <p>Tổng số dòng: {importStatus.result.totalRows}</p>
                        <p>Dòng hợp lệ: {importStatus.result.validRows}</p>
                        <p>Dòng lỗi: {importStatus.result.totalRows - importStatus.result.validRows}</p>
                      </div>

                      {importStatus.result.warnings.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-yellow-800">Cảnh báo:</h4>
                          <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                            {importStatus.result.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {importStatus.result.errors.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-red-800">Lỗi:</h4>
                          <ul className="list-disc list-inside text-sm text-red-700 mt-1 max-h-32 overflow-y-auto">
                            {importStatus.result.errors.slice(0, 10).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importStatus.result.errors.length > 10 && (
                              <li>... và {importStatus.result.errors.length - 10} lỗi khác</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              
              <button
                onClick={clearResult}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : importStatus.isImporting
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              
              {importStatus.isImporting ? (
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600">Đang xử lý file...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600">
                    {isDragActive
                      ? 'Thả file vào đây...'
                      : 'Kéo thả file Excel vào đây hoặc click để chọn'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Hỗ trợ file .xlsx, .xls
                  </p>
                </div>
              )}
            </div>

            {/* Import Result */}
            {(importStatus.result || importStatus.error) && (
              <div className="mt-6 p-4 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {importStatus.error ? (
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-0.5" />
                    ) : importStatus.result?.success ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5" />
                    ) : (
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mt-0.5" />
                    )}
                    
                    <div className="flex-1">
                      {importStatus.error ? (
                        <div>
                          <h3 className="font-medium text-red-800">Lỗi Import</h3>
                          <p className="text-red-700 mt-1">{importStatus.error}</p>
                        </div>
                      ) : importStatus.result ? (
                        <div>
                          <h3 className={`font-medium ${
                            importStatus.result.success ? 'text-green-800' : 'text-yellow-800'
                          }`}>
                            {importStatus.result.success ? 'Import Thành Công' : 'Import Có Lỗi'}
                          </h3>
                          
                          <div className="mt-2 space-y-1 text-sm">
                            <p>Tổng số dòng: {importStatus.result.totalRows}</p>
                            <p>Dòng hợp lệ: {importStatus.result.validRows}</p>
                            <p>Dòng lỗi: {importStatus.result.totalRows - importStatus.result.validRows}</p>
                          </div>

                          {importStatus.result.warnings.length > 0 && (
                            <div className="mt-3">
                              <h4 className="font-medium text-yellow-800">Cảnh báo:</h4>
                              <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                                {importStatus.result.warnings.map((warning, index) => (
                                  <li key={index}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {importStatus.result.errors.length > 0 && (
                            <div className="mt-3">
                              <h4 className="font-medium text-red-800">Lỗi:</h4>
                              <ul className="list-disc list-inside text-sm text-red-700 mt-1 max-h-32 overflow-y-auto">
                                {importStatus.result.errors.slice(0, 10).map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                                {importStatus.result.errors.length > 10 && (
                                  <li>... và {importStatus.result.errors.length - 10} lỗi khác</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  
                  <button
                    onClick={clearResult}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clipboard' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ClipboardPasteInput
              onDataParsed={handleClipboardData}
              expectedColumns={getExpectedColumns(selectedType)}
              placeholder={`Paste dữ liệu ${selectedType === 'products' ? 'sản phẩm' : selectedType === 'inventory' ? 'tồn kho' : 'bán hàng'} từ Excel/Google Sheets vào đây...`}
            />
          </div>
        )}

        {activeTab === 'googlesheets' && (
          <GoogleSheetsIntegration
            onDataImported={handleGoogleSheetsImport}
          />
        )}
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Export Dữ Liệu
        </h2>
        <p className="text-gray-600 mb-4">
          Xuất dữ liệu hiện tại ra file Excel
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { type: 'products' as ImportType, label: 'Xuất Sản Phẩm', description: 'Danh sách tất cả sản phẩm' },
            { type: 'inventory' as ImportType, label: 'Xuất Tồn Kho', description: 'Báo cáo tồn kho hiện tại' },
            { type: 'sales' as ImportType, label: 'Xuất Bán Hàng', description: 'Dữ liệu bán hàng' },
          ].map(({ type, label, description }) => (
            <button
              key={type}
              onClick={() => handleExport(type)}
              className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <DocumentArrowDownIcon className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">{label}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-medium text-blue-900 mb-2">
          Hướng Dẫn Sử Dụng
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Tải template Excel để có định dạng chuẩn</li>
          <li>• Điền dữ liệu vào template theo đúng cột</li>
          <li>• Kéo thả file vào vùng import hoặc click để chọn</li>
          <li>• Kiểm tra kết quả import và sửa lỗi nếu có</li>
          <li>• Sử dụng chức năng export để sao lưu dữ liệu</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportExportPage;
