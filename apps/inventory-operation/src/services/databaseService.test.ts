import { describe, it, expect, vi, beforeEach } from 'vitest';
import { databaseService } from './databaseService';
import { supabase } from '../lib/supabase';

// Supabase is already mocked in setupTests.ts
describe('databaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as any) = vi.fn();
  });

  describe('createProduct', () => {
    it('returns validation error for empty businessCode', async () => {
      const result = await databaseService.createProduct({ businessCode: '', name: '' } as any);
      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(result.error).toContain('Product business code is required');
    });

    it('returns validation error for duplicate code via Supabase', async () => {
      const newProduct = {
        businessCode: 'SP001',
        name: 'New Product',
        category: 'fruit',
        inputQuantity: 10,
        inputUnit: 'kg',
        outputUnit: 'kg',
      };

      // Duplicate check: product already exists
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
          }),
        }),
      });

      const result = await databaseService.createProduct(newProduct as any);
      expect(result.error).toContain('already exists');
      expect(result.data).toBeNull();
    });

    it('successfully inserts valid product', async () => {
      const newProduct = {
        businessCode: 'SP001',
        name: 'New Product',
        category: 'fruit',
        inputQuantity: 10,
        inputUnit: 'kg',
        outputUnit: 'kg',
      };

      // Duplicate check returns no duplicate
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      // Insert returns data
      (supabase.from as any).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: '1', ...newProduct }, error: null }),
          }),
        }),
      });

      const result = await databaseService.createProduct(newProduct as any);
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.businessCode).toBe('SP001');
    });
  });

  describe('createInventoryRecord', () => {
    it('returns validation error for empty productCode', async () => {
      const result = await databaseService.createInventoryRecord({ productCode: '', productName: '' } as any);
      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(result.error).toContain('Product code is required');
    });

    it('returns error when product does not exist', async () => {
      const record = { productCode: 'UNKNOWN', productName: 'X', rawMaterialStock: 1, date: new Date().toISOString() };

      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const result = await databaseService.createInventoryRecord(record as any);
      expect(result.error).toContain('does not exist');
      expect(result.data).toBeNull();
    });

    it('successfully inserts valid record when product exists', async () => {
      const record = {
        productCode: 'SP001',
        productName: 'Product',
        rawMaterialStock: 10,
        processedStock: 5,
        finishedProductStock: 2,
        date: new Date().toISOString(),
      };

      // Product exists check
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
          }),
        }),
      });

      // Duplicate inventory check (no duplicate)
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        }),
      });

      // Insert
      (supabase.from as any).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'inv1', ...record }, error: null }),
          }),
        }),
      });

      const result = await databaseService.createInventoryRecord(record as any);
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe('bulkInsertProducts', () => {
    it('rejects more than 200 rows', async () => {
      const products = Array.from({ length: 201 }, (_, i) => ({
        businessCode: `SP${i}`,
        name: `Product ${i}`,
        category: 'fruit',
        inputQuantity: 1,
        inputUnit: 'kg',
        outputUnit: 'kg',
      }));

      const result = await databaseService.bulkInsertProducts(products as any);
      expect(result.error).toContain('Maximum 200');
    });

    it('returns validation errors for invalid rows', async () => {
      const products = [
        { businessCode: '', name: '', category: '', inputQuantity: 1, inputUnit: '', outputUnit: '' },
      ];

      const result = await databaseService.bulkInsertProducts(products as any);
      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
    });

    it('inserts valid batch successfully', async () => {
      const products = [
        { businessCode: 'SP001', name: 'A', category: 'fruit', inputQuantity: 1, inputUnit: 'kg', outputUnit: 'kg' },
        { businessCode: 'SP002', name: 'B', category: 'dry_goods', inputQuantity: 1, inputUnit: 'kg', outputUnit: 'kg' },
      ];

      // Existing products check (empty)
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      });

      // Insert
      (supabase.from as any).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: products, error: null }),
        }),
      });

      const result = await databaseService.bulkInsertProducts(products as any);
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });
  });

  describe('bulkInsertInventoryRecords', () => {
    it('rejects batch over 200 rows', async () => {
      const records = Array.from({ length: 201 }, (_, i) => ({
        productCode: `SP${i}`,
        productName: `P${i}`,
        rawMaterialStock: 1,
        date: '2024-01-01',
      }));

      const result = await databaseService.bulkInsertInventoryRecords(records as any);
      expect(result.error).toContain('Maximum 200');
    });
  });
});
