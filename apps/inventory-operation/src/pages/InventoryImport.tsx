import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { databaseService } from '../services/databaseService';
import { InventoryRecord } from '../types';
import { parseDateOrNow } from '@superapp/shared-utils';

const MAX_BULK_ROWS = 200;

const DEFAULT_COLUMNS = [
  { key: 'date', label: 'Ngày', type: 'date', required: true, enabled: true, order: 1 },
  { key: 'productCode', label: 'Mã sản phẩm', type: 'text', required: true, enabled: true, order: 2 },
  { key: 'productName', label: 'Tên sản phẩm', type: 'text', required: true, enabled: true, order: 3 },
  { key: 'inputQuantity', label: 'Số lượng nhập', type: 'number', required: false, enabled: true, order: 4 },
  { key: 'rawMaterialStock', label: 'Tồn nguyên liệu', type: 'number', required: false, enabled: true, order: 5 },
  { key: 'rawMaterialUnit', label: 'ĐVT nguyên liệu', type: 'dropdown', options: ['kg', 'gram', 'lít', 'ml', 'cái', 'gói', 'hộp'], required: false, enabled: true, order: 6 },
  { key: 'processedStock', label: 'Tồn chế biến', type: 'number', required: false, enabled: true, order: 7 },
  { key: 'processedUnit', label: 'ĐVT chế biến', type: 'dropdown', options: ['ly', 'phần', 'cái', 'miếng'], required: false, enabled: true, order: 8 },
  { key: 'finishedProductStock', label: 'Tồn thành phẩm', type: 'number', required: false, enabled: true, order: 9 },
  { key: 'finishedProductUnit', label: 'ĐVT thành phẩm', type: 'dropdown', options: ['ly', 'phần', 'cái', 'miếng'], required: false, enabled: true, order: 10 },
  { key: 'notes', label: 'Ghi chú', type: 'text', required: false, enabled: true, order: 11 }
];

interface ImportRow {
  id: string;
  date: string;
  productCode: string;
  productName: string;
  inputQuantity: number | string;
  rawMaterialStock: number | string;
  rawMaterialUnit: string;
  processedStock: number | string;
  processedUnit: string;
  finishedProductStock: number | string;
  finishedProductUnit: string;
  notes: string;
  errors: string[];
  warnings: string[];
}

