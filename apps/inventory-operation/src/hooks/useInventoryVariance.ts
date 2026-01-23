import { useState, useEffect, useCallback } from 'react';
import { 
  InventoryVarianceReport, 
  InventoryVarianceReportCreateInput,
  InventoryReportStats,
  InventoryVarianceAlert
} from '../types';
import { inventoryVarianceService } from '../services/inventoryVarianceService';

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
      const newReport = await inventoryVarianceService.createReport(reportData);
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
