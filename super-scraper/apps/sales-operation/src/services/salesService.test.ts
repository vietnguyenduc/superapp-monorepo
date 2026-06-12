import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesService } from './salesService';
import { supabase } from '../lib/supabase';
import { fallbackService } from './fallbackService';

// Mock fallbackService
vi.mock('../fallbackService', () => ({
  fallbackService: {
    getSalesRecords: vi.fn(),
    createSalesRecord: vi.fn(),
    updateSalesRecord: vi.fn(),
    deleteSalesRecord: vi.fn(),
    getSalesStatistics: vi.fn(),
  },
}));

// Mock SalesMapper
vi.mock('../mappers/salesMapper', () => ({
  SalesMapper: {
    mapDbToSales: vi.fn((item: any) => ({
      id: item.id,
      productCode: item.product?.business_code || item.product_code,
      productName: item.product?.name || item.product_name,
      outputDate: item.date ? new Date(item.date) : new Date(),
      quantitySold: item.sales_quantity || 0,
      unitPrice: item.unit_price || 0,
      totalAmount: item.total_amount || 0,
      customerType: item.customer_type || 'retail',
      status: item.status || 'completed',
      notes: item.notes || '',
      createdBy: item.created_by,
      updatedBy: item.updated_by,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
    })),
    mapSalesToDb: vi.fn((item: any) => ({
      product_id: item.productId,
      date: item.outputDate,
      sales_quantity: item.quantitySold,
      unit_price: item.unitPrice,
      total_amount: item.totalAmount,
      customer_type: item.customerType,
      status: item.status,
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

describe('SalesService', () => {
  const mockSalesRecord = {
    id: 'sale-1',
    productCode: 'NVL-XO01',
    productName: 'Xoài',
    outputDate: new Date('2024-01-15'),
    quantitySold: 120,
    unitPrice: 25000,
    totalAmount: 3000000,
    customerType: 'retail' as const,
    status: 'completed' as const,
    notes: '',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockDbSalesRecord = {
    id: 'sale-1',
    date: '2024-01-15',
    sales_quantity: 120,
    unit_price: 25000,
    total_amount: 3000000,
    customer_type: 'retail',
    status: 'completed',
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

  describe('getSalesRecords', () => {
    it('returns sales records from Supabase', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDbSalesRecord], error: null }),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await SalesService.getSalesRecords();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].productCode).toBe('NVL-XO01');
      expect(supabase.from).toHaveBeenCalledWith('sales_records');
    });

    it('applies date range filters', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDbSalesRecord], error: null }),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      await SalesService.getSalesRecords({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2024-01-31');
    });

    it('applies product filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDbSalesRecord], error: null }),
        eq: vi.fn().mockReturnThis(),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      await SalesService.getSalesRecords({ productId: 'prod-1' });

      expect(mockQuery.eq).toHaveBeenCalledWith('product_id', 'prod-1');
    });

    it('falls back when Supabase fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);
      (fallbackService.getSalesRecords as any).mockResolvedValue({
        data: [mockSalesRecord],
        error: null,
        count: 1,
      });

      const result = await SalesService.getSalesRecords();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockSalesRecord]);
      expect(fallbackService.getSalesRecords).toHaveBeenCalledTimes(1);
    });

    it('uses fallback in trial mode', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      (fallbackService.getSalesRecords as any).mockResolvedValue({
        data: [mockSalesRecord],
        error: null,
        count: 1,
      });

      const result = await SalesService.getSalesRecords();

      expect(result.success).toBe(true);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('createSalesRecord', () => {
    it('creates a sales record successfully', async () => {
      const newRecord = {
        productCode: 'NVL-XO01',
        productName: 'Xoài',
        outputDate: new Date('2024-02-01'),
        quantitySold: 50,
        unitPrice: 25000,
        totalAmount: 1250000,
        customerType: 'retail' as const,
        status: 'completed' as const,
        notes: 'Test sale',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDbSalesRecord, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await SalesService.createSalesRecord(newRecord);

      expect(result.success).toBe(true);
      expect(mockQuery.insert).toHaveBeenCalled();
    });

    it('falls back when Supabase insert fails', async () => {
      const newRecord = {
        productCode: 'NVL-XO01',
        productName: 'Xoài',
        outputDate: new Date('2024-02-01'),
        quantitySold: 50,
        unitPrice: 25000,
        totalAmount: 1250000,
        customerType: 'retail' as const,
        status: 'completed' as const,
        notes: '',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);
      (fallbackService.createSalesRecord as any).mockResolvedValue({
        data: { ...mockSalesRecord, id: 'fb-sale-1' },
        error: null,
      });

      const result = await SalesService.createSalesRecord(newRecord);

      expect(result.success).toBe(true);
      expect(fallbackService.createSalesRecord).toHaveBeenCalledWith(newRecord);
    });
  });

  describe('updateSalesRecord', () => {
    it('updates a sales record successfully', async () => {
      const updates = { quantitySold: 150 };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockDbSalesRecord, sales_quantity: 150 }, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await SalesService.updateSalesRecord('sale-1', updates);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteSalesRecord', () => {
    it('deletes a sales record successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await SalesService.deleteSalesRecord('sale-1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('getSalesStatistics', () => {
    it('returns aggregated statistics', async () => {
      const mockDbRecords = [
        { date: '2024-01-15', sales_quantity: 120, promotion_quantity: 10, product: { name: 'Xoài', category: 'fruit' } },
        { date: '2024-01-20', sales_quantity: 80, promotion_quantity: 5, product: { name: 'Dưa hấu', category: 'fruit' } },
      ];

      const mockQuery = {
        select: vi.fn().mockResolvedValue({ data: mockDbRecords, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await SalesService.getSalesStatistics('2024-01-01', '2024-01-31');

      expect(result.success).toBe(true);
      expect(result.data?.totalSales).toBe(200);
      expect(result.data?.totalPromotion).toBe(15);
      expect(result.data?.totalRecords).toBe(2);
      expect(result.data?.byCategory.fruit.sales).toBe(200);
    });

    it('returns error when query fails', async () => {
      const mockQuery = {
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await SalesService.getSalesStatistics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Query failed');
    });
  });
});
