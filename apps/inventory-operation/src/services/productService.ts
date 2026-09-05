import { getCurrentCompanyId, getCurrentUserId, apiClient } from "../lib/supabase";
import { Product } from '../types';
import { fallbackService } from './fallbackService';
import { BaseService, ServiceResponse } from './baseService';
import { ProductMapper } from './mappers/productMapper';
import { importExportSettingsService, MatchField } from './importExportSettingsService';

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
        const res = await apiClient
          .from('products')
          .upsert([row], { onConflict: 'company_id,business_code' })
          .select('*')
          .single();
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
    // Delegate to bulkInsertProducts — same logic with configured match field
    return this.bulkInsertProducts(products);
  }

  static async bulkInsertProducts(products: Partial<Product>[]): Promise<ServiceResponse<Product[]>> {
    const BATCH_SIZE = 200;
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();
        const config = await importExportSettingsService.load();
        const matchField: MatchField = config.productMatchField;

        // Deduplicate by configured match field — keep the LAST occurrence.
        // Without dedup, Postgres throws "affect row a second time" on upsert.
        const seen = new Map<string, Partial<Product>>();
        for (const p of products) {
          let key = '';
          if (matchField === 'name') key = (p.name || '').trim().toLowerCase();
          else if (matchField === 'both') key = `${(p.businessCode || '').trim()}__${(p.name || '').trim().toLowerCase()}`;
          else key = p.businessCode || ''; // default: business_code
          if (key) seen.set(key, p);
          else seen.set(`__no_match_${seen.size}__`, p);
        }
        const deduped = Array.from(seen.values());

        const rows = deduped.map(p => {
          const row = ProductMapper.mapProductToDb({ ...p, createdBy: userId, updatedBy: userId });
          if (companyId) row.company_id = companyId;
          return row;
        });

        // When matching by name, check for duplicate names in DB first
        if (matchField === 'name' && companyId) {
          const namesToCheck = deduped.map(p => p.name).filter(Boolean) as string[];
          if (namesToCheck.length > 0) {
            const { data: existing } = await apiClient
              .from('products')
              .select('id, name')
              .eq('company_id', companyId)
              .in('name', namesToCheck);
            if (existing && existing.length > 0) {
              const nameCount = new Map<string, number>();
              existing.forEach(p => {
                const n = (p.name || '').toLowerCase();
                nameCount.set(n, (nameCount.get(n) || 0) + 1);
              });
              const dupes = Array.from(nameCount.entries()).filter(([, c]) => c > 1);
              if (dupes.length > 0) {
                return {
                  data: null as any,
                  error: `Có ${dupes.length} sản phẩm trùng tên trong hệ thống: ${dupes.slice(0, 3).map(d => d[0]).join(', ')}${dupes.length > 3 ? '...' : ''}. Vui lòng đổi tên hoặc dùng mã sản phẩm để match.`
                };
              }
            }
          }
        }

        // Use upsert — onConflict depends on match field.
        // business_code: use DB unique constraint (company_id, business_code)
        // name: no DB unique constraint on name, so we do insert + manual update
        // both: same as business_code
        const onConflict = matchField === 'name' ? undefined : 'company_id,business_code';

        const allData: Product[] = [];
        let firstError: any = null;

        if (matchField === 'name' && companyId) {
          // Match by name: query existing products by name, update or insert
          for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const chunk = rows.slice(i, i + BATCH_SIZE);
            const chunkNames = chunk.map(r => r.name).filter(Boolean);
            const { data: existing } = await apiClient
              .from('products')
              .select('id, name')
              .eq('company_id', companyId)
              .in('name', chunkNames);
            const existingByName = new Map<string, string>();
            (existing || []).forEach(p => existingByName.set((p.name || '').toLowerCase(), p.id));

            const toInsert: any[] = [];
            const toUpdate: { id: string; row: any }[] = [];
            for (const row of chunk) {
              const nameKey = (row.name || '').toLowerCase();
              const existingId = existingByName.get(nameKey);
              if (existingId) toUpdate.push({ id: existingId, row });
              else toInsert.push(row);
            }

            // Insert new
            if (toInsert.length > 0) {
              const res = await apiClient.from('products').insert(toInsert).select('*');
              if (res.error && !firstError) firstError = res.error;
              if (res.data) for (const item of res.data) allData.push(ProductMapper.mapDbToProduct(item));
              if (res.error) break;
            }

            // Update existing
            for (const { id, row } of toUpdate) {
              const { id: _id, created_at: _ca, ...updateRow } = row;
              const res = await apiClient.from('products').update(updateRow).eq('id', id).eq('company_id', companyId).select('*');
              if (res.error && !firstError) firstError = res.error;
              if (res.data && res.data[0]) allData.push(ProductMapper.mapDbToProduct(res.data[0]));
              if (res.error) break;
            }
            if (firstError) break;
          }
        } else {
          // Match by business_code (or both) — use upsert
          for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const chunk = rows.slice(i, i + BATCH_SIZE);
            const res = await apiClient
              .from('products')
              .upsert(chunk, { onConflict: onConflict! })
              .select('*');
            if (res.error && !firstError) firstError = res.error;
            if (res.data) {
              for (const item of res.data) allData.push(ProductMapper.mapDbToProduct(item));
            }
            if (res.error) break;
          }
        }

        return { data: allData, error: firstError };
      },
      async () => {
        const results: Product[] = [];
        for (const p of products) {
          // In trial mode, check if product with same businessCode exists
          const existing = await fallbackService.getProducts({ search: p.businessCode });
          const found = existing.data?.find(prod => prod.businessCode === p.businessCode);
          if (found) {
            const res = await fallbackService.updateProduct(found.id, p);
            if (res.data) results.push(res.data);
          } else {
            const res = await fallbackService.createProduct(p as any);
            if (res.data) results.push(res.data);
          }
        }
        return { data: results, error: null };
      }
    );
  }
}

export const productService = ProductService;
