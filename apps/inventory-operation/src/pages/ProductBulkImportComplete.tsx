import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Complete field structure based on Excel definition file
const COMPLETE_COLUMNS = [
  { key: 'updateDate', label: 'Ngày cập nhật', type: 'date', required: true, enabled: true, order: 1 },
  { key: 'materialType', label: 'Loại', type: 'dropdown', options: ['Nguyên liệu', 'Thành phẩm', 'Bán thành phẩm'], required: true, enabled: true, order: 2 },
  { key: 'materialCode', label: 'Mã nguyên vật liệu', type: 'text', required: true, enabled: true, order: 3 },
  { key: 'materialName', label: 'Tên nguyên vật liệu', type: 'text', required: true, enabled: true, order: 4 },
  { key: 'isFinishedProduct', label: 'Thành phẩm?', type: 'dropdown', options: ['TRUE', 'FALSE'], required: true, enabled: true, order: 5 },
  { key: 'outputQuantity', label: 'Định lượng Xuất', type: 'number', required: true, enabled: true, order: 6 },
  { key: 'inputQuantity', label: 'Nhập', type: 'number', required: true, enabled: true, order: 7 },
  { key: 'productCode', label: 'Mã SP KD', type: 'text', required: true, enabled: true, order: 8 },
  { key: 'productName', label: 'Tên thành phẩm', type: 'text', required: true, enabled: true, order: 9 },
  { key: 'inputUnit', label: 'ĐVT Nhập', type: 'dropdown', options: ['quả', 'miếng', 'gram', 'kg', 'lít', 'ml', 'cái', 'gói', 'hộp'], required: true, enabled: true, order: 10 },
  { key: 'outputUnit', label: 'ĐVT Xuất', type: 'dropdown', options: ['miếng', 'gram', 'kg', 'lít', 'ml', 'cái', 'phần', 'đĩa'], required: true, enabled: true, order: 11 },
  { key: 'status', label: 'Tình trạng', type: 'dropdown', options: ['Đang bán', 'Ngưng bán', 'Hết hàng'], required: true, enabled: true, order: 12 }
];

interface CompleteImportRow {
  id: string;
  updateDate: string;
  materialType: string;
  materialCode: string;
  materialName: string;
  isFinishedProduct: string;
  outputQuantity: number | string;
  inputQuantity: number | string;
  productCode: string;
  productName: string;
  inputUnit: string;
  outputUnit: string;
  status: string;
  errors: string[];
  warnings: string[];
}

// Sample data for validation
const EXISTING_MATERIALS = [
  'Cam', 'Nho', 'Cà phê', 'Trà', 'Sữa', 'Đường', 'Đá'
];

