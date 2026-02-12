import { useState, useEffect } from 'react';
import { SalesRecord, SpecialOutboundRecord, Product, ApprovalLog, ApiResponse } from '../types';
import { salesService } from '../services/salesService';
import { specialOutboundService } from '../services/specialOutboundService';
import { fallbackService } from '../services/fallbackService';

export const useSalesReport = () => {
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSalesRecords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading sales records...');
      
      // Force fallback mode for now since Supabase is not configured
      console.warn('🔄 Using fallback mode (Supabase not configured)');
      const response = await fallbackService.getSalesRecords();
      
      console.log('📊 Sales fallback response:', response);
      
      if (response.data) {
        setSalesRecords(response.data);
        console.log('✅ Sales records loaded:', response.data.length);
      } else {
        setError(response.error || 'Không thể tải danh sách báo cáo bán hàng');
        console.error('❌ Failed to load sales records:', response.error);
      }
    } catch (err) {
      setError('Lỗi kết nối khi tải dữ liệu');
      console.error('Error loading sales records:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSalesRecord = async (data: Omit<SalesRecord, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await salesService.createSalesRecord(data);
      if (response.success && response.data) {
        setSalesRecords(prev => [response.data!, ...prev]);
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Không thể tạo báo cáo bán hàng');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Lỗi kết nối khi tạo báo cáo';
      setError(errorMessage);
      console.error('Error creating sales record:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateSalesRecord = async (id: string, data: Partial<SalesRecord>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await salesService.updateSalesRecord(id, data);
      if (response.success && response.data) {
        setSalesRecords(prev => 
          prev.map(record => record.id === id ? response.data! : record)
        );
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Không thể cập nhật báo cáo bán hàng');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Lỗi kết nối khi cập nhật báo cáo';
      setError(errorMessage);
      console.error('Error updating sales record:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteSalesRecord = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await salesService.deleteSalesRecord(id);
      if (response.success) {
        setSalesRecords(prev => prev.filter(record => record.id !== id));
        return { success: true };
      } else {
        setError(response.message || 'Không thể xóa báo cáo bán hàng');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Lỗi kết nối khi xóa báo cáo';
      setError(errorMessage);
      console.error('Error deleting sales record:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const importSalesRecords = async (records: Omit<SalesRecord, 'id' | 'created_at' | 'updated_at'>[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await salesService.importSalesRecords(records);
      if (response.success && response.data) {
        // Reload all records to get the latest data
        await loadSalesRecords();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Không thể import báo cáo bán hàng');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Lỗi kết nối khi import dữ liệu';
      setError(errorMessage);
      console.error('Error importing sales records:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesRecords();
  }, []);

  return {
    salesRecords,
    loading,
    error,
    loadSalesRecords,
    createSalesRecord,
    updateSalesRecord,
    deleteSalesRecord,
    importSalesRecords,
    clearError: () => setError(null)
  };
};

export const useSpecialOutbound = () => {
  const [records, setRecords] = useState<SpecialOutboundRecord[]>([]);
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await specialOutboundService.getAllRecords();
      if (response.success && response.data) {
        setRecords(response.data);
      } else {
        setError(response.message || 'Không thể tải danh sách xuất đặc biệt');
      }
    } catch (err) {
      setError('Lỗi kết nối khi tải dữ liệu');
      console.error('Error loading special outbound records:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApprovalLogs = async (recordId?: string) => {
    try {
      const response = await specialOutboundService.getApprovalLogs(recordId);
      if (response.success && response.data) {
        setApprovalLogs(response.data);
      }
    } catch (err) {
      console.error('Error loading approval logs:', err);
    }
  };

  const createRecord = async (data: Omit<SpecialOutboundRecord, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await specialOutboundService.createRecord(data);
      if (response.success && response.data) {
        setRecords(prev => [response.data!, ...prev]);
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Không thể tạo yêu cầu xuất đặc biệt');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Lỗi kết nối khi tạo yêu cầu';
      setError(errorMessage);
      console.error('Error creating special outbound record:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (id: string, data: Partial<SpecialOutboundRecord>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await specialOutboundService.updateRecord(id, data);
      if (response.success && response.data) {
        setRecords(prev => 
          prev.map(record => record.id === id ? response.data! : record)
        );
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Không thể cập nhật yêu cầu xuất đặc biệt');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Lỗi kết nối khi cập nhật yêu cầu';
      setError(errorMessage);
      console.error('Error updating special outbound record:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await specialOutboundService.deleteRecord(id);
      if (response.success) {
        setRecords(prev => prev.filter(record => record.id !== id));
        return { success: true };
      } else {
        setError(response.message || 'Không thể xóa yêu cầu xuất đặc biệt');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Lỗi kết nối khi xóa yêu cầu';
      setError(errorMessage);
      console.error('Error deleting special outbound record:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const approveRecord = async (id: string, comment?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await specialOutboundService.approveRecord(id, comment);
      if (response.success) {
        // Update the record status
        setRecords(prev => 
          prev.map(record => 
            record.id === id 
              ? { ...record, approval_status: 'approved' }
              : record
          )
        );
        // Reload approval logs
        await loadApprovalLogs();
        return { success: true };
      } else {
        setError(response.message || 'Không thể phê duyệt yêu cầu');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Lỗi kết nối khi phê duyệt yêu cầu';
      setError(errorMessage);
      console.error('Error approving record:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const rejectRecord = async (id: string, comment: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await specialOutboundService.rejectRecord(id, comment);
      if (response.success) {
        // Update the record status
        setRecords(prev => 
          prev.map(record => 
            record.id === id 
              ? { ...record, approval_status: 'rejected' }
              : record
          )
        );
        // Reload approval logs
        await loadApprovalLogs();
        return { success: true };
      } else {
        setError(response.message || 'Không thể từ chối yêu cầu');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Lỗi kết nối khi từ chối yêu cầu';
      setError(errorMessage);
      console.error('Error rejecting record:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    loadApprovalLogs();
  }, []);

  return {
    records,
    approvalLogs,
    loading,
    error,
    loadRecords,
    loadApprovalLogs,
    createRecord,
    updateRecord,
    deleteRecord,
    approveRecord,
    rejectRecord,
    clearError: () => setError(null)
  };
};
