import { getCurrentCompanyId, getCurrentUserId, apiClient } from "../lib/supabase";
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
        const companyId = await getCurrentCompanyId();
        let query = apiClient.from('products').select('*').order('name');
        if (companyId) query = query.eq('company_id', companyId);
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
        const companyId = await getCurrentCompanyId();
        let query = apiClient.from('products').select('*').eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const res = await query.single();
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
        const companyId = await getCurrentCompanyId();
        const row = ProductMapper.mapProductToDb({ ...product, createdBy: userId, updatedBy: userId });
        if (companyId) row.company_id = companyId;
        const res = await apiClient.from('products').insert([row]).select('*').single();
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
        const companyId = await getCurrentCompanyId();
        const row = ProductMapper.mapProductToDb({ ...updates, updatedBy: userId, updatedAt: new Date() });
        let query = apiClient.from('products').update(row).eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const res = await query.select('*').single();
        if (res.data) res.data = ProductMapper.mapDbToProduct(res.data);
        return res;
      },
      () => fallbackService.updateProduct(id, updates)
    );
  }

  static async deleteProduct(id: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient.from('products').delete().eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const { error } = await query;
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
        const companyId = await getCurrentCompanyId();
        const rows = products.map(p => {
          const row = ProductMapper.mapProductToDb({ ...p, createdBy: userId, updatedBy: userId });
          if (companyId) row.company_id = companyId;
          return row;
        });
        const res = await apiClient.from('products').insert(rows).select('*');
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
        const companyId = await getCurrentCompanyId();
        const rows = products.map(p => {
          const row = ProductMapper.mapProductToDb({ ...p, createdBy: userId, updatedBy: userId });
          if (companyId) row.company_id = companyId;
          return row;
        });
        const res = await apiClient.from('products').insert(rows).select('*');
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
