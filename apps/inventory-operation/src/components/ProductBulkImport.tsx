import React, { useState } from 'react';
import { excelImportService } from '../services/excelImportService';
import { databaseService } from '../services/databaseService';
import { ProductCategory, ProductStatus, Product } from '../types';
import appSettingsService from '../services/appSettingsService';

interface RawProductData {
  businessCode: string;
  name: string;
  category: string;
  inputUnit: string;
  outputUnit: string;
  intermediateUnits?: string[];
  conversionRatioRawToProcessed?: number;
  conversionRatioProcessedToFinished?: number;
  status?: string;
  notes?: string;
}

interface ImportData {
  file: File | null;
  data: RawProductData[];
  errors: string[];
  isValid: boolean;
}

const MAX_BULK_ROWS = 500;

interface ProductBulkImportProps {
  onImportComplete?: () => void;
  onCancel?: () => void;
}

const ProductBulkImport: React.FC<ProductBulkImportProps> = ({ onImportComplete, onCancel }) => {
  const isCommercial = appSettingsService.isCommercial();
  const [importData, setImportData] = useState<ImportData>({
    file: null,
    data: [],
    errors: [],
    isValid: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await excelImportService.importProducts(file);
      
      if (result.data.length > MAX_BULK_ROWS) {
        setImportData({
          file,
          data: [],
          errors: [`File vượt quá giới hạn ${MAX_BULK_ROWS} dòng.`],
          isValid: false,
        });
        return;
      }
      
      setImportData({
        file,
        data: result.data as any[],
        errors: result.errors,
        isValid: result.success && result.errors.length === 0,
      });
      
      if (result.success) {
        setCurrentStep(2);
      }
    } catch (error) {
      setImportData({
        file: null,
        data: [],
        errors: ['Không thể đọc file. Vui lòng kiểm tra định dạng file.'],
        isValid: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const mapCategory = (category: string): ProductCategory => {
    const categoryMap: Record<string, ProductCategory> = {
      'RAW': ProductCategory.RAW,
      'PROCESSED': ProductCategory.PROCESSED,
      'FINISHED': ProductCategory.FINISHED,
      'DRY_GOODS': ProductCategory.DRY_GOODS,
      'BEVERAGE': ProductCategory.BEVERAGE,
      'OTHER': ProductCategory.OTHER,
      'Nguyên liệu': ProductCategory.DRY_GOODS,
      'Đồ uống': ProductCategory.BEVERAGE,
      'Thức ăn': ProductCategory.PROCESSED
    };
    return categoryMap[category] || ProductCategory.OTHER;
  };

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    try {
      const productsToInsert = importData.data.map(row => ({
        businessCode: row.businessCode,
        name: row.name,
        category: isCommercial ? ProductCategory.FINISHED : mapCategory(row.category),
        inputUnit: row.inputUnit,
        outputUnit: isCommercial ? row.inputUnit : row.outputUnit,
        intermediateUnits: isCommercial ? [] : (row.intermediateUnits || []),
        conversionRatioRawToProcessed: isCommercial ? 0 : (row.conversionRatioRawToProcessed || 0),
        conversionRatioProcessedToFinished: isCommercial ? 0 : (row.conversionRatioProcessedToFinished || 0),
        status: row.status === 'ACTIVE' ? ProductStatus.ACTIVE : ProductStatus.INACTIVE,
        businessStatus: (row.status === 'ACTIVE' ? 'active' : 'inactive') as 'active' | 'inactive',
        createdBy: 'system',
        updatedBy: 'system',
        updatedAt: new Date(),
        createdAt: new Date(),
        isFinishedProduct: isCommercial ? true : !!row.outputUnit,
        inputQuantity: 1,
        outputQuantity: 1,
      }));

      const result = await databaseService.bulkInsertProducts(productsToInsert as any[]);
      
      if (result.error) {
        alert(`Lỗi: ${result.error}`);
      } else {
        setSuccessMessage(`Đã nhập thành công ${productsToInsert.length} sản phẩm!`);
        setCurrentStep(3);
        
        setTimeout(() => {
          if (onImportComplete) {
            onImportComplete();
          }
        }, 2000);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi nhập dữ liệu');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setImportData({
      file: null,
      data: [],
      errors: [],
      isValid: false,
    });
    setCurrentStep(1);
    setSuccessMessage(null);
  };

  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <span className="text-2xl">📋</span>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-bold text-base mb-2">
                {isCommercial ? 'Hướng dẫn nhập danh mục (Thương mại):' : 'Hướng dẫn nhập danh mục (Mới):'}
              </p>
              <ul className="list-disc list-inside space-y-1 font-medium opacity-80">
                {isCommercial ? (
                  <>
                    <li>Chế độ Thương mại: chỉ nhập sản phẩm thành phẩm (Mã, Tên, Đơn vị, Giá bán).</li>
                    <li>Không cần ĐVT trung gian hay tỷ lệ quy đổi.</li>
                    <li>Tối đa {MAX_BULK_ROWS} dòng mỗi lần nhập.</li>
                  </>
                ) : (
                  <>
                    <li>Tải file mẫu để biết các cột ĐVT Trung gian và Tỷ lệ quy đổi.</li>
                    <li>ĐVT Trung gian nhập cách nhau bằng dấu phẩy (VD: Miếng, Gram).</li>
                    <li>Tỷ lệ quy đổi: `1 Đơn vị Nhập` = `X Đơn vị Trung gian`.</li>
                    <li>Tối đa {MAX_BULK_ROWS} dòng mỗi lần nhập.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => excelImportService.generateTemplate('products', isCommercial)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 dark:bg-emerald-700 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải file mẫu Chuẩn (.xlsx)
          </button>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50/30 dark:bg-gray-800/20'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleInputChange}
            disabled={isProcessing}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-3xl">📁</div>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-gray-100">{isProcessing ? 'Đang phân tích dữ liệu...' : 'Thả file Excel tại đây'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">hoặc click để duyệt file từ máy tính</p>
              </div>
            </div>
          </label>
        </div>

        {importData.errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-2xl p-5">
            <h4 className="font-bold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2"><span>⚠️</span> Phát hiện lỗi dữ liệu:</h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2 font-medium">
              {importData.errors.map((error, idx) => <li key={idx}>{error}</li>)}
            </ul>
          </div>
        )}

        {onCancel && <button onClick={onCancel} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Hủy bỏ</button>}
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-1 flex items-center transition-colors">
          <div className="flex-1 p-4 border-r border-gray-50 dark:border-gray-800">
            <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1">Tổng số sản phẩm</div>
            <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{importData.data.length}</div>
          </div>
          <div className="flex-1 p-4 border-r border-gray-50 dark:border-gray-800">
            <div className="text-[10px] font-black text-green-400 uppercase mb-1">Trạng thái Hợp lệ</div>
            <div className="text-2xl font-black text-green-600 dark:text-green-500">Sẵn sàng</div>
          </div>
          <div className="flex-1 p-4">
            <div className="text-[10px] font-black text-blue-400 uppercase mb-1">Đã cấu trúc lại</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-500">Thành công</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden overflow-x-auto transition-colors">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">Mã / Tên</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">Loại / ĐVT</th>
                {!isCommercial && <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">Trung gian</th>}
                {!isCommercial && <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">Tỷ lệ sơ chế</th>}
                {!isCommercial && <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">Định mức TP</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {importData.data.slice(0, 10).map((row, index) => (
                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{row.name}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{row.businessCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{row.category}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{row.inputUnit}{!isCommercial && ` → ${row.outputUnit}`}</div>
                  </td>
                  {!isCommercial && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.intermediateUnits?.map(u => (
                          <span key={u} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                            {u}
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                  {!isCommercial && <td className="px-4 py-3 text-center font-black text-gray-900 dark:text-gray-100 text-sm">{row.conversionRatioRawToProcessed}</td>}
                  {!isCommercial && <td className="px-4 py-3 text-center font-black text-gray-900 dark:text-gray-100 text-sm">{row.conversionRatioProcessedToFinished}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          {importData.data.length > 10 && (
            <div className="p-4 text-center bg-gray-50/30 dark:bg-gray-800/30 border-t border-gray-50 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium italic">... và {importData.data.length - 10} sản phẩm khác</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button onClick={handleReset} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">← Quay lại tải file</button>
          <button onClick={handleConfirmImport} disabled={isProcessing} className="px-8 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-xl font-black text-sm hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none disabled:bg-gray-300 dark:disabled:bg-gray-800 transition-all">
            {isProcessing ? 'Đang xử lý...' : `Xác nhận Nhập ${importData.data.length} Sản phẩm`}
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-3xl">✅</div>
        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">Nhập thành công!</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">{successMessage}</p>
        <button onClick={handleReset} className="px-8 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-100 dark:shadow-none hover:bg-blue-700 dark:hover:bg-blue-600 transition-all active:scale-95">Nhập thêm file khác</button>
      </div>
    );
  }

  return null;
};

export default ProductBulkImport;
