import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCatalogTable from '../components/ProductCatalogTable';
import { useProductCatalog } from '../hooks/useProductCatalog';
import { Product } from '../types';

const ProductCatalogPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    clearError,
  } = useProductCatalog({ autoLoad: true });

  const handleSubmit = async (data: Partial<Product>) => {
    if (editingProduct) {
      const result = await updateProduct(editingProduct.id, data);
      if (result.success) {
        setEditingProduct(null);
        setShowForm(false);
      }
    } else {
      const result = await createProduct(data as Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>);
      if (result.success) {
        setShowForm(false);
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      await deleteProduct(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleSearch = (query: string) => {
    searchProducts(query);
  };
      return;
    }

    // Check if product code already exists
    const existingProduct = products.find(p => p.productCode === newProduct.productCode);
    if (existingProduct) {
      alert('⚠️ Mã hàng đã tồn tại! Vui lòng chọn mã khác.');
      return;
    }

    // Validate product code format
    const codePattern = /^[A-Z]{2}\d{3}$/;
    if (!codePattern.test(newProduct.productCode)) {
      const confirm = window.confirm('⚠️ Mã hàng không theo định dạng khuyến nghị (2 chữ cái + 3 số). Bạn có muốn tiếp tục?');
      if (!confirm) return;
    }

    // Validate price range
    if (newProduct.price < 5000 || newProduct.price > 100000) {
      const confirm = window.confirm('⚠️ Giá bán nằm ngoài khoảng khuyến nghị (5,000 - 100,000 VNĐ). Bạn có muốn tiếp tục?');
      if (!confirm) return;
    }

    const newId = `NEW_${Date.now()}`;
    const productToAdd = {
      id: newId,
      productCode: newProduct.productCode,
      productName: newProduct.productName,
      unit: newProduct.unit as any,
      price: newProduct.price,
      category: newProduct.category as any,
      notes: newProduct.notes,
      isActive: newProduct.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Admin',
      updatedBy: 'Admin'
    };

    setProducts([...products, productToAdd]);
    setShowAddForm(false);
    
    // Reset form
    setNewProduct({
      productCode: '',
      productName: '',
      unit: 'Cái',
      price: 0,
      category: 'Khác',
      notes: '',
      isActive: true
    });

    alert('✅ Đã thêm sản phẩm mới thành công!');
  };

  // Get stats
  const activeProducts = products.filter(p => p.isActive).length;
  const inactiveProducts = products.filter(p => !p.isActive).length;

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
                <h1 className="text-2xl font-bold text-gray-900">Danh mục hàng hóa</h1>
                <p className="text-sm text-gray-600 mt-1">Quản lý danh mục, định mức, quy đổi với inline editing</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/import-settings')}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span className="mr-2">⚙️</span>
                Cấu hình bảng
              </button>
              <button
                onClick={() => navigate('/product-import')}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <span className="mr-2">📊</span>
                Nhập hàng loạt
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <span className="mr-2">➕</span>
                Thêm sản phẩm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <span className="mr-2">📊</span>
                <span className="font-medium">Tổng: {products.length}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">✅</span>
                <span className="font-medium">Đang bán: {activeProducts}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🚫</span>
                <span className="font-medium">Ngưng bán: {inactiveProducts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn vị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? '✅ Hoạt động' : '❌ Ngưng hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {product.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Enhanced Header with Instructions */}
            <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-3">
                    <span className="bg-green-100 text-green-800 p-2 rounded-full mr-3">➕</span>
                    Thêm sản phẩm mới vào danh mục
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    📝 Điền đầy đủ thông tin bên dưới để tạo sản phẩm mới trong hệ thống quản lý danh mục
                  </p>
                  
                  {/* Detailed Instructions */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm font-medium text-blue-900 mb-2">💡 Hướng dẫn nhập liệu:</div>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• <strong>Mã hàng</strong>: Phải duy nhất, định dạng khuyến nghị: 2 chữ cái + 3 số (VD: CF001)</li>
                        <li>• <strong>Tên hàng</strong>: Tên đầy đủ, dễ hiểu, không viết tắt</li>
                        <li>• <strong>Giá bán</strong>: Nhập theo VNĐ, phù hợp với thị trường F&B (5,000 - 100,000 VNĐ)</li>
                        <li>• <strong>Đơn vị & Loại</strong>: Chọn đúng để hệ thống validation và báo cáo chính xác</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="text-sm font-medium text-yellow-900 mb-2">⚠️ Lưu ý quan trọng:</div>
                      <ul className="text-xs text-yellow-800 space-y-1">
                        <li>• Mã hàng không được trùng với sản phẩm đã có</li>
                        <li>• Đơn vị phải phù hợp với loại sản phẩm</li>
                        <li>• Giá bán sẽ được kiểm tra tính hợp lý</li>
                        <li>• Ghi chú giúp nhân viên hiểu rõ sản phẩm hơn</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowAddForm(false)}
                  className="ml-4 text-gray-400 hover:text-gray-600 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="px-6 py-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Product Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProduct.productCode}
                    onChange={(e) => setNewProduct({...newProduct, productCode: e.target.value.toUpperCase()})}
                    placeholder="VD: CF001, TS002, BF003..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Định dạng khuyến nghị: 2 chữ cái + 3 số (CF001)</p>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProduct.productName}
                    onChange={(e) => setNewProduct({...newProduct, productName: e.target.value})}
                    placeholder="VD: Cà phê đen, Trà sữa trân châu, Bánh flan..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Tên đầy đủ, dễ hiểu cho khách hàng và nhân viên</p>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đơn vị <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cái">Cái</option>
                    <option value="Ly">Ly</option>
                    <option value="Gói">Gói</option>
                    <option value="Hộp">Hộp</option>
                    <option value="Chai">Chai</option>
                    <option value="Kg">Kg</option>
                    <option value="Gram">Gram</option>
                    <option value="Lít">Lít</option>
                    <option value="Phần">Phần</option>
                    <option value="Ổ">Ổ</option>
                    <option value="Set">Set</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">💡 Chọn đơn vị phù hợp với loại sản phẩm</p>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá bán (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: parseInt(e.target.value) || 0})}
                    placeholder="VD: 25000, 35000, 15000..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                    max={1000000}
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Khoảng khuyến nghị: 5,000 - 100,000 VNĐ</p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Nguyên liệu">Nguyên liệu</option>
                    <option value="Đồ uống">Đồ uống</option>
                    <option value="Thức ăn">Thức ăn</option>
                    <option value="Cà phê">Cà phê</option>
                    <option value="Trà sữa">Trà sữa</option>
                    <option value="Nước ép">Nước ép</option>
                    <option value="Smoothie">Smoothie</option>
                    <option value="Bánh ngọt">Bánh ngọt</option>
                    <option value="Bánh mì">Bánh mì</option>
                    <option value="Combo">Combo</option>
                    <option value="Snack">Snack</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">💡 Phân loại để dễ quản lý và báo cáo</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        checked={newProduct.isActive === true}
                        onChange={() => setNewProduct({...newProduct, isActive: true})}
                        className="mr-2"
                      />
                      <span className="text-sm text-green-700">✅ Hoạt động</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        checked={newProduct.isActive === false}
                        onChange={() => setNewProduct({...newProduct, isActive: false})}
                        className="mr-2"
                      />
                      <span className="text-sm text-red-700">❌ Ngưng hoạt động</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">💡 Sản phẩm hoạt động sẽ hiển thị trong menu bán hàng</p>
                </div>
              </div>

              {/* Notes - Full Width */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={newProduct.notes}
                  onChange={(e) => setNewProduct({...newProduct, notes: e.target.value})}
                  placeholder="VD: Cà phê đen truyền thống, không đường, phục vụ nóng. Có thể thêm sữa tươi theo yêu cầu..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">💡 Mô tả thêm về sản phẩm, cách chế biến, lưu ý đặc biệt (tối đa 500 ký tự)</p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ❌ Hủy
              </button>
              <button
                onClick={handleAddProduct}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                ✅ Thêm sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalogPageEnhanced;
