// Product Catalog Types - Based on Real Excel Sample Data
// File: Quản Lý danh mục

export interface ProductCatalogItem {
  id?: string;
  productCode: string;        // Mã hàng - VD: "CF001", "TS002"
  productName: string;        // Tên hàng - VD: "Cà phê Sữa Ly", "Trà Sữa Trân Châu"
  unit: ProductUnit;          // Đơn vị - Ly, Cái, Phần, Suất
  price: number;              // Giá bán (VNĐ)
  category: ProductCategory;  // Loại sản phẩm
  
  // Thông tin quản lý tồn kho - CỰC KỲ QUAN TRỌNG
  outputQuantity?: number;    // Định lượng Xuất (số miếng để tạo 1 thành phẩm)
  inputQuantity?: number;     // Định lượng Nhập (1 quả → 8 miếng)
  inputPrice?: number;        // Đơn giá nhập (VNĐ)
  outputPrice?: number;       // Đơn giá xuất (VNĐ)
  minStockLevel?: number;     // Mức tồn kho tối thiểu
  maxStockLevel?: number;     // Mức tồn kho tối đa
  currentStock?: number;      // Tồn kho hiện tại
  
  // Thông tin nhà cung cấp và định danh
  supplier?: string;             // Nhà cung cấp
  barcode?: string;              // Mã vạch/SKU
  sku?: string;                  // Stock Keeping Unit
  
  // Thông tin bổ sung
  description?: string;          // Mô tả chi tiết sản phẩm
  storageCondition?: string;     // Điều kiện bảo quản
  expiryDays?: number;          // Số ngày hết hạn (nếu có)
  
