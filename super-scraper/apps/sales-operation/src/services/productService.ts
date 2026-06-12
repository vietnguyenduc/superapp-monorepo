import { supabase, getCurrentUserId } from '../lib/supabase';
import { Product } from '../types';
import { fallbackService } from './fallbackService';
import { BaseService, ServiceResponse } from './baseService';
import { ProductMapper } from './mappers/productMapper';

export class ProductService extends BaseService {
  static async getProducts(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<ServiceResponse<Product[]>> {
    return this.execute(
      async () => {
        let query = supabase.from('products').select('*').order('name');
        if (filters?.category) query = query.eq('category', filters.category);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,business_code.ilike.%${filters.search}%`);
        
        const res = await query;
        if (res.data) res.data = res.data.map(item => ProductMapper.mapDbToProduct(item));
        return res;
      },
      () => fallbackService.getProducts(filters)
    );
  }

  static async getProduct(id: string): Promise<ServiceResponse<Product>> {
    return this.execute(
      async () => {
        const res = await supabase.from('products').select('*').eq('id', id).single();
        if (res.data) res.data = ProductMapper.mapDbToProduct(res.data);
        return res;
      },
      () => fallbackService.getProductById(id)
    );
  }

  static async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<Product>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const row = ProductMapper.mapProductToDb({ ...product, createdBy: userId, updatedBy: userId });
        const res = await supabase.from('products').insert([row]).select('*').single();
        if (res.data) res.data = ProductMapper.mapDbToProduct(res.data);
        return res;
      },
      () => fallbackService.createProduct(product)
    );
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<ServiceResponse<Product>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const row = ProductMapper.mapProductToDb({ ...updates, updatedBy: userId, updatedAt: new Date() });
        const res = await supabase.from('products').update(row).eq('id', id).select('*').single();
        if (res.data) res.data = ProductMapper.mapDbToProduct(res.data);
        return res;
      },
      () => fallbackService.updateProduct(id, updates)
    );
  }

  static async deleteProduct(id: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        return { data: !error, error };
      },
      () => fallbackService.deleteProduct(id)
    );
  }

  static async searchProducts(query: string): Promise<ServiceResponse<Product[]>> {
    return this.getProducts({ search: query });
  }

  static async importProducts(products: Partial<Product>[]): Promise<ServiceResponse<Product[]>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const rows = products.map(p => ProductMapper.mapProductToDb({ ...p, createdBy: userId, updatedBy: userId }));
        const res = await supabase.from('products').insert(rows).select('*');
        if (res.data) res.data = res.data.map(item => ProductMapper.mapDbToProduct(item));
        return res;
      },
      async () => {
        const results: Product[] = [];
        for (const p of products) {
          const res = await fallbackService.createProduct(p as any);
          if (res.data) results.push(res.data);
        }
        return { data: results, error: null };
      }
    );
  }

  static async bulkInsertProducts(products: Partial<Product>[]): Promise<ServiceResponse<Product[]>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const rows = products.map(p => ProductMapper.mapProductToDb({ ...p, createdBy: userId, updatedBy: userId }));
        const res = await supabase.from('products').insert(rows).select('*');
        if (res.data) res.data = res.data.map(item => ProductMapper.mapDbToProduct(item));
        return res;
      },
      async () => {
        const results: Product[] = [];
        for (const p of products) {
          const res = await fallbackService.createProduct(p as any);
          if (res.data) results.push(res.data);
        }
        return { data: results, error: null };
      }
    );
  }
}

export const productService = ProductService;
