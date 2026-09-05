import React, { useState } from 'react';
import { ProductEntryForm } from '../components/Form/ProductEntryForm';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import { useAuthContext } from '@superapp/iam';

const ProductEntryPage: React.FC = () => {
  const { hasPermission } = useAuthContext();
  const canImportProducts = hasPermission('import_products');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const handleSubmit = async (data: Partial<Product>) => {
    if (!canImportProducts) {
      setMessage({ type: 'error', text: 'Bạn không có quyền nhập sản phẩm' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await ProductService.createProduct(data as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
        return;
      }

      if (result.data) {
        setProducts(prev => [result.data!, ...prev]);
        setMessage({ type: 'success', text: 'Tạo sản phẩm thành công!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi khi tạo sản phẩm' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nhập sản phẩm mới</h1>
        <p className="text-gray-500">Nhập thông tin sản phẩm theo form bên dưới</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <ProductEntryForm
          existingProducts={products}
          onSubmit={handleSubmit}
          onCancel={() => window.history.back()}
          loading={loading}
        />
      </div>

      {products.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm vừa tạo ({products.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã KD</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{p.businessCode}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{p.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{p.category}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${p.businessStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {p.businessStatus === 'active' ? 'Đang KD' : 'Ngừng KD'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEntryPage;
