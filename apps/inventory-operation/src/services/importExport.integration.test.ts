import { describe, it, expect, vi, beforeEach } from 'vitest';
import { databaseService } from './databaseService';
import { supabase } from '../lib/supabase';
import { validateBulkImport, checkImportLimit } from '../utils/validation';

describe('Import/Export Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as any) = vi.fn();
  });

  it('validates and rejects oversized import batch', async () => {
    const products = Array.from({ length: 201 }, (_, i) => ({
      businessCode: `SP${i}`,
      name: `Product ${i}`,
      category: 'fruit',
      inputQuantity: 1,
      inputUnit: 'kg',
      outputUnit: 'kg',
    }));

    const limitCheck = checkImportLimit(products.length);
    expect(limitCheck.allowed).toBe(false);

    const result = await databaseService.bulkInsertProducts(products as any);
    expect(result.error).toContain('Maximum 200');
  });

  it('validates CSV rows before database insert', () => {
    const rows = [
      { businessCode: 'SP001', name: 'Valid', category: 'fruit' },
      { businessCode: '', name: '', category: '' },
    ];

    const validation = validateBulkImport(rows, ['businessCode', 'name', 'category']);
    expect(validation.valid).toBe(false);
    expect(validation.validRows).toBe(1);
    expect(validation.errorCount).toBe(3);
  });

  it('inserts only after server-side duplicate check passes', async () => {
    const products = [
      { businessCode: 'SP001', name: 'A', category: 'fruit', inputQuantity: 1, inputUnit: 'kg', outputUnit: 'kg' },
    ];

    // No existing products
    (supabase.from as any).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ data: [], error: null }),
      }),
    });

    // Insert succeeds
    (supabase.from as any).mockReturnValueOnce({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: products, error: null }),
      }),
    });

    const result = await databaseService.bulkInsertProducts(products as any);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it('rejects batch containing duplicate business codes', async () => {
    const products = [
      { businessCode: 'SP001', name: 'A', category: 'fruit', inputQuantity: 1, inputUnit: 'kg', outputUnit: 'kg' },
      { businessCode: 'SP001', name: 'B', category: 'dry_goods', inputQuantity: 1, inputUnit: 'kg', outputUnit: 'kg' },
    ];

    const result = await databaseService.bulkInsertProducts(products as any);
    expect(result.error).toBeTruthy();
  });

  it('inventory import validates product existence before insert', async () => {
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
  });
});
