import React, { useState } from 'react';
import { excelImportService } from '../services/excelImportService';
import { ProductService } from '../services/productService';
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
  standardInputPrice?: number;
  status?: string;
  notes?: string;
}

interface ImportData {
  file: File | null;
  data: RawProductData[];
  errors: string[];
  isValid: boolean;
}

interface ImportResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: string[];
}

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
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [duplicateCodes, setDuplicateCodes] = useState<{ code: string; rows: number[] }[]>([]);
  const [importProgress, setImportProgress] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setValidationWarnings([]);
    setDuplicateCodes([]);
    try {
      const result = await excelImportService.importProducts(file);

      // Check for duplicate business_code within the file
      const codeToRows = new Map<string, number[]>();
      (result.data as any[]).forEach((row, idx) => {
        const code = row.businessCode?.trim();
        if (code) {
          const existing = codeToRows.get(code) || [];
          existing.push(idx + 2); // Excel row number (header = row 1)
          codeToRows.set(code, existing);
        }
      });
      const dupes = Array.from(codeToRows.entries())
        .filter(([, rows]) => rows.length > 1)
        .map(([code, rows]) => ({ code, rows }));
      setDuplicateCodes(dupes);

      if (dupes.length > 0) {
        const dupeWarnings = dupes.map(d =>
          `Mã "${d.code}" xuất hiện ${d.rows.length} lần (dòng ${d.rows.join(', ')}). Sẽ chỉ giữ lại dòng cuối.`
        );
        setValidationWarnings(dupeWarnings);
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
    setImportResult(null);
    setImportProgress(`Đang chuẩn bị nhập ${importData.data.length} sản phẩm...`);
    try {
      const productsToInsert = importData.data.map(row => ({
        businessCode: row.businessCode || '',
        name: row.name,
        category: isCommercial ? ProductCategory.FINISHED : mapCategory(row.category),
        inputUnit: row.inputUnit,
        outputUnit: isCommercial ? row.inputUnit : (row.outputUnit || row.inputUnit),
        intermediateUnits: isCommercial ? [] : (row.intermediateUnits || []),
        conversionRatioRawToProcessed: isCommercial ? 0 : (row.conversionRatioRawToProcessed || 0),
        conversionRatioProcessedToFinished: isCommercial ? 0 : (row.conversionRatioProcessedToFinished || 0),
        standardInputPrice: row.standardInputPrice || 0,
        status: row.status === 'INACTIVE' ? ProductStatus.INACTIVE : ProductStatus.ACTIVE,
        businessStatus: (row.status === 'INACTIVE' ? 'inactive' : 'active') as 'active' | 'inactive',
        createdBy: 'system',
        updatedBy: 'system',
        updatedAt: new Date(),
        createdAt: new Date(),
        isFinishedProduct: isCommercial ? true : !!row.outputUnit,
        inputQuantity: 1,
        outputQuantity: 1,
      }));

      const result = await ProductService.bulkInsertProducts(productsToInsert as any[]);

      setImportProgress(null);

      if (result.error) {
        // Parse common Postgres errors into user-friendly messages
        let friendlyError = result.error;
        if (result.error.includes('ON CONFLICT DO UPDATE command cannot affect row a second time')) {
          friendlyError = 'File có nhiều dòng trùng mã sản phẩm. Hãy kiểm tra lại file Excel và xóa các dòng trùng.';
        } else if (result.error.includes('duplicate key value violates unique constraint')) {
          friendlyError = 'Mã sản phẩm đã tồn tại trong hệ thống. Hãy dùng mã khác hoặc xóa sản phẩm cũ trước.';
        } else if (result.error.includes('violates foreign key constraint')) {
          friendlyError = 'Dữ liệu tham chiếu không hợp lệ (có thể company_id hoặc branch_id không tồn tại).';
        } else if (result.error.includes('invalid input syntax')) {
          friendlyError = 'Định dạng dữ liệu không hợp lệ ở một hoặc nhiều dòng. Hãy kiểm tra lại kiểu số, ngày tháng.';
        } else if (result.error.includes('value too long')) {
          friendlyError = 'Một trường dữ liệu quá dài. Hãy rút ngắn nội dung và thử lại.';
        } else if (result.error.includes('network') || result.error.includes('Failed to fetch')) {
          friendlyError = 'Mất kết nối tới máy chủ. Hãy kiểm tra internet và thử lại.';
        }

        setImportResult({
          success: false,
          inserted: 0,
          updated: 0,
          errors: [friendlyError],
        });
      } else {
        const savedCount = result.data?.length || 0;
        const hasDupes = duplicateCodes.length > 0;
        const msg = hasDupes
          ? `Đã nhập thành công ${savedCount} sản phẩm (đã tự động gộp ${duplicateCodes.length} mã trùng trong file).`
          : `Đã nhập thành công ${savedCount} sản phẩm!`;

        setSuccessMessage(msg);
        setImportResult({
          success: true,
          inserted: savedCount,
          updated: 0,
          errors: [],
        });
        setCurrentStep(3);

        setTimeout(() => {
          if (onImportComplete) {
            onImportComplete();
          }
        }, 2000);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      setImportResult({
        success: false,
        inserted: 0,
        updated: 0,
        errors: [`Có lỗi xảy ra khi nhập dữ liệu: ${errMsg}`],
      });
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
    setImportResult(null);
    setValidationWarnings([]);
    setDuplicateCodes([]);
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
                    <li>Chỉ bắt buộc: <b>Tên sản phẩm</b> và <b>Đơn vị</b>. Các trường khác (Mã, Giá, Trạng thái) tùy chọn.</li>
                    <li>Trạng thái để trống → tự động <b>Đang active</b>. Muốn tắt thì sửa thủ công sau.</li>
                    <li>Không cần ĐVT trung gian hay tỷ lệ quy đổi.</li>
                    <li>Hỗ trợ nhập số lượng lớn (tự động chia nhỏ batch khi ghi vào DB).</li>
                  </>
                ) : (
                  <>
                    <li>Chỉ bắt buộc: <b>Tên sản phẩm</b> và <b>Đơn vị nhập</b>. Các trường khác (Mã, Đơn vị xuất, Danh mục...) tùy chọn.</li>
                    <li>Để trống Đơn vị xuất → tự động lấy theo Đơn vị nhập.</li>
                    <li>Trạng thái để trống → tự động <b>Đang active</b>. Muốn tắt thì sửa thủ công sau.</li>
                    <li>ĐVT Trung gian nhập cách nhau bằng dấu phẩy (VD: Miếng, Gram).</li>
                    <li>Tỷ lệ quy đổi: `1 Đơn vị Nhập` = `X Đơn vị Trung gian`.</li>
                    <li>Hỗ trợ nhập số lượng lớn (tự động chia nhỏ batch khi ghi vào DB).</li>
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
            <h4 className="font-bold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2"><span>⚠️</span> Phát hiện lỗi dữ liệu ({importData.errors.length}):</h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2 font-medium max-h-60 overflow-y-auto">
              {importData.errors.map((error, idx) => <li key={idx}>{error}</li>)}
            </ul>
          </div>
        )}

        {validationWarnings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5">
            <h4 className="font-bold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2"><span>⚠️</span> Cảnh báo — mã trùng trong file ({validationWarnings.length}):</h4>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-2 font-medium max-h-60 overflow-y-auto">
              {validationWarnings.map((warning, idx) => <li key={idx}>{warning}</li>)}
            </ul>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-3 font-medium">
              Hệ thống sẽ tự động gộp các dòng trùng mã — chỉ giữ lại dòng cuối cùng. Bạn có thể tiếp tục hoặc sửa file và tải lại.
            </p>
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
                <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">Giá nhập</th>
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
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{row.inputUnit}{!isCommercial && row.outputUnit && ` → ${row.outputUnit}`}</div>
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
                  <td className="px-4 py-3 text-center font-black text-gray-900 dark:text-gray-100 text-sm">{row.standardInputPrice ? Number(row.standardInputPrice).toLocaleString('vi-VN') : '-'}</td>
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

        {validationWarnings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
            <h4 className="font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2 text-sm">
              <span>⚠️</span> {validationWarnings.length} mã sản phẩm trùng trong file — sẽ tự động gộp
            </h4>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 font-medium max-h-40 overflow-y-auto">
              {validationWarnings.slice(0, 5).map((w, idx) => <li key={idx}>{w}</li>)}
              {validationWarnings.length > 5 && <li className="italic">... và {validationWarnings.length - 5} cảnh báo khác</li>}
            </ul>
          </div>
        )}

        {importResult && !importResult.success && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-2xl p-5">
            <h4 className="font-bold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2">
              <span>❌</span> Không thể nhập dữ liệu — {importResult.errors.length} lỗi:
            </h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2 font-medium">
              {importResult.errors.map((error, idx) => <li key={idx}>{error}</li>)}
            </ul>
            <p className="text-xs text-red-600 dark:text-red-500 mt-3 font-medium">
              Vui lòng sửa file Excel và tải lại, hoặc liên hệ hỗ trợ nếu lỗi vẫn tiếp tục.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <button onClick={handleReset} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">← Quay lại tải file</button>
          <button onClick={handleConfirmImport} disabled={isProcessing} className="px-8 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-xl font-black text-sm hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none disabled:bg-gray-300 dark:disabled:bg-gray-800 transition-all">
            {isProcessing ? (importProgress || 'Đang xử lý...') : `Xác nhận Nhập ${importData.data.length} Sản phẩm`}
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
