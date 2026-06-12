// Fallback Service - Uses mock data when database is unavailable
// This ensures the app continues to work even with database schema issues

import { 
  Product, 
  InventoryRecord, 
  SalesRecord, 
  SpecialOutboundRecord, 
  InventoryVarianceReport,
  ProductCategory,
  ProductStatus
} from '../types';
import { ProductCatalogItem, SAMPLE_PRODUCT_CATALOG } from '../types/product-catalog';
import { convertToSalesRecords } from '../data/realSalesData';
import { MOCK_PRODUCTS, MOCK_INVENTORY } from '../data/trialMockData';

// Mock data for fallback (Initialized from localStorage if in Trial Mode)
// Initial data constants

// Mock data for fallback
let mockProducts: Product[] = [];
let mockInventoryRecords: InventoryRecord[] = [];
let mockSalesRecords: SalesRecord[] = [];
let mockSpecialOutboundRecords: SpecialOutboundRecord[] = [];

// Mock sales records matching database schema (for UI compatibility)
const mockSalesRecordsForUI = [
  // Real sales records from actual transactions
  ...convertToSalesRecords(),
  
  // Keep some original mock records for testing
  {
    id: 'sale-001',
    product_id: 'prod-001',
    date: '2024-01-15',
    sales_quantity: 120,
    unit_price: 25000,
    total_amount: 3000000,
    customer_type: 'retail',
    status: 'completed',
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
    created_by: 'staff-001',
    updated_by: 'staff-001'
  },
  {
    id: 'sale-002',
    product_id: 'prod-002',
    date: '2024-01-20',
    sales_quantity: 80,
    unit_price: 15000,
    total_amount: 1200000,
    customer_type: 'wholesale',
    status: 'completed',
    created_at: new Date('2024-01-20T10:00:00Z'),
    updated_at: new Date('2024-01-20T10:00:00Z'),
    created_by: 'staff-002',
    updated_by: 'staff-002'
  }
];

// Keep original type-compliant records for other uses
// Default mock sales data for initialization
const DEFAULT_MOCK_SALES: SalesRecord[] = [
  ...convertToSalesRecords(),
  {
    id: 'sale-001',
    productCode: 'NVL-XO01',
    outputDate: new Date('2025-05-10T10:00:00Z'),
    quantitySold: 150,
    notes: 'Bán lẻ - Ly xoài dầm',
    createdAt: new Date('2025-05-10T10:00:00Z'),
    updatedAt: new Date('2025-05-10T10:00:00Z'),
    createdBy: 'trial',
    updatedBy: 'trial'
  },
  {
    id: 'sale-002',
    productCode: 'NVL-DH01',
    outputDate: new Date('2025-05-11T10:00:00Z'),
    quantitySold: 80,
    notes: 'Bán sỉ - Đĩa dưa hấu',
    createdAt: new Date('2025-05-11T10:00:00Z'),
    updatedAt: new Date('2025-05-11T10:00:00Z'),
    createdBy: 'trial',
    updatedBy: 'trial'
  }
];

export interface FallbackResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface FallbackListResponse<T> {
  data: T[] | null;
  error: string | null;
  count?: number;
}

export class FallbackService {
  private isUsingFallback = false;

  // Check if we should use fallback mode
  constructor() {
    this.initializeData();
  }

