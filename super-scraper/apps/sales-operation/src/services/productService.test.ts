import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from './productService';
import { supabase } from '../lib/supabase';
import { fallbackService } from './fallbackService';

// Mock fallbackService
vi.mock('../fallbackService', () => ({
  fallbackService: {
    getProducts: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

// Mock ProductMapper
vi.mock('../mappers/productMapper', () => ({
  ProductMapper: {
    mapDbToProduct: vi.fn((item: any) => ({
      ...item,
      id: item.id,
      name: item.name,
      businessCode: item.business_code,
      category: item.category,
      status: item.status,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
    })),
    mapProductToDb: vi.fn((item: any) => ({
      ...item,
      business_code: item.businessCode,
      created_by: item.createdBy,
      updated_by: item.updatedBy,
    })),
  },
}));

// Mock localStorage for trial mode
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ProductService', () => {
  const mockProduct = {
    id: 'prod-1',
    name: 'Xoài',
    businessCode: 'NVL-XO01',
    category: 'fruit',
    status: 'active',
    inputQuantity: 100,
    inputUnit: 'kg',
    outputUnit: 'kg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockDbProduct = {
    id: 'prod-1',
    name: 'Xoài',
    business_code: 'NVL-XO01',
    category: 'fruit',
    status: 'active',
    input_quantity: 100,
    input_unit: 'kg',
    output_unit: 'kg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('getProducts', () => {
    it('returns products from Supabase when not in trial mode', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDbProduct], error: null }),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await ProductService.getProducts();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('Xoài');
      expect(supabase.from).toHaveBeenCalledWith('products');
    });

    it('applies category filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDbProduct], error: null }),
        eq: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      await ProductService.getProducts({ category: 'fruit' });

      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'fruit');
    });

    it('applies search filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDbProduct], error: null }),
        or: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      await ProductService.getProducts({ search: 'xoài' });

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('xoài')
      );
    });

    it('falls back to fallbackService when Supabase fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);
      (fallbackService.getProducts as any).mockResolvedValue({
        data: [mockProduct],
        error: null,
        count: 1,
      });

      const result = await ProductService.getProducts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockProduct]);
      expect(fallbackService.getProducts).toHaveBeenCalledTimes(1);
    });

    it('uses fallback in trial mode', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      (fallbackService.getProducts as any).mockResolvedValue({
        data: [mockProduct],
        error: null,
        count: 1,
      });

      const result = await ProductService.getProducts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockProduct]);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('getProduct', () => {
    it('returns a single product by id', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDbProduct, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await ProductService.getProduct('prod-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('prod-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'prod-1');
    });

    it('returns error when product not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await ProductService.getProduct('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });

  describe('createProduct', () => {
    it('creates a product successfully', async () => {
      const newProduct = {
        name: 'Sầu riêng',
        businessCode: 'NVL-SR01',
        category: 'fruit',
        status: 'active' as const,
        inputQuantity: 50,
        inputUnit: 'kg',
        outputUnit: 'kg',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockDbProduct, id: 'prod-2', name: 'Sầu riêng' }, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await ProductService.createProduct(newProduct);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Sầu riêng');
      expect(mockQuery.insert).toHaveBeenCalled();
    });

    it('falls back when Supabase insert fails', async () => {
      const newProduct = {
        name: 'Sầu riêng',
        businessCode: 'NVL-SR01',
        category: 'fruit',
        status: 'active' as const,
        inputQuantity: 50,
        inputUnit: 'kg',
        outputUnit: 'kg',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);
      (fallbackService.createProduct as any).mockResolvedValue({
        data: { ...newProduct, id: 'fb-prod-1', createdAt: new Date(), updatedAt: new Date() },
        error: null,
      });

      const result = await ProductService.createProduct(newProduct);

      expect(result.success).toBe(true);
      expect(fallbackService.createProduct).toHaveBeenCalledWith(newProduct);
    });
  });

  describe('updateProduct', () => {
    it('updates a product successfully', async () => {
      const updates = { name: 'Xoài Cát' };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockDbProduct, name: 'Xoài Cát' }, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await ProductService.updateProduct('prod-1', updates);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Xoài Cát');
    });
  });

  describe('deleteProduct', () => {
    it('deletes a product successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await ProductService.deleteProduct('prod-1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('returns error when delete fails', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await ProductService.deleteProduct('prod-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('searchProducts', () => {
    it('delegates to getProducts with search filter', async () => {
      const getProductsSpy = vi.spyOn(ProductService, 'getProducts').mockResolvedValue({
        success: true,
        data: [mockProduct],
      });

      const result = await ProductService.searchProducts('xoài');

      expect(getProductsSpy).toHaveBeenCalledWith({ search: 'xoài' });
      expect(result.success).toBe(true);
    });
  });

  describe('importProducts', () => {
    it('imports multiple products via Supabase', async () => {
      const products = [
        { name: 'A', businessCode: 'A01', category: 'fruit', inputQuantity: 10, inputUnit: 'kg', outputUnit: 'kg' },
        { name: 'B', businessCode: 'B01', category: 'dry_goods', inputQuantity: 20, inputUnit: 'kg', outputUnit: 'kg' },
      ];

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [mockDbProduct, { ...mockDbProduct, id: 'prod-2', name: 'B' }], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await ProductService.importProducts(products);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('falls back to individual fallback creates when Supabase fails', async () => {
      const products = [
        { name: 'A', businessCode: 'A01', category: 'fruit', inputQuantity: 10, inputUnit: 'kg', outputUnit: 'kg' },
      ];

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);
      (fallbackService.createProduct as any).mockResolvedValue({
        data: { ...products[0], id: 'fb-1', createdAt: new Date(), updatedAt: new Date() },
        error: null,
      });

      const result = await ProductService.importProducts(products);

      expect(result.success).toBe(true);
      expect(fallbackService.createProduct).toHaveBeenCalledTimes(1);
    });
  });

  describe('bulkInsertProducts', () => {
    it('inserts products in bulk via Supabase', async () => {
      const products = [
        { name: 'A', businessCode: 'A01', category: 'fruit', inputQuantity: 10, inputUnit: 'kg', outputUnit: 'kg' },
      ];

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [mockDbProduct], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await ProductService.bulkInsertProducts(products);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
