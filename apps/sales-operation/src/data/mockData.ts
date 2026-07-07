// Mock data for testing inventory-operation app
import { 
  Product, 
  ProductCategory,
  ProductStatus,
  InventoryRecord, 
  SalesRecord, 
  SpecialOutboundRecord,
  SpecialOutboundReason,
  SpecialOutboundApprovalStatus,
  InventoryVarianceReport 
} from '../types';

// Mock Products - Dựa trên Excel sample
export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    businessCode: 'TC0001',
    name: 'Bưởi',
    category: ProductCategory.FRUIT,
    inputUnit: 'trái',
    outputUnit: 'đĩa',
    inputQuantity: 1,
    outputQuantity: 0.5,
    isFinishedProduct: false,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    finishedProductCode: 'TC0001',
    createdAt: new Date('2025-08-02T00:00:00Z'),
    updatedAt: new Date('2025-08-02T00:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-002',
    businessCode: 'TC0002',
    name: 'Cam',
    category: ProductCategory.FRUIT,
    inputUnit: 'trái',
    outputUnit: 'đĩa',
    inputQuantity: 8,
    outputQuantity: 40,
    isFinishedProduct: false,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    finishedProductCode: 'TC0002',
    createdAt: new Date('2025-08-02T00:00:00Z'),
    updatedAt: new Date('2025-08-02T00:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-003',
    businessCode: 'TC0002',
    name: 'Cam',
    category: ProductCategory.FRUIT,
    inputUnit: 'trái',
    outputUnit: 'đĩa',
    inputQuantity: 8,
    outputQuantity: 8,
    isFinishedProduct: false,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    finishedProductCode: 'TC0002',
    createdAt: new Date('2025-08-02T00:00:00Z'),
    updatedAt: new Date('2025-08-02T00:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-004',
    businessCode: 'TC0002',
    name: 'Cam',
    category: ProductCategory.FRUIT,
    inputUnit: 'trái',
    outputUnit: 'đĩa',
    inputQuantity: 6,
    outputQuantity: 3,
    isFinishedProduct: false,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    finishedProductCode: 'TC0020',
    createdAt: new Date('2025-08-02T00:00:00Z'),
    updatedAt: new Date('2025-08-02T00:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-005',
    businessCode: 'TC0004',
    name: 'Dưa hấu',
    category: ProductCategory.FRUIT,
    inputUnit: 'trái',
    outputUnit: 'đĩa',
    inputQuantity: 48,
    outputQuantity: 48,
    isFinishedProduct: false,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    finishedProductCode: 'TC0004',
    createdAt: new Date('2025-08-02T00:00:00Z'),
    updatedAt: new Date('2025-08-02T00:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-006',
    businessCode: 'TC0004',
    name: 'Dưa hấu',
    category: ProductCategory.FRUIT,
    inputUnit: 'trái',
    outputUnit: 'đĩa',
    inputQuantity: 48,
    outputQuantity: 8,
    isFinishedProduct: false,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    finishedProductCode: 'TC0004',
    createdAt: new Date('2025-08-02T00:00:00Z'),
    updatedAt: new Date('2025-08-02T00:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-007',
    businessCode: 'TC0004',
    name: 'Dưa hấu',
    category: ProductCategory.FRUIT,
    inputUnit: 'trái',
    outputUnit: 'đĩa',
    inputQuantity: 48,
    outputQuantity: 14,
    isFinishedProduct: false,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    finishedProductCode: 'TC0020',
    createdAt: new Date('2025-08-02T00:00:00Z'),
    updatedAt: new Date('2025-08-02T00:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-008',
    businessCode: 'TC0005',
    name: 'Nho',
    category: ProductCategory.FRUIT,
    inputUnit: 'gram',
    outputUnit: 'đĩa',
    inputQuantity: 1000,
    outputQuantity: 400,
    isFinishedProduct: false,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    finishedProductCode: 'TC0005',
    createdAt: new Date('2025-08-02T00:00:00Z'),
    updatedAt: new Date('2025-08-02T00:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-009',
    businessCode: 'TC0005',
    name: 'Nho',
    category: ProductCategory.FRUIT,
    inputUnit: 'gram',
    outputUnit: 'đĩa',
    inputQuantity: 1000,
    outputQuantity: 100,
    isFinishedProduct: false,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    finishedProductCode: 'TC0005',
    createdAt: new Date('2025-08-02T00:00:00Z'),
    updatedAt: new Date('2025-08-02T00:00:00Z'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

// Mock Inventory Records
export const mockInventoryRecords: InventoryRecord[] = [
  {
    id: 'inv-001',
    date: new Date('2024-01-20'),
    productCode: 'SP001',
    productName: 'Cà phê Arabica',
    inputQuantity: 50,
    rawMaterialStock: 45,
    rawMaterialUnit: 'kg',
    processedStock: 0,
    processedUnit: 'kg',
    finishedProductStock: 4500,
    finishedProductUnit: 'ly',
    createdAt: new Date('2024-01-20T00:00:00Z'),
    updatedAt: new Date('2024-01-20T00:00:00Z'),
    createdBy: 'staff-001',
    updatedBy: 'staff-001',
    notes: 'Nhập kho đầu tuần'
  },
  {
    id: 'inv-002',
    date: new Date('2024-01-21'),
    productCode: 'SP002',
    productName: 'Bánh mì sandwich',
    inputQuantity: 100,
    rawMaterialStock: 0,
    rawMaterialUnit: 'cái',
    processedStock: 0,
    processedUnit: 'cái',
    finishedProductStock: 95,
    finishedProductUnit: 'phần',
    createdAt: new Date('2024-01-21T00:00:00Z'),
    updatedAt: new Date('2024-01-21T00:00:00Z'),
    createdBy: 'staff-002',
    updatedBy: 'staff-002',
    notes: 'Bánh mì làm sẵn'
  }
];
export const mockSalesRecords: SalesRecord[] = [
  {
    id: 'sale-001',
    productCode: 'TC0001',
    outputDate: new Date('2024-01-15T00:00:00Z'),
    quantitySold: 150,
    notes: 'Bán hàng và khuyến mãi',
    createdAt: new Date('2024-01-15T18:00:00Z'),
    updatedAt: new Date('2024-01-15T18:00:00Z'),
    createdBy: 'staff-001',
    updatedBy: 'staff-001'
  },
  {
    id: 'sale-002',
    productCode: 'TC0002',
    outputDate: new Date('2024-01-20T00:00:00Z'),
    quantitySold: 80,
    notes: 'Bán hàng và khuyến mãi',
    createdAt: new Date('2024-01-20T18:00:00Z'),
    updatedAt: new Date('2024-01-20T18:00:00Z'),
    createdBy: 'staff-002',
    updatedBy: 'staff-002'
  },
  {
    id: 'sale-003',
    productCode: 'TC0001',
    outputDate: new Date('2024-01-21T00:00:00Z'),
    quantitySold: 200,
    notes: 'Cuối tuần đông khách',
    createdAt: new Date('2024-01-21T18:00:00Z'),
    updatedAt: new Date('2024-01-21T18:00:00Z'),
    createdBy: 'staff-001',
    updatedBy: 'staff-001'
  }
];

// Mock Special Outbound Records
export const mockSpecialOutboundRecords: SpecialOutboundRecord[] = [
  {
    id: 'special-001',
    productCode: 'TC0001',
    outputDate: new Date('2024-01-15T00:00:00Z'),
    operationTime: new Date('2024-01-15T09:00:00Z'),
    quantity: 10,
    reason: SpecialOutboundReason.WORSHIP,
    notes: 'Xuất cúng đầu tháng',
    requestedBy: 'staff-001',
    approvedBy: 'manager',
    approvedAt: new Date('2024-01-15T10:00:00Z'),
    status: SpecialOutboundApprovalStatus.APPROVED,
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: 'special-002',
    productCode: 'TC0004',
    outputDate: new Date('2024-01-16T00:00:00Z'),
    operationTime: new Date('2024-01-16T09:00:00Z'),
    quantity: 5,
    reason: SpecialOutboundReason.COMPENSATION,
    notes: 'Đền bù cho khách hàng VIP',
    requestedBy: 'staff-002',
    approvedBy: 'manager',
    approvedAt: new Date('2024-01-16T10:00:00Z'),
    status: SpecialOutboundApprovalStatus.APPROVED,
    createdAt: new Date('2024-01-16T09:00:00Z'),
    updatedAt: new Date('2024-01-16T10:00:00Z')
  }
];

// Mock User Data
export const mockUsers = [
  {
    id: 'user-001',
    name: 'Nguyễn Văn A',
    role: 'staff',
    email: 'staff1@example.com'
  },
  {
    id: 'user-002',
    name: 'Trần Thị B',
    role: 'manager',
    email: 'manager1@example.com'
  },
  {
    id: 'user-003',
    name: 'Lê Văn C',
    role: 'admin',
    email: 'admin@example.com'
  }
];

// Mock Inventory Variance Reports
export const mockInventoryVarianceReports: InventoryVarianceReport[] = [
  {
    id: 'var-001',
    date: '2024-01-20',
    product_id: 'TC0001',
    beginning_inventory: 4000,
    inbound_quantity: 5000,
    sales_quantity: 150,
    promotion_quantity: 20,
    special_outbound_quantity: 0,
    book_inventory: 8830,
    actual_inventory: 8500,
    variance: -330,
    variance_percentage: -3.74,
    unit: 'ly',
    notes: 'Chênh lệch nhỏ, có thể do sai số đo lường',
    created_by: 'staff-001',
    updated_by: 'staff-001',
    created_at: '2024-01-20T18:00:00Z',
    updated_at: '2024-01-20T18:00:00Z'
  },
  {
    id: 'var-002',
    date: '2024-01-21',
    product_id: 'TC0002',
    beginning_inventory: 95,
    inbound_quantity: 100,
    sales_quantity: 80,
    promotion_quantity: 5,
    special_outbound_quantity: 0,
    book_inventory: 110,
    actual_inventory: 95,
    variance: -15,
    variance_percentage: -13.64,
    unit: 'phần',
    notes: 'Chênh lệch cao - cần kiểm tra lại quy trình',
    created_by: 'staff-002',
    updated_by: 'staff-002',
    created_at: '2024-01-21T19:00:00Z',
    updated_at: '2024-01-21T19:00:00Z'
  }
];

// Export all mock data
export const mockData = {
  products: mockProducts,
  inventoryRecords: mockInventoryRecords,
  salesRecords: mockSalesRecords,
  specialOutboundRecords: mockSpecialOutboundRecords,
  inventoryVarianceReports: mockInventoryVarianceReports,
  users: mockUsers
};

export default mockData;
