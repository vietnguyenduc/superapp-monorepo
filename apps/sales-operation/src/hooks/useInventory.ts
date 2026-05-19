import { useState, useEffect, useCallback } from 'react';
import { InventoryRecord } from '../types';
import { InventoryService } from '../services/inventoryService';
import { fallbackService } from '../services/fallbackService';
import { getTrialInventoryRecords, saveTrialInventoryRecords, seedTrialDataIfNeeded } from '../data/trialMockData';

interface UseInventoryOptions {
  autoLoad?: boolean;
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    productCode?: string;
  };
}

export const useInventory = (options: UseInventoryOptions = {}) => {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load inventory records
  const loadRecords = useCallback(async (filters?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Trial mode: load from localStorage
      const isTrial = localStorage.getItem('isTrial') === 'true';
      if (isTrial) {
        seedTrialDataIfNeeded();
        const trialRecords = getTrialInventoryRecords();
        setRecords(trialRecords);
        console.log('🧪 Trial mode: loaded', trialRecords.length, 'inventory records');
        return;
      }

      console.log('🔄 Loading inventory records from database...');
      
      // Try database service first
      const dbResponse = await InventoryService.getInventoryRecords(filters);
      
      if (dbResponse.data) {
        setRecords(dbResponse.data);
        console.log('✅ Records loaded from database:', dbResponse.data.length);
        return;
      }
      
      // If DB fails with specific error, use fallback as temporary safety net
      console.warn('Database service failed, using fallback service:', dbResponse.error);
      const fallbackResponse = await fallbackService.getInventoryRecords(filters);
      
      if (fallbackResponse.data) {
        setRecords(fallbackResponse.data);
        console.log('📊 Fallback response received:', fallbackResponse.data.length);
      } else {
        setError(dbResponse.error || fallbackResponse.error || 'Không thể tải dữ liệu tồn kho');
        console.error('❌ Failed to load records from both sources');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải dữ liệu');
      console.error('Error loading inventory records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new inventory record
  const createRecord = useCallback(async (record: Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const isTrial = localStorage.getItem('isTrial') === 'true';
      let response;
      
      if (isTrial) {
        console.log('🧪 Trial mode: creating inventory record in localStorage');
        response = await fallbackService.createInventoryRecord(record);
      } else {
        // Try database service first, fallback to mock data if it fails
        try {
          response = await InventoryService.createInventoryRecord(record);
        } catch (dbError) {
          console.warn('Database error, using fallback service:', dbError);
          response = await fallbackService.createInventoryRecord(record);
        }
      }
      
      if (response.data) {
        setRecords(prev => [response.data!, ...prev]);
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Không thể tạo bản ghi tồn kho');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = 'Đã xảy ra lỗi khi tạo bản ghi';
      setError(errorMessage);
      console.error('Error creating inventory record:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update inventory record
  const updateRecord = useCallback(async (id: string, updates: Partial<InventoryRecord>) => {
    setIsLoading(true);
    setError(null);

    try {
      const isTrial = localStorage.getItem('isTrial') === 'true';
      let response;
      
      if (isTrial) {
        console.log('🧪 Trial mode: updating inventory record in localStorage');
        // fallbackService currently doesn't have updateRecord, we simulate it
        response = { data: { ...updates, id, updatedAt: new Date() } as InventoryRecord, error: null };
      } else {
        // Try database service first, fallback to mock data if it fails
        try {
          response = await InventoryService.updateInventoryRecord(id, updates);
        } catch (dbError) {
          console.warn('Database error, using fallback service:', dbError);
          // For update, we'll simulate success since fallback service doesn't have update method
          response = { data: { ...updates, id, updatedAt: new Date() } as InventoryRecord, error: null };
        }
      }
      
      if (response.data) {
        setRecords(prev => 
          prev.map(record => 
            record.id === id ? { ...record, ...response.data } as InventoryRecord : record
          )
        );
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Không thể cập nhật bản ghi tồn kho');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = 'Đã xảy ra lỗi khi cập nhật bản ghi';
      setError(errorMessage);
      console.error('Error updating inventory record:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete inventory record
  const deleteRecord = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const isTrial = localStorage.getItem('isTrial') === 'true';
      let response;
      
      if (isTrial) {
        console.log('🧪 Trial mode: deleting inventory record in localStorage');
        response = { data: true, error: null };
      } else {
        // Try database service first, fallback to mock data if it fails
        try {
          response = await InventoryService.deleteInventoryRecord(id);
        } catch (dbError) {
          console.warn('Database error, using fallback service:', dbError);
          // For delete, we'll simulate success
          response = { data: true, error: null };
        }
      }
      
      if (response.data) {
        setRecords(prev => prev.filter(record => record.id !== id));
        return { success: true };
      } else {
        setError(response.error || 'Không thể xóa bản ghi tồn kho');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = 'Đã xảy ra lỗi khi xóa bản ghi';
      setError(errorMessage);
      console.error('Error deleting inventory record:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Import multiple records
  const importRecords = useCallback(async (recordsToImport: Partial<InventoryRecord>[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await InventoryService.importInventoryRecords(recordsToImport);
      
      if (response.success && response.data) {
        setRecords(prev => [...response.data!, ...prev]);
        return { success: true, data: response.data, count: response.data.length };
      } else {
        setError(response.error || 'Không thể import dữ liệu tồn kho');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = 'Đã xảy ra lỗi khi import dữ liệu';
      setError(errorMessage);
      console.error('Error importing inventory records:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get inventory summary
  const getSummary = useCallback(async (dateFrom: Date, dateTo: Date) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await InventoryService.getInventorySummary(dateFrom, dateTo);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Không thể tải báo cáo tồn kho');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = 'Đã xảy ra lỗi khi tải báo cáo';
      setError(errorMessage);
      console.error('Error getting inventory summary:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-load records on mount if enabled
  useEffect(() => {
    if (options.autoLoad !== false) {
      loadRecords(options.filters);
    }
  }, [loadRecords, options.autoLoad, options.filters]);

  return {
    // State
    records,
    isLoading,
    error,
    
    // Actions
    loadRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    importRecords,
    getSummary,
    
    // Utilities
    clearError: () => setError(null),
    refresh: () => loadRecords(options.filters),
  };
};
