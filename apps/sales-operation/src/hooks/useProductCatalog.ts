import { useState, useEffect, useCallback } from 'react';
import { Product, ProductStatus } from '../types';
import { ProductService } from '../services/productService';

interface UseProductCatalogOptions {
  autoLoad?: boolean;
  filters?: {
    category?: string;
    status?: string;
    search?: string;
  };
}

export const useProductCatalog = (options: UseProductCatalogOptions = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async (filters?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ProductService.getProducts(filters || options.filters);
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error || 'Không thể tải danh mục sản phẩm');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải danh mục sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }, [options.filters]);

  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    const response = await ProductService.createProduct(product);
    if (response.success && response.data) {
      setProducts(prev => [response.data!, ...prev]);
      setIsLoading(false);
      return { success: true, data: response.data };
    }
    setError(response.error || 'Không thể tạo sản phẩm');
    setIsLoading(false);
    return { success: false, error: response.error };
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    setIsLoading(true);
    setError(null);
    const response = await ProductService.updateProduct(id, updates);
    if (response.success && response.data) {
      setProducts(prev => prev.map(p => p.id === id ? response.data! : p));
      setIsLoading(false);
      return { success: true, data: response.data };
    }
    setError(response.error || 'Không thể cập nhật sản phẩm');
    setIsLoading(false);
    return { success: false, error: response.error };
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    const response = await ProductService.deleteProduct(id);
    if (response.success) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setIsLoading(false);
      return { success: true };
    }
    setError(response.error || 'Không thể xóa sản phẩm');
    setIsLoading(false);
    return { success: false, error: response.error };
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadProducts();
      return;
    }
    setIsLoading(true);
    setError(null);
    const response = await ProductService.searchProducts(query);
    if (response.success && response.data) {
      setProducts(response.data);
    } else {
      setError(response.error || 'Không thể tìm kiếm sản phẩm');
    }
    setIsLoading(false);
  }, [loadProducts]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadProducts();
    }
  }, [loadProducts, options.autoLoad]);

  return {
    products,
    isLoading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    clearError: () => setError(null),
    refresh: loadProducts,
  };
};
