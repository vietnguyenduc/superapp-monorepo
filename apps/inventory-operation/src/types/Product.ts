// Product/Material types based on PRD Table 2 - Danh mục hàng hóa

export interface Product {
  id: string;
  updatedAt: Date;
  category: ProductCategory;
  businessCode: string; // Mã SP KD
  promotionCode?: string; // Mã SP KM
  name: string;
  isFinishedProduct: boolean; // Thành phẩm?
  
  // Định mức quy đổi
  outputQuantity: number; // Định lượng Xuất (số miếng để tạo 1 thành phẩm)
  inputQuantity: number; // Định lượng Nhập (1 quả → 8 miếng)
  
  finishedProductCode?: string; // Mã Thành phẩm
  inputUnit: string; // ĐVT Nhập
  outputUnit: string; // ĐVT Xuất
  
  status: ProductStatus;
  businessStatus: 'active' | 'inactive'; // Trạng thái kinh doanh
  
  // Advanced conversions
  conversions?: ProductConversion[];
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedBy: string;
}

export enum ProductCategory {
  FRUIT = 'fruit', // Trái cây
  DRY_GOODS = 'dry_goods', // Đồ khô
  PROCESSED = 'processed', // Sơ chế
  FINISHED = 'finished', // Thành phẩm
  BEVERAGE = 'beverage', // Đồ uống
  TOBACCO = 'tobacco', // Thuốc lá
  OTHER = 'other', // Khác
}

export enum ProductStatus {
  ACTIVE = 'active', // Đang bán
  INACTIVE = 'inactive', // Ngừng bán
}

export enum BusinessStatus {
  ACTIVE = 'active', // Đang kinh doanh
  INACTIVE = 'inactive', // Ngừng kinh doanh
}

// Conversion rates between different product forms
export interface ProductConversion {
  productId: string;
  fromUnit: string;
  toUnit: string;
  conversionRate: number;
  description?: string;
}

// Product with conversion details for display
export interface ProductWithConversions extends Product {
  conversions: ProductConversion[];
}
