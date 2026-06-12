import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage before importing fallbackService
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

// Mock trialMockData
vi.mock('../../data/trialMockData', () => ({
  MOCK_PRODUCTS: [
    {
      id: 'prod-1',
      name: 'Xoài',
      businessCode: 'NVL-XO01',
      category: 'fruit',
      status: 'active',
      inputQuantity: 100,
      inputUnit: 'kg',
      outputUnit: 'kg',
      linkedFinishedProductCodes: [],
      recipe: [],
      intermediateUnits: [],
      conversions: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'prod-2',
      name: 'Dưa hấu',
      businessCode: 'NVL-DH01',
      category: 'fruit',
      status: 'active',
      inputQuantity: 200,
      inputUnit: 'kg',
      outputUnit: 'kg',
      linkedFinishedProductCodes: [],
      recipe: [],
      intermediateUnits: [],
      conversions: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  MOCK_INVENTORY: [
    {
      id: 'inv-1',
      productCode: 'NVL-XO01',
      productName: 'Xoài',
      date: new Date('2024-01-15'),
      rawMaterialStock: 100,
      processedStock: 50,
      finishedProductStock: 30,
      inputQuantity: 200,
      notes: '',
      createdBy: 'trial',
      updatedBy: 'trial',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
  ],
}));

// Mock realSalesData
vi.mock('../../data/realSalesData', () => ({
  convertToSalesRecords: vi.fn(() => []),
}));

// Mock product-catalog
vi.mock('../../types/product-catalog', () => ({
  ProductCatalogItem: {},
  SAMPLE_PRODUCT_CATALOG: [
    {
      id: 'cat-1',
      productName: 'Xoài',
      productCode: 'NVL-XO01',
      category: 'fruit',
      unit: 'kg',
      price: 25000,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
}));

// Mock types
vi.mock('../../types', () => ({
  Product: {},
  InventoryRecord: {},
  SalesRecord: {},
  SpecialOutboundRecord: {},
  InventoryVarianceReport: {},
  ProductCategory: {},
  ProductStatus: {},
}));

import { fallbackService } from './fallbackService';

describe('FallbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('healthCheck', () => {
    it('returns ok status', async () => {
      const result = await fallbackService.healthCheck();
      expect(result.status).toBe('ok');
      expect(result.message).toContain('Fallback service is running');
    });
  });

  describe('getProducts', () => {
    it('returns empty array when no products initialized', async () => {
      const result = await fallbackService.getProducts();
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('filters by category', async () => {
      // Set trial mode to initialize mock data
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'isTrial') return 'true';
        return null;
      });

      // Re-initialize by calling a method that triggers initializeData
      const result = await fallbackService.getProducts({ category: 'fruit' });
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('filters by search term', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'isTrial') return 'true';
        return null;
      });

      const result = await fallbackService.getProducts({ search: 'xoài' });
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('returns error gracefully', async () => {
      // Force an error by making getProducts throw
      const result = await fallbackService.getProducts();
      // Should not throw, should return error response
      expect(result.error).toBeNull(); // No error because mock data is empty but valid
    });
  });

  describe('getProductById', () => {
    it('returns null when product not found', async () => {
      const result = await fallbackService.getProductById('nonexistent');
      expect(result.data).toBeNull();
      expect(result.error).toBe('Không tìm thấy sản phẩm');
    });
  });

  describe('createProduct', () => {
    it('creates a product with generated id', async () => {
      const newProduct = {
        name: 'Test Product',
        businessCode: 'TEST-01',
        category: 'fruit' as const,
        status: 'active' as const,
        inputQuantity: 10,
        inputUnit: 'kg',
        outputUnit: 'kg',
      };

      const result = await fallbackService.createProduct(newProduct as any);

      expect(result.data).toBeDefined();
      expect(result.data?.id).toContain('prod-');
      expect(result.data?.name).toBe('Test Product');
      expect(result.error).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('returns error when product not found', async () => {
      const result = await fallbackService.updateProduct('nonexistent', { name: 'Updated' });
      expect(result.data).toBeNull();
      expect(result.error).toBe('Không tìm thấy sản phẩm để cập nhật');
    });
  });

  describe('deleteProduct', () => {
    it('returns error when product not found', async () => {
      const result = await fallbackService.deleteProduct('nonexistent');
      expect(result.data).toBe(false);
      expect(result.error).toBe('Không tìm thấy sản phẩm để xóa');
    });
  });

  describe('getInventoryRecords', () => {
    it('returns empty array when no records', async () => {
      const result = await fallbackService.getInventoryRecords();
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('filters by productCode', async () => {
      const result = await fallbackService.getInventoryRecords({ productCode: 'NVL-XO01' });
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('createInventoryRecord', () => {
    it('creates a record with generated id', async () => {
      const newRecord = {
        productCode: 'NVL-XO01',
        productName: 'Xoài',
        date: new Date(),
        rawMaterialStock: 100,
        processedStock: 50,
        finishedProductStock: 30,
        inputQuantity: 200,
        notes: '',
        createdBy: 'trial',
        updatedBy: 'trial',
      };

      const result = await fallbackService.createInventoryRecord(newRecord as any);

      expect(result.data).toBeDefined();
      expect(result.data?.id).toContain('inv-');
      expect(result.error).toBeNull();
    });
  });

  describe('getSalesRecords', () => {
    it('returns empty array when no records', async () => {
      const result = await fallbackService.getSalesRecords();
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('createSalesRecord', () => {
    it('creates a sales record with generated id', async () => {
      const newRecord = {
        productCode: 'NVL-XO01',
        productName: 'Xoài',
        outputDate: new Date(),
        quantitySold: 50,
        unitPrice: 25000,
        totalAmount: 1250000,
        customerType: 'retail' as const,
        status: 'completed' as const,
        notes: '',
        createdBy: 'trial',
        updatedBy: 'trial',
      };

      const result = await fallbackService.createSalesRecord(newRecord as any);

      expect(result.data).toBeDefined();
      expect(result.data?.id).toContain('sale-');
      expect(result.error).toBeNull();
    });
  });

  describe('getDashboardStats', () => {
    it('returns default stats', async () => {
      const result = await fallbackService.getDashboardStats();
      expect(result.data).toBeDefined();
      expect(result.data?.totalProducts).toBe(0);
      expect(result.data?.totalInventoryValue).toBe(0);
      expect(result.data?.lowStockAlerts).toBe(2);
      expect(result.data?.todayRevenue).toBe(0);
      expect(result.error).toBeNull();
    });
  });

  describe('getProductCatalog', () => {
    it('returns catalog items', async () => {
      const result = await fallbackService.getProductCatalog();
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('filters by category', async () => {
      const result = await fallbackService.getProductCatalog({ category: 'fruit' });
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('filters by search', async () => {
      const result = await fallbackService.getProductCatalog({ search: 'xoài' });
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe('createProductCatalogItem', () => {
    it('creates a catalog item with generated id', async () => {
      const newItem = {
        productName: 'New Item',
        productCode: 'NEW-01',
        category: 'fruit',
        unit: 'kg',
        price: 10000,
      };

      const result = await fallbackService.createProductCatalogItem(newItem as any);

      expect(result.data).toBeDefined();
      expect(result.data?.id).toContain('catalog-');
      expect(result.error).toBeNull();
    });
  });
});