  private initializeData() {
    const isTrial = localStorage.getItem('isTrial') === 'true';
    if (isTrial) {
      const isCleared = localStorage.getItem('trial_data_cleared') === 'true';
      
      const storedProducts = localStorage.getItem('trial_products');
      if (storedProducts) {
        const parsed = JSON.parse(storedProducts);
        mockProducts = parsed.map((p: any) => {
          const latestMock = MOCK_PRODUCTS.find(m => m.businessCode === p.businessCode);
          return {
            ...p,
            // Ensure logic properties are preserved even if missing or empty in old storage
            linkedFinishedProductCodes: (p.linkedFinishedProductCodes?.length > 0) ? p.linkedFinishedProductCodes : (latestMock?.linkedFinishedProductCodes || []),
            recipe: (p.recipe?.length > 0) ? p.recipe : (latestMock?.recipe || []),
            intermediateUnits: (p.intermediateUnits?.length > 0) ? p.intermediateUnits : (latestMock?.intermediateUnits || []),
            conversions: (p.conversions?.length > 0) ? p.conversions : (latestMock?.conversions || []),
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt)
          };
        });
      } else if (!isCleared) {
        // Only use default mock data if NOT explicitly cleared
        mockProducts = [...MOCK_PRODUCTS];
      }
      
      const storedInventory = localStorage.getItem('trial_inventory_records');
      if (storedInventory) {
        mockInventoryRecords = JSON.parse(storedInventory).map((r: any) => ({
          ...r,
          date: new Date(r.date),
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }));
      } else if (!isCleared) {
        mockInventoryRecords = [...MOCK_INVENTORY];
      }

      const storedSales = localStorage.getItem('trial_sales_records');
      if (storedSales) {
        mockSalesRecords = JSON.parse(storedSales).map((r: any) => ({
          ...r,
          outputDate: new Date(r.outputDate),
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }));
      } else if (!isCleared) {
        mockSalesRecords = [...DEFAULT_MOCK_SALES];
      }
    }
  }

  private persistData() {
    const isTrial = localStorage.getItem('isTrial') === 'true';
    if (isTrial) {
      localStorage.setItem('trial_products', JSON.stringify(mockProducts));
      localStorage.setItem('trial_inventory_records', JSON.stringify(mockInventoryRecords));
      localStorage.setItem('trial_sales_records', JSON.stringify(mockSalesRecords));
    }
  }

  setFallbackMode(enabled: boolean): void {
    this.isUsingFallback = enabled;
    if (enabled) {
      console.warn('🔄 Using fallback mode with mock data due to database issues');
    }
  }

  // ============ PRODUCTS ============
  
  async getProducts(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<FallbackListResponse<Product>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 10)); // Reduced from 100ms for performance
      
      let filteredProducts = [...mockProducts];
      
      if (filters?.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }
      
      if (filters?.status) {
        filteredProducts = filteredProducts.filter(p => p.status === filters.status);
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.businessCode.toLowerCase().includes(searchLower)
        );
      }
      
      return {
        data: filteredProducts,
        error: null,
        count: filteredProducts.length
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi tải danh sách sản phẩm',
        count: 0
      };
    }
  }

  async getProductById(id: string): Promise<FallbackResponse<Product>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 10)); // Reduced from 50ms
      
      const product = mockProducts.find(p => p.id === id);
      
      if (!product) {
        return {
          data: null,
          error: 'Không tìm thấy sản phẩm'
        };
      }
      
      return {
        data: product,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi tải thông tin sản phẩm'
      };
    }
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<FallbackResponse<Product>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 20)); // Reduced from 200ms
      
      const newProduct: Product = {
        ...product,
        id: `prod-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockProducts.push(newProduct);
      this.persistData();
      
      return {
        data: newProduct,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi tạo sản phẩm mới'
      };
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<FallbackResponse<Product>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const index = mockProducts.findIndex(p => p.id === id);
      
      if (index === -1) {
        return {
          data: null,
          error: 'Không tìm thấy sản phẩm để cập nhật'
        };
      }
      
      mockProducts[index] = {
        ...mockProducts[index],
        ...updates,
        updatedAt: new Date()
      };
      this.persistData();
      
      return {
        data: mockProducts[index],
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi cập nhật sản phẩm'
      };
    }
  }

  async deleteProduct(id: string): Promise<FallbackResponse<boolean>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const index = mockProducts.findIndex(p => p.id === id);
      
      if (index === -1) {
        return {
          data: false,
          error: 'Không tìm thấy sản phẩm để xóa'
        };
      }
      
      mockProducts.splice(index, 1);
      this.persistData();
      
      return {
        data: true,
        error: null
      };
    } catch (error) {
      return {
        data: false,
        error: 'Lỗi khi xóa sản phẩm'
      };
    }
  }

  // ============ INVENTORY RECORDS ============
  
  async getInventoryRecords(filters?: {
    productCode?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<FallbackListResponse<InventoryRecord>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 20)); // Reduced from 100ms
      
      let filteredRecords = [...mockInventoryRecords];
      
      if (filters?.productCode) {
        filteredRecords = filteredRecords.filter(r => r.productCode === filters.productCode);
      }
      
      if (filters?.dateFrom) {
        filteredRecords = filteredRecords.filter(r => r.date >= filters.dateFrom!);
      }
      
      if (filters?.dateTo) {
        filteredRecords = filteredRecords.filter(r => r.date <= filters.dateTo!);
      }
      
      return {
        data: filteredRecords,
        error: null,
        count: filteredRecords.length
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi tải dữ liệu tồn kho',
        count: 0
      };
    }
  }

  async createInventoryRecord(record: Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<FallbackResponse<InventoryRecord>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 20)); // Reduced from 200ms
      
      const newRecord: InventoryRecord = {
        ...record,
        id: `inv-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockInventoryRecords.push(newRecord);
      this.persistData();
      
      console.log('✅ Created inventory record:', newRecord);
      console.log('📊 Total records:', mockInventoryRecords.length);
      
      return {
        data: newRecord,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi tạo bản ghi tồn kho'
      };
    }
  }

  // ============ SALES RECORDS ============
  
  async getSalesRecords(filters?: {
    productCode?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<FallbackListResponse<SalesRecord>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 20)); // Reduced from 100ms
      
      // Use only type-compliant SalesRecord data
      let filteredRecords = [...mockSalesRecords];
      
      if (filters?.productCode) {
        filteredRecords = filteredRecords.filter(r => r.productCode === filters.productCode);
      }
      
      if (filters?.dateFrom) {
        const dateFromStr = filters.dateFrom.toISOString().split('T')[0];
        filteredRecords = filteredRecords.filter(r => {
          const recordDate = r.outputDate.toISOString().split('T')[0];
          return recordDate >= dateFromStr;
        });
      }
      
      if (filters?.dateTo) {
        const dateToStr = filters.dateTo.toISOString().split('T')[0];
        filteredRecords = filteredRecords.filter(r => {
          const recordDate = r.outputDate.toISOString().split('T')[0];
          return recordDate <= dateToStr;
        });
      }
      
      return {
        data: filteredRecords,
        error: null,
        count: filteredRecords.length
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi tải dữ liệu bán hàng',
        count: 0
      };
    }
  }

  async createSalesRecord(record: Omit<SalesRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<FallbackResponse<SalesRecord>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 20)); // Reduced from 200ms
      
      const newRecord: SalesRecord = {
        ...record,
        id: `sale-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockSalesRecords.push(newRecord);
      
      return {
        data: newRecord,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi tạo bản ghi bán hàng'
      };
    }
  }

  // ============ DASHBOARD ANALYTICS ============
  
  async getDashboardStats(): Promise<FallbackResponse<{
    totalProducts: number;
    totalInventoryValue: number;
    lowStockAlerts: number;
    todayRevenue: number;
  }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 20)); // Reduced from 150ms
      
      const stats = {
        totalProducts: mockProducts.length,
        totalInventoryValue: mockInventoryRecords.reduce((sum, record) => sum + (record.finishedProductStock * 10), 0),
        lowStockAlerts: 2,
        todayRevenue: mockSalesRecords.reduce((sum, record) => sum + (record.quantitySold * 25), 0)
      };
      
      return {
        data: stats,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi tải thống kê dashboard'
      };
    }
  }

  // ============ PRODUCT CATALOG ============
  
  async getProductCatalog(filters?: {
    category?: string;
    search?: string;
  }): Promise<FallbackListResponse<ProductCatalogItem>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 20)); // Reduced from 100ms
      
      let filteredProducts = [...SAMPLE_PRODUCT_CATALOG];
      
      if (filters?.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.productName.toLowerCase().includes(searchLower) ||
          p.productCode.toLowerCase().includes(searchLower)
        );
      }
      
      return {
        data: filteredProducts,
        error: null,
        count: filteredProducts.length
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi tải danh mục sản phẩm',
        count: 0
      };
    }
  }

  async createProductCatalogItem(data: Omit<ProductCatalogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<FallbackResponse<ProductCatalogItem>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 20)); // Reduced from 200ms
      
      const newItem: ProductCatalogItem = {
        ...data,
        id: `catalog-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add to sample data (in real app, this would persist)
      SAMPLE_PRODUCT_CATALOG.push(newItem);
      
      return {
        data: newItem,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: 'Lỗi khi tạo sản phẩm mới'
      };
    }
  }

  // ============ HEALTH CHECK ============
  
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
    return {
      status: 'ok',
      message: 'Fallback service is running with mock data'
    };
  }
}

// Export singleton instance
export const fallbackService = new FallbackService();
