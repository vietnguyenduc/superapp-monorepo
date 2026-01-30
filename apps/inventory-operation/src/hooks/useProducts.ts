import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { fallbackService } from '../services/fallbackService';
import { databaseService } from '../services/databaseService';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading products...');
      
      // Force fallback mode for now since Supabase is not configured
      console.warn('🔄 Using fallback mode (Supabase not configured)');
      const response = await fallbackService.getProducts();
      
      console.log('📊 Products fallback response:', response);
      
      if (response.data) {
        setProducts(response.data);
        console.log('✅ Products loaded:', response.data.length);
      } else {
        throw new Error(response.error || 'Không thể tải danh sách sản phẩm');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi tải danh sách sản phẩm';
      setError(errorMessage);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try database service first, fallback to mock data if it fails
      let response;
      try {
        response = await databaseService.createProduct(productData);
      } catch (dbError) {
        console.warn('Database error, using fallback service:', dbError);
        response = await fallbackService.createProduct(productData);
      }
      
      if (response.data) {
        setProducts(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        throw new Error(response.error || 'Không thể tạo sản phẩm');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi tạo sản phẩm';
      setError(errorMessage);
      console.error('Error creating product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductById = useCallback(async (id: string): Promise<Product | null> => {
    try {
      // Try database service first, fallback to mock data if it fails
      let response;
      try {
        response = await databaseService.getProduct(id);
      } catch (dbError) {
        console.warn('Database error, using fallback service:', dbError);
        response = await fallbackService.getProductById(id);
      }
      
      return response.data || null;
    } catch (err) {
      console.error('Error fetching product by ID:', err);
      return null;
    }
  }, []);

  // Auto-fetch products on mount
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
