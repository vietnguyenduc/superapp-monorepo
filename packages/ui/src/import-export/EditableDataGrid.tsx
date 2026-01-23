import React, { useState, useCallback, useRef } from 'react';

export interface ImportError {
  row: number;
  column: string;
  message: string;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  validation?: (value: any) => string | null;
}

interface EditableDataGridProps {
  data: any[];
  errors: ImportError[];
  onDataChange: (data: any[]) => void;
  columns: ColumnDefinition[];
  maxRows?: number;
  allowAddRows?: boolean;
  allowRemoveRows?: boolean;
}

const EditableDataGrid: React.FC<EditableDataGridProps> = ({
  data,
  errors,
  onDataChange,
  columns,
  maxRows = 100,
  allowAddRows = true,
  allowRemoveRows = true,
}) => {
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const tableRef = useRef<HTMLTableElement>(null);

  // Get error for specific cell
  const getErrorForCell = useCallback(
    (rowIndex: number, column: string): ImportError | undefined => {
      return errors.find(
        (error) => error.row === rowIndex && error.column === column,
      );
    },
    [errors],
  );

  // Get error for specific row
  const getErrorForRow = useCallback(
    (rowIndex: number): ImportError[] => {
      return errors.filter((error) => error.row === rowIndex);
    },
    [errors],
  );

  // Handle cell click to start editing
  const handleCellClick = useCallback(
    (rowIndex: number, column: string, value: string) => {
      setEditingCell({ row: rowIndex, col: column });
      setEditValue(value || '');
    },
    [],
  );

  // Handle edit value change
  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setEditValue(e.target.value);
    },
    [],
  );

  // Handle edit completion
  const handleEditComplete = useCallback(() => {
    if (!editingCell) return;

    const { row, col } = editingCell;
    const newData = [...data];

    // Update the cell value
    newData[row] = {
      ...newData[row],
      [col]: editValue,
    };

    onDataChange(newData);
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, data, onDataChange]);

  // Handle edit cancellation
  const handleEditCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Handle key press in edit mode
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEditComplete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleEditCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleEditComplete();
        // Move to next cell
        if (editingCell) {
          const currentColIndex = columns.findIndex(col => col.key === editingCell.col);
          const nextColIndex = (currentColIndex + 1) % columns.length;
          const nextRow = nextColIndex === 0 ? editingCell.row + 1 : editingCell.row;
          
          if (nextRow < data.length) {
            setTimeout(() => {
              handleCellClick(nextRow, columns[nextColIndex].key, data[nextRow][columns[nextColIndex].key] || '');
            }, 50);
          }
        }
      }
    },
    [handleEditComplete, handleEditCancel, editingCell, columns, data, handleCellClick],
  );

  // Handle blur to complete edit
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (editingCell) {
        handleEditComplete();
      }
    }, 100);
  }, [editingCell, handleEditComplete]);

  // Handle paste event
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTableElement>) => {
      e.preventDefault();
      const clipboardData = e.clipboardData.getData('text');
      if (!clipboardData) return;

      const rows = clipboardData.split(/\r?\n/).filter(Boolean);
      const pastedData = rows.map(row => 
        row.split('\t').reduce((acc, cell, index) => {
          if (columns[index]) {
            acc[columns[index].key] = cell.trim();
          }
          return acc;
        }, {} as any)
      );

      // Merge with existing data
      const newData = [...data, ...pastedData];
      onDataChange(newData.slice(0, maxRows));
    },
    [data, columns, maxRows, onDataChange],
  );

  // Add new row
  const handleAddRow = useCallback(() => {
    if (data.length >= maxRows) return;
    
    const newRow = columns.reduce((acc, col) => {
      acc[col.key] = '';
      return acc;
    }, {} as any);
    
    onDataChange([...data, newRow]);
  }, [data, columns, maxRows, onDataChange]);

  // Remove row
  const handleRemoveRow = useCallback((index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onDataChange(newData);
  }, [data, onDataChange]);

  // Render cell content
  const renderCell = (rowIndex: number, columnKey: string, value: string, column: ColumnDefinition) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === columnKey;
    const error = getErrorForCell(rowIndex, columnKey);
    const hasError = !!error;

    if (isEditing) {
      if (column.type === 'select' && column.options) {
        return (
          <select
            value={editValue}
            onChange={handleEditChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyPress}
            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 bg-blue-50"
            autoFocus
          >
            <option value="">-- Chọn --</option>
            {column.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      }

      return (
        <input
          type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
          value={editValue}
          onChange={handleEditChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
          className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 bg-blue-50"
          autoFocus
        />
      );
    }

    return (
      <div
        onClick={() => handleCellClick(rowIndex, columnKey, value)}
        className={`px-3 py-2 cursor-pointer hover:bg-gray-50 min-h-[40px] flex items-center ${
          hasError ? 'bg-red-50 border-red-200' : ''
        }`}
        title={hasError ? error.message : ''}
      >
        <span className={hasError ? 'text-red-700' : 'text-gray-900'}>
          {value || (
            <span className="text-gray-400 italic">
              {column.required ? 'Bắt buộc' : 'Nhấn để nhập'}
            </span>
          )}
        </span>
        {hasError && (
          <span className="ml-2 text-red-500 text-xs">⚠️</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      {allowAddRows && (
        <div className="flex justify-between items-center">
          <button
            onClick={handleAddRow}
            disabled={data.length >= maxRows}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
          >
            + Thêm dòng
          </button>
          <div className="text-sm text-gray-500">
            {data.length}/{maxRows} dòng
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table
          ref={tableRef}
          className="min-w-full divide-y divide-gray-200"
          onPaste={handlePaste}
          tabIndex={0}
        >
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                  {column.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </th>
              ))}
              {allowRemoveRows && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => {
              const rowErrors = getErrorForRow(rowIndex);
              const hasRowError = rowErrors.length > 0;

              return (
                <tr key={rowIndex} className={hasRowError ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  {columns.map((column) => (
                    <td key={column.key} className="p-0 border-r border-gray-100 last:border-r-0">
                      {renderCell(
                        rowIndex,
                        column.key,
                        row[column.key] || '',
                        column,
                      )}
                    </td>
                  ))}
                  {allowRemoveRows && (
                    <td className="px-3 py-2 text-sm text-center">
                      <button
                        onClick={() => handleRemoveRow(rowIndex)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Xóa dòng này"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            
            {/* Empty state */}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (allowRemoveRows ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                  <div className="space-y-2">
                    <div className="text-lg">📋</div>
                    <div>Chưa có dữ liệu</div>
                    <div className="text-sm">
                      Nhấn "Thêm dòng" hoặc paste dữ liệu (Ctrl+V) để bắt đầu
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Error Summary */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            ⚠️ Lỗi xác thực ({errors.length})
          </h4>
          <div className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
            {errors.slice(0, 10).map((error, index) => (
              <div key={index}>
                Dòng {error.row + 1}, Cột {error.column}: {error.message}
              </div>
            ))}
            {errors.length > 10 && (
              <div className="text-red-600 font-medium">
                ... và {errors.length - 10} lỗi khác
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="font-medium text-blue-800 mb-2">
          💡 Hướng dẫn sử dụng:
        </p>
        <ul className="text-blue-700 space-y-1">
          <li>• <strong>Click</strong> vào ô để chỉnh sửa</li>
          <li>• <strong>Enter</strong> để lưu, <strong>Escape</strong> để hủy</li>
          <li>• <strong>Tab</strong> để chuyển sang ô tiếp theo</li>
          <li>• <strong>Ctrl+V</strong> để paste dữ liệu từ Excel/Google Sheets</li>
          <li>• Các trường có dấu <span className="text-red-500">*</span> là bắt buộc</li>
        </ul>
      </div>
    </div>
  );
};

export default EditableDataGrid;
