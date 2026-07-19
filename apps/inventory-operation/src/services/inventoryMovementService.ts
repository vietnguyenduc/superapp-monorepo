import { supabase , apiClient} from "../lib/supabase";
import { getTrialInventoryRecords, seedTrialDataIfNeeded, getTrialProducts } from '../data/trialMockData';
import { BaseService, ServiceResponse } from './baseService';

// Database types matching the migration schema
export interface InventoryMovement {
  id: string;
  movement_date: string;
  movement_time: string;
  movement_type: string;
  source_type: string;
  source_id?: string;
  product_id: string;
  quantity: number;
  unit: string;
  unit_cost?: number;
  total_value?: number;
  running_balance: number;
  running_value?: number;
  movement_category?: string;
  reference_movement_id?: string;
  notes?: string;
  company_id: string;
  branch_id?: string;
  warehouse_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryBalanceSnapshot {
  id: string;
  snapshot_date: string;
  snapshot_type: string;
  product_id: string;
  quantity: number;
  unit: string;
  unit_cost?: number;
  total_value?: number;
  period_start_date?: string;
  period_end_date?: string;
  book_quantity?: number;
  physical_quantity?: number;
  variance?: number;
  variance_percentage?: number;
  notes?: string;
  company_id: string;
  branch_id?: string;
  warehouse_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface StockCountEntry {
  id: string;
  count_date: string;
  count_type: string;
  product_id: string;
  book_quantity: number;
  counted_quantity: number;
  unit: string;
  variance: number;
  variance_percentage?: number;
  reconciliation_status: string;
  reconciliation_notes?: string;
  reconciled_by?: string;
  reconciled_at?: string;
  notes?: string;
  company_id: string;
  branch_id?: string;
  warehouse_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export class InventoryMovementService extends BaseService {
  static async createMovement(movement: Omit<InventoryMovement, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<InventoryMovement>> {
    return this.execute(
      async () => {
        return await apiClient.from('inventory_movements').insert([{ ...movement, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]).select().single();
      },
      async () => ({ success: true, data: { ...movement, id: 'mock-' + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as InventoryMovement, error: null })
    );
  }

  static calculateEquivalentStock(
    stocks: { raw?: number; processed?: number; finished?: number },
    ratios: { rawToProcessed: number; processedToFinished: number },
    targetForm: 'raw' | 'processed' | 'finished'
  ): number {
    const raw = stocks.raw || 0;
    const processed = stocks.processed || 0;
    const finished = stocks.finished || 0;
    const r1 = ratios.rawToProcessed || 1;
    const r2 = ratios.processedToFinished || 1;

    switch (targetForm) {
      case 'raw': return raw + (processed / r1) + (finished / (r1 * r2));
      case 'processed': return (raw * r1) + processed + (finished / r2);
      case 'finished': return (raw * r1 * r2) + (processed * r2) + finished;
      default: return 0;
    }
  }

  static getMockMovements(filters: any): ServiceResponse<InventoryMovement[]> {
    seedTrialDataIfNeeded();
    const trialRecords = getTrialInventoryRecords();
    const products = getTrialProducts();
    let movements: InventoryMovement[] = [];
    
    trialRecords.forEach(r => {
      const product = products.find(p => p.businessCode === r.productCode || p.id === r.productCode);
      const ratios = {
        rawToProcessed: product?.conversionRatioRawToProcessed || 1,
        processedToFinished: product?.conversionRatioProcessedToFinished || 1
      };
      const allowedForms = product?.allowedForms || ['raw', 'processed', 'finished'];
      const base = {
        movement_date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        movement_time: '08:00:00',
        movement_category: 'physical',
        product_id: r.productCode,
        unit: r.rawMaterialUnit || product?.outputUnit || 'pcs',
        company_id: filters.companyId || 'trial-company',
        notes: r.notes,
        created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
        updated_at: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      };

      const stocks = {
        raw: allowedForms.includes('raw') ? r.rawMaterialStock : 0,
        processed: allowedForms.includes('processed') ? r.processedStock : 0,
        finished: allowedForms.includes('finished') ? r.finishedProductStock : 0
      };

      const targetForm = allowedForms.includes('processed') ? 'processed' : (allowedForms[0] || 'finished') as any;
      const totalStock = this.calculateEquivalentStock(stocks, ratios, targetForm);
      const inQty = r.inputQuantity || 0;
      const outQty = r.outputQuantity || 0;
      
      const isCount = r.notes?.toLowerCase().includes('kiểm kê');
      const isAdj = r.notes?.toLowerCase().includes('điều chỉnh');
      const isProduction = r.notes?.toLowerCase().includes('sản xuất') || r.notes?.toLowerCase().includes('chế biến');
      const randomPrice = Math.floor(Math.random() * 50 + 10) * 1000;

      if (outQty > 0) {
        movements.push({
          ...base,
          id: r.id + '-out',
          movement_type: isCount ? 'stock_count' : isAdj ? 'adjustment' : isProduction ? 'consumption' : 'sale',
          source_type: isCount ? 'stock_count' : isAdj ? 'manual' : isProduction ? 'system' : 'sales_order',
          quantity: -outQty,
          unit_cost: randomPrice,
          total_value: outQty * randomPrice,
          running_balance: totalStock + inQty,
        } as InventoryMovement);
      }

      if (inQty > 0) {
        movements.push({
          ...base,
          id: r.id + '-in',
          movement_type: isCount ? 'stock_count' : isAdj ? 'adjustment' : isProduction ? 'production' : 'purchase',
          source_type: isCount ? 'stock_count' : isAdj ? 'manual' : isProduction ? 'system' : 'purchase_order',
          quantity: inQty,
          unit_cost: randomPrice,
          total_value: inQty * randomPrice,
          running_balance: totalStock,
        } as InventoryMovement);
      }
    });

    const targetProduct = filters.productCode || filters.productId;
    if (targetProduct) movements = movements.filter(m => m.product_id === targetProduct);
    if (filters.movementType) movements = movements.filter(m => m.movement_type === filters.movementType);
    if (filters.dateFrom) movements = movements.filter(m => m.movement_date >= filters.dateFrom);
    if (filters.dateTo) movements = movements.filter(m => m.movement_date <= filters.dateTo);

    movements.sort((a, b) => new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime());
    return { success: true, data: movements, error: null };
  }

  static async getMovements(filters: any = {}): Promise<ServiceResponse<InventoryMovement[]>> {
    return this.execute(
      async () => {
        let query = apiClient.from('inventory_movements').select('*').order('movement_date', { ascending: false }).order('movement_time', { ascending: false });
        if (filters.companyId) query = query.eq('company_id', filters.companyId);
        const targetProduct = filters.productCode || filters.productId;
        if (targetProduct) query = query.eq('product_id', targetProduct);
        if (filters.movementType) query = query.eq('movement_type', filters.movementType);
        if (filters.sourceType) query = query.eq('source_type', filters.sourceType);
        if (filters.movementCategory) query = query.eq('movement_category', filters.movementCategory);
        if (filters.dateFrom) query = query.gte('movement_date', filters.dateFrom);
        if (filters.dateTo) query = query.lte('movement_date', filters.dateTo);
        return await query;
      },
      () => Promise.resolve(this.getMockMovements(filters))
    );
  }

  static async getMovementsByReference(referenceId: string, sourceType: string): Promise<ServiceResponse<InventoryMovement[]>> {
    return this.execute(
      async () => {
        return await apiClient.from('inventory_movements').select('*').eq('source_id', referenceId).eq('source_type', sourceType).order('movement_date', { ascending: false });
      },
      async () => ({ success: true, data: [], error: null })
    );
  }

  static async createBalanceSnapshot(snapshot: Omit<InventoryBalanceSnapshot, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<InventoryBalanceSnapshot>> {
    return this.execute(
      async () => {
        return await apiClient.from('inventory_balance_snapshots').insert([{ ...snapshot, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]).select().single();
      },
      async () => ({ success: true, data: { ...snapshot, id: 'mock-' + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as InventoryBalanceSnapshot, error: null })
    );
  }

  static async getBalanceSnapshots(filters: any = {}): Promise<ServiceResponse<InventoryBalanceSnapshot[]>> {
    return this.execute(
      async () => {
        let query = apiClient.from('inventory_balance_snapshots').select('*').order('snapshot_date', { ascending: false });
        if (filters.companyId) query = query.eq('company_id', filters.companyId);
        if (filters.productId) query = query.eq('product_id', filters.productId);
        if (filters.snapshotType) query = query.eq('snapshot_type', filters.snapshotType);
        if (filters.dateFrom) query = query.gte('snapshot_date', filters.dateFrom);
        if (filters.dateTo) query = query.lte('snapshot_date', filters.dateTo);
        return await query;
      },
      async () => ({ success: true, data: [], error: null })
    );
  }

  static async getCurrentBalance(companyId: string, productId: string): Promise<ServiceResponse<{ quantity: number; value?: number }>> {
    return this.execute(
      async () => {
        const { data, error } = await apiClient.from('inventory_movements').select('running_balance, running_value').eq('company_id', companyId).eq('product_id', productId).order('movement_date', { ascending: false }).order('movement_time', { ascending: false }).limit(1).single();
        if (error && error.code !== 'PGRST116') return { error };
        return { data: data ? { quantity: data.running_balance, value: data.running_value } : { quantity: 0 } };
      },
      async () => {
        const trialRecords = getTrialInventoryRecords();
        const productRecords = trialRecords.filter(r => r.productCode === productId);
        if (productRecords.length > 0) {
          productRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const latest = productRecords[0];
          return { success: true, data: { quantity: (latest.rawMaterialStock || 0) + (latest.processedStock || 0) + (latest.finishedProductStock || 0) }, error: null };
        }
        return { success: true, data: { quantity: 0 }, error: null };
      }
    );
  }

  static async getVarianceReport(companyId: string, dateFrom: string, dateTo: string): Promise<ServiceResponse<any[]>> {
    return this.execute(
      async () => {
        return await apiClient.from('stock_count_entries').select('*, products(id, name, business_code)').eq('company_id', companyId).gte('count_date', dateFrom).lte('count_date', dateTo).order('count_date', { ascending: false });
      },
      async () => {
        seedTrialDataIfNeeded();
        const records = getTrialInventoryRecords();
        const products = getTrialProducts();
        const varianceRecords = records.filter(r => r.notes?.toLowerCase().includes('kiểm kê')).map(r => ({
          id: r.id, count_date: r.date, product_id: r.productCode, book_quantity: (r.rawMaterialStock || 0) + (r.processedStock || 0) + (r.finishedProductStock || 0), counted_quantity: (r.rawMaterialStock || 0) + (r.processedStock || 0) + (r.finishedProductStock || 0), variance: 0, variance_percentage: 0, reconciliation_status: 'approved', unit: r.rawMaterialUnit || 'pcs', notes: r.notes, products: { name: r.productName, business_code: r.productCode }
        }));
        return { success: true, data: varianceRecords, error: null };
      }
    );
  }
}

export const inventoryMovementService = InventoryMovementService;
export default InventoryMovementService;
