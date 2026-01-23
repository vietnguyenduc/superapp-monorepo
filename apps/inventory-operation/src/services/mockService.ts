// Mock service for local testing without Supabase
import { simpleMockData } from '../data/simpleMockData';
import { 
  Product, 
  InventoryRecord, 
  SalesRecord, 
  SpecialOutboundRecord, 
  InventoryVarianceReport,
  InventoryVarianceReportCreateInput 
} from '../types';

// Simulate async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Products Service
export const mockProductService = {
  async getProducts(): Promise<Product[]> {
    await delay(500);
    return [...simpleMockData.products];
  },

  async getProductById(id: string): Promise<Product | null> {
    await delay(300);
    return simpleMockData.products.find(p => p.id === id) || null;
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    await delay(800);
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    simpleMockData.products.push(newProduct);
    return newProduct;
  }
};

// Mock Inventory Variance Service
export const mockInventoryVarianceService = {
  async getReports(filters?: {
    search?: string;
    date_from?: string;
    date_to?: string;
    product_id?: string;
    variance_type?: string;
  }): Promise<InventoryVarianceReport[]> {
    await delay(600);
    
    let reports = [...simpleMockData.varianceReports];
    
    // Apply filters
    if (filters?.search) {
      reports = reports.filter(r => 
        r.notes?.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }
    
    if (filters?.date_from) {
      reports = reports.filter(r => r.date >= filters.date_from!);
    }
    
    if (filters?.date_to) {
      reports = reports.filter(r => r.date <= filters.date_to!);
    }
    
    if (filters?.product_id) {
      reports = reports.filter(r => r.product_id === filters.product_id);
    }
    
    if (filters?.variance_type) {
      if (filters.variance_type === 'positive') {
        reports = reports.filter(r => r.variance > 0);
      } else if (filters.variance_type === 'negative') {
        reports = reports.filter(r => r.variance < 0);
      } else if (filters.variance_type === 'zero') {
        reports = reports.filter(r => r.variance === 0);
      } else if (filters.variance_type === 'high') {
        reports = reports.filter(r => Math.abs(r.variance_percentage) >= 10);
      }
    }
    
    return reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createReport(reportData: InventoryVarianceReportCreateInput): Promise<InventoryVarianceReport> {
    await delay(1000);
    
    const newReport: InventoryVarianceReport = {
      ...reportData,
      id: `var-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    simpleMockData.varianceReports.push(newReport);
    return newReport;
  },

  async updateReport(id: string, updates: Partial<InventoryVarianceReportCreateInput>): Promise<InventoryVarianceReport> {
    await delay(800);
    
    const reportIndex = mockData.inventoryVarianceReports.findIndex(r => r.id === id);
    if (reportIndex === -1) {
      throw new Error('Không tìm thấy báo cáo');
    }
    
    const updatedReport = {
      ...simpleMockData.varianceReports[reportIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    simpleMockData.varianceReports[reportIndex] = updatedReport;
    return updatedReport;
  },

  async deleteReport(id: string): Promise<void> {
    await delay(500);
    
    const reportIndex = mockData.inventoryVarianceReports.findIndex(r => r.id === id);
    if (reportIndex === -1) {
      throw new Error('Không tìm thấy báo cáo');
    }
    
    simpleMockData.varianceReports.splice(reportIndex, 1);
  }
};

// Mock Sales Service
export const mockSalesService = {
  async getSalesRecords(filters?: {
    search?: string;
    date_from?: string;
    date_to?: string;
    product_id?: string;
  }): Promise<SalesRecord[]> {
    await delay(500);
    
    let records = [...mockData.salesRecords];
    
    if (filters?.date_from) {
      records = records.filter(r => r.date >= filters.date_from!);
    }
    
    if (filters?.date_to) {
      records = records.filter(r => r.date <= filters.date_to!);
    }
    
    if (filters?.product_id) {
      records = records.filter(r => r.product_id === filters.product_id);
    }
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createSalesRecord(recordData: Omit<SalesRecord, 'id' | 'created_at' | 'updated_at'>): Promise<SalesRecord> {
    await delay(800);
    
    const newRecord: SalesRecord = {
      ...recordData,
      id: `sale-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockData.salesRecords.push(newRecord);
    return newRecord;
  }
};

// Mock Special Outbound Service
export const mockSpecialOutboundService = {
  async getSpecialOutboundRecords(filters?: {
    search?: string;
    date_from?: string;
    date_to?: string;
    product_id?: string;
    approval_status?: string;
  }): Promise<SpecialOutboundRecord[]> {
    await delay(600);
    
    let records = [...mockData.specialOutboundRecords];
    
    if (filters?.date_from) {
      records = records.filter(r => r.date >= filters.date_from!);
    }
    
    if (filters?.date_to) {
      records = records.filter(r => r.date <= filters.date_to!);
    }
    
    if (filters?.product_id) {
      records = records.filter(r => r.product_id === filters.product_id);
    }
    
    if (filters?.approval_status) {
      records = records.filter(r => r.approval_status === filters.approval_status);
    }
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createSpecialOutboundRecord(recordData: Omit<SpecialOutboundRecord, 'id' | 'created_at' | 'updated_at'>): Promise<SpecialOutboundRecord> {
    await delay(1000);
    
    const newRecord: SpecialOutboundRecord = {
      ...recordData,
      id: `special-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockData.specialOutboundRecords.push(newRecord);
    return newRecord;
  },

  async approveSpecialOutbound(id: string, approvedBy: string, comments?: string): Promise<SpecialOutboundRecord> {
    await delay(800);
    
    const recordIndex = mockData.specialOutboundRecords.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      throw new Error('Không tìm thấy phiếu xuất đặc biệt');
    }
    
    const updatedRecord = {
      ...mockData.specialOutboundRecords[recordIndex],
      approval_status: 'approved' as const,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockData.specialOutboundRecords[recordIndex] = updatedRecord;
    return updatedRecord;
  }
};

// Mock Export Service
export const mockExportService = {
  async exportReports(exportData: any): Promise<{
    file: Blob;
    fileName: string;
    logId: string;
  }> {
    await delay(2000); // Simulate longer export time
    
    // Create mock CSV content
    const csvContent = `Ngày,Sản phẩm,Tồn sổ,Tồn thực,Chênh lệch,Tỷ lệ %
2024-01-20,Cà phê Arabica,8830,8500,-330,-3.74%
2024-01-21,Bánh mì sandwich,110,95,-15,-13.64%
2024-01-22,Nước cam tươi,140,155,15,10.71%`;
    
    const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `bao_cao_chenh_lech_${new Date().toISOString().split('T')[0]}.csv`;
    
    return {
      file,
      fileName,
      logId: `log-${Date.now()}`
    };
  }
};

// Environment flag to use mock services
export const USE_MOCK_SERVICES = process.env.NODE_ENV === 'development' || !process.env.VITE_SUPABASE_URL;

// Export all mock services
export const mockServices = {
  products: mockProductService,
  inventoryVariance: mockInventoryVarianceService,
  sales: mockSalesService,
  specialOutbound: mockSpecialOutboundService,
  export: mockExportService
};

export default mockServices;
