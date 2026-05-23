// Enhanced Product Bulk Import Component
// Based on cashflow's CustomerImport.tsx pattern
// Features: drag-drop, validation preview, row-level errors, multi-step process

import React, { useState, useCallback, useMemo } from 'react';
import { useAuthContext as useAuth } from '@superapp/iam';
import type { Product } from '../../types';
import { parseProductFile, validateProductData, convertToProduct, canProceedWithImport, formatErrorMessage, getValidationSummary, type ImportError, type RawProductData, type ImportData } from '../../utils/importUtils';
import Button from '../UI/Button';

interface ProductBulkImportEnhancedProps {
  onImportComplete?: (data: Product[]) => void;
  companyId: string;
  branchId: string;
}

const INITIAL_SINGLE_PRODUCT: RawProductData = {
  name: '',
  category: '',
  businessCode: '',
  promotionCode: '',
  inputQuantity: '',
  outputQuantity: '',
  finishedProductCode: '',
  inputUnit: '',
  outputUnit: '',
  notes: '',
};

const MAX_BULK_ROWS = 200;

const ProductBulkImportEnhanced: React.FC<ProductBulkImportEnhancedProps> = ({
  onImportComplete,
  companyId,
  branchId,
}) => {
  const { user } = useAuth();
  const [singleProduct, setSingleProduct] = useState<RawProductData>(INITIAL_SINGLE_PRODUCT);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [isCreatingSingle, setIsCreatingSingle] = useState(false);
  const [importData, setImportData] = useState<ImportData>({
    file: null,
    data: [],
    errors: [],
    isValid: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<{
    data: RawProductData[];
    errors: ImportError[];
    isValid: boolean;
  }>({ data: [], errors: [], isValid: false });

  const hasSingleChanges = useMemo(() => {
    return Object.keys(INITIAL_SINGLE_PRODUCT).some((field) => {
      const key = field as keyof RawProductData;
      return (singleProduct[key] || '') !== (INITIAL_SINGLE_PRODUCT[key] || '');
    });
  }, [singleProduct]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      const parsed = await parseProductFile(file);
      
      if (parsed.length > MAX_BULK_ROWS) {
        setProcessedData({
          data: [],
          errors: [
            {
              row: 0,
              column: 'general',
              message: `File vượt quá giới hạn ${MAX_BULK_ROWS} dòng. Vui lòng chia nhỏ và thử lại`,
              severity: 'error',
            },
          ],
          isValid: false,
        });
        return;
      }

      const validation = validateProductData(parsed);

      setProcessedData({
        data: parsed,
        errors: validation.errors,
        isValid: validation.isValid,
      });

      setImportData({
        file,
        data: parsed,
        errors: validation.errors,
        isValid: validation.isValid,
      });

      setShowPreview(true);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error parsing file:', error);
      setSingleError('Không thể đọc file. Vui lòng kiểm tra định dạng file.');
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    if (!canProceedWithImport(processedData.errors)) {
      setSingleError('Vui lòng sửa các lỗi trước khi import');
      return;
    }

    setIsProcessing(true);
    setSingleError(null);

    try {
      const productsToImport = processedData.data.map((raw) =>
        convertToProduct(raw, companyId, branchId, user?.id || '')
      );

      // TODO: Implement actual import to database
      // For now, simulate import
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const importedProducts = productsToImport as Product[];

      setSuccessMessage(`Đã import thành công ${importedProducts.length} sản phẩm`);
      setProcessedData({ data: [], errors: [], isValid: false });
      setShowPreview(false);
      setCurrentStep(1);

      if (onImportComplete) {
        onImportComplete(importedProducts);
      }
    } catch (error) {
      console.error('Error importing products:', error);
      setSingleError('Import thất bại: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle single product creation
  const handleSingleSubmit = async () => {
    setIsCreatingSingle(true);
    setSingleError(null);

    try {
      // Validate single product
      const validation = validateProductData([singleProduct]);
      if (!validation.isValid) {
        setSingleError(validation.errors[0]?.message || 'Dữ liệu không hợp lệ');
        setIsCreatingSingle(false);
        return;
      }

      const product = convertToProduct(singleProduct, companyId, branchId, user?.id || '');

      // TODO: Implement actual creation to database
      // For now, simulate creation
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSuccessMessage('Đã tạo sản phẩm thành công');
      setSingleProduct(INITIAL_SINGLE_PRODUCT);

      if (onImportComplete) {
        onImportComplete([product as Product]);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setSingleError('Tạo sản phẩm thất bại: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreatingSingle(false);
    }
  };

  const summary = getValidationSummary(processedData.errors);

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="mt-2 text-sm text-green-600 hover:text-green-800"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Error message */}
      {singleError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{singleError}</p>
          <button
            onClick={() => setSingleError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Tab selector */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('single')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'single'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Nhập từng sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bulk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Nhập hàng loạt
          </button>
        </nav>
      </div>

      {/* Single product form */}
      {activeTab === 'single' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                value={singleProduct.name}
                onChange={(e) => setSingleProduct({ ...singleProduct, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên sản phẩm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                value={singleProduct.category}
                onChange={(e) => setSingleProduct({ ...singleProduct, category: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn danh mục</option>
                <option value="raw_material">Nguyên vật liệu</option>
                <option value="processed">Sơ chế</option>
                <option value="finished_product">Thành phẩm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã SP
              </label>
              <input
                type="text"
                value={singleProduct.businessCode}
                onChange={(e) => setSingleProduct({ ...singleProduct, businessCode: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mã sản phẩm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã KM
              </label>
              <input
                type="text"
                value={singleProduct.promotionCode}
                onChange={(e) => setSingleProduct({ ...singleProduct, promotionCode: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mã khuyến mãi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Định lượng nhập
              </label>
              <input
                type="number"
                value={singleProduct.inputQuantity}
                onChange={(e) => setSingleProduct({ ...singleProduct, inputQuantity: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập định lượng"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Định lượng xuất
              </label>
              <input
                type="number"
                value={singleProduct.outputQuantity}
                onChange={(e) => setSingleProduct({ ...singleProduct, outputQuantity: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập định lượng"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ĐVT nhập
              </label>
              <input
                type="text"
                value={singleProduct.inputUnit}
                onChange={(e) => setSingleProduct({ ...singleProduct, inputUnit: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Đơn vị"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ĐVT xuất
              </label>
              <input
                type="text"
                value={singleProduct.outputUnit}
                onChange={(e) => setSingleProduct({ ...singleProduct, outputUnit: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Đơn vị"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={singleProduct.notes}
              onChange={(e) => setSingleProduct({ ...singleProduct, notes: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Nhập ghi chú"
            />
          </div>
          <Button
            onClick={handleSingleSubmit}
            disabled={isCreatingSingle || !hasSingleChanges}
            className="w-full"
          >
            {isCreatingSingle ? 'Đang tạo...' : 'Tạo sản phẩm'}
          </Button>
        </div>
      )}

      {/* Bulk import */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          {!showPreview ? (
            <div>
              {/* Drag and drop area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Kéo thả file Excel hoặc CSV vào đây, hoặc{' '}
                  <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                    />
                    click để chọn file
                  </label>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Tối đa {MAX_BULK_ROWS} dòng
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Validation summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Tóm tắt kiểm tra</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tổng dòng:</span>
                    <span className="ml-2 font-medium">{processedData.data.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Lỗi:</span>
                    <span className="ml-2 font-medium text-red-600">{summary.totalErrors}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cảnh báo:</span>
                    <span className="ml-2 font-medium text-yellow-600">{summary.totalWarnings}</span>
                  </div>
                </div>
              </div>

              {/* Errors list */}
              {processedData.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h3 className="font-medium text-red-900 mb-2">Lỗi cần sửa:</h3>
                  <ul className="space-y-1">
                    {processedData.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">
                        {formatErrorMessage(error)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dòng</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã SP</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Định lượng</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ĐVT</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {processedData.data.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{row.businessCode || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{row.category || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {row.inputQuantity || row.outputQuantity || '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {row.inputUnit || row.outputUnit || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    setProcessedData({ data: [], errors: [], isValid: false });
                  }}
                  variant="secondary"
                  disabled={isProcessing}
                >
                    Hủy
                  </Button>
                <Button
                  onClick={handleBulkImport}
                  disabled={!processedData.isValid || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Đang import...' : 'Import dữ liệu'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductBulkImportEnhanced;
