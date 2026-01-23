import React, { useState } from 'react';
import EditableDataGrid from '../components/ImportExport/EditableDataGrid';
import { ImportError } from '../types';

const EditableGridDemoPage: React.FC = () => {
  // Sample data for products
  const [productData, setProductData] = useState([
    {
      productCode: 'SP001',
      productName: 'Cà phê đen',
      category: 'Đồ uống',
      unit: 'ly',
      price: 25000,
      description: 'Cà phê đen truyền thống'
    },
    {
      productCode: 'SP002',
      productName: 'Bánh mì thịt',
      category: 'Thức ăn',
      unit: 'cái',
      price: 15000,
      description: 'Bánh mì thịt nướng'
    }
  ]);

  // Sample data for inventory
  const [inventoryData, setInventoryData] = useState([
    {
      productCode: 'SP001',
      rawMaterialStock: 100,
      finishedProductStock: 50,
      recordDate: '2024-01-15',
      notes: 'Kiểm kho định kỳ'
    },
    {
      productCode: 'SP002',
      rawMaterialStock: 200,
      finishedProductStock: 30,
      recordDate: '2024-01-15',
      notes: 'Nhập hàng mới'
    }
  ]);

  // Sample errors
  const [errors] = useState<ImportError[]>([
    {
      row: 0,
      column: 'price',
      message: 'Giá phải lớn hơn 0'
    }
  ]);

  // Column definitions for products
  const productColumns = [
    {
      key: 'productCode',
      label: 'Mã sản phẩm',
      required: true,
      type: 'text' as const,
      validation: (value: any) => {
        if (!value) return 'Mã sản phẩm không được để trống';
        if (!/^SP\d{3}$/.test(value)) return 'Mã sản phẩm phải có định dạng SP001';
        return null;
      }
    },
    {
      key: 'productName',
      label: 'Tên sản phẩm',
      required: true,
      type: 'text' as const
    },
    {
      key: 'category',
      label: 'Danh mục',
      required: false,
      type: 'select' as const,
      options: ['Đồ uống', 'Thức ăn', 'Nguyên liệu', 'Khác']
    },
    {
      key: 'unit',
      label: 'Đơn vị',
      required: true,
      type: 'select' as const,
      options: ['kg', 'lít', 'cái', 'hộp', 'ly', 'phần']
    },
    {
      key: 'price',
      label: 'Giá (VNĐ)',
      required: false,
      type: 'number' as const,
      validation: (value: any) => {
        if (value && value < 0) return 'Giá phải lớn hơn hoặc bằng 0';
        return null;
      }
    },
    {
      key: 'description',
      label: 'Mô tả',
      required: false,
      type: 'text' as const
    }
  ];

  // Column definitions for inventory
  const inventoryColumns = [
    {
      key: 'productCode',
      label: 'Mã sản phẩm',
      required: true,
      type: 'text' as const
    },
    {
      key: 'rawMaterialStock',
      label: 'Tồn nguyên liệu',
      required: true,
      type: 'number' as const,
      validation: (value: any) => {
        if (value < 0) return 'Số lượng tồn không được âm';
        return null;
      }
    },
    {
      key: 'finishedProductStock',
      label: 'Tồn thành phẩm',
      required: true,
      type: 'number' as const,
      validation: (value: any) => {
        if (value < 0) return 'Số lượng tồn không được âm';
        return null;
      }
    },
    {
      key: 'recordDate',
      label: 'Ngày ghi nhận',
      required: true,
      type: 'date' as const
    },
    {
      key: 'notes',
      label: 'Ghi chú',
      required: false,
      type: 'text' as const
    }
  ];

  const [activeTab, setActiveTab] = useState<'products' | 'inventory'>('products');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📊 Demo Bảng Nhập Liệu Excel-like
        </h1>
        <p className="text-gray-600">
          Giao diện nhập liệu giống Excel/Google Sheets với khả năng chỉnh sửa trực tiếp từng ô
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🛍️ Sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'inventory'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📦 Tồn kho
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quản lý danh sách sản phẩm
            </h2>
            <EditableDataGrid
              data={productData}
              errors={errors}
              onDataChange={setProductData}
              columns={productColumns}
              maxRows={50}
              allowAddRows={true}
              allowRemoveRows={true}
            />
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quản lý tồn kho
            </h2>
            <EditableDataGrid
              data={inventoryData}
              errors={[]}
              onDataChange={setInventoryData}
              columns={inventoryColumns}
              maxRows={100}
              allowAddRows={true}
              allowRemoveRows={true}
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          🎯 Hướng dẫn sử dụng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Chỉnh sửa dữ liệu:</h4>
            <ul className="space-y-1">
              <li>• Click vào ô để chỉnh sửa</li>
              <li>• Enter để lưu, Escape để hủy</li>
              <li>• Tab để chuyển sang ô tiếp theo</li>
              <li>• Các trường có dấu * là bắt buộc</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Nhập dữ liệu hàng loạt:</h4>
            <ul className="space-y-1">
              <li>• Ctrl+V để paste từ Excel/Google Sheets</li>
              <li>• Dữ liệu sẽ được tự động phân tích</li>
              <li>• Lỗi validation sẽ được hiển thị</li>
              <li>• Thêm/xóa dòng bằng các nút tương ứng</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Dữ liệu hiện tại (JSON)
        </h3>
        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
          {JSON.stringify(activeTab === 'products' ? productData : inventoryData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default EditableGridDemoPage;
