import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCatalogTable from '../components/ProductCatalogTable';
import ProductCatalogForm from '../components/ProductCatalogForm';
import { useProductCatalog } from '../hooks/useProductCatalog';
import { Product } from '../types';

const ProductCatalogPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
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

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (data: Partial<Product>) => {
    try {
      let result;
      
      if (editingProduct) {
        result = await updateProduct(editingProduct.id, data);
      } else {
        const productData = {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system'
        };
        result = await createProduct(productData as Omit<Product, 'id'>);
      }

      if (result.success) {
        showNotification('success', 
          editingProduct 
            ? 'Cập nhật sản phẩm thành công!' 
            : 'Thêm sản phẩm thành công!'
        );
        setShowForm(false);
        setEditingProduct(null);
      } else {
        showNotification('error', 'Có lỗi xảy ra');
      }
    } catch (error) {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      return;
    }

    const result = await deleteProduct(id);
    if (result.success) {
      showNotification('success', 'Xóa sản phẩm thành công!');
    } else {
      showNotification('error', 'Không thể xóa sản phẩm');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleSearch = (query: string) => {
    searchProducts(query);
  };

  // Clear error when component mounts
  React.useEffect(() => {
    if (error) {
      showNotification('error', error);
      clearError();
    }
  }, [error, clearError]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-gray-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Danh mục hàng hóa</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Quản lý danh mục, định mức, quy đổi (Bảng 2)
                </p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => navigate('/product-catalog-import?tab=single')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tạo sản phẩm mới
              </button>
            )}
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`rounded-xl p-4 border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {notification.type === 'success' ? '✅' : '❌'}
              </span>
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {showForm && (
          <ProductCatalogForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingProduct || undefined}
            isLoading={isLoading}
          />
        )}

        {/* Product List Table */}
        {!showForm && (
          <ProductCatalogTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        )}

        {/* Loading State */}
        {isLoading && !showForm && (
          <div className="bg-white rounded-2xl shadow-soft p-12 border border-gray-100">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCatalogPageEnhanced;
