import { useState, useCallback } from 'react';
import { exportService, ExportData, ExportLog } from '../services/exportService';

export const useInventoryExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReports = useCallback(async (exportData: ExportData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await exportService.exportInventoryReports(exportData);
      
      // Trigger file download
      const url = window.URL.createObjectURL(result.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        fileName: result.fileName,
        logId: result.logId
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi xuất file';
      setError(errorMessage);
      console.error('Error exporting reports:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    exportReports,
    clearError: () => setError(null)
  };
};

export const useExportLogs = () => {
  const [logs, setLogs] = useState<ExportLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);
      const data = await exportService.getExportLogs(limit);
      setLogs(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi tải lịch sử xuất file';
      setError(errorMessage);
      console.error('Error fetching export logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    loading,
    error,
    fetchLogs,
    clearError: () => setError(null)
  };
};
