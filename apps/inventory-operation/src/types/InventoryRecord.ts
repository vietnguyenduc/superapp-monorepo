// Inventory Record types based on PRD Table 1 - Nhập liệu tồn kho

export interface InventoryRecord {
  id: string;
  date: Date;
  productCode: string; // Mã món
  productName: string; // Tên hàng
  
  // Nhập kho
  inputQuantity: number; // Nhập
  
  // Tồn thực theo các dạng khác nhau
  rawMaterialStock: number; // Tồn thực NVL (quả, cây, con)
  rawMaterialUnit: string; // ĐVT NVL
  
  processedStock: number; // Tồn thực sơ chế (miếng, lát)
  processedUnit: string; // ĐVT sơ chế
  
  finishedProductStock: number; // Tồn thực thành phẩm
  finishedProductUnit: string; // ĐVT thành phẩm (đĩa, hộp)
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  notes?: string;
}

// Aggregated inventory data for reports
export interface InventoryReport {
  id: string;
  date: Date;
  productCode: string;
  productName: string;
  
  // Tồn đầu kỳ
  openingStock: number;
  
  // Nhập kỳ
  inputQuantity: number;
  inputUnit: string;
  
  // Tồn thực các dạng
  rawMaterialStock: number;
  processedStock: number;
  finishedProductStock: number;
  
  // Tổng tồn thực tế
  totalActualStock: number;
  
  // Tổng xuất thực tế = Tồn đầu + Nhập - Tổng tồn thực
  totalActualOutput: number;
  
  // Tổng xuất sổ (từ bán hàng + xuất khác)
  totalBookOutput: number;
  
  // Tổng tồn sổ = Tồn đầu + Nhập - Xuất sổ
  totalBookStock: number;
  
  // Chênh lệch = Tổng tồn thực - Tồn sổ
  discrepancy: number;
  
  // Ghi chú lệch
  discrepancyNotes?: string;
  
  // Status
  status: InventoryReportStatus;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum InventoryReportStatus {
  DRAFT = 'draft',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  DISCREPANCY_FOUND = 'discrepancy_found',
}

// Stock check print data
export interface StockCheckPrint {
  id: string;
  printDate: Date;
  type: StockCheckType;
  data: InventoryRecord[] | InventoryDiscrepancy[];
  printedBy: string;
  notes?: string;
}

export enum StockCheckType {
  OVERVIEW = 'overview', // Bảng 5.1 - Tổng quan tồn kho
  DISCREPANCY = 'discrepancy', // Bảng 5.2 - Lệch kiểm kho
}

// Discrepancy data for print
export interface InventoryDiscrepancy {
  productCode: string;
  productName: string;
  detailedUnit: string; // Đơn vị chi tiết nhất (miếng)
  actualStock: number; // Tồn thực
  bookStock: number; // Tồn sổ
  detailedDiscrepancy: number; // Chênh lệch (chi tiết)
  convertedDiscrepancy: number; // Chênh lệch quy đổi (quả)
}
