import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCatalogForm from '../components/ProductCatalogForm';
import ProductCatalogTable from '../components/ProductCatalogTable';
import SimpleProductCatalogTable from '../components/SimpleProductCatalogTable';
import { useProductCatalog } from '../hooks/useProductCatalog';
import { ProductCatalogItem, PRODUCT_CATALOG_COLUMNS, SAMPLE_PRODUCT_CATALOG, formatPrice } from '../types/product-catalog';
// import { EditableDataGrid } from '@repo/ui'; // Temporarily disabled

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

const ProductCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCatalogItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCell, setEditingCell] = useState<{ productId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]);
  
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

  const handleSubmit = async (data: Partial<ProductCatalogItem>) => {
    if (editingProduct) {
      const result = await updateProduct(editingProduct.id, data);
      if (result.success) {
        setEditingProduct(null);
        setShowForm(false);
      }
    } else {
      const result = await createProduct(data as Omit<ProductCatalogItem, 'id' | 'createdAt' | 'updatedAt'>);
      if (result.success) {
        setShowForm(false);
      }
    }
  };

  const handleEdit = (product: ProductCatalogItem) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danh mục hàng hóa</h1>
          <p className="mt-2 text-gray-600">
            Quản lý danh mục, định mức, quy đổi (Bảng 2)
          </p>
        </div>
        {!showForm && (
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/product-import')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              📊 Nhập hàng loạt
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Có lỗi xảy ra</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={clearError}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <ProductCatalogForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={editingProduct || undefined}
          isLoading={isLoading}
        />
      )}

      {/* Table */}
      {!showForm && (
        <ProductCatalogTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ProductCatalogPage;
