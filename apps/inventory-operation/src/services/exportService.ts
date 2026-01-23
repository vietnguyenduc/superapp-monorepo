import { supabase } from '../config/supabase';
import { InventoryVarianceReport, Product } from '../types';

export interface ExportData {
  format: 'excel' | 'pdf';
  template: 'inventory_check' | 'variance_report' | 'summary_report';
  filters: {
    date_from?: string;
    date_to?: string;
    product_ids?: string[];
    include_zero_variance?: boolean;
    include_notes?: boolean;
  };
  notes?: string;
}

export interface ExportLog {
  id: string;
  export_type: string;
  format: string;
  filters: any;
  file_name: string;
  file_size: number;
  created_by: string;
  created_at: string;
  notes?: string;
}

export const exportService = {
  // Generate Excel file for inventory reports
  async generateExcelReport(exportData: ExportData, reports: InventoryVarianceReport[], products: Product[]): Promise<Blob> {
    try {
      // Create workbook data structure
      const workbookData = {
        template: exportData.template,
        format: exportData.format,
        data: {
          reports: reports.map(report => {
            const product = products.find(p => p.id === report.product_id);
            return {
              ...report,
              product_name: product?.name || 'N/A',
              product_code: product?.businessCode || 'N/A',
              product_category: product?.category || 'N/A'
            };
          }),
          products,
          summary: {
            total_reports: reports.length,
            total_variance: reports.reduce((sum, r) => sum + Math.abs(r.variance), 0),
            high_variance_count: reports.filter(r => Math.abs(r.variance_percentage) >= 10).length,
            accuracy_percentage: reports.length > 0 
              ? (reports.filter(r => r.variance === 0).length / reports.length) * 100 
              : 0
          },
          filters: exportData.filters,
          generated_at: new Date().toISOString(),
          notes: exportData.notes
        }
      };

      // In a real implementation, this would use a library like xlsx or exceljs
      // For now, we'll create a simple CSV-like structure
      const csvContent = this.generateCSVContent(workbookData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      return blob;
    } catch (error) {
      console.error('Error generating Excel report:', error);
      throw new Error('Lỗi tạo file Excel');
    }
  },

  // Generate PDF file for inventory reports
  async generatePDFReport(exportData: ExportData, reports: InventoryVarianceReport[], products: Product[]): Promise<Blob> {
    try {
      // Create PDF data structure
      const pdfData = {
        template: exportData.template,
        format: exportData.format,
        title: this.getReportTitle(exportData.template),
        data: {
          reports: reports.map(report => {
            const product = products.find(p => p.id === report.product_id);
            return {
              ...report,
              product_name: product?.name || 'N/A',
              product_code: product?.businessCode || 'N/A'
            };
          }),
          summary: {
            total_reports: reports.length,
            date_range: `${exportData.filters.date_from} - ${exportData.filters.date_to}`,
            high_variance_count: reports.filter(r => Math.abs(r.variance_percentage) >= 10).length
          },
          generated_at: new Date().toLocaleString('vi-VN'),
          notes: exportData.notes
        }
      };

      // In a real implementation, this would use a library like jsPDF or puppeteer
      // For now, we'll create a simple HTML structure that can be converted to PDF
      const htmlContent = this.generateHTMLContent(pdfData);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      
      return blob;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error('Lỗi tạo file PDF');
    }
  },

  // Export inventory reports with specified format and template
  async exportInventoryReports(exportData: ExportData): Promise<{
    file: Blob;
    fileName: string;
    logId: string;
  }> {
    try {
      // Fetch reports based on filters
      const reports = await this.fetchReportsForExport(exportData.filters);
      const products = await this.fetchProductsForExport(exportData.filters.product_ids);

      let file: Blob;
      let fileName: string;

      if (exportData.format === 'excel') {
        file = await this.generateExcelReport(exportData, reports, products);
        fileName = `${this.getReportFileName(exportData.template)}_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        file = await this.generatePDFReport(exportData, reports, products);
        fileName = `${this.getReportFileName(exportData.template)}_${new Date().toISOString().split('T')[0]}.html`;
      }

      // Log the export action
      const logId = await this.logExportAction({
        export_type: exportData.template,
        format: exportData.format,
        filters: exportData.filters,
        file_name: fileName,
        file_size: file.size,
        notes: exportData.notes
      });

      return {
        file,
        fileName,
        logId
      };
    } catch (error) {
      console.error('Error exporting reports:', error);
      throw error;
    }
  },

  // Fetch reports for export based on filters
  async fetchReportsForExport(filters: ExportData['filters']): Promise<InventoryVarianceReport[]> {
    try {
      let query = supabase
        .from('inventory_variance_reports')
        .select('*')
        .order('date', { ascending: false });

      if (filters.date_from) {
        query = query.gte('date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('date', filters.date_to);
      }

      if (filters.product_ids && filters.product_ids.length > 0) {
        query = query.in('product_id', filters.product_ids);
      }

      if (!filters.include_zero_variance) {
        query = query.neq('variance', 0);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi tải dữ liệu: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching reports for export:', error);
      throw error;
    }
  },

  // Fetch products for export
  async fetchProductsForExport(productIds?: string[]): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('name');

      if (productIds && productIds.length > 0) {
        query = query.in('id', productIds);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi tải danh sách sản phẩm: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching products for export:', error);
      throw error;
    }
  },

  // Log export action
  async logExportAction(logData: Omit<ExportLog, 'id' | 'created_at' | 'created_by'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('export_logs')
        .insert([{
          ...logData,
          created_by: 'current-user', // Replace with actual user ID
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Error logging export action:', error);
        // Don't throw error for logging failure
        return 'log-failed';
      }

      return data?.id || 'log-created';
    } catch (error) {
      console.error('Error logging export action:', error);
      return 'log-error';
    }
  },

  // Get export logs
  async getExportLogs(limit: number = 50): Promise<ExportLog[]> {
    try {
      const { data, error } = await supabase
        .from('export_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Lỗi tải lịch sử xuất file: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching export logs:', error);
      throw error;
    }
  },

  // Helper methods
  getReportTitle(template: string): string {
    switch (template) {
      case 'inventory_check':
        return 'PHIẾU KIỂM KHO';
      case 'variance_report':
        return 'BÁO CÁO CHÊNH LỆCH TỒN KHO';
      case 'summary_report':
        return 'BÁO CÁO TỔNG HỢP NHẬP XUẤT TỒN';
      default:
        return 'BÁO CÁO TỒN KHO';
    }
  },

  getReportFileName(template: string): string {
    switch (template) {
      case 'inventory_check':
        return 'phieu_kiem_kho';
      case 'variance_report':
        return 'bao_cao_chenh_lech';
      case 'summary_report':
        return 'bao_cao_tong_hop';
      default:
        return 'bao_cao_ton_kho';
    }
  },

  generateCSVContent(data: any): string {
    const { reports } = data.data;
    
    let csv = 'Ngày,Mã sản phẩm,Tên sản phẩm,Tồn sổ,Tồn thực,Chênh lệch,Tỷ lệ chênh lệch (%),Đơn vị,Ghi chú\n';
    
    reports.forEach((report: any) => {
      csv += `${report.date},${report.product_code},${report.product_name},${report.book_inventory},${report.actual_inventory},${report.variance},${report.variance_percentage.toFixed(2)},${report.unit},"${report.notes || ''}"\n`;
    });

    return csv;
  },

  generateHTMLContent(data: any): string {
    const { title, data: reportData } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .variance-positive { color: #d32f2f; }
          .variance-negative { color: #1976d2; }
          .variance-zero { color: #388e3c; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Ngày tạo: ${reportData.generated_at}</p>
          <p>Khoảng thời gian: ${reportData.summary.date_range}</p>
        </div>
        
        <div class="summary">
          <h3>Tóm tắt</h3>
          <p>Tổng số báo cáo: ${reportData.summary.total_reports}</p>
          <p>Số báo cáo có chênh lệch cao: ${reportData.summary.high_variance_count}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Mã SP</th>
              <th>Tên sản phẩm</th>
              <th>Tồn sổ</th>
              <th>Tồn thực</th>
              <th>Chênh lệch</th>
              <th>Tỷ lệ (%)</th>
              <th>Đơn vị</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.reports.map((report: any) => `
              <tr>
                <td>${report.date}</td>
                <td>${report.product_code}</td>
                <td>${report.product_name}</td>
                <td>${report.book_inventory.toLocaleString('vi-VN')}</td>
                <td>${report.actual_inventory.toLocaleString('vi-VN')}</td>
                <td class="${report.variance > 0 ? 'variance-positive' : report.variance < 0 ? 'variance-negative' : 'variance-zero'}">
                  ${report.variance > 0 ? '+' : ''}${report.variance.toLocaleString('vi-VN')}
                </td>
                <td class="${report.variance_percentage > 0 ? 'variance-positive' : report.variance_percentage < 0 ? 'variance-negative' : 'variance-zero'}">
                  ${report.variance_percentage > 0 ? '+' : ''}${report.variance_percentage.toFixed(2)}%
                </td>
                <td>${report.unit}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${reportData.notes ? `<div><h3>Ghi chú</h3><p>${reportData.notes}</p></div>` : ''}
      </body>
      </html>
    `;
  }
};

export default exportService;
