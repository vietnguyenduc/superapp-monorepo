import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import settings from localStorage or default config - Updated to match ProductCatalog
const DEFAULT_COLUMNS = [
  { key: 'productCode', label: 'Mã hàng', type: 'text', required: true, enabled: true, order: 1 },
  { key: 'productName', label: 'Tên hàng', type: 'text', required: true, enabled: true, order: 2 },
  { key: 'unit', label: 'Đơn vị', type: 'dropdown', options: ['Cái', 'Ly', 'Gói', 'Hộp', 'Chai', 'Kg', 'Gram', 'Lít', 'Phần', 'Ổ', 'Set'], required: true, enabled: true, order: 3 },
  { key: 'price', label: 'Giá bán (VNĐ)', type: 'number', required: true, enabled: true, order: 4 },
  { key: 'category', label: 'Loại sản phẩm', type: 'dropdown', options: ['Nguyên liệu', 'Đồ uống', 'Thức ăn', 'Cà phê', 'Trà sữa', 'Nước ép', 'Smoothie', 'Bánh ngọt', 'Bánh mì', 'Combo', 'Snack', 'Khác'], required: true, enabled: true, order: 5 },
  { key: 'notes', label: 'Ghi chú', type: 'text', required: false, enabled: true, order: 6 },
  { key: 'isActive', label: 'Trạng thái', type: 'dropdown', options: ['Hoạt động', 'Ngưng hoạt động'], required: false, enabled: true, order: 7 }
];

// Existing products for validation
const EXISTING_PRODUCTS = [
  'Cà phê đen', 'Cà phê sữa', 'Trà sữa trân châu', 'Trà xanh đá', 'Bánh mì thịt nướng',
  'Bánh croissant', 'Bánh tiramisu', 'Nước cam vắt', 'Smoothie xoài', 'Smoothie dâu'
];

interface ImportRow {
  id: string;
  productCode: string;
  productName: string;
  unit: string;
  price: number | string;
  category: string;
  notes: string;
  isActive: string;
  errors: string[];
  warnings: string[];
}

const ProductImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Initialize with empty rows
  useEffect(() => {
    const emptyRows = Array.from({ length: 10 }, (_, index) => createEmptyRow(index));
    setImportData(emptyRows);
  }, []);

  const createEmptyRow = (index: number): ImportRow => ({
    id: `row-${index}`,
    productCode: '',
    productName: '',
    unit: 'Cái',
    price: '',
    category: 'Đồ uống',
    notes: '',
    isActive: 'Hoạt động',
    errors: [],
    warnings: []
  });

  // Validation function - Enhanced for F&B business rules
  const validateRow = (row: ImportRow, data: ImportRow[]): { errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!row.productCode.trim()) errors.push('Mã hàng không được để trống');
    if (!row.productName.trim()) errors.push('Tên hàng không được để trống');
    if (!row.price || row.price === '') errors.push('Giá bán không được để trống');
    if (!row.unit.trim()) errors.push('Đơn vị không được để trống');
    if (!row.category.trim()) errors.push('Loại sản phẩm không được để trống');

    // Product code format validation (should be like CF001, TS002, etc.)
    const codePattern = /^[A-Z]{2}\d{3}$/;
    if (row.productCode.trim() && !codePattern.test(row.productCode.trim())) {
      warnings.push('Mã hàng nên theo định dạng: 2 chữ cái + 3 số (VD: CF001)');
    }

    // Price validation with F&B specific ranges
    const price = typeof row.price === 'string' ? parseFloat(row.price.replace(/[^\d.-]/g, '')) : row.price;
    if (isNaN(price) || price <= 0) {
      errors.push('Giá bán phải là số dương');
    } else {
      if (price < 5000) {
        warnings.push('Giá bán thấp (< 5,000 VNĐ) - kiểm tra lại');
      } else if (price > 100000) {
        warnings.push('Giá bán cao (> 100,000 VNĐ) - kiểm tra lại');
      }
    }

    // Unit validation - check if unit matches category
    const categoryUnitMap: Record<string, string[]> = {
      'Đồ uống': ['Ly', 'Chai', 'Lít'],
      'Cà phê': ['Ly', 'Chai'],
      'Trà sữa': ['Ly', 'Chai'],
      'Nước ép': ['Ly', 'Chai', 'Lít'],
      'Smoothie': ['Ly', 'Chai'],
      'Bánh ngọt': ['Cái', 'Hộp', 'Phần'],
      'Bánh mì': ['Cái', 'Ổ'],
      'Thức ăn': ['Phần', 'Set', 'Cái'],
      'Nguyên liệu': ['Kg', 'Gram', 'Gói', 'Hộp'],
      'Combo': ['Set', 'Phần'],
      'Snack': ['Gói', 'Hộp', 'Cái']
    };

    if (row.category && row.unit && categoryUnitMap[row.category]) {
      if (!categoryUnitMap[row.category].includes(row.unit)) {
        warnings.push(`Đơn vị "${row.unit}" không phù hợp với loại "${row.category}"`);
      }
    }

    // Product name validation (check if exists in catalog)
    const existingProduct = EXISTING_PRODUCTS.find(p => 
      p.toLowerCase() === row.productName.toLowerCase()
    );
    
    if (!existingProduct && row.productName.trim()) {
      warnings.push('Sản phẩm chưa có trong danh mục - sẽ tạo mới');
    }

    // Duplicate product code check within current import batch
    const duplicateInBatch = data.filter(d => d.id !== row.id && d.productCode.trim() === row.productCode.trim());
    if (duplicateInBatch.length > 0 && row.productCode.trim()) {
      errors.push('Mã hàng bị trùng trong lô nhập này');
    }

    return { errors, warnings };
  };

  // Handle cell value change
  const handleCellChange = (rowIndex: number, columnKey: string, value: string) => {
    const newData = [...importData];
    newData[rowIndex] = { ...newData[rowIndex], [columnKey]: value };
    
    // Validate row
    const validation = validateRow(newData[rowIndex], newData);
    newData[rowIndex].errors = validation.errors;
    newData[rowIndex].warnings = validation.warnings;

    setImportData(newData);
  };

  // Handle paste from clipboard
  const handlePaste = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    const clipboardData = event.clipboardData.getData('text');
    
    if (!clipboardData) return;

    const rows = clipboardData.split('\n').filter(row => row.trim());
    const newData: ImportRow[] = [];

    rows.forEach((row, index) => {
      const cells = row.split('\t');
      const enabledColumns = columns.filter(col => col.enabled).sort((a, b) => a.order - b.order);
      
      const newRow: ImportRow = {
        id: `imported-${Date.now()}-${index}`,
        productCode: cells[0] || '',
        productName: cells[1] || '',
        unit: cells[2] || 'Cái',
        price: cells[3] || '',
        category: cells[4] || 'Đồ uống',
        notes: cells[5] || '',
        isActive: cells[6] || 'Hoạt động',
        errors: [],
        warnings: []
      };

      // Validate imported row
      const validation = validateRow(newRow, newData);
      newRow.errors = validation.errors;
      newRow.warnings = validation.warnings;

      newData.push(newRow);
    });

    // Add empty rows if needed
    while (newData.length < 10) {
      newData.push(createEmptyRow(newData.length));
    }

    setImportData(newData);
  };

  // Add more rows
  const addMoreRows = () => {
    const currentLength = importData.length;
    const newRows = Array.from({ length: 5 }, (_, index) => createEmptyRow(currentLength + index));
    setImportData([...importData, ...newRows]);
  };

  // Save imported data
  const handleSave = async () => {
    const validRows = importData.filter(row => 
      row.productCode.trim() && row.productName.trim() && row.errors.length === 0
    );

    if (validRows.length === 0) {
      alert('Không có dữ liệu hợp lệ để lưu');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Đã lưu thành công ${validRows.length} sản phẩm!`);
      
      // Reset form
      const emptyRows = Array.from({ length: 10 }, (_, index) => createEmptyRow(index));
      setImportData(emptyRows);
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  // Get enabled columns in order
  const enabledColumns = columns.filter(col => col.enabled).sort((a, b) => a.order - b.order);

  // Count valid/invalid rows
  const validRows = importData.filter(row => row.productCode.trim() && row.errors.length === 0).length;
  const errorRows = importData.filter(row => row.errors.length > 0).length;
  const warningRows = importData.filter(row => row.warnings.length > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📋 Nhập hàng loạt - Danh mục sản phẩm</h1>
            <p className="text-gray-600 mt-1">Nhập hoặc paste dữ liệu từ Excel/Google Sheets với đầy đủ thông tin</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/import-settings')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              ⚙️ Cài đặt cột
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              ← Quay lại
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Dòng hợp lệ</div>
            <div className="text-2xl font-bold text-green-600">{validRows}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Dòng có lỗi</div>
            <div className="text-2xl font-bold text-red-600">{errorRows}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Dòng cảnh báo</div>
            <div className="text-2xl font-bold text-yellow-600">{warningRows}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Tổng dòng</div>
            <div className="text-2xl font-bold text-blue-600">{importData.length}</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Hướng dẫn sử dụng:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Paste hàng loạt</strong>: Copy từ Excel/Google Sheets và paste (Ctrl+V) vào bảng</li>
            <li>• <strong>Edit trực tiếp</strong>: Click vào ô để chỉnh sửa từng ô một</li>
            <li>• <strong>Validation tự động</strong>: Hệ thống sẽ kiểm tra và cảnh báo lỗi ngay lập tức</li>
            <li>• <strong>Đầy đủ 7 trường</strong>: Mã hàng, Tên hàng, Đơn vị, Giá bán, Loại, Ghi chú, Trạng thái</li>
            <li>• <strong>Cài đặt cột</strong>: Nhấn "Cài đặt cột" để tùy chỉnh thứ tự và định dạng cột</li>
          </ul>
        </div>

        {/* Import Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div 
            ref={tableRef}
            className="overflow-x-auto max-h-96"
            onPaste={handlePaste}
            tabIndex={0}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                  {enabledColumns.map((column) => (
                    <th key={column.key} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {column.label}
                      {column.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importData.map((row, rowIndex) => (
                  <tr key={row.id} className={`hover:bg-gray-50 ${row.errors.length > 0 ? 'bg-red-50' : row.warnings.length > 0 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-3 py-2 text-sm text-gray-500 font-medium">{rowIndex + 1}</td>
                    {enabledColumns.map((column) => (
                      <td key={column.key} className="px-3 py-2">
                        {column.type === 'dropdown' ? (
                          <select
                            value={row[column.key as keyof ImportRow] as string}
                            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            {column.options?.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={column.type === 'number' ? 'number' : 'text'}
                            value={row[column.key as keyof ImportRow] as string}
                            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 ${
                              row.errors.length > 0 ? 'border-red-300 bg-red-50' : 
                              row.warnings.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                            }`}
                            placeholder={column.label}
                          />
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      {row.errors.length > 0 ? (
                        <span className="text-red-600 text-xl" title={row.errors.join(', ')}>❌</span>
                      ) : row.warnings.length > 0 ? (
                        <span className="text-yellow-600 text-xl" title={row.warnings.join(', ')}>⚠️</span>
                      ) : row.productCode.trim() ? (
                        <span className="text-green-600 text-xl">✅</span>
                      ) : (
                        <span className="text-gray-400 text-xl">⭕</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={addMoreRows}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            + Thêm dòng
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2"
            >
              ← Quay lại
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || validRows === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang lưu...' : `💾 Lưu ${validRows} sản phẩm`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImportPage;
