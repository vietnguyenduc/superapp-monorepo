import { 
  Product, 
  InventoryRecord, 
  SalesRecord, 
  SpecialOutboundRecord, 
  InventoryVarianceReport,
} from '../types';
import { fallbackService } from './fallbackService';
import { ProductService } from './productService';
import { InventoryService } from './inventoryService';
import { SalesService } from './salesService';

/**
 * Legacy DatabaseService wrapper.
 * This class is being refactored into specialized services (ProductService, InventoryService, etc.).
 * It is maintained here as a facade for backward compatibility.
 */
export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface DatabaseListResponse<T> {
  data: T[] | null;
  error: string | null;
  count?: number;
}

class DatabaseService {
  // ============ PRODUCTS ============
  
  async getProducts(filters?: any): Promise<DatabaseListResponse<Product>> {
    const res = await ProductService.getProducts(filters);
    return { data: res.data || [], error: res.error || null };
  }

  async getProduct(id: string): Promise<DatabaseResponse<Product>> {
    const res = await ProductService.getProduct(id);
    return { data: res.data || null, error: res.error || null };
  }

  async createProduct(product: any): Promise<DatabaseResponse<Product>> {
    const res = await ProductService.createProduct(product);
    return { data: res.data || null, error: res.error || null };
  }

  async updateProduct(id: string, updates: any): Promise<DatabaseResponse<Product>> {
    const res = await ProductService.updateProduct(id, updates);
    return { data: res.data || null, error: res.error || null };
  }

  async deleteProduct(id: string): Promise<DatabaseResponse<boolean>> {
    const res = await ProductService.deleteProduct(id);
    return { data: res.data || false, error: res.error || null };
  }

  async bulkInsertProducts(products: Partial<Product>[]): Promise<DatabaseListResponse<Product>> {
    const res = await ProductService.bulkInsertProducts(products);
    return { data: res.data || [], error: res.error || null };
  }

  // ============ INVENTORY ============

  async getInventoryRecords(filters?: any): Promise<DatabaseListResponse<InventoryRecord>> {
    const res = await InventoryService.getInventoryRecords(filters);
    return { data: res.data || [], error: res.error || null };
  }

  async createInventoryRecord(record: any): Promise<DatabaseResponse<InventoryRecord>> {
    const res = await InventoryService.createInventoryRecord(record);
    return { data: res.data || null, error: res.error || null };
  }

  // ============ SALES ============

  async getSalesRecords(filters?: any): Promise<DatabaseListResponse<SalesRecord>> {
    const res = await SalesService.getSalesRecords(filters);
    return { data: res.data || [], error: res.error || null };
  }

  async createSalesRecord(record: any): Promise<DatabaseResponse<SalesRecord>> {
    const res = await SalesService.createSalesRecord(record);
    return { data: res.data || null, error: res.error || null };
  }

  // ============ DASHBOARD & ANALYTICS ============

  async getDashboardStats(): Promise<DatabaseResponse<any>> {
    // Forward to fallback for now, or implement in a dedicated AnalyticsService
    return await fallbackService.getDashboardStats();
  }

  async getInventorySummary(dateFrom: Date, dateTo: Date): Promise<DatabaseListResponse<any>> {
    const res = await InventoryService.getInventorySummary(dateFrom, dateTo);
    return { data: res.data || [], error: res.error || null };
  }

  // ============ HEALTH CHECK ============
  
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
    return { status: 'ok', message: 'Database service is running (Facade mode)' };
  }
}

export const databaseService = new DatabaseService();