  notes?: string;               // Ghi chú
  isActive: boolean;            // Trạng thái hoạt động
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export enum ProductUnit {
  PIECE = 'Cái',
  CUP = 'Ly',
  PACK = 'Gói',
  BOX = 'Hộp',
  BOTTLE = 'Chai',
  KG = 'Kg',
  GRAM = 'Gram',
  LITER = 'Lít',
  PORTION = 'Phần',
  LOAF = 'Ổ',
  SET = 'Set'
}

export enum ProductCategory {
  RAW_MATERIAL = 'Nguyên liệu',
  BEVERAGE = 'Đồ uống',
  FOOD = 'Thức ăn',
  COFFEE = 'Cà phê',
  TEA = 'Trà sữa',
  JUICE = 'Nước ép',
  SMOOTHIE = 'Smoothie',
  PASTRY = 'Bánh ngọt',
  BREAD = 'Bánh mì',
  COMBO = 'Combo',
  SNACK = 'Snack',
  OTHER = 'Khác'
}

// Column definitions for EditableDataGrid
export const PRODUCT_CATALOG_COLUMNS = [
  {
    key: 'productCode',
    label: 'Mã hàng',
    required: true,
    type: 'text' as const,
    validation: (value: string) => {
      if (!value) return 'Mã hàng không được để trống';
      if (value.length < 2) return 'Mã hàng phải có ít nhất 2 ký tự';
      if (value.length > 20) return 'Mã hàng không được quá 20 ký tự';
      return null;
    }
  },
  {
    key: 'productName',
    label: 'Tên hàng',
    required: true,
    type: 'text' as const,
    validation: (value: string) => {
      if (!value) return 'Tên hàng không được để trống';
      if (value.length < 2) return 'Tên hàng phải có ít nhất 2 ký tự';
      if (value.length > 100) return 'Tên hàng không được quá 100 ký tự';
      return null;
    }
  },
  {
    key: 'unit',
    label: 'Đơn vị',
    required: true,
    type: 'select' as const,
    options: [
      ProductUnit.PIECE,
      ProductUnit.CUP,
      ProductUnit.PACK,
      ProductUnit.BOX,
      ProductUnit.BOTTLE,
      ProductUnit.KG,
      ProductUnit.GRAM,
      ProductUnit.LITER,
      ProductUnit.PORTION,
      ProductUnit.LOAF,
      ProductUnit.SET
    ],
    validation: (value: string) => {
      if (!value) return 'Đơn vị không được để trống';
      return null;
    }
  },
  {
    key: 'outputQuantity',
    label: 'Định lượng Xuất',
    required: true,
    type: 'number' as const,
    validation: (value: number) => {
      if (value === undefined || value === null) return 'Định lượng Xuất không được để trống';
      if (value < 0) return 'Định lượng Xuất không được âm';
      return null;
    }
  },
  {
    key: 'inputQuantity',
    label: 'Định lượng Nhập',
    required: true,
    type: 'number' as const,
    validation: (value: number) => {
      if (value === undefined || value === null) return 'Định lượng Nhập không được để trống';
      if (value < 0) return 'Định lượng Nhập không được âm';
      return null;
    }
  },
  {
    key: 'price',
    label: 'Giá bán (VNĐ)',
    required: true,
    type: 'number' as const,
    validation: (value: number) => {
      if (!value && value !== 0) return 'Giá bán không được để trống';
      if (value < 0) return 'Giá bán không được âm';
      if (value > 10000000) return 'Giá bán không được quá 10 triệu';
      return null;
    }
  },
  {
    key: 'category',
    label: 'Loại sản phẩm',
    required: true,
    type: 'select' as const,
    options: [
      ProductCategory.RAW_MATERIAL,
      ProductCategory.BEVERAGE,
      ProductCategory.FOOD,
      ProductCategory.COFFEE,
      ProductCategory.TEA,
      ProductCategory.JUICE,
      ProductCategory.SMOOTHIE,
      ProductCategory.PASTRY,
      ProductCategory.BREAD,
      ProductCategory.COMBO,
      ProductCategory.SNACK,
      ProductCategory.OTHER
    ],
    validation: (value: string) => {
      if (!value) return 'Loại sản phẩm không được để trống';
      return null;
    }
  },
  {
    key: 'notes',
    label: 'Ghi chú',
    required: false,
    type: 'text' as const,
    validation: (value: string) => {
      if (value && value.length > 500) return 'Ghi chú không được quá 500 ký tự';
      return null;
    }
  }
];

// SAMPLE DATA - Import từ Excel định mức
export const SAMPLE_PRODUCT_CATALOG: ProductCatalogItem[] = [
  {
    id: 'NVL-TC0001',
    productCode: 'NVL-TC0001',
    productName: 'Cam',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 0.5,
    inputQuantity: 0.1,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 1,
    supplier: '',
    barcode: 'TC0001',
    sku: '',
    description: 'Đĩa cam, đĩa trái cây...',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0002',
    productCode: 'NVL-TC0002',
    productName: 'Cam',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 40,
    inputQuantity: 8,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 8,
    supplier: '',
    barcode: 'TC0002',
    sku: '',
    description: 'Đĩa cam',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0002-2',
    productCode: 'NVL-TC0002',
    productName: 'Cam',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 3,
    inputQuantity: 1,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 6,
    supplier: '',
    barcode: 'TC0002',
    sku: '',
    description: 'Đĩa trái cây',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0004',
    productCode: 'NVL-TC0004',
    productName: 'Dưa hấu',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 48,
    inputQuantity: 6,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 48,
    supplier: '',
    barcode: 'TC0004',
    sku: '',
    description: 'Đĩa dưa hấu',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0004-2',
    productCode: 'NVL-TC0004',
    productName: 'Dưa hấu',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 8,
    inputQuantity: 1,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 48,
    supplier: '',
    barcode: 'TC0004',
    sku: '',
    description: 'Đĩa trái cây',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0004-3',
    productCode: 'NVL-TC0004',
    productName: 'Dưa hấu',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 14,
    inputQuantity: 2,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 48,
    supplier: '',
    barcode: 'TC0020',
    sku: '',
    description: 'Đĩa trái cây combo',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0005',
    productCode: 'NVL-TC0005',
    productName: 'Nho',
    unit: ProductUnit.GRAM,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 400,
    inputQuantity: 100,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 1000,
    supplier: '',
    barcode: 'TC0005',
    sku: '',
    description: 'Đĩa nho',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0005-2',
    productCode: 'NVL-TC0005',
    productName: 'Nho',
    unit: ProductUnit.GRAM,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 100,
    inputQuantity: 20,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 2000,
    supplier: '',
    barcode: 'TC0005',
    sku: '',
    description: 'Đĩa trái cây',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0006',
    productCode: 'NVL-TC0006',
    productName: 'Ổi',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 49,
    inputQuantity: 7,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 6,
    supplier: '',
    barcode: 'TC0006',
    sku: '',
    description: 'Đĩa ổi',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0006-2',
    productCode: 'NVL-TC0006',
    productName: 'Ổi',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 8,
    inputQuantity: 1,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 6,
    supplier: '',
    barcode: 'TC0006',
    sku: '',
    description: 'Đĩa trái cây',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0006-3',
    productCode: 'NVL-TC0006',
    productName: 'Ổi',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 8,
    inputQuantity: 1,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 6,
    supplier: '',
    barcode: 'TC0020',
    sku: '',
    description: 'Đĩa trái cây combo',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0007',
    productCode: 'NVL-TC0007',
    productName: 'Táo',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 40,
    inputQuantity: 8,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 8,
    supplier: '',
    barcode: 'TC0007',
    sku: '',
    description: 'Đĩa táo',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0007-2',
    productCode: 'NVL-TC0007',
    productName: 'Táo',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 8,
    inputQuantity: 1,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 8,
    supplier: '',
    barcode: 'TC0007',
    sku: '',
    description: 'Đĩa trái cây',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0007-3',
    productCode: 'NVL-TC0007',
    productName: 'Táo',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 3,
    inputQuantity: 1,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 8,
    supplier: '',
    barcode: 'TC0020',
    sku: '',
    description: 'Đĩa trái cây combo',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0008',
    productCode: 'NVL-TC0008',
    productName: 'Xoài',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 48,
    inputQuantity: 6,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 16,
    supplier: '',
    barcode: 'TC0008',
    sku: '',
    description: 'Đĩa xoài',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0008-2',
    productCode: 'NVL-TC0008',
    productName: 'Xoài',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 14,
    inputQuantity: 2,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 16,
    supplier: '',
    barcode: 'TC0008',
    sku: '',
    description: 'Đĩa trái cây',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'NVL-TC0008-3',
    productCode: 'NVL-TC0008',
    productName: 'Xoài',
    unit: ProductUnit.PIECE,
    price: 0,
    category: ProductCategory.RAW_MATERIAL,
    outputQuantity: 18,
    inputQuantity: 3,
    inputPrice: 0,
    outputPrice: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 16,
    supplier: '',
    barcode: 'TC0020',
    sku: '',
    description: 'Đĩa trái cây combo',
    storageCondition: '',
    expiryDays: 0,
    notes: '',
    isActive: true,
    createdAt: new Date('2025-08-02'),
    updatedAt: new Date('2025-08-02')
  },
  {
    id: 'TP004',
    productCode: 'TP-004',
    productName: 'Trà xanh đá',
    unit: ProductUnit.CUP,
    price: 18000,
    category: ProductCategory.TEA,
    outputQuantity: 1,
    inputQuantity: 1,
    inputPrice: 8000,
    outputPrice: 18000,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 0,
    supplier: 'Tự sản xuất',
    barcode: '8934673104234',
    sku: 'TEA-GREEN-ICE-004',
    description: 'Trà xanh pha lạnh',
    storageCondition: 'Phục vụ ngay',
    expiryDays: 0,
    notes: 'Trà xanh pha lạnh',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'TP005',
    productCode: 'TP-005',
    productName: 'Bánh mì thịt nướng',
    unit: ProductUnit.LOAF,
    price: 25000,
    category: ProductCategory.FOOD,
    outputQuantity: 1,
    inputQuantity: 1,
    inputPrice: 15000,
    outputPrice: 25000,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 0,
    supplier: 'Tự sản xuất',
    barcode: '8934673105234',
    sku: 'BREAD-GRILLED-PORK-005',
    description: 'Bánh mì Việt Nam với thịt nướng',
    storageCondition: 'Phục vụ ngay',
    expiryDays: 0,
    notes: 'Bánh mì Việt Nam với thịt nướng',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'TP006',
    productCode: 'TP-006',
    productName: 'Bánh croissant',
    unit: ProductUnit.PIECE,
    price: 30000,
    category: ProductCategory.PASTRY,
    outputQuantity: 1,
    inputQuantity: 1,
    inputPrice: 18000,
    outputPrice: 30000,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 0,
    supplier: 'Tự sản xuất',
    barcode: '8934673106234',
    sku: 'PASTRY-CROISSANT-006',
    description: 'Bánh croissant bơ Pháp',
    storageCondition: 'Phục vụ ngay',
    expiryDays: 0,
    notes: 'Bánh croissant bơ Pháp',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'CB001',
    productCode: 'CB-001',
    productName: 'Combo sáng',
    unit: ProductUnit.SET,
    price: 55000,
    category: ProductCategory.COMBO,
    outputQuantity: 1,
    inputQuantity: 1,
    inputPrice: 35000,
    outputPrice: 55000,
    minStockLevel: 0,
    maxStockLevel: 0,
    currentStock: 0,
    supplier: 'Tự sản xuất',
    barcode: '8934673201234',
    sku: 'COMBO-MORNING-001',
    description: 'Cà phê sữa + Bánh mì + Trứng ốp la',
    storageCondition: 'Phục vụ ngay',
    expiryDays: 0,
    notes: 'Cà phê sữa + Bánh mì + Trứng ốp la',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Format helpers
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

export const formatProductForDisplay = (item: ProductCatalogItem): string => {
  return `${item.productCode} - ${item.productName} (${formatPrice(item.price)}/${item.unit})`;
};
