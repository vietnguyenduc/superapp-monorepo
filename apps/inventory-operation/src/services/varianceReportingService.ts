// Phase 7: Variance reporting and export redesign
// Variance reporting service based on movement + balance model

import {
  InventoryMovement,
  MovementType,
  MovementSource,
} from '../types/InventoryMovement';

export interface VarianceReport {
  productId: string;
  productCode: string;
  productName: string;
  
  // Book balance from movements
  bookQuantity: number;
  bookValue?: number;
  
  // Actual balance from stock count
  actualQuantity: number;
  actualValue?: number;
  
  // Variance
  varianceQuantity: number;
  varianceValue?: number;
  variancePercentage: number;
  
  // Metadata
  lastStockCountDate?: Date;
  lastMovementDate?: Date;
  status: 'matched' | 'variance' | 'no_data';
  
  // Reconciliation info
  needsReconciliation: boolean;
  suggestedAction?: string;
}

export interface VarianceReportFilters {
  companyId: string;
  dateFrom?: Date;
  dateTo?: Date;
  productId?: string;
  varianceThreshold?: number; // Percentage threshold
  status?: 'matched' | 'variance' | 'all';
}

class VarianceReportingService {
  // Generate variance report comparing book vs actual
  async generateVarianceReport(_filters: VarianceReportFilters): Promise<{
    data?: VarianceReport[];
    summary?: {
      totalProducts: number;
      matchedCount: number;
      varianceCount: number;
      noDataCount: number;
      totalVarianceQuantity: number;
      totalVarianceValue: number;
    };
    error?: string;
  }> {
    try {
      // TODO: Implement Supabase calls to:
      // 1. Get current book balances from inventory_balance_snapshots or calculate from movements
      // 2. Get latest stock count entries from stock_count_entries
      // 3. Calculate variance for each product
      // 4. Filter and sort based on filters
      
      // For now, return mock data
      return {
        data: [],
        summary: {
          totalProducts: 0,
          matchedCount: 0,
          varianceCount: 0,
          noDataCount: 0,
          totalVarianceQuantity: 0,
          totalVarianceValue: 0,
        },
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to generate variance report' };
    }
  }

  // Get variance for a specific product
  async getProductVariance(_companyId: string, _productId: string): Promise<{
    data?: VarianceReport;
    error?: string;
  }> {
    try {
      // TODO: Implement Supabase calls
      return { data: undefined, error: 'Not implemented yet' };
    } catch (error: any) {
      return { error: error.message || 'Failed to get product variance' };
    }
  }

  // Generate variance report from movements and stock counts for a period
  async generatePeriodVarianceReport(
    _companyId: string,
    _periodStart: Date,
    _periodEnd: Date
  ): Promise<{
    data?: VarianceReport[];
    error?: string;
  }> {
    try {
      // 1. Get balance snapshot for the period
      // 2. Get stock count entries in the period
      // 3. Calculate variance
      // TODO: Implement Supabase calls
      return { data: [], error: 'Not implemented yet' };
    } catch (error: any) {
      return { error: error.message || 'Failed to generate period variance report' };
    }
  }

  // Reconcile variance by creating adjustment movement
  async reconcileVariance(
    _companyId: string,
    _productId: string,
    varianceQuantity: number,
    reason: string,
    userId: string
  ): Promise<{
    data?: InventoryMovement;
    error?: string;
  }> {
    try {
      // Create an adjustment movement to reconcile the variance
      const _movement: Omit<InventoryMovement, 'id' | 'createdAt' | 'updatedAt'> = {
        companyId: _companyId,
        productId: _productId,
        productCode: '', // Will be fetched
        productName: '', // Will be fetched
        movementType: MovementType.ADJUSTMENT,
        source: MovementSource.ADJUSTMENT,
        roleOwner: 'accountant' as any,
        quantity: Math.abs(varianceQuantity),
        unit: '',
        unitCost: undefined,
        runningBalance: 0, // Will be calculated
        isBookEntry: true,
        isActualEntry: false,
        movementDate: new Date(),
        createdBy: userId,
        updatedBy: userId,
        notes: `Điều chỉnh chênh lệch: ${reason}`,
      };

      // TODO: Implement Supabase call to create movement
      return { data: undefined, error: 'Not implemented yet' };
    } catch (error: any) {
      return { error: error.message || 'Failed to reconcile variance' };
    }
  }

  // Get high variance items for dashboard alerts
  async getHighVarianceAlerts(
    companyId: string,
    threshold: number = 10 // Percentage threshold
  ): Promise<{
    data?: VarianceReport[];
    error?: string;
  }> {
    try {
      // Get variance report filtered by high variance
      const result = await this.generateVarianceReport({
        companyId,
        varianceThreshold: threshold,
        status: 'variance',
      });

      if (result.error) {
        return { error: result.error };
      }

      // Sort by variance percentage descending
      const sortedData = result.data?.sort((a, b) => 
        Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage)
      );

      return { data: sortedData };
    } catch (error: any) {
      return { error: error.message || 'Failed to get high variance alerts' };
    }
  }

  // Calculate variance percentage
  calculateVariancePercentage(bookQuantity: number, actualQuantity: number): number {
    if (bookQuantity === 0) {
      return actualQuantity !== 0 ? 100 : 0;
    }
    return ((actualQuantity - bookQuantity) / bookQuantity) * 100;
  }

  // Determine variance status
  determineVarianceStatus(variancePercentage: number, threshold: number = 5): 'matched' | 'variance' {
    return Math.abs(variancePercentage) <= threshold ? 'matched' : 'variance';
  }

  // Get suggested action for variance
  getSuggestedAction(varianceQuantity: number, variancePercentage: number): string {
    const absPercentage = Math.abs(variancePercentage);
    
    if (absPercentage >= 20) {
      return varianceQuantity > 0 
        ? 'Cần kiểm tra lại và tạo phiếu xuất điều chỉnh thừa kho (cao)'
        : 'Cần điều tra nguyên nhân thiếu hụt và tạo phiếu nhập điều chỉnh (cao)';
    }
    
    if (absPercentage >= 10) {
      return varianceQuantity > 0 
        ? 'Cân nhắc tạo phiếu xuất điều chỉnh thừa kho'
        : 'Cần kiểm tra lại tồn kho và tìm nguyên nhân thiếu hụt';
    }
    
    if (absPercentage >= 5) {
      return 'Theo dõi chênh lệch trong kỳ tới';
    }
    
    return 'Chênh lệch nhỏ, không cần hành động ngay';
  }
}

export const varianceReportingService = new VarianceReportingService();
export default varianceReportingService;
