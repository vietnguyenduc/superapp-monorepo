import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { ProductService } from '../services/productService';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ProductService.getProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error || 'Không thể tải danh sách sản phẩm');
      }
    } catch (err) {
      setError('Lỗi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ProductService.createProduct(productData);
      if (response.success && response.data) {
        setProducts(prev => [response.data!, ...prev]);
        return response.data;
      }
      throw new Error(response.error || 'Không thể tạo sản phẩm');
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductById = useCallback(async (id: string): Promise<Product | null> => {
    const response = await ProductService.getProduct(id);
    return response.data || null;
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    getProductById,
    clearError: () => setError(null)
  };
};
