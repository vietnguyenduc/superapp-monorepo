import React, { useState, useEffect } from 'react';

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

interface ColumnEditModalProps {
  column: ColumnConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (column: ColumnConfig) => void;
  isNewColumn?: boolean;
}

const ColumnEditModal: React.FC<ColumnEditModalProps> = ({
  column,
  isOpen,
  onClose,
  onSave,
  isNewColumn = false
}) => {
  const [formData, setFormData] = useState<ColumnConfig>({
    id: '',
    key: '',
    label: '',
    type: 'text',
    width: '120px',
    required: false,
    visible: true,
    order: 1,
    selectOptions: []
  });

  const [selectOptionsText, setSelectOptionsText] = useState('');

  useEffect(() => {
    if (column) {
      setFormData(column);
      setSelectOptionsText(column.selectOptions?.join(', ') || '');
    } else if (isNewColumn) {
      setFormData({
        id: '',
        key: '',
        label: '',
        type: 'text',
        width: '120px',
        required: false,
        visible: true,
        order: 1,
        selectOptions: []
      });
      setSelectOptionsText('');
    }
  }, [column, isNewColumn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.key || !formData.label) {
      alert('Vui lòng điền đầy đủ Key và Label!');
      return;
    }

    // Process select options
    const selectOptions = formData.type === 'select' 
      ? selectOptionsText.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0)
      : undefined;

    const updatedColumn: ColumnConfig = {
      ...formData,
      selectOptions
    };

    onSave(updatedColumn);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isNewColumn ? '➕ Thêm cột mới' : '✏️ Chỉnh sửa cột'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key (tên field) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="vd: tenSanPham, giaBan..."
              required
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label (hiển thị) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="vd: Tên sản phẩm, Giá bán..."
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kiểu dữ liệu
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">📝 Text</option>
              <option value="number">🔢 Number</option>
              <option value="date">📅 Date</option>
              <option value="boolean">☑️ Boolean</option>
              <option value="select">📋 Select (Dropdown)</option>
            </select>
          </div>

          {/* Select Options (only show if type is select) */}
          {formData.type === 'select' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tùy chọn Dropdown
              </label>
              <textarea
                value={selectOptionsText}
                onChange={(e) => setSelectOptionsText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập các tùy chọn, cách nhau bằng dấu phẩy&#10;vd: Đang bán, Ngưng bán, Hết hàng"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Cách nhau bằng dấu phẩy (,)
              </p>
            </div>
          )}

          {/* Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Độ rộng cột
            </label>
            <select
              value={formData.width}
              onChange={(e) => setFormData({ ...formData, width: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="80px">80px - Rất nhỏ</option>
              <option value="100px">100px - Nhỏ</option>
              <option value="120px">120px - Vừa</option>
              <option value="150px">150px - Trung bình</option>
              <option value="200px">200px - Lớn</option>
              <option value="250px">250px - Rất lớn</option>
              <option value="auto">auto - Tự động</option>
            </select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
                ⚠️ Trường bắt buộc
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="visible"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="visible" className="ml-2 block text-sm text-gray-900">
                👁️ Hiển thị cột
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isNewColumn ? '➕ Thêm' : '💾 Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ColumnEditModal;
