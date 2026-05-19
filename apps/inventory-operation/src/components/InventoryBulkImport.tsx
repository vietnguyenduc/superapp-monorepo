import React, { useState, useMemo } from 'react';
import { excelImportService } from '../services/excelImportService';
import { inventoryService } from '../services/inventoryService';
import appSettingsService from '../services/appSettingsService';
import { useProducts } from '../hooks/useProducts';
import { InventoryRecord } from '../types';

interface InventoryBulkImportProps {
  onImportComplete?: () => void;
  onCancel?: () => void;
  type?: 'warehouse_keeper' | 'warehouse_accountant';
}

const MAX_BULK_ROWS = 1000;

const InventoryBulkImport: React.FC<InventoryBulkImportProps> = ({ onImportComplete, onCancel, type }) => {
  const [importData, setImportData] = useState<{
    file: File | null;
    data: any[];
    errors: string[];
    isValid: boolean;
  }>({
    file: null,
    data: [],
    errors: [],
    isValid: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [dragActive, setDragActive] = useState(false);
  const [globalSupplier, setGlobalSupplier] = useState('');
  const [globalInvoice, setGlobalInvoice] = useState<File | null>(null);
  
  const { products } = useProducts();

  const isKeeper = type === 'warehouse_keeper';
  const isAccountant = type === 'warehouse_accountant';

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await excelImportService.importInventoryRecords(file);
      
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
        data: result.data,
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

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    try {
      const config = appSettingsService.getSettings().priceVarianceConfig;
      
      const recordsToInsert = importData.data.map(row => {
        let approvalStatus = undefined;
        let priceVariancePercentage = undefined;
        
        if (isAccountant && row.unitPrice !== undefined) {
          const product = products.find(p => p.businessCode === row.productCode);
          if (product && product.standardInputPrice) {
            const standard = product.standardInputPrice;
            const actual = row.unitPrice;
            const variance = ((actual - standard) / standard) * 100;
            priceVariancePercentage = variance;
            
            if (config) {
              if (Math.abs(variance) > config.tolerancePercentage) {
                approvalStatus = 'pending';
              } else {
                approvalStatus = 'approved';
              }
            }
          }
        }
        
        return {
          ...row,
          source: type || 'bulk_import',
          createdAt: new Date(),
          updatedAt: new Date(),
          totalAmount: row.totalAmount || (row.unitPrice * row.inputQuantity) || 0,
          supplier: globalSupplier || row.supplier, // Override with global if provided
          approvalStatus,
          priceVariancePercentage
        };
      });

      const result = await inventoryService.importInventoryRecords(recordsToInsert);
      
      if (result.error) {
        alert(`Lỗi: ${result.error}`);
      } else {
        setCurrentStep(3);
        setTimeout(() => {
          if (onImportComplete) onImportComplete();
        }, 2000);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi nhập dữ liệu');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setImportData({ file: null, data: [], errors: [], isValid: false });
    setCurrentStep(1);
  };

  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center shrink-0">📊</div>
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <p className="font-black text-base mb-2">Hướng dẫn Import theo Logic mới:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-medium">
                <div className="space-y-2">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">🏗️ Cho Thủ kho (Kiểm tồn):</p>
                  <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Cột <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1 rounded text-emerald-800 dark:text-emerald-300">Tồn Nguyên liệu (Gốc)</code></li>
                    <li>Cột <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1 rounded text-emerald-800 dark:text-emerald-300">Tồn Sơ chế (Trung gian)</code></li>
                    <li>Cột <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1 rounded text-emerald-800 dark:text-emerald-300">Tồn Thành phẩm (Món)</code></li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-blue-700 dark:text-blue-400">💰 Cho Kế toán (Hạch toán):</p>
                  <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Cột <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded text-blue-800 dark:text-blue-300">Nhà cung cấp</code></li>
                    <li>Cột <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded text-blue-800 dark:text-blue-300">Đơn giá nhập</code></li>
                    <li>Cột <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded text-blue-800 dark:text-blue-300">Thành tiền</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => excelImportService.generateTemplate('inventory')}
            className="group relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white rounded-2xl font-black text-sm hover:shadow-lg hover:shadow-emerald-200 dark:hover:shadow-emerald-900 transition-all active:scale-95"
          >
            <span>📥 Tải file Excel mẫu chuẩn (3 tầng đơn vị)</span>
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">↓</div>
          </button>
        </div>

        <div
          className={`group border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 scale-[1.02]' 
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-gray-800/20 hover:bg-white dark:hover:bg-gray-800/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
        >
          <input 
            type="file" 
            id="inv-bulk-upload" 
            className="hidden" 
            accept=".xlsx,.xls,.csv" 
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
          />
          <label htmlFor="inv-bulk-upload" className="cursor-pointer block">
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
                📄
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
                  {isProcessing ? 'Đang đọc dữ liệu...' : 'Thả file Excel của bạn vào đây'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-bold uppercase tracking-widest">
                  Hoặc click để chọn file từ thiết bị
                </p>
              </div>
            </div>
          </label>
        </div>

        {importData.errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-2xl p-6 transition-colors">
            <h4 className="font-black text-red-600 dark:text-red-400 mb-4 flex items-center gap-2 text-lg">
              <span>⚠️</span> Có lỗi trong file Excel:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {importData.errors.map((e, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-800/50 text-sm font-bold text-red-500 dark:text-red-400 shadow-sm">
                  <span className="w-5 h-5 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center text-[10px]">!</span>
                  {e}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm transition-colors">
            <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Tổng sản phẩm</div>
            <div className="text-3xl font-black text-gray-900 dark:text-gray-100">{importData.data.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm transition-colors">
            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Kiểm kê 3 tầng</div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">Sẵn sàng</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm transition-colors">
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Hạch toán KT</div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-500">OK</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm transition-colors">
            <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Người nhập</div>
            <div className="text-xl font-black text-orange-600 dark:text-orange-500 truncate">{isKeeper ? 'THỦ KHO' : 'KẾ TOÁN'}</div>
          </div>
        </div>

        {isAccountant && (
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-6 transition-colors">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
              <span>🧾</span> Thông tin chứng từ chung cho lô hàng (Tùy chọn)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2">
                  Nhà cung cấp chung
                </label>
                <input
                  type="text"
                  value={globalSupplier}
                  onChange={(e) => setGlobalSupplier(e.target.value)}
                  placeholder="Áp dụng cho toàn bộ danh sách..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2">
                  Ảnh Hóa đơn / Chứng từ
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setGlobalInvoice(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                />
              </div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-3 font-medium">
              * Nếu điền Nhà cung cấp chung, hệ thống sẽ ưu tiên sử dụng tên này thay cho dữ liệu trong file Excel.
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-100/50 dark:shadow-none overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sản phẩm</th>
                  
                  {isAccountant && (
                    <>
                      <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nhà cung cấp</th>
                      <th className="px-6 py-4 text-right text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Đơn giá / Thành tiền</th>
                    </>
                  )}

                  <th className="px-6 py-4 text-center text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nguyên liệu (Gốc)</th>
                  <th className="px-6 py-4 text-center text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sơ chế (Trung gian)</th>
                  <th className="px-6 py-4 text-center text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Thành phẩm (Món)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {importData.data.slice(0, 15).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-0.5">{row.productName}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-black tracking-widest uppercase">{row.productCode}</div>
                    </td>

                    {isAccountant && (
                      <>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-gray-600 dark:text-gray-400">{row.supplier || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs font-black text-blue-700 dark:text-blue-400">{(row.unitPrice || 0).toLocaleString()}đ</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Total: {(row.totalAmount || 0).toLocaleString()}đ</div>
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-black text-gray-900 dark:text-gray-100">
                        {row.rawMaterialStock || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm font-black text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                        {row.processedStock || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm font-black text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-800/50">
                        {row.finishedProductStock || 0}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {importData.data.length > 15 && (
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 text-center border-t border-gray-50 dark:border-gray-800">
              <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">... và {importData.data.length - 15} sản phẩm khác</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleReset}
            className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            ← Quay lại tải file
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sẵn sàng nhập</div>
              <div className="text-xs font-bold text-gray-900 dark:text-gray-100">Kiểm tra dữ liệu hoàn tất</div>
            </div>
            <button
              onClick={handleConfirmImport}
              disabled={isProcessing}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 text-white rounded-2xl font-black text-sm hover:shadow-xl hover:shadow-blue-200 dark:hover:shadow-blue-900 transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? 'Đang xử lý...' : `🚀 Xác nhận Nhập ${importData.data.length} Giao dịch`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
        <div className="w-24 h-24 mx-auto bg-green-50 dark:bg-green-900/20 rounded-[40px] flex items-center justify-center text-5xl mb-8 animate-bounce">
          ✨
        </div>
        <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tight">Hệ thống đã cập nhật!</h3>
        <p className="text-gray-500 dark:text-gray-400 font-bold mb-10 max-w-md mx-auto">Toàn bộ {importData.data.length} dòng dữ liệu đã được xử lý và phân bổ theo tầng đơn vị chuẩn xác.</p>
        <button 
          onClick={handleReset} 
          className="px-10 py-4 bg-gray-900 dark:bg-gray-800 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-black dark:hover:bg-gray-700 transition-all active:scale-95"
        >
          Nhập thêm file khác
        </button>
      </div>
    );
  }

  return null;
};

export default InventoryBulkImport;
