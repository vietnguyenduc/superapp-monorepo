import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from './inventoryService';
import { supabase } from '../lib/supabase';
import { fallbackService } from './fallbackService';

// Mock fallbackService
vi.mock('../fallbackService', () => ({
  fallbackService: {
    getInventoryRecords: vi.fn(),
    getProductById: vi.fn(),
    createInventoryRecord: vi.fn(),
    updateInventoryRecord: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

// Mock InventoryMapper
vi.mock('../mappers/inventoryMapper', () => ({
  InventoryMapper: {
    mapDbToInventory: vi.fn((item: any) => ({
      id: item.id,
      productCode: item.product?.business_code || item.product_code,
      productName: item.product?.name || item.product_name,
      date: item.date ? new Date(item.date) : new Date(),
      rawMaterialStock: item.raw_material_stock || 0,
      processedStock: item.processed_stock || 0,
      finishedProductStock: item.finished_product_stock || 0,
      inputQuantity: item.input_quantity || 0,
      notes: item.notes || '',
      createdBy: item.created_by,
      updatedBy: item.updated_by,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
    })),
    mapInventoryToDb: vi.fn((item: any) => ({
      product_id: item.productId,
      date: item.date,
      raw_material_stock: item.rawMaterialStock,
      processed_stock: item.processedStock,
      finished_product_stock: item.finishedProductStock,
      input_quantity: item.inputQuantity,
      notes: item.notes,
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

describe('InventoryService', () => {
  const mockInventoryRecord = {
    id: 'inv-1',
    productCode: 'NVL-XO01',
    productName: 'Xoài',
    date: new Date('2024-01-15'),
    rawMaterialStock: 100,
    processedStock: 50,
    finishedProductStock: 30,
    inputQuantity: 200,
    notes: '',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockDbInventoryRecord = {
    id: 'inv-1',
    date: '2024-01-15',
    raw_material_stock: 100,
    processed_stock: 50,
    finished_product_stock: 30,
    input_quantity: 200,
    notes: '',
    created_by: 'user-1',
    updated_by: 'user-1',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    product: {
      id: 'prod-1',
      name: 'Xoài',
      business_code: 'NVL-XO01',
      category: 'fruit',
      input_unit: 'kg',
      output_unit: 'kg',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('getInventoryRecords', () => {
    it('returns inventory records from Supabase', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDbInventoryRecord], error: null }),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await InventoryService.getInventoryRecords();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].productCode).toBe('NVL-XO01');
      expect(supabase.from).toHaveBeenCalledWith('inventory_records');
    });

    it('applies date filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDbInventoryRecord], error: null }),
        eq: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      await InventoryService.getInventoryRecords({ date: '2024-01-15' });

      expect(mockQuery.eq).toHaveBeenCalledWith('date', '2024-01-15');
    });

    it('applies product filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDbInventoryRecord], error: null }),
        eq: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      await InventoryService.getInventoryRecords({ productId: 'prod-1' });

      expect(mockQuery.eq).toHaveBeenCalledWith('product_id', 'prod-1');
    });

    it('applies limit', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDbInventoryRecord], error: null }),
        limit: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      await InventoryService.getInventoryRecords({ limit: 10 });

      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('falls back when Supabase fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);
      (fallbackService.getInventoryRecords as any).mockResolvedValue({
        data: [mockInventoryRecord],
        error: null,
        count: 1,
      });

      const result = await InventoryService.getInventoryRecords();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockInventoryRecord]);
      expect(fallbackService.getInventoryRecords).toHaveBeenCalledTimes(1);
    });

    it('uses fallback in trial mode', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      (fallbackService.getInventoryRecords as any).mockResolvedValue({
        data: [mockInventoryRecord],
        error: null,
        count: 1,
      });

      const result = await InventoryService.getInventoryRecords();

      expect(result.success).toBe(true);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('getInventoryRecord', () => {
    it('returns a single inventory record by id', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDbInventoryRecord, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await InventoryService.getInventoryRecord('inv-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('inv-1');
    });
  });

  describe('createInventoryRecord', () => {
    it('creates an inventory record successfully', async () => {
      const newRecord = {
        productCode: 'NVL-XO01',
        productName: 'Xoài',
        date: new Date('2024-02-01'),
        rawMaterialStock: 200,
        processedStock: 100,
        finishedProductStock: 50,
        inputQuantity: 300,
        notes: '',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      };

      // Mock product lookup
      const productLookupQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'prod-1' }, error: null }),
      };

      // Mock insert
      const insertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDbInventoryRecord, error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(productLookupQuery)  // First call: product lookup
        .mockReturnValueOnce(insertQuery);         // Second call: insert

      const result = await InventoryService.createInventoryRecord(newRecord);

      expect(result.success).toBe(true);
      expect(productLookupQuery.eq).toHaveBeenCalledWith('business_code', 'NVL-XO01');
      expect(insertQuery.insert).toHaveBeenCalled();
    });

    it('returns error when product not found', async () => {
      const newRecord = {
        productCode: 'UNKNOWN',
        productName: 'Unknown',
        date: new Date(),
        rawMaterialStock: 0,
        processedStock: 0,
        finishedProductStock: 0,
        inputQuantity: 0,
        notes: '',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      };

      const productLookupQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };

      (supabase.from as any).mockReturnValue(productLookupQuery);

      const result = await InventoryService.createInventoryRecord(newRecord);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Không tìm thấy sản phẩm');
    });

    it('falls back when Supabase insert fails', async () => {
      const newRecord = {
        productCode: 'NVL-XO01',
        productName: 'Xoài',
        date: new Date(),
        rawMaterialStock: 100,
        processedStock: 50,
        finishedProductStock: 30,
        inputQuantity: 200,
        notes: '',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      };

      // Product lookup succeeds
      const productLookupQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'prod-1' }, error: null }),
      };

      // Insert fails
      const insertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(productLookupQuery)
        .mockReturnValueOnce(insertQuery);

      (fallbackService.createInventoryRecord as any).mockResolvedValue({
        data: { ...mockInventoryRecord, id: 'fb-inv-1' },
        error: null,
      });

      const result = await InventoryService.createInventoryRecord(newRecord);

      expect(result.success).toBe(true);
      expect(fallbackService.createInventoryRecord).toHaveBeenCalledWith(newRecord);
    });
  });

  describe('updateInventoryRecord', () => {
    it('updates an inventory record successfully', async () => {
      const updates = { rawMaterialStock: 150 };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockDbInventoryRecord, raw_material_stock: 150 }, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await InventoryService.updateInventoryRecord('inv-1', updates);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteInventoryRecord', () => {
    it('deletes an inventory record successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await InventoryService.deleteInventoryRecord('inv-1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('getInventorySummary', () => {
    it('returns aggregated inventory summary', async () => {
      const mockDbRecords = [
        { product_code: 'NVL-XO01', product_name: 'Xoài', input_quantity: 200, raw_material_stock: 100, processed_stock: 50, finished_product_stock: 30 },
        { product_code: 'NVL-XO01', product_name: 'Xoài', input_quantity: 150, raw_material_stock: 80, processed_stock: 40, finished_product_stock: 20 },
      ];

      const mockQuery = {
        select: vi.fn().mockResolvedValue({ data: mockDbRecords, error: null }),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await InventoryService.getInventorySummary(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].productCode).toBe('NVL-XO01');
      expect(result.data![0].totalInput).toBe(350);
      expect(result.data![0].totalRawMaterial).toBe(180);
      expect(result.data![0].totalProcessed).toBe(90);
      expect(result.data![0].totalFinished).toBe(50);
    });
  });

  describe('importInventoryRecords', () => {
    it('imports multiple records via Supabase', async () => {
      const records = [
        { productCode: 'NVL-XO01', productName: 'Xoài', date: new Date(), rawMaterialStock: 100, processedStock: 50, finishedProductStock: 30, inputQuantity: 200, notes: '' },
      ];

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [mockDbInventoryRecord], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await InventoryService.importInventoryRecords(records);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('falls back to individual fallback creates when Supabase fails', async () => {
      const records = [
        { productCode: 'NVL-XO01', productName: 'Xoài', date: new Date(), rawMaterialStock: 100, processedStock: 50, finishedProductStock: 30, inputQuantity: 200, notes: '' },
      ];

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);
      (fallbackService.createInventoryRecord as any).mockResolvedValue({
        data: { ...mockInventoryRecord, id: 'fb-inv-1' },
        error: null,
      });

      const result = await InventoryService.importInventoryRecords(records);

      expect(result.success).toBe(true);
      expect(fallbackService.createInventoryRecord).toHaveBeenCalledTimes(1);
    });
  });
});
