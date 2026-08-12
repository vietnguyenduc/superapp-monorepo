import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportService, ExportData } from '../exportService';
import { supabase } from '../../lib/supabase';
import { mockSupabaseChain } from './testUtils';

vi.mock('../../lib/supabase', () => {
  const mockSupabase = { from: vi.fn() };
  return {
    supabase: mockSupabase,
    apiClient: { get from() { return mockSupabase.from; } },
    getCurrentUserId: vi.fn().mockResolvedValue('mock-user-id'),
    getCurrentCompanyId: vi.fn().mockResolvedValue(null),
    TABLES: {
      PRODUCTS: 'products',
      INVENTORY_RECORDS: 'inventory_records',
      SALES_RECORDS: 'sales_records',
      EXPORT_LOGS: 'export_logs',
    },
  };
});

// Helper to read Blob text in jsdom (which lacks blob.text())
async function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('exportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('generateExcelReport', () => {
    it('generates a CSV blob for inventory_check template', async () => {
      const exportData: ExportData = {
        format: 'excel',
        template: 'inventory_check',
        filters: {},
      };

      const reports = [
        { product_id: 'p1', date: '2024-01-15', book_inventory: 100, actual_inventory: 95, variance: -5, variance_percentage: -5, unit: 'kg', notes: '' },
      ];

      const products = [
        { id: 'p1', name: 'Product A', businessCode: 'SP001', category: 'fruit' },
      ];

      const blob = await exportService.generateExcelReport(exportData, reports as any, products as any);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8;');
    });

    it('generates CSV with correct headers', async () => {
      const exportData: ExportData = { format: 'excel', template: 'variance_report', filters: {} };
      const reports = [
        { product_id: 'p1', date: '2024-01-15', book_inventory: 100, actual_inventory: 95, variance: -5, variance_percentage: -5, unit: 'kg', notes: 'Test' },
      ];
      const products = [{ id: 'p1', name: 'Product A', businessCode: 'SP001', category: 'fruit' }];

      const blob = await exportService.generateExcelReport(exportData, reports as any, products as any);
      const text = await readBlobText(blob);

      expect(text).toContain('Ngày,Mã sản phẩm,Tên sản phẩm,Tồn sổ,Tồn thực,Chênh lệch,Tỷ lệ chênh lệch (%),Đơn vị,Ghi chú');
      expect(text).toContain('SP001');
      expect(text).toContain('Product A');
    });

    it('handles empty reports array', async () => {
      const exportData: ExportData = { format: 'excel', template: 'summary_report', filters: {} };
      const blob = await exportService.generateExcelReport(exportData, [], []);

      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('generatePDFReport', () => {
    it('generates an HTML blob for variance_report template', async () => {
      const exportData: ExportData = { format: 'pdf', template: 'variance_report', filters: { date_from: '2024-01-01', date_to: '2024-01-31' } };
      const reports = [
        { product_id: 'p1', date: '2024-01-15', book_inventory: 100, actual_inventory: 95, variance: -5, variance_percentage: -5, unit: 'kg', notes: '' },
      ];
      const products = [{ id: 'p1', name: 'Product A', businessCode: 'SP001', category: 'fruit' }];

      const blob = await exportService.generatePDFReport(exportData, reports as any, products as any);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/html;charset=utf-8;');
    });

    it('includes report title in HTML', async () => {
      const exportData: ExportData = { format: 'pdf', template: 'inventory_check', filters: {} };
      const blob = await exportService.generatePDFReport(exportData, [], []);
      const text = await readBlobText(blob);

      expect(text).toContain('PHIẾU KIỂM KHO');
    });
  });

  describe('exportInventoryReports', () => {
    it('exports Excel report with correct file name', async () => {
      localStorage.setItem('isTrial', 'true'); // Skip DB calls

      const exportData: ExportData = {
        format: 'excel',
        template: 'inventory_check',
        filters: {},
      };

      const result = await exportService.exportInventoryReports(exportData);

      expect(result.file).toBeInstanceOf(Blob);
      expect(result.fileName).toContain('phieu_kiem_kho');
      expect(result.logId).toBe('trial-log');
    });

    it('exports PDF report with correct file name', async () => {
      localStorage.setItem('isTrial', 'true');

      const exportData: ExportData = {
        format: 'pdf',
        template: 'variance_report',
        filters: {},
      };

      const result = await exportService.exportInventoryReports(exportData);

      expect(result.file).toBeInstanceOf(Blob);
      expect(result.fileName).toContain('bao_cao_chenh_lech');
    });
  });

  describe('fetchReportsForExport', () => {
    it('returns empty array in trial mode', async () => {
      localStorage.setItem('isTrial', 'true');
      const result = await exportService.fetchReportsForExport({});
      expect(result).toEqual([]);
    });

    it('fetches reports from Supabase with filters', async () => {
      const mockData = [{ id: 'r1', product_id: 'p1', variance: 5 }];
      // Chain: select().order().gte().lte().in().neq() — terminal is neq, so neqResult must have data
      // Each chain method returns a different chain object, so we need to track the chain
      const mocks = mockSupabaseChain({
        neqResult: { data: mockData, error: null },
      });

      const result = await exportService.fetchReportsForExport({
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        product_ids: ['p1'],
        include_zero_variance: false,
      });

      expect(result).toHaveLength(1);
      expect(mocks.gteMock).toHaveBeenCalledWith('date', '2024-01-01');
      // Chain: select().order().gte().lte().in().neq()
      // .in() is called on lteChainObj, not on selectChain
      expect(mocks.lteChainInMock).toHaveBeenCalledWith('product_id', ['p1']);
    });
  });

  describe('fetchProductsForExport', () => {
    it('returns empty array in trial mode', async () => {
      localStorage.setItem('isTrial', 'true');
      const result = await exportService.fetchProductsForExport();
      expect(result).toEqual([]);
    });

    it('fetches products from Supabase', async () => {
      const mockProducts = [{ id: 'p1', name: 'Product A', business_code: 'SP001' }];
      mockSupabaseChain({ orderResult: { data: mockProducts, error: null } });

      const result = await exportService.fetchProductsForExport();

      expect(result).toHaveLength(1);
      expect(supabase.from).toHaveBeenCalledWith('products');
    });
  });

  describe('logExportAction', () => {
    it('returns trial-log in trial mode', async () => {
      localStorage.setItem('isTrial', 'true');
      const result = await exportService.logExportAction({
        export_type: 'inventory_check',
        format: 'excel',
        filters: {},
        file_name: 'test.csv',
        file_size: 100,
      });
      expect(result).toBe('trial-log');
    });

    it('logs export action to Supabase', async () => {
      mockSupabaseChain({ singleResult: { data: { id: 'log-1' }, error: null } });

      const result = await exportService.logExportAction({
        export_type: 'variance_report',
        format: 'pdf',
        filters: {},
        file_name: 'report.pdf',
        file_size: 500,
      });

      expect(result).toBe('log-1');
      expect(supabase.from).toHaveBeenCalledWith('export_logs');
    });
  });

  describe('getExportLogs', () => {
    it('returns empty array in trial mode', async () => {
      localStorage.setItem('isTrial', 'true');
      const result = await exportService.getExportLogs();
      expect(result).toEqual([]);
    });

    it('fetches export logs from Supabase', async () => {
      const mockLogs = [{ id: 'log-1', export_type: 'inventory_check', format: 'excel' }];
      // Chain: select().order().limit() — terminal is limit, so limitResult must have data
      const { limitMock } = mockSupabaseChain({
        limitResult: { data: mockLogs, error: null },
      });

      const result = await exportService.getExportLogs(10);

      expect(result).toHaveLength(1);
      expect(limitMock).toHaveBeenCalledWith(10);
    });
  });

  describe('helper methods', () => {
    it('getReportTitle returns correct titles', () => {
      expect(exportService.getReportTitle('inventory_check')).toBe('PHIẾU KIỂM KHO');
      expect(exportService.getReportTitle('variance_report')).toBe('BÁO CÁO CHÊNH LỆCH TỒN KHO');
      expect(exportService.getReportTitle('summary_report')).toBe('BÁO CÁO TỔNG HỢP NHẬP XUẤT TỒN');
      expect(exportService.getReportTitle('unknown')).toBe('BÁO CÁO TỒN KHO');
    });

    it('getReportFileName returns correct file names', () => {
      expect(exportService.getReportFileName('inventory_check')).toBe('phieu_kiem_kho');
      expect(exportService.getReportFileName('variance_report')).toBe('bao_cao_chenh_lech');
      expect(exportService.getReportFileName('summary_report')).toBe('bao_cao_tong_hop');
      expect(exportService.getReportFileName('unknown')).toBe('bao_cao_ton_kho');
    });

    it('generateCSVContent produces valid CSV', () => {
      const data = {
        data: {
          reports: [
            { date: '2024-01-15', product_code: 'SP001', product_name: 'A', book_inventory: 100, actual_inventory: 95, variance: -5, variance_percentage: -5, unit: 'kg', notes: '' },
          ],
        },
      };

      const csv = exportService.generateCSVContent(data);
      expect(csv).toContain('2024-01-15,SP001,A,100,95,-5,-5.00,kg,""');
    });

    it('generateHTMLContent produces valid HTML', () => {
      const data = {
        title: 'BÁO CÁO KIỂM KHO',
        data: {
          reports: [
            { date: '2024-01-15', product_code: 'SP001', product_name: 'A', book_inventory: 100, actual_inventory: 95, variance: -5, variance_percentage: -5, unit: 'kg' },
          ],
          summary: { total_reports: 1, date_range: '2024-01-01 - 2024-01-31', high_variance_count: 1 },
          generated_at: '2024-01-31',
          notes: '',
        },
      };

      const html = exportService.generateHTMLContent(data);
      expect(html).toContain('BÁO CÁO KIỂM KHO');
      expect(html).toContain('SP001');
      expect(html).toContain('<table>');
    });
  });
});
