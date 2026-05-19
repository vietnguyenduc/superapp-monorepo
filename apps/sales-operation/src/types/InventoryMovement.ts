// Canonical Inventory Model - Movement + Balance based
// Phase 5: Inventory data model redesign

export enum MovementType {
  INBOUND = 'inbound', // Nhập kho
  OUTBOUND = 'outbound', // Xuất kho
  ADJUSTMENT = 'adjustment', // Điều chỉnh
  STOCK_COUNT = 'stock_count', // Kiểm kê
}

export enum MovementSource {
  PURCHASE = 'purchase', // Mua hàng
  SALES = 'sales', // Bán hàng
  TRANSFER = 'transfer', // Chuyển kho
  PRODUCTION = 'production', // Sản xuất
  STOCK_COUNT = 'stock_count', // Kiểm kê
  ADJUSTMENT = 'adjustment', // Điều chỉnh thủ công
  RETURN = 'return', // Trả hàng
}

export enum MovementRole {
  WAREHOUSE_KEEPER = 'warehouse_keeper', // Thủ kho
  ACCOUNTANT = 'accountant', // Kế toán kho
  MANAGER = 'manager', // Quản lý
  SYSTEM = 'system', // Tự động
}

// Movement record - core entity for inventory tracking
export interface InventoryMovement {
  id: string;
  companyId: string;
  productId: string;
  productCode: string;
  productName: string;
  
  // Movement dimensions
  movementType: MovementType;
  source: MovementSource;
  roleOwner: MovementRole;
  
  // Quantity and value
  quantity: number;
  unit: string;
  unitCost?: number; // Chi phí đơn vị (nếu có)
  totalValue?: number; // Tổng giá trị = quantity * unitCost
  
  // Balance tracking
  runningBalance: number; // Số dư sau movement này
  runningValue?: number; // Gi trị số dư sau movement này
  
  // For F&B: distinguish between book and actual
  isBookEntry: boolean; // Xuất sổ (từ bán hàng/business records)
  isActualEntry: boolean; // Xuất thực (từ kiểm kê/đếm vật lý)
  
  // Reference to related documents
  referenceId?: string; // ID của transaction/đơn hàng liên quan
  referenceType?: string; // Loại reference (sale, purchase, stock_count, etc.)
  
  // Timestamps
  movementDate: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  notes?: string;
}

// Balance snapshot - periodic balance records
export interface InventoryBalanceSnapshot {
  id: string;
  companyId: string;
  productId: string;
  productCode: string;
  productName: string;
  
  // Period
  periodStart: Date;
  periodEnd: Date;
  
  // Opening balance
  openingQuantity: number;
  openingUnit: string;
  openingValue?: number;
  
  // Inbound in period
  inboundQuantity: number;
  inboundUnit: string;
  inboundValue?: number;
  
  // Outbound in period
  outboundQuantity: number;
  outboundUnit: string;
  outboundValue?: number;
  
  // Closing balance
  closingQuantity: number;
  closingUnit: string;
  closingValue?: number;
  
  // Variance (if reconciled with stock count)
  stockCountQuantity?: number;
  varianceQuantity?: number;
  varianceNotes?: string;
  
  // Status
  status: BalanceStatus;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export enum BalanceStatus {
  DRAFT = 'draft',
  RECONCILED = 'reconciled',
  APPROVED = 'approved',
}

// Stock count entry - physical counting records
export interface StockCountEntry {
  id: string;
  companyId: string;
  productId: string;
  productCode: string;
  productName: string;
  
  // Count data
  countedQuantity: number;
  countedUnit: string;
  
  // Expected (book) quantity
  expectedQuantity: number;
  expectedUnit: string;
  
  // Variance
  varianceQuantity: number;
  varianceUnit: string;
  varianceValue?: number;
  
  // Count metadata
  countDate: Date;
  countedBy: string;
  reviewedBy?: string;
  
  // Status
  status: StockCountStatus;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export enum StockCountStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
}

// Role-based view configurations
export interface InventoryViewConfig {
  viewId: string;
  viewName: string;
  description: string;
  allowedRoles: string[];
  columns: ViewColumn[];
  filters?: ViewFilter[];
  defaultSort?: string;
}

export interface ViewColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  visible: boolean;
  order: number;
  width?: string;
}

