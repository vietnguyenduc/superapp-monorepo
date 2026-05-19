import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'dropdown' | 'date';
  required: boolean;
  enabled: boolean;
  order: number;
  options?: string[];
  format?: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { 
    key: 'productCode', 
    label: 'Mã hàng', 
    type: 'text', 
    required: true, 
    enabled: true, 
    order: 1 
  },
  { 
    key: 'productName', 
    label: 'Tên hàng', 
    type: 'text', 
    required: true, 
    enabled: true, 
    order: 2 
  },
  { 
    key: 'unit', 
    label: 'Đơn vị', 
    type: 'dropdown', 
    options: ['Ly', 'Cái', 'Phần', 'Ổ', 'Set', 'Kg', 'Gói', 'Lít', 'Gram', 'Chai', 'Hộp'], 
    required: true, 
    enabled: true, 
    order: 3 
  },
  { 
    key: 'price', 
    label: 'Giá bán', 
    type: 'number', 
    required: true, 
    enabled: true, 
    order: 4,
    format: 'currency'
  },
  { 
    key: 'category', 
    label: 'Loại sản phẩm', 
    type: 'dropdown', 
    options: ['Nguyên liệu', 'Đồ uống', 'Thức ăn', 'Bánh ngọt', 'Nước ép', 'Smoothie', 'Combo', 'Khác'], 
    required: true, 
    enabled: true, 
    order: 5 
  },
  { 
    key: 'supplier', 
    label: 'Nhà cung cấp', 
    type: 'text', 
    required: false, 
    enabled: false, 
    order: 6 
  },
  { 
    key: 'expiryDate', 
    label: 'Hạn sử dụng', 
    type: 'date', 
    required: false, 
    enabled: false, 
    order: 7,
    format: 'dd/mm/yyyy'
  },
  { 
    key: 'stockQuantity', 
    label: 'Số lượng tồn', 
    type: 'number', 
    required: false, 
    enabled: false, 
    order: 8 
  },
  { 
    key: 'notes', 
    label: 'Ghi chú', 
    type: 'text', 
    required: false, 
    enabled: true, 
    order: 9 
  }
];

const ImportSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('import-column-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setColumns(parsed);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('import-column-settings', JSON.stringify(columns));
    alert('Đã lưu cài đặt thành công!');
  };

  // Reset to default
  const resetToDefault = () => {
    if (confirm('Bạn có chắc muốn khôi phục cài đặt mặc định?')) {
      setColumns(DEFAULT_COLUMNS);
      localStorage.removeItem('import-column-settings');
    }
  };

  // Toggle column enabled/disabled
  const toggleColumn = (index: number) => {
    const newColumns = [...columns];
    newColumns[index].enabled = !newColumns[index].enabled;
    setColumns(newColumns);
  };

  // Update column property
  const updateColumn = (index: number, property: keyof ColumnConfig, value: any) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [property]: value };
    setColumns(newColumns);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newColumns = [...columns];
    const draggedColumn = newColumns[draggedIndex];
    
    // Remove dragged item
    newColumns.splice(draggedIndex, 1);
    
    // Insert at new position
    newColumns.splice(dropIndex, 0, draggedColumn);
    
    // Update order numbers
    newColumns.forEach((col, index) => {
      col.order = index + 1;
    });

    setColumns(newColumns);
    setDraggedIndex(null);
  };

  // Move column up/down
  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const newColumns = [...columns];
    [newColumns[index], newColumns[newIndex]] = [newColumns[newIndex], newColumns[index]];
    
    // Update order numbers
    newColumns.forEach((col, idx) => {
      col.order = idx + 1;
    });

    setColumns(newColumns);
  };

  // Add custom options to dropdown
  const addDropdownOption = (columnIndex: number, newOption: string) => {
    if (!newOption.trim()) return;
    
    const newColumns = [...columns];
    const column = newColumns[columnIndex];
    if (column.options && !column.options.includes(newOption)) {
      column.options.push(newOption);
      setColumns(newColumns);
    }
  };

  // Remove dropdown option
  const removeDropdownOption = (columnIndex: number, optionIndex: number) => {
    const newColumns = [...columns];
    const column = newColumns[columnIndex];
    if (column.options) {
      column.options.splice(optionIndex, 1);
      setColumns(newColumns);
    }
  };

  const enabledColumns = columns.filter(col => col.enabled);
  const disabledColumns = columns.filter(col => !col.enabled);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚙️ Cài đặt cột nhập liệu</h1>
            <p className="text-gray-600">Tùy chỉnh thứ tự, định dạng và hiển thị các cột</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetToDefault}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              🔄 Khôi phục mặc định
            </button>
            <button
              onClick={() => navigate('/product-import')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ← Quay lại nhập liệu
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enabled Columns */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ✅ Cột hiển thị ({enabledColumns.length})
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Kéo thả để sắp xếp thứ tự. Các cột này sẽ hiển thị trong bảng nhập liệu.
            </p>
            
            <div className="space-y-3">
              {columns.map((column, index) => {
                if (!column.enabled) return null;
                
                return (
                  <div
                    key={column.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">⋮⋮</span>
                        <div>
                          <span className="font-medium text-gray-900">{column.label}</span>
                          {column.required && <span className="text-red-500 ml-1">*</span>}
                          <div className="text-xs text-gray-500">
                            {column.type} • Thứ tự: {column.order}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveColumn(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveColumn(index, 'down')}
                          disabled={index === columns.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => toggleColumn(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          👁️‍🗨️
                        </button>
                      </div>
                    </div>

                    {/* Column Type Settings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Kiểu dữ liệu</label>
                        <select
                          value={column.type}
                          onChange={(e) => updateColumn(index, 'type', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="text">Văn bản</option>
                          <option value="number">Số</option>
                          <option value="dropdown">Dropdown</option>
                          <option value="date">Ngày tháng</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Bắt buộc</label>
                        <select
                          value={column.required ? 'true' : 'false'}
                          onChange={(e) => updateColumn(index, 'required', e.target.value === 'true')}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="false">Không</option>
                          <option value="true">Có</option>
                        </select>
                      </div>
                    </div>

                    {/* Dropdown Options */}
                    {column.type === 'dropdown' && (
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-2">Tùy chọn dropdown</label>
                        <div className="space-y-1">
                          {column.options?.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newColumns = [...columns];
                                  if (newColumns[index].options) {
                                    newColumns[index].options![optIndex] = e.target.value;
                                    setColumns(newColumns);
                                  }
                                }}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                              <button
                                onClick={() => removeDropdownOption(index, optIndex)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newOption = prompt('Nhập tùy chọn mới:');
                              if (newOption) addDropdownOption(index, newOption);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            + Thêm tùy chọn
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Format Settings */}
                    {(column.type === 'number' || column.type === 'date') && (
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1">Định dạng</label>
                        <input
                          type="text"
                          value={column.format || ''}
                          onChange={(e) => updateColumn(index, 'format', e.target.value)}
                          placeholder={column.type === 'number' ? 'currency, decimal' : 'dd/mm/yyyy, mm/dd/yyyy'}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disabled Columns */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ❌ Cột ẩn ({disabledColumns.length})
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Các cột này sẽ không hiển thị trong bảng nhập liệu. Click để bật lại.
            </p>
            
            <div className="space-y-2">
              {columns.map((column, index) => {
                if (column.enabled) return null;
                
                return (
                  <div
                    key={column.key}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-100 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-700">{column.label}</span>
                        <div className="text-xs text-gray-500">{column.type}</div>
                      </div>
                      <button
                        onClick={() => toggleColumn(index)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Bật
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Preview */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">🔍 Xem trước bảng nhập liệu</h3>
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {enabledColumns
                        .sort((a, b) => a.order - b.order)
                        .map((column) => (
                          <th key={column.key} className="px-2 py-2 text-left font-medium text-gray-700">
                            {column.label}
                            {column.required && <span className="text-red-500 ml-1">*</span>}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      {enabledColumns
                        .sort((a, b) => a.order - b.order)
                        .map((column) => (
                          <td key={column.key} className="px-2 py-2 text-gray-500">
                            {column.type === 'dropdown' ? 'Dropdown' : 
                             column.type === 'number' ? '0' :
                             column.type === 'date' ? 'dd/mm/yyyy' : 'Text'}
                          </td>
                        ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex justify-center mt-8">
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/product-import')}
              className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              onClick={saveSettings}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              💾 Lưu cài đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportSettingsPage;