const InventoryImport: React.FC = () => {
  const navigate = useNavigate();
  const [columns] = useState(DEFAULT_COLUMNS);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [singleForm, setSingleForm] = useState<ImportRow>(createEmptySingleRow());
  const tableRef = useRef<HTMLDivElement>(null);

  function createEmptyRow(index: number): ImportRow {
    return {
      id: `row-${index}`,
      date: new Date().toISOString().split('T')[0],
      productCode: '',
      productName: '',
      inputQuantity: '',
      rawMaterialStock: '',
      rawMaterialUnit: 'kg',
      processedStock: '',
      processedUnit: 'ly',
      finishedProductStock: '',
      finishedProductUnit: 'ly',
      notes: '',
      errors: [],
      warnings: []
    };
  }

  function createEmptySingleRow(): ImportRow {
    return {
      id: 'single',
      date: new Date().toISOString().split('T')[0],
      productCode: '',
      productName: '',
      inputQuantity: '',
      rawMaterialStock: '',
      rawMaterialUnit: 'kg',
      processedStock: '',
      processedUnit: 'ly',
      finishedProductStock: '',
      finishedProductUnit: 'ly',
      notes: '',
      errors: [],
      warnings: []
    };
  }

  // Initialize bulk import with empty rows
  useEffect(() => {
    if (activeTab === 'bulk') {
      const emptyRows = Array.from({ length: 10 }, (_, index) => createEmptyRow(index));
      setImportData(emptyRows);
    }
  }, [activeTab]);

  // Validation function
  const validateRow = (row: ImportRow, data: ImportRow[]): { errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!row.date) errors.push('Ngày không được để trống');
    if (!row.productCode.trim()) errors.push('Mã sản phẩm không được để trống');
    if (!row.productName.trim()) errors.push('Tên sản phẩm không được để trống');

    // Quantity validation
    const inputQty = typeof row.inputQuantity === 'string' ? parseFloat(row.inputQuantity) : row.inputQuantity;
    const rawStock = typeof row.rawMaterialStock === 'string' ? parseFloat(row.rawMaterialStock) : row.rawMaterialStock;
    const processedStock = typeof row.processedStock === 'string' ? parseFloat(row.processedStock) : row.processedStock;
    const finishedStock = typeof row.finishedProductStock === 'string' ? parseFloat(row.finishedProductStock) : row.finishedProductStock;

    if (row.inputQuantity && (isNaN(inputQty) || inputQty < 0)) {
      errors.push('Số lượng nhập phải là số không âm');
    }
    if (row.rawMaterialStock && (isNaN(rawStock) || rawStock < 0)) {
      errors.push('Tồn nguyên liệu phải là số không âm');
    }
    if (row.processedStock && (isNaN(processedStock) || processedStock < 0)) {
      errors.push('Tồn chế biến phải là số không âm');
    }
    if (row.finishedProductStock && (isNaN(finishedStock) || finishedStock < 0)) {
      errors.push('Tồn thành phẩm phải là số không âm');
    }

    // Duplicate check within batch
    const duplicateInBatch = data.filter(d => d.id !== row.id && d.productCode.trim() === row.productCode.trim() && d.date === row.date);
    if (duplicateInBatch.length > 0 && row.productCode.trim()) {
      errors.push('Bản ghi tồn kho bị trùng trong lô nhập này (cùng mã sản phẩm và ngày)');
    }

    return { errors, warnings };
  };

  // Handle cell value change for bulk import
  const handleCellChange = (rowIndex: number, columnKey: string, value: string) => {
    const newData = [...importData];
    newData[rowIndex] = { ...newData[rowIndex], [columnKey]: value };
    
    const validation = validateRow(newData[rowIndex], newData);
    newData[rowIndex].errors = validation.errors;
    newData[rowIndex].warnings = validation.warnings;

    setImportData(newData);
  };

  // Handle single form change
  const handleSingleFormChange = (columnKey: string, value: string) => {
    const newForm = { ...singleForm, [columnKey]: value };
    const validation = validateRow(newForm, [newForm]);
    newForm.errors = validation.errors;
    newForm.warnings = validation.warnings;
    setSingleForm(newForm);
  };

  // Handle paste from clipboard for bulk import
  const handlePaste = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    const clipboardData = event.clipboardData.getData('text');
    
    if (!clipboardData) return;

    const rows = clipboardData.split('\n').filter(row => row.trim());
    const newData: ImportRow[] = [];

    rows.forEach((row, index) => {
      const cells = row.split('\t');
      const newRow: ImportRow = {
        id: `imported-${Date.now()}-${index}`,
        date: cells[0] || new Date().toISOString().split('T')[0],
        productCode: cells[1] || '',
        productName: cells[2] || '',
        inputQuantity: cells[3] || '',
        rawMaterialStock: cells[4] || '',
        rawMaterialUnit: cells[5] || 'kg',
        processedStock: cells[6] || '',
        processedUnit: cells[7] || 'ly',
        finishedProductStock: cells[8] || '',
        finishedProductUnit: cells[9] || 'ly',
        notes: cells[10] || '',
        errors: [],
        warnings: []
      };

      const validation = validateRow(newRow, newData);
      newRow.errors = validation.errors;
      newRow.warnings = validation.warnings;

      newData.push(newRow);
    });

    while (newData.length < 10) {
      newData.push(createEmptyRow(newData.length));
    }

    setImportData(newData);
  };

  // Add more rows
  const addMoreRows = () => {
    const currentLength = importData.length;
    if (currentLength >= MAX_BULK_ROWS) {
      alert(`Tối đa ${MAX_BULK_ROWS} dòng cho mỗi lần nhập`);
      return;
    }
    const newRows = Array.from({ length: 5 }, (_, index) => createEmptyRow(currentLength + index));
    setImportData([...importData, ...newRows]);
  };

  // Save single record
  const handleSaveSingle = async () => {
    const validation = validateRow(singleForm, [singleForm]);
    
    if (validation.errors.length > 0) {
      alert(`Lỗi: ${validation.errors.join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
      const record: Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        date: parseDateOrNow(singleForm.date),
        productCode: singleForm.productCode,
        productName: singleForm.productName,
        inputQuantity: singleForm.inputQuantity ? parseFloat(singleForm.inputQuantity as string) : 0,
        rawMaterialStock: singleForm.rawMaterialStock ? parseFloat(singleForm.rawMaterialStock as string) : 0,
        rawMaterialUnit: singleForm.rawMaterialUnit,
        processedStock: singleForm.processedStock ? parseFloat(singleForm.processedStock as string) : 0,
        processedUnit: singleForm.processedUnit,
        finishedProductStock: singleForm.finishedProductStock ? parseFloat(singleForm.finishedProductStock as string) : 0,
        finishedProductUnit: singleForm.finishedProductUnit,
        notes: singleForm.notes,
        createdBy: 'system',
        updatedBy: 'system'
      };

      const result = await databaseService.createInventoryRecord(record);
      
      if (result.error) {
        alert(`Lỗi: ${result.error}`);
      } else {
        alert('Đã lưu thành công bản ghi tồn kho!');
        setSingleForm(createEmptySingleRow());
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  // Save bulk import
  const handleSaveBulk = async () => {
    const validRows = importData.filter(row => 
      row.productCode.trim() && row.productName.trim() && row.errors.length === 0
    );

    if (validRows.length === 0) {
      alert('Không có dữ liệu hợp lệ để lưu');
      return;
    }

    if (validRows.length > MAX_BULK_ROWS) {
      alert(`Tối đa ${MAX_BULK_ROWS} dòng cho mỗi lần nhập`);
      return;
    }

    setIsLoading(true);
    try {
      const recordsToInsert = validRows.map(row => ({
        date: parseDateOrNow(row.date),
        productCode: row.productCode,
        productName: row.productName,
        inputQuantity: row.inputQuantity ? parseFloat(row.inputQuantity as string) : 0,
        rawMaterialStock: row.rawMaterialStock ? parseFloat(row.rawMaterialStock as string) : 0,
        rawMaterialUnit: row.rawMaterialUnit,
        processedStock: row.processedStock ? parseFloat(row.processedStock as string) : 0,
        processedUnit: row.processedUnit,
        finishedProductStock: row.finishedProductStock ? parseFloat(row.finishedProductStock as string) : 0,
        finishedProductUnit: row.finishedProductUnit,
        notes: row.notes,
        createdBy: 'system',
        updatedBy: 'system'
      }));

      const result = await databaseService.bulkInsertInventoryRecords(recordsToInsert);
      
      if (result.error) {
        alert(`Lỗi: ${result.error}`);
      } else {
        alert(`Đã lưu thành công ${validRows.length} bản ghi tồn kho!`);
        const emptyRows = Array.from({ length: 10 }, (_, index) => createEmptyRow(index));
        setImportData(emptyRows);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    const result = await databaseService.exportInventoryToCSV();
    
    if (result.error) {
      alert(`Lỗi: ${result.error}`);
      return;
    }

    const blob = new Blob([result.data!], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Download template
  const handleDownloadTemplate = () => {
    const headers = DEFAULT_COLUMNS.filter(col => col.enabled).sort((a, b) => a.order - b.order).map(col => col.label).join(',');
    const sampleRow = `2024-01-15,CF001,Cà phê đen,10,5,kg,8,ly,8,ly,Ghi chú mẫu`;
    const csvContent = `${headers}\n${sampleRow}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inventory_template.csv';
    link.click();
  };

  const enabledColumns = columns.filter(col => col.enabled).sort((a, b) => a.order - b.order);
  const validRows = importData.filter(row => row.productCode.trim() && row.errors.length === 0).length;
  const errorRows = importData.filter(row => row.errors.length > 0).length;
  const warningRows = importData.filter(row => row.warnings.length > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📦 Nhập tồn kho</h1>
            <p className="text-gray-600 mt-1">Nhập đơn hoặc hàng loạt bản ghi tồn kho</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              📥 Tải mẫu
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              📤 Xuất CSV
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              ← Quay lại
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('single')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'single'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Nhập đơn
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'bulk'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Nhập hàng loạt
              </button>
            </nav>
          </div>

          {/* Single Entry Form */}
          {activeTab === 'single' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enabledColumns.map((column) => (
                  <div key={column.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {column.label}
                      {column.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {column.type === 'dropdown' ? (
                      <select
                        value={singleForm[column.key as keyof ImportRow] as string}
                        onChange={(e) => handleSingleFormChange(column.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {column.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : column.type === 'date' ? (
                      <input
                        type="date"
                        value={singleForm[column.key as keyof ImportRow] as string}
                        onChange={(e) => handleSingleFormChange(column.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : column.type === 'number' ? (
                      <input
                        type="number"
                        value={singleForm[column.key as keyof ImportRow] as string}
                        onChange={(e) => handleSingleFormChange(column.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <input
                        type="text"
                        value={singleForm[column.key as keyof ImportRow] as string}
                        onChange={(e) => handleSingleFormChange(column.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Validation Errors */}
              {singleForm.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <ul className="text-sm text-red-700 space-y-1">
                    {singleForm.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Validation Warnings */}
              {singleForm.warnings.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {singleForm.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveSingle}
                  disabled={isLoading || singleForm.errors.length > 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Đang lưu...' : '💾 Lưu bản ghi'}
                </button>
              </div>
            </div>
          )}

          {/* Bulk Import Form */}
          {activeTab === 'bulk' && (
            <div className="p-6">
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
                <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Hướng dẫn:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Paste từ Excel</strong>: Copy từ Excel/Google Sheets và paste (Ctrl+V) vào bảng</li>
                  <li>• <strong>Edit trực tiếp</strong>: Click vào ô để chỉnh sửa</li>
                  <li>• <strong>Validation tự động</strong>: Kiểm tra trùng mã sản phẩm + ngày</li>
                  <li>• <strong>Giới hạn</strong>: Tối đa {MAX_BULK_ROWS} dòng cho mỗi lần nhập</li>
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
                              ) : column.type === 'date' ? (
                                <input
                                  type="date"
                                  value={row[column.key as keyof ImportRow] as string}
                                  onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              ) : column.type === 'number' ? (
                                <input
                                  type="number"
                                  value={row[column.key as keyof ImportRow] as string}
                                  onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                                  min="0"
                                  step="0.01"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={row[column.key as keyof ImportRow] as string}
                                  onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                                  className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 ${
                                    row.errors.length > 0 ? 'border-red-300 bg-red-50' : 
                                    row.warnings.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                                  }`}
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
                
                <button
                  onClick={handleSaveBulk}
                  disabled={isLoading || validRows === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Đang lưu...' : `💾 Lưu ${validRows} bản ghi`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryImport;