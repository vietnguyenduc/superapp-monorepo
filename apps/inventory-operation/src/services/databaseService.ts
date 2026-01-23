import { supabase } from '../config/supabase';
import { 
  Product, 
  InventoryRecord, 
  SalesRecord, 
  SpecialOutboundRecord, 
  InventoryVarianceReport 
} from '../types';

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
  
  /**
   * Get all products with optional filtering
   */
  async getProducts(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<DatabaseListResponse<Product>> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,business_code.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null, count };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(id: string): Promise<DatabaseResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create new product
   */
  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update product
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<DatabaseResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Bulk insert products (for Excel import)
   */
  async bulkInsertProducts(products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<DatabaseListResponse<Product>> {
    try {
      const productsWithTimestamps = products.map(product => ({
        ...product,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('products')
        .insert(productsWithTimestamps)
        .select();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============ INVENTORY RECORDS ============

  /**
   * Get inventory records with optional filtering
   */
  async getInventoryRecords(filters?: {
    productCode?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<DatabaseListResponse<InventoryRecord>> {
    try {
      let query = supabase
        .from('inventory_records')
        .select('*')
        .order('date', { ascending: false });

      if (filters?.productCode) {
        query = query.eq('product_code', filters.productCode);
      }
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null, count };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create inventory record
   */
  async createInventoryRecord(record: Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseResponse<InventoryRecord>> {
    try {
      const { data, error } = await supabase
        .from('inventory_records')
        .insert([{
          ...record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Bulk insert inventory records
   */
  async bulkInsertInventoryRecords(records: Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<DatabaseListResponse<InventoryRecord>> {
    try {
      const recordsWithTimestamps = records.map(record => ({
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('inventory_records')
        .insert(recordsWithTimestamps)
        .select();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============ SALES RECORDS ============

  /**
   * Get sales records
   */
  async getSalesRecords(filters?: {
    productId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<DatabaseListResponse<SalesRecord>> {
    try {
      let query = supabase
        .from('sales_records')
        .select('*')
        .order('date', { ascending: false });

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null, count };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create sales record
   */
  async createSalesRecord(record: Omit<SalesRecord, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<SalesRecord>> {
    try {
      const { data, error } = await supabase
        .from('sales_records')
        .insert([{
          ...record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Bulk insert sales records
   */
  async bulkInsertSalesRecords(records: Omit<SalesRecord, 'id' | 'created_at' | 'updated_at'>[]): Promise<DatabaseListResponse<SalesRecord>> {
    try {
      const recordsWithTimestamps = records.map(record => ({
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('sales_records')
        .insert(recordsWithTimestamps)
        .select();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============ VARIANCE REPORTS ============

  /**
   * Get variance reports
   */
  async getVarianceReports(filters?: {
    productId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<DatabaseListResponse<InventoryVarianceReport>> {
    try {
      let query = supabase
        .from('inventory_variance_reports')
        .select('*')
        .order('date', { ascending: false });

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null, count };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create variance report
   */
  async createVarianceReport(report: Omit<InventoryVarianceReport, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<InventoryVarianceReport>> {
    try {
      const { data, error } = await supabase
        .from('inventory_variance_reports')
        .insert([{
          ...report,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============ DASHBOARD ANALYTICS ============

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DatabaseResponse<{
    totalProducts: number;
    activeProducts: number;
    lowStockAlerts: number;
    totalValue: number;
    todayInbound: number;
    todayOutbound: number;
    varianceCount: number;
  }>> {
    try {
      // Get products stats
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, status');

      if (productsError) {
        return { data: null, error: productsError.message };
      }

      // Get today's inventory records
      const today = new Date().toISOString().split('T')[0];
      const { data: todayInventory, error: inventoryError } = await supabase
        .from('inventory_records')
        .select('input_quantity')
        .gte('date', today);

      if (inventoryError) {
        return { data: null, error: inventoryError.message };
      }

      // Get today's sales
      const { data: todaySales, error: salesError } = await supabase
        .from('sales_records')
        .select('sales_quantity')
        .gte('date', today);

      if (salesError) {
        return { data: null, error: salesError.message };
      }

      // Get variance reports count
      const { data: variances, error: varianceError } = await supabase
        .from('inventory_variance_reports')
        .select('id')
        .neq('variance', 0);

      if (varianceError) {
        return { data: null, error: varianceError.message };
      }

      const stats = {
        totalProducts: products?.length || 0,
        activeProducts: products?.filter(p => p.status === 'ACTIVE').length || 0,
        lowStockAlerts: 0, // TODO: Calculate based on min_stock_level
        totalValue: 0, // TODO: Calculate based on current stock * unit cost
        todayInbound: todayInventory?.reduce((sum, record) => sum + (record.input_quantity || 0), 0) || 0,
        todayOutbound: todaySales?.reduce((sum, record) => sum + (record.sales_quantity || 0), 0) || 0,
        varianceCount: variances?.length || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============ REALTIME SUBSCRIPTIONS ============

  /**
   * Subscribe to products changes
   */
  subscribeToProducts(callback: (payload: any) => void) {
    return supabase
      .channel('products-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' }, 
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to inventory changes
   */
  subscribeToInventory(callback: (payload: any) => void) {
    return supabase
      .channel('inventory-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory_records' }, 
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to sales changes
   */
  subscribeToSales(callback: (payload: any) => void) {
    return supabase
      .channel('sales-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sales_records' }, 
        callback
      )
      .subscribe();
  }

  // ============ UTILITY METHODS ============

  /**
   * Test database connection
   */
  async testConnection(): Promise<DatabaseResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('count', { count: 'exact', head: true });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus(): Promise<DatabaseResponse<{
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    timestamp: string;
  }>> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase
        .from('products')
        .select('count', { count: 'exact', head: true });

      const responseTime = Date.now() - startTime;
      
      if (error) {
        return { 
          data: {
            status: 'down',
            responseTime,
            timestamp: new Date().toISOString()
          }, 
          error: error.message 
        };
      }

      const status = responseTime < 1000 ? 'healthy' : 'degraded';

      return { 
        data: {
          status,
          responseTime,
          timestamp: new Date().toISOString()
        }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: {
          status: 'down',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
