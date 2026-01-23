import React, { useState } from 'react';
import { ProductCatalogItem, PRODUCT_CATALOG_COLUMNS, SAMPLE_PRODUCT_CATALOG, formatPrice } from '../types/product-catalog';

// Simple inline types for demo
interface ImportError {
  row: number;
  column: string;
  message: string;
}

interface EditableDataGridProps {
  data: any[];
  errors: ImportError[];
  onDataChange: (data: any[]) => void;
  columns: any[];
  maxRows?: number;
  allowAddRows?: boolean;
  allowRemoveRows?: boolean;
}

// Simple inline EditableDataGrid component for demo
const EditableDataGrid: React.FC<EditableDataGridProps> = ({ 
  data, 
  errors, 
  onDataChange, 
  columns,
  allowAddRows = true,
  allowRemoveRows = true 
}) => {
  const addRow = () => {
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col.key] = col.defaultValue || '';
    });
    onDataChange([...data, newRow]);
  };

  const removeRow = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onDataChange(newData);
  };

  const updateCell = (rowIndex: number, columnKey: string, value: any) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [columnKey]: value };
    onDataChange(newData);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {column.label}
                {column.required && <span className="text-red-500 ml-1">*</span>}
              </th>
            ))}
            {allowRemoveRows && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((column) => {
                const error = errors.find(e => e.row === rowIndex && e.column === column.key);
                return (
                  <td key={column.key} className="px-3 py-4 whitespace-nowrap">
                    <input
                      type={column.type === 'number' ? 'number' : 'text'}
                      value={row[column.key] || ''}
                      onChange={(e) => updateCell(rowIndex, column.key, e.target.value)}
                      className={`w-full px-2 py-1 border rounded text-sm ${
                        error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={column.placeholder}
                    />
                    {error && (
                      <div className="text-xs text-red-600 mt-1">{error.message}</div>
                    )}
                  </td>
                );
              })}
              {allowRemoveRows && (
                <td className="px-3 py-4 whitespace-nowrap">
                  <button
                    onClick={() => removeRow(rowIndex)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    🗑️
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {allowAddRows && (
        <div className="mt-4">
          <button
            onClick={addRow}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            + Thêm dòng
          </button>
        </div>
      )}
    </div>
  );
};

const ProductCatalogDemoPage: React.FC = () => {
  const [gridData, setGridData] = useState<ProductCatalogItem[]>(SAMPLE_PRODUCT_CATALOG);
  const [gridErrors, setGridErrors] = useState<ImportError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMode, setInputMode] = useState<'form' | 'grid'>('grid');

  // Handle grid data changes
  const handleGridDataChange = (data: any[]) => {
    setGridData(data);
    
    // Validate data
    const errors: ImportError[] = [];
    data.forEach((row, index) => {
      PRODUCT_CATALOG_COLUMNS.forEach(column => {
        if (column.validation) {
          const error = column.validation(row[column.key]);
          if (error) {
            errors.push({
              row: index,
              column: column.key,
              message: error
            });
          }
        }
      });
    });
    
    setGridErrors(errors);
  };

  // Handle save grid data
  const handleSaveGridData = async () => {
    if (gridErrors.length > 0) {
      alert('Vui lòng sửa các lỗi trước khi lưu');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saving product catalog data:', gridData);
      alert(`Đã lưu thành công ${gridData.length} sản phẩm!`);
      
      // Clear grid after successful save
      setGridData([]);
      
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  // Add sample data for testing
  const handleAddSampleData = () => {
    setGridData([...gridData, ...SAMPLE_PRODUCT_CATALOG]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demo: Quản lý danh mục - Excel-like</h1>
          <p className="mt-2 text-gray-600">
            Test schema thực tế từ file Excel "Quản lý danh mục" với EditableDataGrid
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setInputMode('form')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                inputMode === 'form'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 Form
            </button>
            <button
              onClick={() => setInputMode('grid')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                inputMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Excel-like
            </button>
          </div>
          
          {/* Action Buttons */}
          <button
            onClick={handleAddSampleData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
          >
            + Thêm data mẫu
          </button>
          
          {gridData.length > 0 && (
            <button
              onClick={handleSaveGridData}
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Đang lưu...' : '💾 Lưu dữ liệu'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Tổng sản phẩm</div>
          <div className="text-2xl font-bold text-gray-900">{gridData.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Lỗi validation</div>
          <div className="text-2xl font-bold text-red-600">{gridErrors.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Tổng giá trị</div>
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(gridData.reduce((sum, item) => sum + (item.price || 0), 0))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Loại sản phẩm</div>
          <div className="text-2xl font-bold text-blue-600">
            {new Set(gridData.map(item => item.category)).size}
          </div>
        </div>
      </div>

      {/* Excel-like Grid */}
      {inputMode === 'grid' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              📊 Nhập liệu nhanh - Excel-like
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Click vào ô để chỉnh sửa, hoặc paste dữ liệu từ Excel/Google Sheets (Ctrl+V)
            </p>
          </div>
          
          <EditableDataGrid
            data={gridData}
            errors={gridErrors}
            onDataChange={handleGridDataChange}
            columns={PRODUCT_CATALOG_COLUMNS}
            maxRows={100}
            allowAddRows={true}
            allowRemoveRows={true}
          />
          
          {gridData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-lg font-medium mb-2">Chưa có dữ liệu</div>
              <div className="text-sm">
                Nhấn "Thêm data mẫu" hoặc paste dữ liệu từ Excel (Ctrl+V) để bắt đầu
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Mode Placeholder */}
      {inputMode === 'form' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <div className="text-lg font-medium mb-2">Form Mode</div>
            <div className="text-sm">
              Form truyền thống sẽ được implement sau. Hiện tại focus vào Excel-like experience.
            </div>
          </div>
        </div>
      )}

      {/* Sample Data Preview */}
      {gridData.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔍 Preview Data (Top 5)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã hàng</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên hàng</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn vị</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá bán</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gridData.slice(0, 5).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-sm font-medium text-gray-900">{item.productCode}</td>
                    <td className="px-3 py-4 text-sm text-gray-900">{item.productName}</td>
                    <td className="px-3 py-4 text-sm text-gray-500">{item.unit}</td>
                    <td className="px-3 py-4 text-sm text-green-600 font-medium">{formatPrice(item.price)}</td>
                    <td className="px-3 py-4 text-sm text-blue-600">{item.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {gridData.length > 5 && (
              <div className="text-center py-2 text-sm text-gray-500">
                ... và {gridData.length - 5} sản phẩm khác
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalogDemoPage;
