import { useState, useEffect, useCallback } from 'react';
import { Product, ProductStatus } from '../types';
import { ProductCatalogItem } from '../types/product-catalog';
import { fallbackService } from '../services/fallbackService';
import { databaseService } from '../services/databaseService';

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

  // Load products
  const loadProducts = useCallback(async (filters?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try database service first, fallback to mock data if it fails
      let response;
      try {
        response = await databaseService.getProducts(filters);
      } catch (dbError) {
        console.warn('Database error, using fallback service for ProductCatalog:', dbError);
        const fallbackResponse = await fallbackService.getProductCatalog(filters);
        response = {
          success: !fallbackResponse.error,
          data: fallbackResponse.data,
          error: fallbackResponse.error
        };
      }
      
      if (response.data) {
        // Convert ProductCatalogItem[] to Product[] if needed
        const productData = Array.isArray(response.data) && response.data.length > 0 
          ? 'businessCode' in response.data[0] 
            ? response.data as Product[]
            : (response.data as any[]).map(item => ({
                id: item.id || item.productCode,
                businessCode: item.productCode || item.businessCode,
                promotionCode: item.promotionCode,
                name: item.productName || item.name,
                isFinishedProduct: item.isFinishedProduct || true,
                category: item.category || 'OTHER',
                inputQuantity: item.inputQuantity || 1,
                outputQuantity: item.outputQuantity || 1,
                finishedProductCode: item.finishedProductCode,
                inputUnit: item.unit || item.inputUnit || 'cái',
                outputUnit: item.unit || item.outputUnit || 'cái',
                status: (item.isActive !== undefined ? (item.isActive ? ProductStatus.ACTIVE : ProductStatus.INACTIVE) : ProductStatus.ACTIVE) as ProductStatus,
                businessStatus: 'active' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system'
              }))
          : response.data as Product[];
        setProducts(productData);
      } else {
        setError(response.error || 'Không thể tải danh mục sản phẩm');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải danh mục sản phẩm');
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new product
  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try database service first, fallback to mock data if it fails
      let response;
      try {
        response = await databaseService.createProduct(product);
      } catch (dbError) {
        console.warn('Database error, using fallback service:', dbError);
        response = await fallbackService.createProduct(product);
      }
      
      if (response.data) {
        setProducts(prev => [response.data!, ...prev]);
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Không thể tạo sản phẩm');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = 'Đã xảy ra lỗi khi tạo sản phẩm';
      setError(errorMessage);
      console.error('Error creating product:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update product
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try database service first, fallback to mock data if it fails
      let response;
      try {
        response = await databaseService.updateProduct(id, updates);
      } catch (dbError) {
        console.warn('Database error, using fallback service:', dbError);
        response = await fallbackService.updateProduct(id, updates);
      }
      
      if (response.data) {
        setProducts(prev => 
          prev.map(product => 
            product.id === id ? response.data! : product
          )
        );
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Không thể cập nhật sản phẩm');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = 'Đã xảy ra lỗi khi cập nhật sản phẩm';
      setError(errorMessage);
      console.error('Error updating product:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete product
  const deleteProduct = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try database service first, fallback to mock data if it fails
      let response;
      try {
        response = await databaseService.deleteProduct(id);
      } catch (dbError) {
        console.warn('Database error, using fallback service:', dbError);
        response = await fallbackService.deleteProduct(id);
      }
      
      if (response.data) {
        setProducts(prev => prev.filter(product => product.id !== id));
        return { success: true };
      } else {
        setError(response.error || 'Không thể xóa sản phẩm');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = 'Đã xảy ra lỗi khi xóa sản phẩm';
      setError(errorMessage);
      console.error('Error deleting product:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      // If query is empty, reload all products
      loadProducts(options.filters);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try database service first, fallback to mock data if it fails
      let response;
      try {
        const filters = { search: query, ...options.filters };
        response = await databaseService.getProducts(filters);
      } catch (dbError) {
        console.warn('Database error, using fallback service:', dbError);
        const filters = { search: query, ...options.filters };
        response = await fallbackService.getProducts(filters);
      }
      
      if (response.data) {
        setProducts(response.data);
      } else {
        setError(response.error || 'Không thể tìm kiếm sản phẩm');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tìm kiếm sản phẩm');
      console.error('Error searching products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadProducts, options.filters]);

  // Import multiple products
  const importProducts = useCallback(async (productsToImport: Partial<Product>[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // For import, we'll use fallback service directly since it's a bulk operation
      const results: Product[] = [];
      for (const productData of productsToImport) {
        try {
          const response = await fallbackService.createProduct(productData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
          if (response.data) {
            results.push(response.data);
          }
        } catch (err) {
          console.warn('Failed to import product:', productData, err);
        }
      }
      
      if (results.length > 0) {
        setProducts(prev => [...results, ...prev]);
        return { success: true, data: results, count: results.length };
      } else {
        setError('Không thể import danh mục sản phẩm');
        return { success: false, error: 'Không thể import danh mục sản phẩm' };
      }
    } catch (err) {
      const errorMessage = 'Đã xảy ra lỗi khi import danh mục';
      setError(errorMessage);
      console.error('Error importing products:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get products by category
  const getProductsByCategory = useCallback(async (category: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await databaseService.getProducts();
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Không thể tải sản phẩm theo danh mục');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = 'Đã xảy ra lỗi khi tải sản phẩm';
      setError(errorMessage);
      console.error('Error getting products by category:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-load products on mount if enabled
  useEffect(() => {
    if (options.autoLoad !== false) {
      loadProducts(options.filters);
    }
  }, [loadProducts, options.autoLoad, options.filters]);

  return {
    // State
    products,
    isLoading,
    error,
    
    // Actions
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    importProducts,
    getProductsByCategory,
    
    // Utilities
    clearError: () => setError(null),
    refresh: () => loadProducts(options.filters),
  };
};
