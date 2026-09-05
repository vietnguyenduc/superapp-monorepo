import { useState, useEffect, useCallback } from 'react';
import {
  InventoryVarianceReport,
  InventoryVarianceReportCreateInput,
  InventoryReportStats,
  InventoryVarianceAlert
} from '../types';
import { inventoryVarianceService } from '../services/inventoryVarianceService';
import { fallbackService } from '../services/fallbackService';
import { ProductService } from '../services/productService';
import { isTrialMode } from '@superapp/shared-utils';

export const useInventoryVarianceReports = () => {
  const [reports, setReports] = useState<InventoryVarianceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (filters?: {
    search?: string;
    date_from?: string;
    date_to?: string;
    product_id?: string;
    variance_type?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const isTrial = isTrialMode();
      if (isTrial) {
        const invRes = await fallbackService.getInventoryRecords();
        const prodRes = await ProductService.getProducts();
        const records = invRes.data || [];
        const products = prodRes.data || [];
        
        // Group by product and date to simulate variance reports
        const reportMap = new Map<string, InventoryVarianceReport>();
        
        records.forEach(r => {
          const prod = products.find(p => p.businessCode === r.productCode) || { name: r.productName, id: r.productCode };
          const dateStr = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date as string;
          const key = `${r.productCode}_${dateStr}`;
          
          if (!reportMap.has(key)) {
            reportMap.set(key, {
              id: `var_${key}`,
              date: dateStr,
              product_id: prod.id,
              beginning_inventory: 0,
              inbound_quantity: 0,
              sales_quantity: 0,
              promotion_quantity: 0,
              special_outbound_quantity: 0,
              book_inventory: 0,
              actual_inventory: 0,
              variance: 0,
              variance_percentage: 0,
              unit: (r.rawMaterialUnit || r.processedUnit || r.finishedProductUnit) || 'đơn vị',
              created_by: 'trial',
              updated_by: 'trial',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
          
          const rep = reportMap.get(key)!;
          rep.inbound_quantity += (r.inputQuantity || 0);
          rep.sales_quantity += (r.outputQuantity || 0); // Kế toán kho xuất sổ
          
          // Thủ kho nhập tồn thực
          const actual = (r.rawMaterialStock || 0) + (r.processedStock || 0) + (r.finishedProductStock || 0);
          if (actual > 0) rep.actual_inventory = actual;
        });
        
        const mockReports = Array.from(reportMap.values()).map(rep => {
          rep.book_inventory = rep.beginning_inventory + rep.inbound_quantity - rep.sales_quantity - rep.promotion_quantity - rep.special_outbound_quantity;
          rep.variance = rep.actual_inventory - rep.book_inventory;
          rep.variance_percentage = rep.book_inventory > 0 ? (rep.variance / rep.book_inventory) * 100 : 0;
          return rep;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setReports(mockReports);
        return;
      }
      
      const data = await inventoryVarianceService.getReports(filters);
      setReports(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi tải dữ liệu';
      setError(errorMessage);
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReport = useCallback(async (reportData: InventoryVarianceReportCreateInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const isTrial = isTrialMode();
      let newReport;
      
      if (isTrial) {
        console.log('🧪 Trial mode: creating variance report in localStorage');
        // Simple mock creation for trial mode
        newReport = {
          ...reportData,
          id: `var_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'trial',
          updated_by: 'trial'
        } as InventoryVarianceReport;
        
        // In a real app, we'd persist this, but for trial mode reports are often derived
      } else {
        newReport = await inventoryVarianceService.createReport(reportData);
      }
      
      setReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi tạo báo cáo';
      setError(errorMessage);
      console.error('Error creating report:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReport = useCallback(async (id: string, updates: Partial<InventoryVarianceReportCreateInput>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedReport = await inventoryVarianceService.updateReport(id, updates);
      setReports(prev => prev.map(report => 
        report.id === id ? updatedReport : report
      ));
      return updatedReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi cập nhật báo cáo';
      setError(errorMessage);
      console.error('Error updating report:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReport = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await inventoryVarianceService.deleteReport(id);
      setReports(prev => prev.filter(report => report.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi xóa báo cáo';
      setError(errorMessage);
      console.error('Error deleting report:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importReports = useCallback(async (reportsData: InventoryVarianceReportCreateInput[]) => {
    try {
      setLoading(true);
      setError(null);
      const result = await inventoryVarianceService.importReports(reportsData);
      
      // Refresh reports after import
      await fetchReports();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi import báo cáo';
      setError(errorMessage);
      console.error('Error importing reports:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    importReports,
    clearError: () => setError(null)
  };
};

export const useInventoryVarianceStats = () => {
  const [stats, setStats] = useState<InventoryReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (filters?: {
    date_from?: string;
    date_to?: string;
    product_id?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const isTrial = isTrialMode();
      if (isTrial) {
        setStats({
          total_reports: 12,
          total_book_inventory: 1500,
          total_actual_inventory: 1485,
          total_variance: -15,
          positive_variance: 2,
          negative_variance: 5,
          zero_variance: 5,
          high_variance: 1,
          accuracy_percentage: 99.0
        });
        return;
      }
      
      const data = await inventoryVarianceService.getReportStats(filters);
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi tải thống kê';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats,
    clearError: () => setError(null)
  };
};

export const useInventoryVarianceAlerts = () => {
  const [alerts, setAlerts] = useState<InventoryVarianceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (threshold: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const isTrial = isTrialMode();
      if (isTrial) {
        setAlerts([
          {
            id: 'alt-1',
            report_id: 'var_NVL-XO01_today',
            product_id: 'p-001',
            variance_type: 'shortage',
            variance_amount: -5,
            variance_percentage: -12.5,
            alert_level: 'high',
            suggested_action: 'Kiểm tra lại số liệu nhập kho hoặc hao hụt thực tế',
            is_resolved: false,
            created_at: new Date().toISOString()
          }
        ]);
        return;
      }
      
      const data = await inventoryVarianceService.getVarianceAlerts(threshold);
      setAlerts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi tải cảnh báo';
      setError(errorMessage);
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSpecialOutboundSuggestion = useCallback(async (reportId: string) => {
    try {
      setLoading(true);
      setError(null);
      const suggestion = await inventoryVarianceService.generateSpecialOutboundSuggestion(reportId);
      return suggestion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi tạo gợi ý xuất đặc biệt';
      setError(errorMessage);
      console.error('Error generating suggestion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    generateSpecialOutboundSuggestion,
    clearError: () => setError(null)
  };
};
