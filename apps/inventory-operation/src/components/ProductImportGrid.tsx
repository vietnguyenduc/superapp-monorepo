import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProductService } from '../services/productService';
import { ProductCategory, ProductStatus, Product } from '../types';
import { useProducts } from '../hooks/useProducts';
import appSettingsService from '../services/appSettingsService';

// Columns strictly following the refined logic
const ALL_COLUMNS = [
  { key: 'isFinishedProduct', label: 'Phân loại', type: 'dropdown', options: ['Thành phẩm', 'Nguyên liệu'], required: true, enabled: true, order: 1 },
  { key: 'productCode', label: 'Mã hàng', type: 'text', required: true, enabled: true, order: 2 },
  { key: 'productName', label: 'Tên hàng', type: 'text', required: true, enabled: true, order: 3 },
  { key: 'inputUnit', label: 'Đơn vị (Gốc/Nhập)', type: 'text', required: true, enabled: true, order: 4 },
  { key: 'intermediateUnit', label: 'ĐVT Sơ chế', type: 'text', required: false, enabled: true, order: 5 },
  { key: 'intermediateRatio', label: 'Định lượng Sơ chế (1 Gốc = ? Sơ chế)', type: 'number', required: false, enabled: true, order: 6 },
  { key: 'linkedFinishedCode', label: 'Mã TP Liên kết', type: 'dropdown', options: [], required: false, enabled: true, order: 7 },
  { key: 'recipeRatio', label: 'Định lượng TP (1 TP = ? Sơ chế)', type: 'number', required: false, enabled: true, order: 8 },
  { key: 'standardInputPrice', label: 'Giá nhập (VNĐ)', type: 'number', required: false, enabled: true, order: 9 },
  { key: 'price', label: 'Giá bán (Chỉ TP)', type: 'number', required: false, enabled: true, order: 10 },
];

// Columns for commercial mode — only finished products, no raw/intermediate
const COMMERCIAL_COLUMNS = [
  { key: 'productCode', label: 'Mã hàng', type: 'text', required: true, enabled: true, order: 1 },
  { key: 'productName', label: 'Tên hàng', type: 'text', required: true, enabled: true, order: 2 },
  { key: 'inputUnit', label: 'Đơn vị', type: 'text', required: true, enabled: true, order: 3 },
  { key: 'standardInputPrice', label: 'Giá nhập (VNĐ)', type: 'number', required: false, enabled: true, order: 4 },
  { key: 'price', label: 'Giá bán', type: 'number', required: false, enabled: true, order: 5 },
];

interface ImportRow {
  id: string;
  isFinishedProduct: string;
  productCode: string;
  productName: string;
  inputUnit: string;
  intermediateUnit: string;
  intermediateRatio: number | string;
  linkedFinishedCode: string;
  recipeRatio: number | string;
  standardInputPrice: number | string;
  price: number | string;
  errors: string[];
}

