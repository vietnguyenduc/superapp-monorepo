// Product Catalog Types - Based on Real Excel Sample Data
// File: Quản Lý danh mục

export interface ProductCatalogItem {
  id?: string;
  productCode: string;        // Mã hàng - VD: "CF001", "TS002"
  productName: string;        // Tên hàng - VD: "Cà phê Sữa Ly", "Trà Sữa Trân Châu"
  unit: ProductUnit;          // Đơn vị - Ly, Cái, Phần, Suất
  price: number;              // Giá bán (VNĐ)
  category: ProductCategory;  // Loại sản phẩm
  notes?: string;             // Ghi chú
  isActive: boolean;          // Trạng thái hoạt động
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export type ProductUnit = 
  | 'Ly'          // Đồ uống
  | 'Cái'         // Bánh, snack
  | 'Phần'        // Món ăn
  | 'Suất'        // Set meal
  | 'Kg'          // Nguyên liệu
  | 'Gói'         // Đóng gói
  | 'Hộp'         // Đóng hộp
  | 'Chai'        // Nước uống
  | 'Lít'         // Chất lỏng
  | 'Gram';       // Nguyên liệu nhỏ

export type ProductCategory = 
  | 'Cà phê'              // Coffee drinks
  | 'Trà sữa'             // Milk tea
  | 'Nước ép'             // Fresh juice
  | 'Smoothie'            // Smoothies
  | 'Bánh ngọt'           // Desserts
  | 'Bánh mì'             // Sandwiches
  | 'Món ăn nhẹ'          // Light meals
  | 'Set combo'           // Combo meals
  | 'Nguyên liệu'         // Raw materials
  | 'Khác';               // Others

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
      'Ly', 'Cái', 'Phần', 'Suất', 'Kg', 
      'Gói', 'Hộp', 'Chai', 'Lít', 'Gram'
    ],
    validation: (value: string) => {
      if (!value) return 'Đơn vị không được để trống';
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
      'Cà phê', 'Trà sữa', 'Nước ép', 'Smoothie',
      'Bánh ngọt', 'Bánh mì', 'Món ăn nhẹ', 'Set combo',
      'Nguyên liệu', 'Khác'
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

// Sample data based on real Excel file
export const SAMPLE_PRODUCT_CATALOG: ProductCatalogItem[] = [
  {
    id: '1',
    productCode: 'CF001',
    productName: 'Cà phê Sữa Ly',
    unit: 'Ly',
    price: 25000,
    category: 'Cà phê',
    notes: 'Cà phê truyền thống với sữa đặc',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    productCode: 'TS001',
    productName: 'Trà Sữa Trân Châu',
    unit: 'Ly',
    price: 35000,
    category: 'Trà sữa',
    notes: 'Trà sữa với trân châu đen',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    productCode: 'BN001',
    productName: 'Bánh Croissant',
    unit: 'Cái',
    price: 15000,
    category: 'Bánh ngọt',
    notes: 'Bánh croissant bơ tươi',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    productCode: 'NE001',
    productName: 'Nước Ép Cam Tươi',
    unit: 'Ly',
    price: 30000,
    category: 'Nước ép',
    notes: 'Cam tươi vắt 100%',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    productCode: 'SM001',
    productName: 'Smoothie Xoài',
    unit: 'Ly',
    price: 40000,
    category: 'Smoothie',
    notes: 'Xoài tươi blend với sữa chua',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Validation helpers
export const validateProductCatalogItem = (item: Partial<ProductCatalogItem>): string[] => {
  const errors: string[] = [];
  
  PRODUCT_CATALOG_COLUMNS.forEach(column => {
    if (column.required && !item[column.key as keyof ProductCatalogItem]) {
      errors.push(`${column.label} không được để trống`);
    }
    
    if (column.validation && item[column.key as keyof ProductCatalogItem]) {
      const validationError = column.validation(item[column.key as keyof ProductCatalogItem] as any);
      if (validationError) {
        errors.push(validationError);
      }
    }
  });
  
  return errors;
};

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
