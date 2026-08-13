import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '../productService';
import { supabase } from '../../lib/supabase';
import { fallbackService } from '../fallbackService';
import { mockSupabaseChain } from './testUtils';

// Mock supabase module with getCurrentUserId
vi.mock('../../lib/supabase', () => {
  const mockSupabase = { from: vi.fn() };
  return {
    supabase: mockSupabase,
    apiClient: { get from() { return mockSupabase.from; } },
    getCurrentUserId: vi.fn().mockResolvedValue('mock-user-id'),
    getCurrentCompanyId: vi.fn().mockResolvedValue(null),
    TABLES: {
      PRODUCTS: 'products',
      INVENTORY_RECORDS: 'inventory_records',
      SALES_RECORDS: 'sales_records',
    },
  };
});

vi.mock('../fallbackService', () => ({
  fallbackService: {
    getProducts: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getProducts', () => {
    it('returns products from Supabase when online', async () => {
      const mockProducts = [
        { id: '1', name: 'Product A', business_code: 'SP001', category: 'fruit', status: 'active' },
        { id: '2', name: 'Product B', business_code: 'SP002', category: 'dry_goods', status: 'active' },
      ];

      mockSupabaseChain({ orderResult: { data: mockProducts, error: null } });

      const result = await ProductService.getProducts();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].name).toBe('Product A');
      expect(supabase.from).toHaveBeenCalledWith('products');
    });

    it('applies category filter', async () => {
      const { eqMock } = mockSupabaseChain({ orderResult: { data: [], error: null } });

      await ProductService.getProducts({ category: 'fruit' });

      expect(eqMock).toHaveBeenCalledWith('category', 'fruit');
    });

    it('applies search filter via or()', async () => {
      const { orMock } = mockSupabaseChain({ orderResult: { data: [], error: null } });

      await ProductService.getProducts({ search: 'SP001' });

      expect(orMock).toHaveBeenCalledWith('name.ilike.%SP001%,business_code.ilike.%SP001%');
    });

    it('falls back to fallbackService when Supabase fails', async () => {
      mockSupabaseChain({ orderResult: { data: null, error: { message: 'DB error' } } });

      const fallbackData = [{ id: 'f1', name: 'Fallback Product', businessCode: 'FB001', category: 'fruit' }];
      (fallbackService.getProducts as any).mockResolvedValue({ data: fallbackData, error: null });

      const result = await ProductService.getProducts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(fallbackData);
      expect(fallbackService.getProducts).toHaveBeenCalled();
    });

    it('uses fallback in trial mode', async () => {
      localStorage.setItem('isTrial', 'true');
      const fallbackData = [{ id: 't1', name: 'Trial Product', businessCode: 'TR001', category: 'fruit' }];
      (fallbackService.getProducts as any).mockResolvedValue({ data: fallbackData, error: null });

      const result = await ProductService.getProducts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(fallbackData);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('getProduct', () => {
    it('returns a single product by id', async () => {
      const mockProduct = { id: '1', name: 'Product A', business_code: 'SP001' };
      mockSupabaseChain({ singleResult: { data: mockProduct, error: null } });

      const result = await ProductService.getProduct('1');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Product A');
    });

    it('returns error when product not found', async () => {
      mockSupabaseChain({ singleResult: { data: null, error: { message: 'Not found' } } });

      const result = await ProductService.getProduct('999');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('createProduct', () => {
    it('creates a product successfully', async () => {
      const newProduct = {
        name: 'New Product',
        businessCode: 'SP003',
        category: 'fruit',
        inputUnit: 'kg',
        outputUnit: 'kg',
      };

      mockSupabaseChain({ singleResult: { data: { id: '3', ...newProduct, business_code: newProduct.businessCode }, error: null } });

      const result = await ProductService.createProduct(newProduct as any);

      expect(result.success).toBe(true);
      expect(result.data?.businessCode).toBe('SP003');
    });

    it('falls back when Supabase insert fails', async () => {
      const newProduct = { name: 'Fallback', businessCode: 'FB001', category: 'fruit', inputUnit: 'kg', outputUnit: 'kg' };
      mockSupabaseChain({ singleResult: { data: null, error: { message: 'Insert error' } } });

      const fallbackData = { id: 'f1', ...newProduct, businessCode: newProduct.businessCode, createdAt: new Date(), updatedAt: new Date() };
      (fallbackService.createProduct as any).mockResolvedValue({ data: fallbackData, error: null });

      const result = await ProductService.createProduct(newProduct as any);

      expect(result.success).toBe(true);
      expect(fallbackService.createProduct).toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('updates a product successfully', async () => {
      const updates = { name: 'Updated Name' };
      mockSupabaseChain({ singleResult: { data: { id: '1', name: 'Updated Name', business_code: 'SP001' }, error: null } });

      const result = await ProductService.updateProduct('1', updates);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Name');
    });
  });

  describe('deleteProduct', () => {
    it('deletes a product successfully', async () => {
      mockSupabaseChain({ eqResult: { data: null, error: null } });

      const result = await ProductService.deleteProduct('1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('returns error when delete fails', async () => {
      mockSupabaseChain({ eqResult: { data: null, error: { message: 'Delete failed' } } });

      const result = await ProductService.deleteProduct('1');

      expect(result.success).toBe(false);
    });
  });

  describe('searchProducts', () => {
    it('delegates to getProducts with search filter', async () => {
      const { orMock } = mockSupabaseChain({ orderResult: { data: [], error: null } });

      await ProductService.searchProducts('test');

      expect(orMock).toHaveBeenCalledWith('name.ilike.%test%,business_code.ilike.%test%');
    });
  });

  describe('importProducts', () => {
    it('imports multiple products', async () => {
      const products = [
        { name: 'P1', businessCode: 'SP001', category: 'fruit', inputUnit: 'kg', outputUnit: 'kg' },
        { name: 'P2', businessCode: 'SP002', category: 'dry_goods', inputUnit: 'kg', outputUnit: 'kg' },
      ];

      mockSupabaseChain({ selectResult: { data: products.map(p => ({ ...p, business_code: p.businessCode })), error: null } });

      const result = await ProductService.importProducts(products as any);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('bulkInsertProducts', () => {
    it('inserts bulk products', async () => {
      const products = [
        { name: 'Bulk1', businessCode: 'B001', category: 'fruit', inputUnit: 'kg', outputUnit: 'kg' },
      ];

      mockSupabaseChain({ selectResult: { data: products.map(p => ({ ...p, business_code: p.businessCode })), error: null } });

      const result = await ProductService.bulkInsertProducts(products as any);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
