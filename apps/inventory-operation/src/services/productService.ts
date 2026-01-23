import { supabase, handleSupabaseError, getCurrentUserId } from '../lib/supabase';
import { Product, ProductConversion } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ProductService {
  // Get all products with optional filters
  static async getProducts(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Product[]>> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          conversions:product_conversions(*)
        `)
        .order('name');

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,business_code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      // Transform data to match our Product interface
      const products = data?.map(item => ({
        ...item,
        conversions: item.conversions || []
      })) || [];

      return { success: true, data: products };
    } catch (error) {
      console.error('Error in getProducts:', error);
      return { success: false, error: 'Không thể tải danh sách sản phẩm' };
    }
  }

  // Get a single product by ID
  static async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          conversions:product_conversions(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, data: { ...data, conversions: data.conversions || [] } };
    } catch (error) {
      console.error('Error in getProduct:', error);
      return { success: false, error: 'Không thể tải sản phẩm' };
    }
  }

  // Create new product
  static async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> {
    try {
      const userId = await getCurrentUserId();
      
      const productData = {
        ...product,
        created_by: userId,
        updated_by: userId
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select(`
          *,
          conversions:product_conversions(*)
        `)
        .single();

      if (error) {
        console.error('Error creating product:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, data: { ...data, conversions: data.conversions || [] } };
    } catch (error) {
      console.error('Error in createProduct:', error);
      return { success: false, error: 'Không thể tạo sản phẩm' };
    }
  }

  // Update product
  static async updateProduct(id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const userId = await getCurrentUserId();
      
      const updateData = {
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      };

      // Remove conversions from update data as they're handled separately
      const { conversions, ...productUpdates } = updateData;

      const { data, error } = await supabase
        .from('products')
        .update(productUpdates)
        .eq('id', id)
        .select(`
          *,
          conversions:product_conversions(*)
        `)
        .single();

      if (error) {
        console.error('Error updating product:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, data: { ...data, conversions: data.conversions || [] } };
    } catch (error) {
      console.error('Error in updateProduct:', error);
      return { success: false, error: 'Không thể cập nhật sản phẩm' };
    }
  }

  // Delete product
  static async deleteProduct(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      return { success: false, error: 'Không thể xóa sản phẩm' };
    }
  }

  // Get product conversions
  static async getProductConversions(productId: string): Promise<ApiResponse<ProductConversion[]>> {
    try {
      const { data, error } = await supabase
        .from('product_conversions')
        .select('*')
        .eq('product_id', productId);

      if (error) {
        console.error('Error fetching product conversions:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getProductConversions:', error);
      return { success: false, error: 'Không thể tải danh sách chuyển đổi sản phẩm' };
    }
  }

  // Create product conversion
  static async createProductConversion(conversion: Omit<ProductConversion, 'id'>): Promise<ApiResponse<ProductConversion>> {
    try {
      const { data, error } = await supabase
        .from('product_conversions')
        .insert([conversion])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating product conversion:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error('Error in createProductConversion:', error);
      return { success: false, error: 'Không thể tạo chuyển đổi sản phẩm' };
    }
  }

  // Search products
  static async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          conversions:product_conversions(*)
        `)
        .or(`name.ilike.%${query}%,business_code.ilike.%${query}%,promotion_code.ilike.%${query}%`)
        .order('name');

      if (error) {
        console.error('Error searching products:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      const products = data?.map(item => ({
        ...item,
        conversions: item.conversions || []
      })) || [];

      return { success: true, data: products };
    } catch (error) {
      console.error('Error in searchProducts:', error);
      return { success: false, error: 'Không thể tìm kiếm sản phẩm' };
    }
  }

  // Import products
  static async importProducts(products: Partial<Product>[]): Promise<ApiResponse<Product[]>> {
    try {
      const userId = await getCurrentUserId();
      
      const productsToInsert = products.map(product => ({
        ...product,
        created_by: userId,
        updated_by: userId
      }));

      const { data, error } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select(`
          *,
          conversions:product_conversions(*)
        `);

      if (error) {
        console.error('Error importing products:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      const products = data?.map(item => ({
        ...item,
        conversions: item.conversions || []
      })) || [];

      return { success: true, data: products };
    } catch (error) {
      console.error('Error in importProducts:', error);
      return { success: false, error: 'Không thể import danh sách sản phẩm' };
    }
  }

  // Get products by category
  static async getProductsByCategory(category: string): Promise<ApiResponse<Product[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          conversions:product_conversions(*)
        `)
        .eq('category', category)
        .order('name');

      if (error) {
        console.error('Error fetching products by category:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      const products = data?.map(item => ({
        ...item,
        conversions: item.conversions || []
      })) || [];

      return { success: true, data: products };
    } catch (error) {
      console.error('Error in getProductsByCategory:', error);
      return { success: false, error: 'Không thể tải sản phẩm theo danh mục' };
    }
  }
}
