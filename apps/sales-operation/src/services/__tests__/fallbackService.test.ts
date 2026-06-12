import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock trialMockData so MOCK_PRODUCTS is empty
vi.mock('../data/trialMockData', () => ({
  MOCK_PRODUCTS: [],
  MOCK_INVENTORY: [],
}));

import type { FallbackService as FallbackServiceClass } from '../fallbackService';
type FallbackService = InstanceType<typeof FallbackServiceClass>;

let fallbackService: FallbackService;

describe('fallbackService', () => {
  beforeEach(async () => {
    localStorage.clear();
    // Re-import fallbackService fresh each test so constructor re-runs with mocked MOCK_PRODUCTS
    vi.resetModules();
    const mod = await import('../fallbackService');
    fallbackService = mod.fallbackService;
  });

  describe('getProducts', () => {
    it('returns empty array when no products exist', async () => {
      const result = await fallbackService.getProducts();
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('filters by category', async () => {
      // Create a product first
      await fallbackService.createProduct({
        name: 'Test Product',
        businessCode: 'SP001',
        category: 'fruit',
        inputUnit: 'kg',
        outputUnit: 'kg',
      } as any);

      const result = await fallbackService.getProducts({ category: 'fruit' });
      expect(result.data).toHaveLength(1);

      const emptyResult = await fallbackService.getProducts({ category: 'dry_goods' });
      expect(emptyResult.data).toHaveLength(0);
    });

    it('filters by search term', async () => {
      await fallbackService.createProduct({
        name: 'Xoài',
        businessCode: 'NVL-XO01',
        category: 'fruit',
        inputUnit: 'kg',
        outputUnit: 'kg',
      } as any);

      const result = await fallbackService.getProducts({ search: 'xoài' });
      expect(result.data).toHaveLength(1);

      const noResult = await fallbackService.getProducts({ search: 'nonexistent' });
      expect(noResult.data).toHaveLength(0);
    });
  });

  describe('getProductById', () => {
    it('returns null for non-existent product', async () => {
      const result = await fallbackService.getProductById('nonexistent');
      expect(result.data).toBeNull();
      expect(result.error).toBe('Không tìm thấy sản phẩm');
    });

    it('returns product after creation', async () => {
      const created = await fallbackService.createProduct({
        name: 'New Product',
        businessCode: 'SP002',
        category: 'fruit',
        inputUnit: 'kg',
        outputUnit: 'kg',
      } as any);

      const result = await fallbackService.getProductById(created.data!.id);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe('New Product');
    });
  });

  describe('createProduct', () => {
    it('creates a product with generated id and timestamps', async () => {
      const result = await fallbackService.createProduct({
        name: 'Created Product',
        businessCode: 'SP003',
        category: 'dry_goods',
        inputUnit: 'kg',
        outputUnit: 'kg',
      } as any);

      expect(result.data).toBeDefined();
      expect(result.data!.id).toContain('prod-');
      expect(result.data!.createdAt).toBeInstanceOf(Date);
      expect(result.data!.updatedAt).toBeInstanceOf(Date);
      expect(result.error).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('updates an existing product', async () => {
      const created = await fallbackService.createProduct({
        name: 'Original',
        businessCode: 'SP004',
        category: 'fruit',
        inputUnit: 'kg',
        outputUnit: 'kg',
      } as any);

      const result = await fallbackService.updateProduct(created.data!.id, { name: 'Updated' });
      expect(result.data!.name).toBe('Updated');
      expect(result.error).toBeNull();
    });

    it('returns error for non-existent product', async () => {
      const result = await fallbackService.updateProduct('nonexistent', { name: 'X' });
      expect(result.data).toBeNull();
      expect(result.error).toBe('Không tìm thấy sản phẩm để cập nhật');
    });
  });

  describe('deleteProduct', () => {
    it('deletes an existing product', async () => {
      const created = await fallbackService.createProduct({
        name: 'To Delete',
        businessCode: 'SP005',
        category: 'fruit',
        inputUnit: 'kg',
        outputUnit: 'kg',
      } as any);

      const deleteResult = await fallbackService.deleteProduct(created.data!.id);
      expect(deleteResult.data).toBe(true);

      const getResult = await fallbackService.getProductById(created.data!.id);
      expect(getResult.data).toBeNull();
    });

    it('returns error for non-existent product', async () => {
      const result = await fallbackService.deleteProduct('nonexistent');
      expect(result.data).toBe(false);
      expect(result.error).toBe('Không tìm thấy sản phẩm để xóa');
    });
  });

  describe('getInventoryRecords', () => {
    it('returns empty array initially', async () => {
      const result = await fallbackService.getInventoryRecords();
      expect(result.data).toEqual([]);
    });

    it('filters by productCode', async () => {
      await fallbackService.createInventoryRecord({
        productCode: 'SP001',
        productName: 'A',
        rawMaterialStock: 10,
        date: new Date(),
      } as any);

      const result = await fallbackService.getInventoryRecords({ productCode: 'SP001' });
      expect(result.data).toHaveLength(1);

      const emptyResult = await fallbackService.getInventoryRecords({ productCode: 'UNKNOWN' });
      expect(emptyResult.data).toHaveLength(0);
    });
  });

  describe('createInventoryRecord', () => {
    it('creates a record with generated id', async () => {
      const result = await fallbackService.createInventoryRecord({
        productCode: 'SP001',
        productName: 'Test Product',
        rawMaterialStock: 50,
        processedStock: 30,
        finishedProductStock: 20,
        date: new Date(),
      } as any);

      expect(result.data).toBeDefined();
      expect(result.data!.id).toContain('inv-');
      expect(result.data!.rawMaterialStock).toBe(50);
      expect(result.error).toBeNull();
    });
  });

  describe('getSalesRecords', () => {
    it('returns empty array initially', async () => {
      const result = await fallbackService.getSalesRecords();
      expect(result.data).toEqual([]);
    });
  });

  describe('createSalesRecord', () => {
    it('creates a sales record with generated id', async () => {
      const result = await fallbackService.createSalesRecord({
        productCode: 'SP001',
        outputDate: new Date(),
        quantitySold: 100,
      } as any);

      expect(result.data).toBeDefined();
      expect(result.data!.id).toContain('sale-');
      expect(result.data!.quantitySold).toBe(100);
      expect(result.error).toBeNull();
    });
  });

  describe('getDashboardStats', () => {
    it('returns default stats when no data', async () => {
      // Ensure clean state by clearing localStorage
      localStorage.removeItem('trial_products');
      localStorage.removeItem('trial_inventory_records');
      localStorage.removeItem('trial_sales_records');
      localStorage.removeItem('trial_data_cleared');

      const result = await fallbackService.getDashboardStats();
      expect(result.data).toBeDefined();
      expect(result.data!.totalProducts).toBe(0);
      expect(result.data!.totalInventoryValue).toBe(0);
      expect(result.data!.lowStockAlerts).toBe(2);
      expect(result.data!.todayRevenue).toBe(0);
    });

    it('reflects created products and records', async () => {
      // Ensure clean state
      localStorage.removeItem('trial_products');
      localStorage.removeItem('trial_inventory_records');
      localStorage.removeItem('trial_sales_records');
      localStorage.removeItem('trial_data_cleared');

      await fallbackService.createProduct({
        name: 'P1',
        businessCode: 'SP001',
        category: 'fruit',
        inputUnit: 'kg',
        outputUnit: 'kg',
      } as any);

      await fallbackService.createInventoryRecord({
        productCode: 'SP001',
        productName: 'P1',
        finishedProductStock: 10,
        date: new Date(),
      } as any);

      const result = await fallbackService.getDashboardStats();
      expect(result.data!.totalProducts).toBe(1);
      expect(result.data!.totalInventoryValue).toBe(100); // 10 * 10
    });
  });

  describe('getProductCatalog', () => {
    it('returns catalog items', async () => {
      const result = await fallbackService.getProductCatalog();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('returns ok status', async () => {
      const result = await fallbackService.healthCheck();
      expect(result.status).toBe('ok');
      expect(result.message).toContain('Fallback service');
    });
  });

  describe('setFallbackMode', () => {
    it('sets fallback mode without throwing', () => {
      expect(() => fallbackService.setFallbackMode(true)).not.toThrow();
      expect(() => fallbackService.setFallbackMode(false)).not.toThrow();
    });
  });
});