export interface ViewFilter {
  key: string;
  label: string;
  type: 'select' | 'date-range' | 'text';
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

// Predefined view configurations for different roles
export const INVENTORY_VIEWS: Record<string, InventoryViewConfig> = {
  // View A: Operational ledger (Thủ kho/Kế toán kho)
  operational_ledger: {
    viewId: 'operational_ledger',
    viewName: 'Sổ giao dịch vận hành',
    description: 'Dành cho Thủ kho/Kế toán kho - xem chi tiết từng movement',
    allowedRoles: ['warehouse_keeper', 'accountant', 'admin'],
    columns: [
      { key: 'movementDate', label: 'Ngày', type: 'date', visible: true, order: 1 },
      { key: 'movementType', label: 'Loại giao dịch', type: 'text', visible: true, order: 2 },
      { key: 'source', label: 'Nguồn', type: 'text', visible: true, order: 3 },
      { key: 'productCode', label: 'Mã SP', type: 'text', visible: true, order: 4 },
      { key: 'productName', label: 'Tên SP', type: 'text', visible: true, order: 5 },
      { key: 'quantity', label: 'Số lượng', type: 'number', visible: true, order: 6 },
      { key: 'unit', label: 'ĐVT', type: 'text', visible: true, order: 7 },
      { key: 'runningBalance', label: 'Số dư sau', type: 'number', visible: true, order: 8 },
      { key: 'roleOwner', label: 'Người tạo', type: 'text', visible: true, order: 9 },
      { key: 'referenceId', label: 'Tham chiếu', type: 'text', visible: false, order: 10 },
    ],
    defaultSort: 'movementDate',
  },
  
  // View B: Accounting summary (Kế toán)
  accounting_summary: {
    viewId: 'accounting_summary',
    viewName: 'Báo cáo XNT tổng hợp',
    description: 'Dành cho Kế toán - xem tổng hợp theo kỳ',
    allowedRoles: ['accountant', 'admin'],
    columns: [
      { key: 'productCode', label: 'Mã SP', type: 'text', visible: true, order: 1 },
      { key: 'productName', label: 'Tên SP', type: 'text', visible: true, order: 2 },
      { key: 'openingQuantity', label: 'Tồn đầu kỳ', type: 'number', visible: true, order: 3 },
      { key: 'openingValue', label: 'Gi trị đầu kỳ', type: 'currency', visible: true, order: 4 },
      { key: 'inboundQuantity', label: 'Nhập kỳ', type: 'number', visible: true, order: 5 },
      { key: 'inboundValue', label: 'Gi trị nhập', type: 'currency', visible: true, order: 6 },
      { key: 'outboundQuantity', label: 'Xuất kỳ', type: 'number', visible: true, order: 7 },
      { key: 'outboundValue', label: 'Gi trị xuất', type: 'currency', visible: true, order: 8 },
      { key: 'closingQuantity', label: 'Tồn cuối kỳ', type: 'number', visible: true, order: 9 },
      { key: 'closingValue', label: 'Gi trị cuối kỳ', type: 'currency', visible: true, order: 10 },
      { key: 'varianceQuantity', label: 'Chênh lệch', type: 'number', visible: false, order: 11 },
    ],
    defaultSort: 'productCode',
  },
  
  // View C: Variance/reconciliation (Admin)
  variance_view: {
    viewId: 'variance_view',
    viewName: 'Báo cáo chênh lệch',
    description: 'Dành cho Admin - xem chênh lệch giữa tồn sổ và tồn thực',
    allowedRoles: ['admin'],
    columns: [
      { key: 'productCode', label: 'Mã SP', type: 'text', visible: true, order: 1 },
      { key: 'productName', label: 'Tên SP', type: 'text', visible: true, order: 2 },
      { key: 'bookQuantity', label: 'Tồn sổ', type: 'number', visible: true, order: 3 },
      { key: 'actualQuantity', label: 'Tồn thực', type: 'number', visible: true, order: 4 },
      { key: 'varianceQuantity', label: 'Chênh lệch', type: 'number', visible: true, order: 5 },
      { key: 'varianceValue', label: 'Gi trị chênh lệch', type: 'currency', visible: true, order: 6 },
      { key: 'varianceNotes', label: 'Ghi chú', type: 'text', visible: true, order: 7 },
      { key: 'lastStockCountDate', label: 'Ngày kiểm kê', type: 'date', visible: true, order: 8 },
    ],
    defaultSort: 'varianceQuantity',
  },
};
