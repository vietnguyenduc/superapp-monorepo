// Product/Material types based on PRD Table 2 - Danh mục hàng hóa

export interface Product {
  id: string;
  updatedAt: Date;
  category: ProductCategory;
  businessCode: string; // Mã SP KD
  promotionCode?: string; // Mã SP KM
  name: string;
  isFinishedProduct: boolean; // Thành phẩm?
  
  // Logic permissions
  allowedForms: InventoryForm[]; // Các dạng tồn kho cho phép (raw, processed, finished)
  canBePurchased: boolean; // Có thể nhập kho (Inflow)
  canBeSold: boolean; // Có thể bán ra (Outflow)
  
  // Định mức quy đổi & Công thức
  rawToProcessedRatio: number; // Tỉ lệ NVL -> Sơ chế (1 quả -> 6 miếng)
  processedToFinishedRatio: number; // Tỉ lệ Sơ chế -> Thành phẩm (4 miếng -> 1 đĩa)
  recipe: RecipeIngredient[]; // Công thức cấu thành
  
  outputQuantity: number; // Định lượng Xuất (số miếng để tạo 1 thành phẩm) - Legacy
  inputQuantity: number; // Định lượng Nhập (1 quả → 8 miếng) - Legacy
  
  standardInputPrice?: number; // Giá nhập tiêu chuẩn (phục vụ Approval Matrix)
  
   finishedProductCode?: string; // Mã Thành phẩm (Legacy)
   linkedFinishedProductCodes?: string[]; // Danh sách mã thành phẩm liên kết
   inputUnit: string; // ĐVT Nhập
   intermediateUnits?: string[]; // Danh sách ĐVT Trung gian (Sơ chế)
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

export type InventoryForm = 'raw' | 'processed' | 'finished';

export interface RecipeIngredient {
  ingredientId: string; // ID của NVL hoặc Bán thành phẩm
  quantity: number; // Số lượng cần dùng
  unit: string;
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
  targetProductCode?: string; // Optional: Link to a specific finished product
}

// Product with conversion details for display
export interface ProductWithConversions extends Product {
  conversions: ProductConversion[];
}
