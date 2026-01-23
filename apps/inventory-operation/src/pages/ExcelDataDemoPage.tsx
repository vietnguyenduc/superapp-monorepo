import React, { useState } from 'react';

// Real Excel data from "Quản Lý danh mục" file
const EXCEL_DATA = [
  // Nguyên liệu - Raw Materials
  { id: 'NL001', code: 'NL-001', name: 'Đường trắng', unit: 'Kg', price: 24000, category: 'Nguyên liệu', notes: 'Đường tinh luyện trắng' },
  { id: 'NL002', code: 'NL-002', name: 'Cà phê hạt', unit: 'Kg', price: 180000, category: 'Nguyên liệu', notes: 'Cà phê Robusta rang vừa' },
  { id: 'NL003', code: 'NL-003', name: 'Sữa tươi', unit: 'Lít', price: 28000, category: 'Nguyên liệu', notes: 'Sữa tươi không đường' },
  { id: 'NL004', code: 'NL-004', name: 'Trà xanh', unit: 'Gói', price: 15000, category: 'Nguyên liệu', notes: 'Trà xanh túi lọc 100g' },
  { id: 'NL005', code: 'NL-005', name: 'Bột mì', unit: 'Kg', price: 22000, category: 'Nguyên liệu', notes: 'Bột mì đa dụng số 8' },
  
  // Thành phẩm - Finished Products
  { id: 'TP001', code: 'TP-001', name: 'Cà phê đen', unit: 'Ly', price: 20000, category: 'Đồ uống', notes: 'Cà phê phin truyền thống' },
  { id: 'TP002', code: 'TP-002', name: 'Cà phê sữa', unit: 'Ly', price: 25000, category: 'Đồ uống', notes: 'Cà phê phin với sữa đặc' },
  { id: 'TP003', code: 'TP-003', name: 'Trà sữa trân châu', unit: 'Ly', price: 35000, category: 'Đồ uống', notes: 'Trà sữa Đài Loan với trân châu đen' },
  { id: 'TP004', code: 'TP-004', name: 'Trà xanh đá', unit: 'Ly', price: 18000, category: 'Đồ uống', notes: 'Trà xanh pha lạnh' },
  { id: 'TP005', code: 'TP-005', name: 'Bánh mì thịt nướng', unit: 'Ổ', price: 25000, category: 'Thức ăn', notes: 'Bánh mì Việt Nam với thịt nướng' },
  { id: 'TP006', code: 'TP-006', name: 'Bánh croissant', unit: 'Cái', price: 30000, category: 'Bánh ngọt', notes: 'Bánh croissant bơ Pháp' },
  { id: 'TP007', code: 'TP-007', name: 'Bánh tiramisu', unit: 'Phần', price: 45000, category: 'Bánh ngọt', notes: 'Bánh tiramisu Ý truyền thống' },
  { id: 'TP008', code: 'TP-008', name: 'Nước cam vắt', unit: 'Ly', price: 30000, category: 'Nước ép', notes: 'Cam tươi vắt 100%' },
  { id: 'TP009', code: 'TP-009', name: 'Smoothie xoài', unit: 'Ly', price: 40000, category: 'Smoothie', notes: 'Xoài tươi xay với sữa chua' },
  { id: 'TP010', code: 'TP-010', name: 'Smoothie dâu', unit: 'Ly', price: 42000, category: 'Smoothie', notes: 'Dâu tây tươi xay với sữa' },
  
  // Combo & Set
  { id: 'CB001', code: 'CB-001', name: 'Combo sáng', unit: 'Set', price: 55000, category: 'Combo', notes: 'Cà phê sữa + Bánh mì + Trứng ốp la' },
  { id: 'CB002', code: 'CB-002', name: 'Combo chiều', unit: 'Set', price: 65000, category: 'Combo', notes: 'Trà sữa + Bánh ngọt + Snack' }
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

const ExcelDataDemoPage: React.FC = () => {
  const [data, setData] = useState(EXCEL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});

  // Filter data based on search and category
  const filteredData = data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(data.map(item => item.category)));

  // Statistics
  const stats = {
    total: data.length,
    totalValue: data.reduce((sum, item) => sum + item.price, 0),
    categories: categories.length,
    avgPrice: data.reduce((sum, item) => sum + item.price, 0) / data.length
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditingData({ ...item });
  };

  const handleSave = () => {
    setData(data.map(item => 
      item.id === editingId ? { ...editingData } : item
    ));
    setEditingId(null);
    setEditingData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      setData(data.filter(item => item.id !== id));
    }
  };

  const addNewItem = () => {
    const newId = 'NEW' + Date.now();
    const newItem = {
      id: newId,
      code: '',
      name: '',
      unit: 'Ly',
      price: 0,
      category: 'Đồ uống',
      notes: ''
    };
    setData([...data, newItem]);
    setEditingId(newId);
    setEditingData(newItem);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Demo: Data Excel "Quản Lý danh mục"
          </h1>
          <p className="text-gray-600">
            Test data thực tế từ file Excel với giao diện Excel-like editing
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Tổng sản phẩm</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Loại sản phẩm</div>
            <div className="text-2xl font-bold text-green-600">{stats.categories}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Tổng giá trị</div>
            <div className="text-2xl font-bold text-purple-600">{formatPrice(stats.totalValue)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Giá trung bình</div>
            <div className="text-2xl font-bold text-orange-600">{formatPrice(stats.avgPrice)}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <input
                type="text"
                placeholder="🔍 Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả loại</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addNewItem}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Thêm sản phẩm
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá bán</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {editingId === item.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={editingData.code}
                            onChange={(e) => setEditingData({...editingData, code: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={editingData.name}
                            onChange={(e) => setEditingData({...editingData, name: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={editingData.unit}
                            onChange={(e) => setEditingData({...editingData, unit: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="Ly">Ly</option>
                            <option value="Cái">Cái</option>
                            <option value="Phần">Phần</option>
                            <option value="Ổ">Ổ</option>
                            <option value="Set">Set</option>
                            <option value="Kg">Kg</option>
                            <option value="Gói">Gói</option>
                            <option value="Lít">Lít</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={editingData.price}
                            onChange={(e) => setEditingData({...editingData, price: parseInt(e.target.value) || 0})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={editingData.category}
                            onChange={(e) => setEditingData({...editingData, category: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={editingData.notes}
                            onChange={(e) => setEditingData({...editingData, notes: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={handleSave}
                            className="text-green-600 hover:text-green-800 mr-3"
                          >
                            ✅
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            ❌
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {item.notes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            🗑️
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>📊 Hiển thị {filteredData.length} / {data.length} sản phẩm</p>
          <p className="mt-2">
            ✨ Demo data thực tế từ file Excel "Quản Lý danh mục" với tính năng Excel-like editing
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExcelDataDemoPage;
