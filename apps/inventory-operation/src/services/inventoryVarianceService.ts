import { supabase } from '../config/supabase';
import { 
  InventoryVarianceReport, 
  InventoryVarianceReportCreateInput, 
  InventoryVarianceReportUpdateInput,
  InventoryReportStats,
  InventoryVarianceAlert
} from '../types';

export const inventoryVarianceService = {
  // Get all inventory variance reports with filters
  async getReports(filters?: {
    search?: string;
    date_from?: string;
    date_to?: string;
    product_id?: string;
    variance_type?: string;
  }): Promise<InventoryVarianceReport[]> {
    try {
      let query = supabase
        .from('inventory_variance_reports')
        .select('*')
        .order('date', { ascending: false });

      if (filters?.search) {
        query = query.or(`notes.ilike.%${filters.search}%`);
      }

      if (filters?.date_from) {
        query = query.gte('date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('date', filters.date_to);
      }

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters?.variance_type) {
        if (filters.variance_type === 'positive') {
          query = query.gt('variance', 0);
        } else if (filters.variance_type === 'negative') {
          query = query.lt('variance', 0);
        } else if (filters.variance_type === 'zero') {
          query = query.eq('variance', 0);
        } else if (filters.variance_type === 'high') {
          query = query.or('variance_percentage.gte.10,variance_percentage.lte.-10');
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching inventory variance reports:', error);
        throw new Error(`Lỗi tải báo cáo: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Get single report by ID
  async getReportById(id: string): Promise<InventoryVarianceReport | null> {
    try {
      const { data, error } = await supabase
        .from('inventory_variance_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching report:', error);
        throw new Error(`Lỗi tải báo cáo: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Create new inventory variance report
  async createReport(reportData: InventoryVarianceReportCreateInput): Promise<InventoryVarianceReport> {
    try {
      const { data, error } = await supabase
        .from('inventory_variance_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) {
        console.error('Error creating report:', error);
        throw new Error(`Lỗi tạo báo cáo: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Update existing report
  async updateReport(id: string, updates: Partial<InventoryVarianceReportCreateInput>): Promise<InventoryVarianceReport> {
    try {
      const { data, error } = await supabase
        .from('inventory_variance_reports')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating report:', error);
        throw new Error(`Lỗi cập nhật báo cáo: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Delete report
  async deleteReport(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inventory_variance_reports')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting report:', error);
        throw new Error(`Lỗi xóa báo cáo: ${error.message}`);
      }
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Get statistics for reports
  async getReportStats(filters?: {
    date_from?: string;
    date_to?: string;
    product_id?: string;
  }): Promise<InventoryReportStats> {
    try {
      let query = supabase
        .from('inventory_variance_reports')
        .select('*');

      if (filters?.date_from) {
        query = query.gte('date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('date', filters.date_to);
      }

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching report stats:', error);
        throw new Error(`Lỗi tải thống kê: ${error.message}`);
      }

      const reports = data || [];
      
      const stats: InventoryReportStats = {
        total_reports: reports.length,
        total_book_inventory: reports.reduce((sum, r) => sum + r.book_inventory, 0),
        total_actual_inventory: reports.reduce((sum, r) => sum + r.actual_inventory, 0),
        total_variance: reports.reduce((sum, r) => sum + Math.abs(r.variance), 0),
        positive_variance: reports.filter(r => r.variance > 0).length,
        negative_variance: reports.filter(r => r.variance < 0).length,
        zero_variance: reports.filter(r => r.variance === 0).length,
        high_variance: reports.filter(r => Math.abs(r.variance_percentage) >= 10).length,
        accuracy_percentage: reports.length > 0 
          ? (reports.filter(r => r.variance === 0).length / reports.length) * 100 
          : 0
      };

      return stats;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Get variance alerts for high discrepancies
  async getVarianceAlerts(threshold: number = 10): Promise<InventoryVarianceAlert[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_variance_reports')
        .select('*')
        .or(`variance_percentage.gte.${threshold},variance_percentage.lte.-${threshold}`)
        .order('variance_percentage', { ascending: false });

      if (error) {
        console.error('Error fetching variance alerts:', error);
        throw new Error(`Lỗi tải cảnh báo: ${error.message}`);
      }

      const alerts: InventoryVarianceAlert[] = (data || []).map(report => ({
        id: `alert_${report.id}`,
        report_id: report.id,
        product_id: report.product_id,
        variance_type: report.variance > 0 ? 'excess' : 'shortage',
        variance_amount: Math.abs(report.variance),
        variance_percentage: Math.abs(report.variance_percentage),
        alert_level: Math.abs(report.variance_percentage) >= 20 ? 'critical' :
                    Math.abs(report.variance_percentage) >= 15 ? 'high' :
                    Math.abs(report.variance_percentage) >= 10 ? 'medium' : 'low',
        suggested_action: report.variance > 0 
          ? 'Tạo phiếu xuất đặc biệt để điều chỉnh thừa kho'
          : 'Kiểm tra lại tồn kho và tìm nguyên nhân thiếu hụt',
        is_resolved: false,
        created_at: report.created_at
      }));

      return alerts;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Import reports from Excel/CSV data
  async importReports(reports: InventoryVarianceReportCreateInput[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const report of reports) {
        try {
          await this.createReport(report);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Dòng ${results.success + results.failed}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Generate special outbound suggestion for high variance
  async generateSpecialOutboundSuggestion(reportId: string): Promise<{
    product_id: string;
    suggested_quantity: number;
    suggested_reason: string;
    variance_amount: number;
    variance_percentage: number;
  }> {
    try {
      const report = await this.getReportById(reportId);
      
      if (!report) {
        throw new Error('Không tìm thấy báo cáo');
      }

      if (Math.abs(report.variance_percentage) < 10) {
        throw new Error('Chênh lệch không đủ lớn để tạo phiếu xuất đặc biệt');
      }

      const suggestion = {
        product_id: report.product_id,
        suggested_quantity: Math.abs(report.variance),
        suggested_reason: report.variance > 0 
          ? 'Điều chỉnh thừa kho do chênh lệch kiểm kê'
          : 'Điều chỉnh thiếu kho do chênh lệch kiểm kê',
        variance_amount: report.variance,
        variance_percentage: report.variance_percentage
      };

      return suggestion;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  }
};

export default inventoryVarianceService;
