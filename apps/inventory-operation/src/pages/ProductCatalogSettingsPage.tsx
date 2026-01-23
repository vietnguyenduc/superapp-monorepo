import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ColumnEditModal from '../components/ColumnEditModal';

// Column configuration interface
interface ColumnConfig {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  width: string;
  required: boolean;
  visible: boolean;
  order: number;
  selectOptions?: string[];
}

// Default column configurations
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: '1', key: 'ngayCapNhat', label: 'Ngày cập nhật', type: 'date', width: '120px', required: true, visible: true, order: 1 },
  { id: '2', key: 'loai', label: 'Loại', type: 'select', width: '100px', required: true, visible: true, order: 2, selectOptions: ['Đĩa trái cây', 'Nước ép', 'Smoothie'] },
  { id: '3', key: 'maNguyenVatLieu', label: 'Mã Nguyên vật liệu', type: 'text', width: '150px', required: true, visible: true, order: 3 },
  { id: '4', key: 'tenNguyenVatLieu', label: 'Tên Nguyên vật liệu', type: 'text', width: '200px', required: true, visible: true, order: 4 },
  { id: '5', key: 'thanhPham', label: 'Thành phẩm?', type: 'boolean', width: '100px', required: false, visible: true, order: 5 },
  { id: '6', key: 'dinhLuongXuat', label: 'Định lượng Xuất', type: 'number', width: '120px', required: false, visible: true, order: 6 },
  { id: '7', key: 'dinhLuongNhap', label: 'Định lượng Nhập', type: 'number', width: '120px', required: false, visible: true, order: 7 },
  { id: '8', key: 'maSPKD', label: 'Mã SP KD', type: 'text', width: '100px', required: false, visible: true, order: 8 },
  { id: '9', key: 'tenThanhPham', label: 'Tên Thành phẩm', type: 'text', width: '200px', required: true, visible: true, order: 9 },
  { id: '10', key: 'dvtNhap', label: 'ĐVT Nhập', type: 'select', width: '80px', required: false, visible: true, order: 10, selectOptions: ['đĩa', 'ly', 'kg', 'gram', 'trái'] },
  { id: '11', key: 'dvtXuat', label: 'ĐVT Xuất', type: 'select', width: '80px', required: false, visible: true, order: 11, selectOptions: ['đĩa', 'ly', 'kg', 'gram', 'trái'] },
  { id: '12', key: 'tinhTrang', label: 'Tình trạng', type: 'select', width: '100px', required: true, visible: true, order: 12, selectOptions: ['Đang bán', 'Ngưng bán', 'Hết hàng'] }
];

const ProductCatalogSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load saved configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('productCatalogColumns');
    if (savedConfig) {
      try {
        setColumns(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading saved column config:', error);
      }
    }
  }, []);

  // Save configuration to localStorage
  const saveConfiguration = () => {
    localStorage.setItem('productCatalogColumns', JSON.stringify(columns));
    alert('✅ Cấu hình đã được lưu thành công!');
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    setColumns(updatedItems);
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Toggle required field
  const toggleRequired = (columnId: string) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, required: !col.required } : col
    ));
  };

  // Update column configuration
  const updateColumn = (updatedColumn: ColumnConfig) => {
    setColumns(columns.map(col => 
      col.id === updatedColumn.id ? updatedColumn : col
    ));
    setEditingColumn(null);
    setShowEditModal(false);
  };

  // Add new column
  const addNewColumn = (newColumn: ColumnConfig) => {
    const newId = (Math.max(...columns.map(c => parseInt(c.id))) + 1).toString();
    const newOrder = Math.max(...columns.map(c => c.order)) + 1;
    
    setColumns([...columns, {
      ...newColumn,
      id: newId,
      order: newOrder
    }]);
    setShowAddColumn(false);
    setShowEditModal(false);
  };

  // Open edit modal
  const openEditModal = (column: ColumnConfig) => {
    setEditingColumn(column);
    setShowEditModal(true);
  };

  // Open add modal
  const openAddModal = () => {
    setEditingColumn(null);
    setShowAddColumn(true);
    setShowEditModal(true);
  };

  // Close modal
  const closeModal = () => {
    setEditingColumn(null);
    setShowAddColumn(false);
    setShowEditModal(false);
  };

  // Delete column
  const deleteColumn = (columnId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa cột này?')) {
      setColumns(columns.filter(col => col.id !== columnId));
    }
  };

  // Reset to default
  const resetToDefault = () => {
    if (confirm('Bạn có chắc chắn muốn reset về cấu hình mặc định?')) {
      setColumns(DEFAULT_COLUMNS);
      localStorage.removeItem('productCatalogColumns');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cấu hình bảng Danh mục</h1>
          <p className="mt-2 text-gray-600">
            Tùy chỉnh thứ tự cột, kiểu dữ liệu, trường bắt buộc và hiển thị
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/product-management')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ← Quay lại
          </button>
          <button
            onClick={resetToDefault}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            🔄 Reset mặc định
          </button>
          <button
            onClick={saveConfiguration}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            💾 Lưu cấu hình
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Tổng cột</div>
          <div className="text-2xl font-bold text-blue-600">{columns.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Đang hiển thị</div>
          <div className="text-2xl font-bold text-green-600">{columns.filter(c => c.visible).length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Bắt buộc</div>
          <div className="text-2xl font-bold text-red-600">{columns.filter(c => c.required).length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Ẩn</div>
          <div className="text-2xl font-bold text-gray-600">{columns.filter(c => !c.visible).length}</div>
        </div>
      </div>

      {/* Column Configuration */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">⚙️ Cấu hình cột</h3>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              + Thêm cột
            </button>
          </div>
        </div>

        <div className="p-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {columns.map((column, index) => (
                    <Draggable key={column.id} draggableId={column.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 border rounded-lg ${
                            snapshot.isDragging ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* Drag Handle */}
                              <div {...provided.dragHandleProps} className="cursor-move text-gray-400">
                                ⋮⋮
                              </div>
                              
                              {/* Column Info */}
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium text-gray-900">{column.label}</span>
                                  <span className="text-sm text-gray-500">({column.key})</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    column.type === 'text' ? 'bg-blue-100 text-blue-800' :
                                    column.type === 'number' ? 'bg-green-100 text-green-800' :
                                    column.type === 'date' ? 'bg-purple-100 text-purple-800' :
                                    column.type === 'boolean' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-pink-100 text-pink-800'
                                  }`}>
                                    {column.type}
                                  </span>
                                  <span className="text-sm text-gray-500">W: {column.width}</span>
                                </div>
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center space-x-2">
                              {/* Visible Toggle */}
                              <button
                                onClick={() => toggleColumnVisibility(column.id)}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  column.visible 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                {column.visible ? '👁️ Hiển thị' : '🙈 Ẩn'}
                              </button>

                              {/* Required Toggle */}
                              <button
                                onClick={() => toggleRequired(column.id)}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  column.required 
                                    ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                {column.required ? '⚠️ Bắt buộc' : '📝 Tùy chọn'}
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => openEditModal(column)}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200"
                              >
                                ✏️ Sửa
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => deleteColumn(column.id)}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200"
                              >
                                🗑️ Xóa
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
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Hướng dẫn sử dụng:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h5 className="font-medium mb-1">🎯 Tính năng chính:</h5>
            <ul className="space-y-1">
              <li>• <strong>Kéo thả:</strong> Thay đổi thứ tự cột</li>
              <li>• <strong>Hiển thị/Ẩn:</strong> Toggle visibility cột</li>
              <li>• <strong>Bắt buộc:</strong> Đánh dấu trường required</li>
              <li>• <strong>Data types:</strong> text, number, date, boolean, select</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-1">⚙️ Thao tác:</h5>
            <ul className="space-y-1">
              <li>• <strong>Sửa:</strong> Click "✏️ Sửa" để chỉnh sửa chi tiết</li>
              <li>• <strong>Thêm:</strong> Click "+ Thêm cột" để tạo cột mới</li>
              <li>• <strong>Lưu:</strong> Click "💾 Lưu cấu hình" để áp dụng</li>
              <li>• <strong>Reset:</strong> Click "🔄 Reset" để về mặc định</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Column Edit Modal */}
      <ColumnEditModal
        column={editingColumn}
        isOpen={showEditModal}
        onClose={closeModal}
        onSave={showAddColumn ? addNewColumn : updateColumn}
        isNewColumn={showAddColumn}
      />
    </div>
  );
};

export default ProductCatalogSettingsPage;
