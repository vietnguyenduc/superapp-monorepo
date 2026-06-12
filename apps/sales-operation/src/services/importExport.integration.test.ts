import { describe, it, expect, vi, beforeEach } from 'vitest';
import { databaseService } from './databaseService';
import { ProductService } from './productService';
import { InventoryService } from './inventoryService';
import { validateBulkImport, checkImportLimit } from '../utils/validation';

vi.mock('./productService', () => ({
  ProductService: {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    bulkInsertProducts: vi.fn(),
    importProducts: vi.fn(),
  },
}));

vi.mock('./inventoryService', () => ({
  InventoryService: {
    getInventoryRecords: vi.fn(),
    createInventoryRecord: vi.fn(),
    getInventorySummary: vi.fn(),
    importInventoryRecords: vi.fn(),
  },
}));

describe('Import/Export Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    (ProductService.bulkInsertProducts as any).mockResolvedValue({
      data: null,
      error: 'Maximum 200 products allowed per batch',
    });

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

    (ProductService.bulkInsertProducts as any).mockResolvedValue({
      data: products,
      error: null,
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

    (ProductService.bulkInsertProducts as any).mockResolvedValue({
      data: null,
      error: 'Duplicate business codes found: SP001',
    });

    const result = await databaseService.bulkInsertProducts(products as any);
    expect(result.error).toBeTruthy();
  });

  it('inventory import validates product existence before insert', async () => {
    const record = { productCode: 'UNKNOWN', productName: 'X', rawMaterialStock: 1, date: new Date().toISOString() };

    (InventoryService.createInventoryRecord as any).mockResolvedValue({
      data: null,
      error: 'Product with code UNKNOWN does not exist',
    });

    const result = await databaseService.createInventoryRecord(record as any);
    expect(result.error).toContain('does not exist');
  });
});