const ProductImportGrid: React.FC<{ onImportComplete?: () => void; onCancel?: () => void }> = ({ onImportComplete, onCancel }) => {
  const { products } = useProducts();
  const isCommercial = appSettingsService.isCommercial();
  const columns = isCommercial ? COMMERCIAL_COLUMNS : ALL_COLUMNS;

  const finishedProducts = useMemo(() => products.filter(p => p.isFinishedProduct), [products]);

  const finishedProductCodes = useMemo(() => [
    '--- Liên kết ---',
    ...finishedProducts.map(p => p.businessCode)
  ], [finishedProducts]);

  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const emptyRows = Array.from({ length: 20 }, (_, index) => createEmptyRow(index));
    setImportData(emptyRows);
  }, [isCommercial]);

  const createEmptyRow = (index: number): ImportRow => ({
    id: `row-${Date.now()}-${index}`,
    isFinishedProduct: isCommercial ? 'Thành phẩm' : 'Nguyên liệu',
    productCode: '',
    productName: '',
    inputUnit: '',
    intermediateUnit: '',
    intermediateRatio: '',
    linkedFinishedCode: '--- Liên kết ---',
    recipeRatio: '',
    standardInputPrice: '',
    price: '',
    errors: []
  });

  const validateRow = (row: ImportRow): string[] => {
    const errors: string[] = [];
    if (!row.productCode.trim()) errors.push('Thiếu mã hàng');
    if (!row.productName.trim()) errors.push('Thiếu tên hàng');
    if (!row.inputUnit.trim()) errors.push('Thiếu đơn vị gốc');
    
    if (row.isFinishedProduct === 'Nguyên liệu') {
      if (row.intermediateUnit && !row.intermediateRatio) {
        errors.push('Thiếu định lượng sơ chế');
      }
      if (row.linkedFinishedCode !== '--- Liên kết ---' && !row.recipeRatio) {
        errors.push('Thiếu định lượng thành phẩm');
      }
    }
    return errors;
  };

  const handleCellChange = (rowIndex: number, columnKey: string, value: any) => {
    const newData = [...importData];
    newData[rowIndex] = { ...newData[rowIndex], [columnKey]: value };
    newData[rowIndex].errors = validateRow(newData[rowIndex]);
    setImportData(newData);
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const clipboardData = event.clipboardData.getData('text');
    if (!clipboardData) return;

    const rows = clipboardData.split('\n').filter(row => row.trim());
    const newData = [...importData];
    
    rows.forEach((rowText, index) => {
      if (!newData[index]) return;
      const cells = rowText.split('\t');
      newData[index] = {
        ...newData[index],
        isFinishedProduct: cells[0] || 'Nguyên liệu',
        productCode: cells[1] || '',
        productName: cells[2] || '',
        inputUnit: cells[3] || '',
        intermediateUnit: cells[4] || '',
        intermediateRatio: cells[5] || '',
        linkedFinishedCode: cells[6] || '--- Liên kết ---',
        recipeRatio: cells[7] || '',
        standardInputPrice: cells[8] || '',
        price: cells[9] || '',
      };
      newData[index].errors = validateRow(newData[index]);
    });
    setImportData(newData);
  };

  const handleSave = async () => {
    const validRows = importData.filter(row => row.productCode.trim() && row.errors.length === 0);
    if (validRows.length === 0) {
      alert('Không có dữ liệu hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      const productsToInsert = validRows.map(row => {
        const isTP = isCommercial ? true : row.isFinishedProduct === 'Thành phẩm';
        const intermediateUnits = row.intermediateUnit ? [row.intermediateUnit] : [];
        const conversions = [];
        const linkedCodes = row.linkedFinishedCode !== '--- Liên kết ---' ? [row.linkedFinishedCode] : [];

        // 1. Intermediate Conversion
        if (row.intermediateUnit && row.intermediateRatio) {
          conversions.push({
            fromUnit: row.inputUnit,
            toUnit: row.intermediateUnit,
            conversionRate: parseFloat(row.intermediateRatio.toString()),
            description: `1 ${row.inputUnit} = ${row.intermediateRatio} ${row.intermediateUnit}`
          });
        }

        // 2. Recipe Conversion
        if (!isTP && row.linkedFinishedCode !== '--- Liên kết ---') {
          const targetTP = finishedProducts.find(p => p.businessCode === row.linkedFinishedCode);
          if (targetTP) {
            conversions.push({
              fromUnit: row.intermediateUnit || row.inputUnit,
              toUnit: targetTP.outputUnit || targetTP.inputUnit, // Use target unit
              conversionRate: 1 / parseFloat(row.recipeRatio.toString()),
              targetProductCode: row.linkedFinishedCode,
              description: `1 ${targetTP.inputUnit} = ${row.recipeRatio} ${row.intermediateUnit || row.inputUnit}`
            });
          }
        }

        return {
          businessCode: row.productCode,
          name: row.productName,
          category: isTP ? ProductCategory.FINISHED : ProductCategory.FRUIT,
          isFinishedProduct: isTP,
          inputUnit: row.inputUnit,
          outputUnit: isTP ? row.inputUnit : '', // For TP, input is output
          intermediateUnits: intermediateUnits,
          linkedFinishedProductCodes: linkedCodes,
          conversions: conversions,
          standardInputPrice: parseFloat(row.standardInputPrice.toString()) || 0,
          price: isTP ? (parseFloat(row.price.toString()) || 0) : 0,
          status: ProductStatus.ACTIVE,
          businessStatus: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const result = await ProductService.bulkInsertProducts(productsToInsert as any);
      if (result.error) alert(`Lỗi: ${result.error}`);
      else {
        alert(`Đã lưu ${validRows.length} sản phẩm!`);
        if (onImportComplete) onImportComplete();
      }
    } catch (e) {
      alert('Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Refined Legend */}
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 dark:from-black dark:to-blue-950 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
          <div className="space-y-4">
            <h3 className="text-2xl font-black tracking-tight dark:text-blue-100">
              {isCommercial ? 'Nhập Danh mục Thương mại' : 'Quy chuẩn Nhập liệu Đa tầng'}
            </h3>
            <p className="text-blue-200/70 text-sm font-medium max-w-md dark:text-blue-300/60">
              {isCommercial
                ? 'Chế độ Thương mại: chỉ nhập sản phẩm thành phẩm để bán. Không có nguyên liệu hay quy đổi.'
                : 'Bảng này đã lược bỏ các trường thừa, tập trung vào định lượng vật lý và định lượng thành phẩm.'}
            </p>
          </div>
          {!isCommercial && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 dark:bg-white/10 p-4 rounded-2xl border border-white/10 dark:border-white/20">
                <div className="text-[10px] font-black text-blue-400 uppercase mb-2">Mẹo NVL</div>
                <p className="text-xs font-bold leading-relaxed">Chọn mã Thành phẩm & nhập định lượng (1 TP = ? Sơ chế)</p>
              </div>
              <div className="bg-white/5 dark:bg-white/10 p-4 rounded-2xl border border-white/10 dark:border-white/20">
                <div className="text-[10px] font-black text-emerald-400 uppercase mb-2">Mẹo TP</div>
                <p className="text-xs font-bold leading-relaxed">Đơn vị gốc chính là ĐVT Xuất dùng để bán.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl shadow-blue-100/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto" onPaste={handlePaste}>
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 border-collapse">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-6 text-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest w-12">#</th>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-6 text-left text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest min-w-[160px]">
                    {col.label} {col.required && <span className="text-red-500">*</span>}
                  </th>
                ))}
                <th className="px-4 py-6 text-center text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest w-20">Lỗi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {importData.map((row, rowIndex) => (
                <tr key={row.id} className={`hover:bg-blue-50/20 dark:hover:bg-blue-900/20 transition-all group ${row.errors.length > 0 ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}>
                  <td className="px-3 py-3 text-center text-[10px] font-black text-gray-300 dark:text-gray-600 group-hover:text-blue-400">
                    {rowIndex + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="px-2 py-2">
                      {col.key === 'isFinishedProduct' ? (
                        <select
                          value={row.isFinishedProduct}
                          onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                          className="w-full px-3 py-2 bg-transparent border-0 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm font-black text-gray-900 dark:text-gray-100 dark:bg-gray-900"
                        >
                          <option value="Thành phẩm">Thành phẩm</option>
                          <option value="Nguyên liệu">Nguyên liệu</option>
                        </select>
                      ) : col.key === 'linkedFinishedCode' ? (
                        <select
                          value={row.linkedFinishedCode}
                          disabled={row.isFinishedProduct === 'Thành phẩm'}
                          onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                          className={`w-full px-3 py-2 bg-transparent border-0 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm font-black ${row.isFinishedProduct === 'Thành phẩm' ? 'text-gray-200 dark:text-gray-700' : 'text-blue-600 dark:text-blue-400'} dark:bg-gray-900`}
                        >
                          {finishedProductCodes.map(code => <option key={code} value={code}>{code}</option>)}
                        </select>
                      ) : (
                        <input
                          type={col.type === 'number' ? 'text' : 'text'}
                          value={row[col.key as keyof ImportRow] as string}
                          disabled={col.key === 'price' && row.isFinishedProduct === 'Nguyên liệu'}
                          onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                          className={`w-full px-4 py-2 bg-transparent border-0 border-b-2 border-transparent focus:border-blue-500 focus:ring-0 text-sm font-bold ${col.key === 'price' && row.isFinishedProduct === 'Nguyên liệu' ? 'text-gray-200 dark:text-gray-700' : 'text-gray-800 dark:text-gray-200'} dark:placeholder:text-gray-700`}
                          placeholder="..."
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    {row.errors.length > 0 ? (
                      <div className="group relative cursor-help">
                        <span className="text-red-500 text-lg">⚠️</span>
                        <div className="absolute bottom-full right-0 mb-3 w-64 bg-black text-white dark:bg-gray-800 dark:text-gray-100 text-[10px] p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-left shadow-2xl">
                          <p className="font-black text-red-400 mb-1">Dữ liệu chưa chuẩn:</p>
                          {row.errors.map((e, i) => <div key={i} className="flex gap-2"><span>•</span> {e}</div>)}
                        </div>
                      </div>
                    ) : row.productCode ? (
                      <span className="text-emerald-500 dark:text-emerald-400 font-black text-xs">✓ OK</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between p-10 bg-white dark:bg-gray-900 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-blue-50 dark:shadow-none transition-colors duration-300">
        <div className="flex gap-12">
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Dòng hợp lệ</span>
            <span className="text-4xl font-black text-blue-600 dark:text-blue-400">{importData.filter(r => r.productCode && r.errors.length === 0).length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Thành phẩm</span>
            <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{finishedProducts.length}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onCancel} className="px-12 py-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-3xl font-black text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Bỏ qua</button>
          <button
            onClick={handleSave}
            disabled={isLoading || importData.filter(r => r.productCode && r.errors.length === 0).length === 0}
            className="px-16 py-5 bg-blue-600 dark:bg-blue-700 text-white rounded-3xl font-black text-sm hover:shadow-2xl hover:shadow-blue-200 dark:hover:shadow-blue-900 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
          >
            {isLoading ? 'Đang hạch toán...' : '🚀 XÁC NHẬN LƯU BẢNG'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductImportGrid;
