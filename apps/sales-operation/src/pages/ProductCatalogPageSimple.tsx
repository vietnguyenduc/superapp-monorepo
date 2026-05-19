import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SAMPLE_PRODUCT_CATALOG, formatPrice } from '../types/product-catalog';
import BulkPasteValidationModal from '../components/BulkPasteValidationModal';

const ProductCatalogPageSimple: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState(SAMPLE_PRODUCT_CATALOG);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPasteData, setBulkPasteData] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle bulk paste modal
  const handleBulkPaste = () => {
    // Show modal with paste area
    const pasteArea = document.createElement('textarea');
    pasteArea.placeholder = 'Dán dữ liệu từ Excel/Google Sheet vào đây...\n\n💡 Định dạng đầy đủ (cách nhau bằng dấu | hoặc tab):\nMã hàng | Tên hàng | Đơn vị | Giá bán | Loại sản phẩm | Ghi chú | Trạng thái\n\nVí dụ:\nCF001 | Cà phê đen | Ly | 25000 | Cà phê | Cà phê đen truyền thống | Hoạt động\nTS002 | Trà sữa trân châu | Ly | 35000 | Trà sữa | Trà sữa vị trân châu đen | Hoạt động\nBF003 | Bánh flan | Cái | 15000 | Bánh ngọt | Bánh flan caramel | Hoạt động';
    pasteArea.className = 'w-full h-40 p-3 border border-gray-300 rounded-md text-sm font-mono';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">📋 Nhập hàng loạt - Đầy đủ các trường</h3>
          <p class="text-sm text-gray-600 mt-1">Dán dữ liệu từ Excel/Google Sheet với đầy đủ thông tin sản phẩm</p>
        </div>
        <div class="px-6 py-4 max-h-96 overflow-y-auto">
          <label class="block text-sm font-medium text-gray-700 mb-2">Dữ liệu sản phẩm (đầy đủ 7 trường):</label>
          ${pasteArea.outerHTML}
          <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div class="text-sm font-medium text-blue-900 mb-2">💡 Hướng dẫn định dạng:</div>
            <div class="text-xs text-blue-800 space-y-1">
              <div><strong>Cách 1:</strong> Dán trực tiếp từ Excel (giữ nguyên cột)</div>
              <div><strong>Cách 2:</strong> Định dạng thủ công với dấu <code>|</code> hoặc <code>Tab</code></div>
              <div><strong>Thứ tự:</strong> Mã hàng | Tên hàng | Đơn vị | Giá bán | Loại | Ghi chú | Trạng thái</div>
              <div><strong>Đơn vị hợp lệ:</strong> Cái, Ly, Gói, Hộp, Chai, Kg, Gram, Lít, Phần, Ổ, Set</div>
              <div><strong>Loại hợp lệ:</strong> Nguyên liệu, Đồ uống, Thức ăn, Cà phê, Trà sữa, Nước ép, Smoothie, Bánh ngọt, Bánh mì, Combo, Snack, Khác</div>
              <div><strong>Trạng thái:</strong> Hoạt động / Ngưng hoạt động</div>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button id="cancel-bulk" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Hủy</button>
          <button id="process-bulk" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Xử lý dữ liệu</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle cancel
    modal.querySelector('#cancel-bulk')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Handle process
    modal.querySelector('#process-bulk')?.addEventListener('click', () => {
      const textarea = modal.querySelector('textarea') as HTMLTextAreaElement;
      const data = textarea.value.trim();
      
      if (data) {
        const items = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        setBulkPasteData(items);
        setShowBulkModal(true);
      }
      
      document.body.removeChild(modal);
    });
  };

  // Parse full product data from bulk paste
  const parseFullProductData = (line: string) => {
    // Split by | or tab
    const parts = line.split(/[|\t]/).map(part => part.trim());
    
    // Expected format: Mã hàng | Tên hàng | Đơn vị | Giá bán | Loại | Ghi chú | Trạng thái
    const [code, name, unit, priceStr, category, notes, statusStr] = parts;
    
    return {
      code: code || '',
      name: name || '',
      unit: unit || 'Cái',
      price: parseFloat(priceStr) || 0,
      category: category || 'Khác',
      notes: notes || '',
      isActive: statusStr ? statusStr.toLowerCase().includes('hoạt động') : true
    };
  };

  // Handle bulk validation confirmation
  const handleBulkConfirm = (validatedItems: any[]) => {
    const newProducts = validatedItems
      .filter(item => item.isValid)
      .map((item, index) => {
        const newId = `NEW_${Date.now()}_${index}`;
        
        // Parse full data if available
        const fullData = parseFullProductData(item.originalLine || '');
        
        return {
          id: newId,
          productCode: item.code || fullData.code || `AUTO_${newId.slice(-6)}`,
          productName: item.name || fullData.name,
          unit: fullData.unit as any,
          price: fullData.price,
          category: fullData.category as any,
          notes: fullData.notes || 'Thêm từ bulk paste',
          isActive: fullData.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'Admin',
          updatedBy: 'Admin'
        };
      });

    setProducts([...products, ...newProducts]);
    setShowBulkModal(false);
    setBulkPasteData([]);

    alert(`✅ Đã thêm thành công ${newProducts.length} sản phẩm mới với đầy đủ thông tin!`);
  };

  // Handle bulk validation cancel
  const handleBulkCancel = () => {
    setShowBulkModal(false);
    setBulkPasteData([]);
  };

  // Handle add single product form
  const [newProduct, setNewProduct] = useState({
    productCode: '',
    productName: '',
    unit: 'Cái',
    price: 0,
    category: 'Khác',
    // Inventory management fields
    inputOutputQuantity: 1,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 0,
    supplier: '',
    barcode: '',
    sku: '',
    description: '',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true
  });

  const handleAddProduct = () => {
    if (!newProduct.productCode || !newProduct.productName) {
      alert('⚠️ Vui lòng nhập đầy đủ Mã hàng và Tên hàng!');
      return;
    }

    // Check if product code already exists
    const existingProduct = products.find(p => p.productCode === newProduct.productCode);
    if (existingProduct) {
      alert('⚠️ Mã hàng đã tồn tại! Vui lòng chọn mã khác.');
      return;
    }

    const newId = `NEW_${Date.now()}`;
    const productToAdd = {
      id: newId,
      productCode: newProduct.productCode,
      productName: newProduct.productName,
      unit: newProduct.unit as any,
      price: newProduct.price,
      category: newProduct.category as any,
      // Inventory management fields
      inputOutputQuantity: newProduct.inputOutputQuantity,
      inputPrice: newProduct.inputPrice,
      outputPrice: newProduct.outputPrice,
      minStockLevel: newProduct.minStockLevel,
      maxStockLevel: newProduct.maxStockLevel,
      currentStock: newProduct.currentStock,
      supplier: newProduct.supplier,
      barcode: newProduct.barcode,
      sku: newProduct.sku,
      description: newProduct.description,
      storageCondition: newProduct.storageCondition,
      expiryDays: newProduct.expiryDays,
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
      // Inventory management fields
      inputOutputQuantity: 1,
      inputPrice: 0,
      outputPrice: 0,
      minStockLevel: 0,
      maxStockLevel: 0,
      currentStock: 0,
      supplier: '',
      barcode: '',
      sku: '',
      description: '',
      storageCondition: '',
      expiryDays: 0,
      notes: '',
      isActive: true
    });

    alert('✅ Đã thêm sản phẩm mới thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danh mục hàng hóa</h1>
          <p className="mt-2 text-gray-600">
            Quản lý danh mục, định mức, quy đổi (Bảng 2) - Dữ liệu từ file Excel
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/product-import')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            📊 Nhập hàng loạt
          </button>
          <button
            onClick={handleBulkPaste}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            📋 Paste hàng loạt
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            + Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Tổng sản phẩm</div>
          <div className="text-2xl font-bold text-blue-600">{SAMPLE_PRODUCT_CATALOG.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Đang hoạt động</div>
          <div className="text-2xl font-bold text-green-600">
            {SAMPLE_PRODUCT_CATALOG.filter(p => p.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Ngưng hoạt động</div>
          <div className="text-2xl font-bold text-red-600">
            {SAMPLE_PRODUCT_CATALOG.filter(p => !p.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Kết quả tìm kiếm</div>
          <div className="text-2xl font-bold text-purple-600">{filteredProducts.length}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            🔍 Tìm kiếm sản phẩm
          </label>
          <input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nhập tên sản phẩm, mã hàng hoặc loại sản phẩm..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Excel Sample Data Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              📊 Dữ liệu mẫu từ file Excel "Quản Lý danh mục"
            </h3>
            <div className="text-sm text-gray-500">
              Hiển thị {filteredProducts.length} / {SAMPLE_PRODUCT_CATALOG.length} sản phẩm
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
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
                    Ghi chú
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày cập nhật
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người sửa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                        {product.productCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                        {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {product.notes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs text-gray-400">
                        {new Date().toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        👤 Admin
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ❌ Ngưng
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-lg font-medium mb-2">Không tìm thấy sản phẩm</div>
              <div className="text-sm">Thử tìm kiếm với từ khóa khác</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Thông tin dữ liệu mẫu:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Dữ liệu được import từ file Excel "Quản Lý danh mục" của bạn</li>
          <li>• Bao gồm {SAMPLE_PRODUCT_CATALOG.length} sản phẩm F&B đa dạng: cà phê, trà sữa, bánh ngọt, nước ép...</li>
          <li>• Giá cả từ {Math.min(...SAMPLE_PRODUCT_CATALOG.map(p => p.price)).toLocaleString('vi-VN')} - {Math.max(...SAMPLE_PRODUCT_CATALOG.map(p => p.price)).toLocaleString('vi-VN')} VNĐ</li>
          <li>• Nhấn "📊 Nhập hàng loạt" để test tính năng import Excel-like</li>
        </ul>
      </div>

      {/* Add Product Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="bg-green-100 text-green-800 p-2 rounded-full mr-3">➕</span>
                Thêm sản phẩm mới vào danh mục
              </h3>
              <p className="text-sm text-gray-600 mt-2 ml-12">
                📝 Điền đầy đủ thông tin bên dưới để tạo sản phẩm mới trong hệ thống quản lý danh mục
              </p>
              <div className="mt-3 ml-12 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-xs font-medium text-blue-900 mb-1">💡 Lưu ý quan trọng:</div>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• <strong>Mã hàng</strong>: Phải duy nhất, định dạng khuyến nghị: 2 chữ cái + 3 số (VD: CF001)</li>
                  <li>• <strong>Giá bán</strong>: Nhập theo VNĐ, phù hợp với thị trường F&B (5,000 - 100,000 VNĐ)</li>
                  <li>• <strong>Đơn vị & Loại</strong>: Chọn đúng để hệ thống validation và báo cáo chính xác</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Mã Nguyên vật liệu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã Nguyên vật liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.productCode}
                  onChange={(e) => setNewProduct({...newProduct, productCode: e.target.value})}
                  placeholder="VD: NVL-TC0001, NVL-TC0002..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">💡 Mã nguyên vật liệu theo chuẩn NVL-TC####</p>
              </div>

              {/* Tên Nguyên vật liệu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Nguyên vật liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.productName}
                  onChange={(e) => setNewProduct({...newProduct, productName: e.target.value})}
                  placeholder="VD: Cam, Dưa hấu, Nho, Táo, Xoài..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">💡 Tên nguyên vật liệu chính</p>
              </div>

              {/* Thành phẩm? */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thành phẩm?
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isFinishedProduct"
                      checked={newProduct.category === 'Thành phẩm'}
                      onChange={() => setNewProduct({...newProduct, category: 'Thành phẩm'})}
                      className="mr-2"
                    />
                    <span className="text-sm text-green-700">TRUE</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isFinishedProduct"
                      checked={newProduct.category === 'Nguyên liệu'}
                      onChange={() => setNewProduct({...newProduct, category: 'Nguyên liệu'})}
                      className="mr-2"
                    />
                    <span className="text-sm text-red-700">FALSE</span>
                  </label>
                </div>
              </div>

              {/* Định lượng Xuất và Nhập */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Định lượng Xuất <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newProduct.outputPrice}
                    onChange={(e) => setNewProduct({...newProduct, outputPrice: parseFloat(e.target.value) || 0})}
                    placeholder="VD: 0.5, 40, 48..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Số miếng/đơn vị cho 1 thành phẩm</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Định lượng Nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newProduct.inputOutputQuantity}
                    onChange={(e) => setNewProduct({...newProduct, inputOutputQuantity: parseFloat(e.target.value) || 0})}
                    placeholder="VD: 1, 8, 48..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Số miếng/đơn vị từ 1 quả nguyên</p>
                </div>
              </div>

              {/* Mã SP KD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã SP KD <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.barcode}
                  onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                  placeholder="VD: TC0001, TC0002, TC0020..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">💡 Mã sản phẩm kinh doanh</p>
              </div>

              {/* Tên Thành phẩm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Thành phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="VD: Đĩa cam, đĩa trái cây, đĩa trái cây combo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">💡 Tên thành phẩm cuối cùng</p>
              </div>

              {/* ĐVT Nhập và ĐVT Xuất */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ĐVT Nhập <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="trái">trái</option>
                    <option value="quả">quả</option>
                    <option value="Cái">Cái</option>
                    <option value="Gram">Gram</option>
                    <option value="Kg">Kg</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">💡 Đơn vị tính khi nhập</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ĐVT Xuất <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProduct.storageCondition || 'đĩa'}
                    onChange={(e) => setNewProduct({...newProduct, storageCondition: e.target.value})}
                    placeholder="VD: đĩa, ly, phần..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Đơn vị tính khi xuất</p>
                </div>
              </div>

              {/* Tình trạng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tình trạng
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      checked={newProduct.isActive === true}
                      onChange={() => setNewProduct({...newProduct, isActive: true})}
                      className="mr-2"
                    />
                    <span className="text-sm text-green-700">Đang bán</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      checked={newProduct.isActive === false}
                      onChange={() => setNewProduct({...newProduct, isActive: false})}
                      className="mr-2"
                    />
                    <span className="text-sm text-red-700">Ngưng bán</span>
                  </label>
                </div>
              </div>

              {/* Inventory Management Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  📦 Thông tin quản lý kho
                </h4>
                
                {/* Input Quantity and Prices */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Định lượng nhập <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={newProduct.inputOutputQuantity}
                      onChange={(e) => setNewProduct({...newProduct, inputOutputQuantity: parseFloat(e.target.value) || 1})}
                      placeholder="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0.01"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">💡 Số lượng chuẩn mỗi lần nhập</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá nhập (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={newProduct.inputPrice}
                      onChange={(e) => setNewProduct({...newProduct, inputPrice: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">💡 Giá mua vào từ nhà cung cấp</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá xuất (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={newProduct.outputPrice}
                      onChange={(e) => setNewProduct({...newProduct, outputPrice: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">💡 Giá bán ra cho khách hàng</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lãi suất (%)
                    </label>
                    <input
                      type="number"
                      value={newProduct.outputPrice && newProduct.inputPrice ? 
                        (((newProduct.outputPrice - newProduct.inputPrice) / newProduct.inputPrice) * 100).toFixed(1) : '0'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">💡 Tự động tính toán</p>
                  </div>
                </div>

                {/* Stock Levels */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tồn kho tối thiểu
                    </label>
                    <input
                      type="number"
                      value={newProduct.minStockLevel}
                      onChange={(e) => setNewProduct({...newProduct, minStockLevel: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tồn kho tối đa
                    </label>
                    <input
                      type="number"
                      value={newProduct.maxStockLevel}
                      onChange={(e) => setNewProduct({...newProduct, maxStockLevel: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tồn kho hiện tại
                    </label>
                    <input
                      type="number"
                      value={newProduct.currentStock}
                      onChange={(e) => setNewProduct({...newProduct, currentStock: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>

                {/* Supplier and Codes */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhà cung cấp
                    </label>
                    <input
                      type="text"
                      value={newProduct.supplier}
                      onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
                      placeholder="VD: Công ty ABC"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã vạch (Barcode)
                    </label>
                    <input
                      type="text"
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                      placeholder="VD: 1234567890123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                      placeholder="VD: CF-001-M"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Storage and Expiry */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điều kiện bảo quản
                    </label>
                    <input
                      type="text"
                      value={newProduct.storageCondition}
                      onChange={(e) => setNewProduct({...newProduct, storageCondition: e.target.value})}
                      placeholder="VD: Bảo quản nơi khô ráo, thoáng mát"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hạn sử dụng (ngày)
                    </label>
                    <input
                      type="number"
                      value={newProduct.expiryDays}
                      onChange={(e) => setNewProduct({...newProduct, expiryDays: parseInt(e.target.value) || 0})}
                      placeholder="VD: 30, 365"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="VD: Mô tả chi tiết về sản phẩm, thành phần, cách sử dụng..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    maxLength={1000}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={newProduct.notes}
                  onChange={(e) => setNewProduct({...newProduct, notes: e.target.value})}
                  placeholder="VD: Cà phê đen truyền thống, không đường, phục vụ nóng..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">💡 Mô tả thêm về sản phẩm (tối đa 500 ký tự)</p>
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
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                ✅ Thêm sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Paste Validation Modal */}
      <BulkPasteValidationModal
        isOpen={showBulkModal}
        onClose={handleBulkCancel}
        onConfirm={handleBulkConfirm}
        pastedData={bulkPasteData}
      />
    </div>
  );
};

export default ProductCatalogPageSimple;
