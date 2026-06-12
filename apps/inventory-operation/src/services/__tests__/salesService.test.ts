import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesService } from '../salesService';
import { supabase } from '../../lib/supabase';
import { fallbackService } from '../fallbackService';
import { mockSupabaseChain, MOCK_USER_ID } from './testUtils';

vi.mock('../fallbackService', () => ({
  fallbackService: {
    getSalesRecords: vi.fn(),
    createSalesRecord: vi.fn(),
    updateSalesRecord: vi.fn(),
    deleteSalesRecord: vi.fn(),
    getSalesStatistics: vi.fn(),
  },
}));

vi.mock('../../lib/supabase', async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, getCurrentUserId: () => Promise.resolve(MOCK_USER_ID) };
});

describe('SalesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getSalesRecords', () => {
    it('returns sales records from Supabase', async () => {
      const mockRecords = [
        { id: '1', date: '2024-01-15', sales_quantity: 100, product: { id: 'p1', name: 'Product A', business_code: 'SP001' } },
        { id: '2', date: '2024-01-16', sales_quantity: 200, product: { id: 'p2', name: 'Product B', business_code: 'SP002' } },
      ];

      mockSupabaseChain({ orderResult: { data: mockRecords, error: null } });

      const result = await SalesService.getSalesRecords();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(supabase.from).toHaveBeenCalledWith('sales_records');
    });

    it('applies dateFrom filter', async () => {
      mockSupabaseChain({ orderResult: { data: [], error: null } });

      await SalesService.getSalesRecords({ dateFrom: '2024-01-01' });

      expect(supabase.from).toHaveBeenCalledWith('sales_records');
    });

    it('applies dateTo filter', async () => {
      mockSupabaseChain({ orderResult: { data: [], error: null } });

      await SalesService.getSalesRecords({ dateTo: '2024-01-31' });

      expect(supabase.from).toHaveBeenCalledWith('sales_records');
    });

    it('applies productId filter', async () => {
      mockSupabaseChain({ orderResult: { data: [], error: null } });

      await SalesService.getSalesRecords({ productId: 'p1' });

      expect(supabase.from).toHaveBeenCalledWith('sales_records');
    });

    it('falls back when Supabase fails', async () => {
      mockSupabaseChain({ orderResult: { data: null, error: { message: 'DB error' } } });

      const fallbackData = [{ id: 'f1', productCode: 'FB001', outputDate: new Date(), quantitySold: 50 }];
      (fallbackService.getSalesRecords as any).mockResolvedValue({ data: fallbackData, error: null });

      const result = await SalesService.getSalesRecords();

      expect(result.success).toBe(true);
      expect(fallbackService.getSalesRecords).toHaveBeenCalled();
    });
  });

  describe('createSalesRecord', () => {
    it('creates a sales record successfully', async () => {
      const record = {
        date: '2024-01-15',
        productId: 'p1',
        salesQuantity: 100,
        promotionQuantity: 10,
        totalAmount: 2500000,
      };

      mockSupabaseChain({
        singleResult: {
          data: { id: 's1', ...record, product: { id: 'p1', name: 'A', business_code: 'SP001' } },
          error: null,
        },
      });

      const result = await SalesService.createSalesRecord(record as any);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('falls back when Supabase insert fails', async () => {
      const record = { date: '2024-01-15', productId: 'p1', salesQuantity: 100 };
      mockSupabaseChain({ singleResult: { data: null, error: { message: 'Insert error' } } });

      const fallbackData = { id: 'f1', productCode: 'FB001', outputDate: new Date(), quantitySold: 100 };
      (fallbackService.createSalesRecord as any).mockResolvedValue({ data: fallbackData, error: null });

      const result = await SalesService.createSalesRecord(record as any);

      expect(result.success).toBe(true);
      expect(fallbackService.createSalesRecord).toHaveBeenCalled();
    });
  });

  describe('updateSalesRecord', () => {
    it('updates a sales record successfully', async () => {
      const updates = { salesQuantity: 150 };
      mockSupabaseChain({
        singleResult: {
          data: { id: '1', sales_quantity: 150, product: { id: 'p1', name: 'A', business_code: 'SP001' } },
          error: null,
        },
      });

      const result = await SalesService.updateSalesRecord('1', updates);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteSalesRecord', () => {
    it('deletes a sales record successfully', async () => {
      mockSupabaseChain({ eqResult: { data: null, error: null } });

      const result = await SalesService.deleteSalesRecord('1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('falls back when Supabase delete fails', async () => {
      mockSupabaseChain({ eqResult: { data: null, error: { message: 'Delete error' } } });

      (fallbackService.deleteSalesRecord as any).mockResolvedValue({ data: true, error: null });

      const result = await SalesService.deleteSalesRecord('1');

      expect(result.success).toBe(true);
      expect(fallbackService.deleteSalesRecord).toHaveBeenCalled();
    });
  });

  describe('getSalesStatistics', () => {
    it('returns aggregated sales statistics', async () => {
      const mockData = [
        { date: '2024-01-15', sales_quantity: 100, promotion_quantity: 10, product: { name: 'A', category: 'fruit' } },
        { date: '2024-01-16', sales_quantity: 200, promotion_quantity: 20, product: { name: 'B', category: 'dry_goods' } },
      ];

      // Chain: select().gte().lte() — final await resolves to lteResult
      mockSupabaseChain({ lteResult: { data: mockData, error: null } });

      const result = await SalesService.getSalesStatistics('2024-01-01', '2024-01-31');

      expect(result.success).toBe(true);
      expect(result.data.totalSales).toBe(300);
      expect(result.data.totalPromotion).toBe(30);
      expect(result.data.totalRecords).toBe(2);
      expect(result.data.byCategory.fruit.sales).toBe(100);
      expect(result.data.byCategory.dry_goods.sales).toBe(200);
    });

    it('handles empty data', async () => {
      // Chain: select() — no filters, final await resolves to selectResult
      mockSupabaseChain({ selectResult: { data: [], error: null } });

      const result = await SalesService.getSalesStatistics();

      expect(result.success).toBe(true);
      expect(result.data.totalSales).toBe(0);
      expect(result.data.totalPromotion).toBe(0);
      expect(result.data.totalRecords).toBe(0);
    });
  });
});
