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
import { realProductsData, convertToProductInterface } from '../data/realProductsData';
import { realInventoryRecords, generateInventoryFromProducts } from '../data/realInventoryData';
import { realInventoryTransactions, parseDate, getTransactionsByDateRange } from '../data/realInventoryTransactions';
import { convertToSalesRecords } from '../data/realSalesData';

// Mock data for fallback
const mockProducts: Product[] = [
  // Convert real products data with correct input/output ratios
  ...realProductsData.map(convertToProductInterface),
  
  // Keep some original mock products for testing
  {
    id: 'prod-001',
    businessCode: 'SP001',
    name: 'Cà phê Arabica',
    category: ProductCategory.FINISHED,
    inputUnit: 'kg',
    outputUnit: 'ly',
    inputQuantity: 1,
    outputQuantity: 100,
    isFinishedProduct: true,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active' as const,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-002',
    businessCode: 'SP002',
    name: 'Bánh mì sandwich',
    category: ProductCategory.FINISHED,
    inputUnit: 'cái',
    outputUnit: 'phần',
    inputQuantity: 1,
    outputQuantity: 1,
    isFinishedProduct: true,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active' as const,
    createdAt: new Date('2024-01-02T10:00:00Z'),
    updatedAt: new Date('2024-01-02T10:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-003',
    businessCode: 'SP003',
    name: 'Nước cam tươi',
    category: ProductCategory.FINISHED,
    inputUnit: 'lít',
    outputUnit: 'ly',
    inputQuantity: 1,
    outputQuantity: 5,
    isFinishedProduct: true,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active' as const,
    createdAt: new Date('2024-01-03T10:00:00Z'),
    updatedAt: new Date('2024-01-03T10:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

const mockInventoryRecords: InventoryRecord[] = [
  // Real inventory records from actual transactions
  ...realInventoryTransactions.map((transaction, index) => ({
    id: `real-inv-${index + 1}`,
    date: parseDate(transaction.date),
    productCode: transaction.productCode,
    productName: transaction.productName,
    inputQuantity: transaction.inputQuantity,
    rawMaterialStock: transaction.actualStock,
    processedStock: Math.floor(transaction.actualStock * 0.8),
    finishedProductStock: Math.floor(transaction.actualStock * 0.6),
    rawMaterialUnit: 'cái',
    processedUnit: 'cái',
    finishedProductUnit: 'cái',
    createdAt: parseDate(transaction.date),
    updatedAt: parseDate(transaction.date),
    createdBy: 'system',
    updatedBy: 'system'
  })),
  
  // Generate additional records from real products
  ...generateInventoryFromProducts(realProductsData.map(convertToProductInterface), 15),
  
  // Keep some original mock records for testing
  {
    id: 'inv-001',
    date: new Date('2024-01-15'),
    productCode: 'SP001',
    productName: 'Cà phê Arabica',
    inputQuantity: 50,
    rawMaterialStock: 120,
    processedStock: 30,
    finishedProductStock: 25,
    rawMaterialUnit: 'kg',
    processedUnit: 'kg',
    finishedProductUnit: 'ly',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'inv-002',
    date: new Date('2024-01-20'),
    productCode: 'SP002',
    productName: 'Bánh mì sandwich',
    inputQuantity: 100,
    rawMaterialStock: 200,
    processedStock: 80,
    finishedProductStock: 10,
    rawMaterialUnit: 'cái',
    processedUnit: 'cái',
    finishedProductUnit: 'phần',
    createdAt: new Date('2024-01-20T10:00:00Z'),
    updatedAt: new Date('2024-01-20T10:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

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
const mockSalesRecords: SalesRecord[] = [
  // Real sales records from actual transactions
  ...convertToSalesRecords(),
  
  // Keep some original mock records for testing
  {
    id: 'sale-001',
    productCode: 'SP001',
    outputDate: new Date('2024-01-15T10:00:00Z'),
    quantitySold: 150,
    notes: 'Bán lẻ - Cà phê Arabica',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    createdBy: 'staff-001',
    updatedBy: 'staff-001'
  },
  {
    id: 'sale-002',
    productCode: 'SP002',
    outputDate: new Date('2024-01-20T10:00:00Z'),
    quantitySold: 80,
    notes: 'Bán sỉ - Bánh mì sandwich',
    createdAt: new Date('2024-01-20T10:00:00Z'),
    updatedAt: new Date('2024-01-20T10:00:00Z'),
    createdBy: 'staff-002',
    updatedBy: 'staff-002'
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

class FallbackService {
  private isUsingFallback = false;

  // Check if we should use fallback mode
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
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
      
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
      await new Promise(resolve => setTimeout(resolve, 50));
      
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
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const newProduct: Product = {
        ...product,
        id: `prod-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockProducts.push(newProduct);
      
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
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const newRecord: InventoryRecord = {
        ...record,
        id: `inv-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockInventoryRecords.push(newRecord);
      
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
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
      await new Promise(resolve => setTimeout(resolve, 200));
      
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
      await new Promise(resolve => setTimeout(resolve, 150));
      
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
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
      await new Promise(resolve => setTimeout(resolve, 200));
      
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
