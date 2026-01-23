// Sales Record types based on PRD Table 3 - Báo cáo bán hàng

export interface SalesRecord {
  id: string;
  productCode: string; // Mã SP (thành phẩm)
  outputDate: Date; // Ngày xuất
  quantitySold: number; // Số lượng bán
  notes?: string; // Ghi chú: xuất bán, xuất khuyến mãi, xuất cúng...
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Special outbound record based on PRD Table 3.1 - Xuất khác
export interface SpecialOutboundRecord {
  id: string;
  productCode: string; // Mã SP (thành phẩm)
  outputDate: Date; // Ngày xuất
  operationTime: Date; // Giờ thao tác
  
  // Người thao tác và duyệt
  requestedBy: string; // Người thao tác (người yêu cầu)
  approvedBy?: string; // Người duyệt (nếu có)
  approvedAt?: Date; // Thời gian duyệt
  
  quantity: number; // Số lượng
  reason: SpecialOutboundReason; // Lý do xuất
  status: ApprovalStatus; // Trạng thái
  
  notes?: string; // Ghi chú
  rejectionReason?: string; // Lý do từ chối (nếu có)
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export enum SpecialOutboundReason {
  WORSHIP = 'worship', // Xuất cúng
  COMPENSATION = 'compensation', // Xuất đền bù
  DISCREPANCY_ADJUSTMENT = 'discrepancy_adjustment', // Xử lý chênh lệch
  DAMAGE = 'damage', // Hư hỏng
  EXPIRED = 'expired', // Hết hạn
  SAMPLE = 'sample', // Mẫu thử
  PROMOTION = 'promotion', // Khuyến mãi
  OTHER = 'other', // Khác
}

export enum ApprovalStatus {
  PENDING = 'pending', // Đang chờ duyệt
  APPROVED = 'approved', // Đã duyệt
  REJECTED = 'rejected', // Từ chối
}

// Sales summary for reports
export interface SalesReportSummary {
  date: Date;
  totalSales: number;
  totalSpecialOutbound: number;
  totalRevenue?: number; // Optional if revenue tracking is needed
  productBreakdown: ProductSalesBreakdown[];
}

export interface ProductSalesBreakdown {
  productCode: string;
  productName: string;
  quantitySold: number;
  specialOutboundQuantity: number;
  totalOutput: number;
}

// Export data structure
export interface SalesExportData {
  period: {
    startDate: Date;
    endDate: Date;
  };
  salesRecords: SalesRecord[];
  specialOutboundRecords: SpecialOutboundRecord[];
  summary: SalesReportSummary[];
  exportedAt: Date;
  exportedBy: string;
}
