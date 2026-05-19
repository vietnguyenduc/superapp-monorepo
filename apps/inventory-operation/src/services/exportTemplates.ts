// Phase 7: Export templates aligned with redesigned views
// Export template configurations for different views and formats

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  viewId: string; // Corresponds to InventoryViewConfig.viewId
  format: 'excel' | 'pdf' | 'csv';
  columns: ExportColumn[];
  summaryFields?: string[];
  metadata: {
    version: string;
    lastUpdated: Date;
    createdBy: string;
  };
}

export interface ExportColumn {
  key: string;
  label: string;
  width?: number;
  format?: 'text' | 'number' | 'currency' | 'date' | 'percentage';
  formula?: string; // For calculated fields
}

// Export templates for each view
export const EXPORT_TEMPLATES: Record<string, ExportTemplate> = {
  // Operational ledger export template
  operational_ledger_excel: {
    id: 'operational_ledger_excel',
    name: 'Sổ vận hành (Excel)',
    description: 'Xuất sổ giao dịch vận hành chi tiết',
    viewId: 'operational_ledger',
    format: 'excel',
    columns: [
      { key: 'movementDate', label: 'Ngày', format: 'date', width: 12 },
      { key: 'movementType', label: 'Loại giao dịch', format: 'text', width: 15 },
      { key: 'source', label: 'Nguồn', format: 'text', width: 12 },
      { key: 'productCode', label: 'Mã SP', format: 'text', width: 12 },
      { key: 'productName', label: 'Tên SP', format: 'text', width: 30 },
      { key: 'quantity', label: 'Số lượng', format: 'number', width: 10 },
      { key: 'unit', label: 'ĐVT', format: 'text', width: 8 },
      { key: 'unitCost', label: 'Đơn giá', format: 'currency', width: 12 },
      { key: 'totalValue', label: 'Tổng giá trị', format: 'currency', width: 15 },
      { key: 'runningBalance', label: 'Số dư sau', format: 'number', width: 12 },
      { key: 'roleOwner', label: 'Người tạo', format: 'text', width: 15 },
      { key: 'referenceId', label: 'Tham chiếu', format: 'text', width: 15 },
      { key: 'notes', label: 'Ghi chú', format: 'text', width: 25 },
    ],
    summaryFields: ['totalMovements', 'totalInbound', 'totalOutbound', 'totalValue'],
    metadata: {
      version: '1.0',
      lastUpdated: new Date(),
      createdBy: 'system',
    },
  },

  // Accounting summary export template
  accounting_summary_excel: {
    id: 'accounting_summary_excel',
    name: 'Báo cáo XNT (Excel)',
    description: 'Báo cáo xuất nhập tồn tổng hợp theo kỳ',
    viewId: 'accounting_summary',
    format: 'excel',
    columns: [
      { key: 'productCode', label: 'Mã SP', format: 'text', width: 12 },
      { key: 'productName', label: 'Tên SP', format: 'text', width: 30 },
      { key: 'openingQuantity', label: 'Tồn đầu kỳ', format: 'number', width: 12 },
      { key: 'openingValue', label: 'Gi trị đầu kỳ', format: 'currency', width: 15 },
      { key: 'inboundQuantity', label: 'Nhập kỳ', format: 'number', width: 12 },
      { key: 'inboundValue', label: 'Gi trị nhập', format: 'currency', width: 15 },
      { key: 'outboundQuantity', label: 'Xuất kỳ', format: 'number', width: 12 },
      { key: 'outboundValue', label: 'Gi trị xuất', format: 'currency', width: 15 },
      { key: 'closingQuantity', label: 'Tồn cuối kỳ', format: 'number', width: 12 },
      { key: 'closingValue', label: 'Gi trị cuối kỳ', format: 'currency', width: 15 },
      { key: 'varianceQuantity', label: 'Chênh lệch', format: 'number', width: 12 },
      { key: 'varianceValue', label: 'Gi trị chênh lệch', format: 'currency', width: 15 },
    ],
    summaryFields: ['totalProducts', 'totalOpeningValue', 'totalInboundValue', 'totalOutboundValue', 'totalClosingValue'],
    metadata: {
      version: '1.0',
      lastUpdated: new Date(),
      createdBy: 'system',
    },
  },

  // Variance report export template
  variance_view_excel: {
    id: 'variance_view_excel',
    name: 'Báo cáo chênh lệch (Excel)',
    description: 'Báo cáo chênh lệch giữa tồn sổ và tồn thực',
    viewId: 'variance_view',
    format: 'excel',
    columns: [
      { key: 'productCode', label: 'Mã SP', format: 'text', width: 12 },
      { key: 'productName', label: 'Tên SP', format: 'text', width: 30 },
      { key: 'bookQuantity', label: 'Tồn sổ', format: 'number', width: 12 },
      { key: 'bookValue', label: 'Gi trị sổ', format: 'currency', width: 15 },
      { key: 'actualQuantity', label: 'Tồn thực', format: 'number', width: 12 },
      { key: 'actualValue', label: 'Gi trị thực', format: 'currency', width: 15 },
      { key: 'varianceQuantity', label: 'Chênh lệch', format: 'number', width: 12 },
      { key: 'varianceValue', label: 'Gi trị chênh lệch', format: 'currency', width: 15 },
      { key: 'variancePercentage', label: '% chênh lệch', format: 'percentage', width: 12 },
      { key: 'varianceNotes', label: 'Ghi chú', format: 'text', width: 25 },
      { key: 'lastStockCountDate', label: 'Ngày kiểm kê', format: 'date', width: 12 },
      { key: 'suggestedAction', label: 'Hành động đề xuất', format: 'text', width: 30 },
    ],
    summaryFields: ['totalProducts', 'matchedCount', 'varianceCount', 'totalVarianceValue'],
    metadata: {
      version: '1.0',
      lastUpdated: new Date(),
      createdBy: 'system',
    },
  },

  // Stock count sheet template
  stock_count_sheet_excel: {
    id: 'stock_count_sheet_excel',
    name: 'Phiếu kiểm kho (Excel)',
    description: 'Phiếu kiểm kho để in và điền',
    viewId: 'operational_ledger',
    format: 'excel',
    columns: [
      { key: 'productCode', label: 'Mã SP', format: 'text', width: 12 },
      { key: 'productName', label: 'Tên SP', format: 'text', width: 30 },
      { key: 'unit', label: 'ĐVT', format: 'text', width: 8 },
      { key: 'expectedQuantity', label: 'Tồn sổ', format: 'number', width: 12 },
      { key: 'countedQuantity', label: 'Tồn thực', format: 'number', width: 12 },
      { key: 'varianceQuantity', label: 'Chênh lệch', format: 'number', width: 12 },
      { key: 'notes', label: 'Ghi chú', format: 'text', width: 25 },
    ],
    summaryFields: ['totalProducts', 'totalExpected', 'totalCounted', 'totalVariance'],
    metadata: {
      version: '1.0',
      lastUpdated: new Date(),
      createdBy: 'system',
    },
  },
};

// Helper function to get template by view and format
export function getExportTemplate(viewId: string, format: 'excel' | 'pdf' | 'csv'): ExportTemplate | null {
  const templateId = `${viewId}_${format}`;
  return EXPORT_TEMPLATES[templateId] || null;
}

// Helper function to get all templates for a view
export function getViewTemplates(viewId: string): ExportTemplate[] {
  return Object.values(EXPORT_TEMPLATES).filter(t => t.viewId === viewId);
}

// Helper function to get all available templates
export function getAllExportTemplates(): ExportTemplate[] {
  return Object.values(EXPORT_TEMPLATES);
}
