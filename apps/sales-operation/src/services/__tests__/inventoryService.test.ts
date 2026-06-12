import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../inventoryService';
import { supabase } from '../../lib/supabase';
import { fallbackService } from '../fallbackService';
import { mockSupabaseChain } from './testUtils';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  getCurrentUserId: vi.fn().mockResolvedValue('mock-user-id'),
  TABLES: {
    PRODUCTS: 'products',
    INVENTORY_RECORDS: 'inventory_records',
    SALES_RECORDS: 'sales_records',
  },
}));

vi.mock('../fallbackService', () => ({
  fallbackService: {
    getInventoryRecords: vi.fn(),
    createInventoryRecord: vi.fn(),
    updateInventoryRecord: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

describe('InventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getInventoryRecords', () => {
    it('returns inventory records from Supabase', async () => {
      const mockRecords = [
        { id: '1', date: '2024-01-15', product: { id: 'p1', name: 'Product A', business_code: 'SP001' }, input_quantity: 10 },
        { id: '2', date: '2024-01-16', product: { id: 'p2', name: 'Product B', business_code: 'SP002' }, input_quantity: 20 },
      ];

      mockSupabaseChain({ orderResult: { data: mockRecords, error: null } });

      const result = await InventoryService.getInventoryRecords();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(supabase.from).toHaveBeenCalledWith('inventory_records');
    });

    it('applies date filter', async () => {
      const { eqMock } = mockSupabaseChain({ orderResult: { data: [], error: null } });

      await InventoryService.getInventoryRecords({ date: '2024-01-15' });

      expect(eqMock).toHaveBeenCalledWith('date', '2024-01-15');
    });

    it('applies productId filter', async () => {
      const { eqMock } = mockSupabaseChain({ orderResult: { data: [], error: null } });

      await InventoryService.getInventoryRecords({ productId: 'p1' });

      expect(eqMock).toHaveBeenCalledWith('product_id', 'p1');
    });

    it('applies limit filter', async () => {
      const { limitMock } = mockSupabaseChain({ orderResult: { data: [], error: null } });

      await InventoryService.getInventoryRecords({ limit: 5 });

      expect(limitMock).toHaveBeenCalledWith(5);
    });

    it('falls back when Supabase fails', async () => {
      mockSupabaseChain({ orderResult: { data: null, error: { message: 'DB error' } } });

      const fallbackData = [{ id: 'f1', productCode: 'FB001', date: new Date() }];
      (fallbackService.getInventoryRecords as any).mockResolvedValue({ data: fallbackData, error: null });

      const result = await InventoryService.getInventoryRecords();

      expect(result.success).toBe(true);
      expect(fallbackService.getInventoryRecords).toHaveBeenCalled();
    });
  });

  describe('getInventoryRecord', () => {
    it('returns a single inventory record by id', async () => {
      const mockRecord = { id: '1', date: '2024-01-15', product: { id: 'p1', name: 'Product A', business_code: 'SP001' } };
      mockSupabaseChain({ singleResult: { data: mockRecord, error: null } });

      const result = await InventoryService.getInventoryRecord('1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('createInventoryRecord', () => {
    it('creates an inventory record successfully', async () => {
      const record = {
        productCode: 'SP001',
        productName: 'Product A',
        rawMaterialStock: 10,
        processedStock: 5,
        finishedProductStock: 2,
        date: new Date('2024-01-15'),
      };

      // Mock product lookup (first call) + insert (second call)
      const productSingleMock = vi.fn().mockResolvedValue({ data: { id: 'p1' }, error: null });
      const productEqMock = vi.fn().mockReturnValue({ single: productSingleMock });
      const productSelectMock = vi.fn().mockReturnValue({ eq: productEqMock });

      const insertSingleMock = vi.fn().mockResolvedValue({
        data: { id: 'inv1', ...record, product: { id: 'p1', name: 'Product A', business_code: 'SP001' } },
        error: null,
      });
      const insertSelectMock = vi.fn().mockReturnValue({ single: insertSingleMock });
      const insertMock = vi.fn().mockReturnValue({ select: insertSelectMock });

      (supabase.from as any)
        .mockReturnValueOnce({ select: productSelectMock })
        .mockReturnValueOnce({ insert: insertMock });

      const result = await InventoryService.createInventoryRecord(record as any);

      expect(result.success).toBe(true);
    });

    it('returns error when product not found', async () => {
      const record = { productCode: 'UNKNOWN', productName: 'X', rawMaterialStock: 1, date: new Date() };

      const productSingleMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const productEqMock = vi.fn().mockReturnValue({ single: productSingleMock });
      const productSelectMock = vi.fn().mockReturnValue({ eq: productEqMock });
      (supabase.from as any).mockReturnValue({ select: productSelectMock });

      const result = await InventoryService.createInventoryRecord(record as any);

      expect(result.success).toBe(false);
    });
  });

  describe('updateInventoryRecord', () => {
    it('updates an inventory record successfully', async () => {
      const updates = { rawMaterialStock: 20 };
      mockSupabaseChain({ singleResult: { data: { id: '1', raw_material_stock: 20, product: { id: 'p1', name: 'A', business_code: 'SP001' } }, error: null } });

      const result = await InventoryService.updateInventoryRecord('1', updates);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteInventoryRecord', () => {
    it('deletes an inventory record successfully', async () => {
      mockSupabaseChain({ eqResult: { data: null, error: null } });

      const result = await InventoryService.deleteInventoryRecord('1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('getInventorySummary', () => {
    it('returns aggregated summary', async () => {
      const mockData = [
        { product_code: 'SP001', product_name: 'A', input_quantity: 10, raw_material_stock: 5, processed_stock: 3, finished_product_stock: 2 },
        { product_code: 'SP001', product_name: 'A', input_quantity: 20, raw_material_stock: 10, processed_stock: 6, finished_product_stock: 4 },
      ];

      const { gteMock, lteMock } = mockSupabaseChain({ lteResult: { data: mockData, error: null } });

      const result = await InventoryService.getInventorySummary(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].totalInput).toBe(30);
      expect(result.data![0].totalRawMaterial).toBe(15);
    });
  });

  describe('importInventoryRecords', () => {
    it('imports multiple records', async () => {
      const records = [
        { productCode: 'SP001', productName: 'A', rawMaterialStock: 10, date: new Date() },
        { productCode: 'SP002', productName: 'B', rawMaterialStock: 20, date: new Date() },
      ];

      mockSupabaseChain({ selectResult: { data: records.map(r => ({ ...r, product: { id: 'p1', name: r.productName, business_code: r.productCode } })), error: null } });

      const result = await InventoryService.importInventoryRecords(records as any);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });
});