const ProductBulkImportComplete: React.FC = () => {
  const navigate = useNavigate();
  const [importData, setImportData] = useState<CompleteImportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [columns] = useState(COMPLETE_COLUMNS);
  const tableRef = useRef<HTMLDivElement>(null);

  // Initialize with empty rows
  useEffect(() => {
    const emptyRows = Array.from({ length: 10 }, (_, index) => createEmptyRow(index));
    setImportData(emptyRows);
  }, []);

  const createEmptyRow = (index: number): CompleteImportRow => ({
    id: `row-${index}`,
    updateDate: new Date().toISOString().split('T')[0],
    materialType: 'Nguyên liệu',
    materialCode: '',
    materialName: '',
    isFinishedProduct: 'FALSE',
    outputQuantity: '',
    inputQuantity: '',
    productCode: '',
    productName: '',
    inputUnit: 'quả',
    outputUnit: 'miếng',
    status: 'Đang bán',
    errors: [],
    warnings: []
  });

  // Enhanced validation function for complete data structure
  const validateRow = (row: CompleteImportRow, data: CompleteImportRow[]): { errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!row.updateDate) errors.push('Ngày cập nhật không được để trống');
    if (!row.materialCode.trim()) errors.push('Mã nguyên vật liệu không được để trống');
    if (!row.materialName.trim()) errors.push('Tên nguyên vật liệu không được để trống');
    if (!row.productCode.trim()) errors.push('Mã SP KD không được để trống');
    if (!row.productName.trim()) errors.push('Tên thành phẩm không được để trống');
    if (!row.outputQuantity || row.outputQuantity === '') errors.push('Định lượng Xuất không được để trống');
    if (!row.inputQuantity || row.inputQuantity === '') errors.push('Nhập không được để trống');

    // Material code format validation
    const materialCodePattern = /^[A-Z]{3}\d{5}$/;
    if (row.materialCode.trim() && !materialCodePattern.test(row.materialCode.trim())) {
      warnings.push('Mã nguyên vật liệu nên theo định dạng: 3 chữ cái + 5 số (VD: NVL00001)');
    }

    // Product code format validation
    const productCodePattern = /^[A-Z]{2}\d{3}$/;
    if (row.productCode.trim() && !productCodePattern.test(row.productCode.trim())) {
      warnings.push('Mã SP KD nên theo định dạng: 2 chữ cái + 3 số (VD: TC001)');
    }

    // Quantity validation
    const outputQty = typeof row.outputQuantity === 'string' ? parseFloat(row.outputQuantity) : row.outputQuantity;
    const inputQty = typeof row.inputQuantity === 'string' ? parseFloat(row.inputQuantity) : row.inputQuantity;
    
    if (isNaN(outputQty) || outputQty <= 0) {
      errors.push('Định lượng Xuất phải là số dương');
    }
    if (isNaN(inputQty) || inputQty <= 0) {
      errors.push('Nhập phải là số dương');
    }

    // Business logic validation
    if (row.isFinishedProduct === 'TRUE' && row.materialType === 'Nguyên liệu') {
      warnings.push('Nguyên liệu không thể là thành phẩm - kiểm tra lại');
    }

    // Unit consistency validation
    const unitConsistencyMap: Record<string, string[]> = {
      'Cam': ['quả', 'miếng'],
      'Nho': ['gram', 'gram'],
      'Cà phê': ['gram', 'ly'],
      'Trà': ['gram', 'ly'],
      'Sữa': ['ml', 'ml']
    };

    if (row.materialName && unitConsistencyMap[row.materialName]) {
      const [expectedInput, expectedOutput] = unitConsistencyMap[row.materialName];
      if (row.inputUnit !== expectedInput) {
        warnings.push(`Đơn vị nhập cho ${row.materialName} nên là "${expectedInput}"`);
      }
      if (row.outputUnit !== expectedOutput) {
        warnings.push(`Đơn vị xuất cho ${row.materialName} nên là "${expectedOutput}"`);
      }
    }

    // Duplicate material code check
    const duplicateInBatch = data.filter(d => d.id !== row.id && d.materialCode.trim() === row.materialCode.trim());
    if (duplicateInBatch.length > 0 && row.materialCode.trim()) {
      errors.push('Mã nguyên vật liệu bị trùng trong lô nhập này');
    }

    // Material name validation
    if (row.materialName.trim() && !EXISTING_MATERIALS.includes(row.materialName.trim())) {
      warnings.push('Nguyên vật liệu chưa có trong danh mục - sẽ tạo mới');
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
    const newData: CompleteImportRow[] = [];

    rows.forEach((row, index) => {
      const cells = row.split('\t');
      const enabledColumns = columns.filter(col => col.enabled).sort((a, b) => a.order - b.order);
      
      const newRow: CompleteImportRow = {
        id: `imported-${Date.now()}-${index}`,
        updateDate: cells[0] || new Date().toISOString().split('T')[0],
        materialType: cells[1] || 'Nguyên liệu',
        materialCode: cells[2] || '',
        materialName: cells[3] || '',
        isFinishedProduct: cells[4] || 'FALSE',
        outputQuantity: cells[5] || '',
        inputQuantity: cells[6] || '',
        productCode: cells[7] || '',
        productName: cells[8] || '',
        inputUnit: cells[9] || 'quả',
        outputUnit: cells[10] || 'miếng',
        status: cells[11] || 'Đang bán',
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
      row.materialCode.trim() && row.materialName.trim() && row.errors.length === 0
    );

    if (validRows.length === 0) {
      alert('Không có dữ liệu hợp lệ để lưu');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Đã lưu thành công ${validRows.length} bản ghi định mức!`);
      
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

  // Get stats
  const validRows = importData.filter(row => row.errors.length === 0 && (row.materialCode.trim() || row.materialName.trim()));
  const errorRows = importData.filter(row => row.errors.length > 0);
  const warningRows = importData.filter(row => row.warnings.length > 0 && row.errors.length === 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg mr-4">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nhập hàng loạt - Định mức nguyên vật liệu</h1>
                <p className="text-sm text-gray-600 mt-1">Nhập hoặc paste dữ liệu từ Excel/Google Sheets với đầy đủ thông tin định mức</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/import-settings')}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span className="mr-2">⚙️</span>
                Cài đặt cột
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span className="mr-2">←</span>
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <div className="text-sm font-medium text-green-900">Dòng hợp lệ</div>
                <div className="text-2xl font-bold text-green-700">{validRows.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <div className="text-sm font-medium text-red-900">Dòng có lỗi</div>
                <div className="text-2xl font-bold text-red-700">{errorRows.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <div className="text-sm font-medium text-yellow-900">Dòng cảnh báo</div>
                <div className="text-2xl font-bold text-yellow-700">{warningRows.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <div className="text-sm font-medium text-blue-900">Tổng dòng</div>
                <div className="text-2xl font-bold text-blue-700">{importData.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 Hướng dẫn sử dụng:</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">📥 Cách nhập liệu:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Paste hàng loạt</strong>: Copy từ Excel/Google Sheets và paste (Ctrl+V) vào bảng</li>
                <li>• <strong>Edit trực tiếp</strong>: Click vào ô để chỉnh sửa từng ô một</li>
                <li>• <strong>Validation tự động</strong>: Hệ thống sẽ kiểm tra và cảnh báo lỗi ngay lập tức</li>
                <li>• <strong>Đầy đủ 12 trường</strong>: Theo chuẩn file Excel định mức nguyên vật liệu</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">📋 Cấu trúc dữ liệu:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Ngày cập nhật</strong>: Định dạng YYYY-MM-DD</li>
                <li>• <strong>Mã nguyên vật liệu</strong>: 3 chữ cái + 5 số (VD: NVL00001)</li>
                <li>• <strong>Mã SP KD</strong>: 2 chữ cái + 3 số (VD: TC001)</li>
                <li>• <strong>Định lượng</strong>: Số dương, quy đổi theo đơn vị chuẩn</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Import Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div 
            ref={tableRef}
            className="overflow-x-auto"
            onPaste={handlePaste}
            tabIndex={0}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  {enabledColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32"
                    >
                      {column.label}
                      {column.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importData.map((row, rowIndex) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-sm text-gray-500 text-center">
                      {rowIndex + 1}
                    </td>
                    {enabledColumns.map((column) => (
                      <td key={column.key} className="px-3 py-2">
                        {column.type === 'dropdown' ? (
                          <select
                            value={row[column.key as keyof CompleteImportRow] as string}
                            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {column.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : column.type === 'date' ? (
                          <input
                            type="date"
                            value={row[column.key as keyof CompleteImportRow] as string}
                            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : column.type === 'number' ? (
                          <input
                            type="number"
                            value={row[column.key as keyof CompleteImportRow] as string}
                            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row[column.key as keyof CompleteImportRow] as string}
                            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                            placeholder={`Nhập ${column.label.toLowerCase()}...`}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      {row.errors.length > 0 ? (
                        <span className="text-red-500 text-xl" title={row.errors.join(', ')}>❌</span>
                      ) : row.warnings.length > 0 ? (
                        <span className="text-yellow-500 text-xl" title={row.warnings.join(', ')}>⚠️</span>
                      ) : (row.materialCode.trim() || row.materialName.trim()) ? (
                        <span className="text-green-500 text-xl">✅</span>
                      ) : (
                        <span className="text-gray-300 text-xl">⭕</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={addMoreRows}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <span className="mr-2">➕</span>
            Thêm 5 dòng
          </button>
          
          <button
            onClick={handleSave}
            disabled={isLoading || validRows.length === 0}
            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="mr-2">⏳</span>
                Đang lưu...
              </>
            ) : (
              <>
                <span className="mr-2">💾</span>
                Lưu dữ liệu ({validRows.length} dòng)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductBulkImportComplete;
