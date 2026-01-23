import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface ColumnConfig {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customRule?: string;
  };
  order: number;
  visible: boolean;
}

interface DataImportSettingsPageProps {
  dataType?: 'products' | 'inventory' | 'sales';
}

const DataImportSettingsPage: React.FC<DataImportSettingsPageProps> = ({
  dataType = 'products'
}) => {
  // Default column configurations for different data types
  const getDefaultColumns = (type: string): ColumnConfig[] => {
    switch (type) {
      case 'products':
        return [
          { key: 'productCode', label: 'Mã sản phẩm', required: true, type: 'text', order: 1, visible: true },
          { key: 'productName', label: 'Tên sản phẩm', required: true, type: 'text', order: 2, visible: true },
          { key: 'category', label: 'Danh mục', required: false, type: 'select', options: ['Đồ uống', 'Thức ăn', 'Nguyên liệu'], order: 3, visible: true },
          { key: 'unit', label: 'Đơn vị', required: true, type: 'select', options: ['kg', 'lít', 'cái', 'hộp'], order: 4, visible: true },
          { key: 'price', label: 'Giá', required: false, type: 'number', validation: { min: 0 }, order: 5, visible: true },
          { key: 'description', label: 'Mô tả', required: false, type: 'text', order: 6, visible: true },
        ];
      case 'inventory':
        return [
          { key: 'productCode', label: 'Mã sản phẩm', required: true, type: 'text', order: 1, visible: true },
          { key: 'rawMaterialStock', label: 'Tồn nguyên liệu', required: true, type: 'number', validation: { min: 0 }, order: 2, visible: true },
          { key: 'finishedProductStock', label: 'Tồn thành phẩm', required: true, type: 'number', validation: { min: 0 }, order: 3, visible: true },
          { key: 'recordDate', label: 'Ngày ghi nhận', required: true, type: 'date', order: 4, visible: true },
          { key: 'notes', label: 'Ghi chú', required: false, type: 'text', order: 5, visible: true },
        ];
      case 'sales':
        return [
          { key: 'productCode', label: 'Mã sản phẩm', required: true, type: 'text', order: 1, visible: true },
          { key: 'salesQuantity', label: 'Số lượng bán', required: true, type: 'number', validation: { min: 0 }, order: 2, visible: true },
          { key: 'promotionQuantity', label: 'Số lượng khuyến mãi', required: false, type: 'number', validation: { min: 0 }, order: 3, visible: true },
          { key: 'saleDate', label: 'Ngày bán', required: true, type: 'date', order: 4, visible: true },
          { key: 'notes', label: 'Ghi chú', required: false, type: 'text', order: 5, visible: true },
        ];
      default:
        return [];
    }
  };

  const [columns, setColumns] = useState<ColumnConfig[]>(getDefaultColumns(dataType));
  const [selectedColumn, setSelectedColumn] = useState<ColumnConfig | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);

  // Handle drag end for reordering columns
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setColumns(updatedItems);
  }, [columns]);

  // Update column configuration
  const updateColumn = useCallback((updatedColumn: ColumnConfig) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === updatedColumn.key ? updatedColumn : col
      )
    );
    setSelectedColumn(updatedColumn);
  }, []);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  }, []);

  // Add new column
  const addNewColumn = useCallback((newColumn: Omit<ColumnConfig, 'order'>) => {
    const maxOrder = Math.max(...columns.map(col => col.order), 0);
    setColumns(prev => [...prev, { ...newColumn, order: maxOrder + 1 }]);
    setShowAddColumn(false);
  }, [columns]);

  // Remove column
  const removeColumn = useCallback((columnKey: string) => {
    setColumns(prev => prev.filter(col => col.key !== columnKey));
    if (selectedColumn?.key === columnKey) {
      setSelectedColumn(null);
    }
  }, [selectedColumn]);

  // Save settings
  const saveSettings = useCallback(() => {
    const settings = {
      dataType,
      columns: columns.sort((a, b) => a.order - b.order),
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(`import-settings-${dataType}`, JSON.stringify(settings));
    alert('Đã lưu cài đặt thành công!');
  }, [dataType, columns]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    if (confirm('Bạn có chắc muốn khôi phục cài đặt mặc định?')) {
      setColumns(getDefaultColumns(dataType));
      setSelectedColumn(null);
    }
  }, [dataType]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ⚙️ Cài Đặt Nhập Liệu
            </h1>
            <p className="text-gray-600 mt-1">
              Cấu hình cột dữ liệu, thứ tự hiển thị và ràng buộc cho {dataType === 'products' ? 'sản phẩm' : dataType === 'inventory' ? 'tồn kho' : 'bán hàng'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={resetToDefault}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              🔄 Khôi phục mặc định
            </button>
            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              💾 Lưu cài đặt
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column List & Reordering */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              📋 Danh Sách Cột
            </h2>
            <button
              onClick={() => setShowAddColumn(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              ➕ Thêm cột
            </button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {columns
                    .sort((a, b) => a.order - b.order)
                    .map((column, index) => (
                      <Draggable
                        key={column.key}
                        draggableId={column.key}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedColumn?.key === column.key
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            onClick={() => setSelectedColumn(column)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  ⋮⋮
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={column.visible}
                                    onChange={() => toggleColumnVisibility(column.key)}
                                    className="rounded"
                                  />
                                  <span className="font-medium text-gray-900">
                                    {column.label}
                                  </span>
                                  {column.required && (
                                    <span className="text-red-500 text-sm">*</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {column.type}
                                </span>
                                <span className="text-xs text-gray-500">
                                  #{column.order}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeColumn(column.key);
                                  }}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Column Configuration Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🔧 Cấu Hình Cột
          </h2>

          {selectedColumn ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={selectedColumn.label}
                  onChange={(e) => updateColumn({ ...selectedColumn, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kiểu dữ liệu
                </label>
                <select
                  value={selectedColumn.type}
                  onChange={(e) => updateColumn({ ...selectedColumn, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="text">Văn bản</option>
                  <option value="number">Số</option>
                  <option value="date">Ngày tháng</option>
                  <option value="select">Lựa chọn</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={selectedColumn.required}
                  onChange={(e) => updateColumn({ ...selectedColumn, required: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                  Bắt buộc nhập
                </label>
              </div>

              {selectedColumn.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tùy chọn (mỗi dòng một giá trị)
                  </label>
                  <textarea
                    value={selectedColumn.options?.join('\n') || ''}
                    onChange={(e) => updateColumn({ 
                      ...selectedColumn, 
                      options: e.target.value.split('\n').filter(Boolean) 
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tùy chọn 1&#10;Tùy chọn 2&#10;Tùy chọn 3"
                  />
                </div>
              )}

              {selectedColumn.type === 'number' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Ràng buộc số</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Giá trị tối thiểu</label>
                      <input
                        type="number"
                        value={selectedColumn.validation?.min || ''}
                        onChange={(e) => updateColumn({
                          ...selectedColumn,
                          validation: {
                            ...selectedColumn.validation,
                            min: e.target.value ? Number(e.target.value) : undefined
                          }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Giá trị tối đa</label>
                      <input
                        type="number"
                        value={selectedColumn.validation?.max || ''}
                        onChange={(e) => updateColumn({
                          ...selectedColumn,
                          validation: {
                            ...selectedColumn.validation,
                            max: e.target.value ? Number(e.target.value) : undefined
                          }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedColumn.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Định dạng (Regex)
                  </label>
                  <input
                    type="text"
                    value={selectedColumn.validation?.pattern || ''}
                    onChange={(e) => updateColumn({
                      ...selectedColumn,
                      validation: {
                        ...selectedColumn.validation,
                        pattern: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="^[A-Z]{2}[0-9]{4}$"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ví dụ: ^[A-Z]{2}[0-9]{4}$ (2 chữ cái + 4 số)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">👆</div>
              <p>Chọn một cột để cấu hình</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          👀 Xem Trước Bảng Nhập Liệu
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns
                  .filter(col => col.visible)
                  .sort((a, b) => a.order - b.order)
                  .map((column) => (
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {columns
                  .filter(col => col.visible)
                  .sort((a, b) => a.order - b.order)
                  .map((column) => (
                    <td key={column.key} className="px-3 py-4 text-sm text-gray-500">
                      {column.type === 'select' ? (
                        <select className="border border-gray-300 rounded px-2 py-1 text-xs">
                          <option>-- Chọn --</option>
                          {column.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                          placeholder={`Nhập ${column.label.toLowerCase()}...`}
                        />
                      )}
                    </td>
                  ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Column Modal */}
      {showAddColumn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">➕ Thêm Cột Mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã cột (key)
                </label>
                <input
                  type="text"
                  id="newColumnKey"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="productCode"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  id="newColumnLabel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mã sản phẩm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kiểu dữ liệu
                </label>
                <select
                  id="newColumnType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="text">Văn bản</option>
                  <option value="number">Số</option>
                  <option value="date">Ngày tháng</option>
                  <option value="select">Lựa chọn</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddColumn(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const key = (document.getElementById('newColumnKey') as HTMLInputElement).value;
                  const label = (document.getElementById('newColumnLabel') as HTMLInputElement).value;
                  const type = (document.getElementById('newColumnType') as HTMLSelectElement).value as any;
                  
                  if (key && label) {
                    addNewColumn({
                      key,
                      label,
                      type,
                      required: false,
                      visible: true,
                    });
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImportSettingsPage;
