// Product lookup service for mapping between product names and codes
export interface ProductMapping {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  isActive: boolean;
}

// Sample product mappings based on real data
const PRODUCT_MAPPINGS: ProductMapping[] = [
  // Đĩa đơn
  { id: '1', name: 'Đĩa cam', code: '8 TC0002', category: 'Trái cây', description: 'Đĩa cam tươi', isActive: true },
  { id: '2', name: 'Đĩa dứa hấu', code: '48 TC0004', category: 'Trái cây', description: 'Đĩa dứa hấu tươi', isActive: true },
  { id: '3', name: 'Đĩa nho', code: '1000 TC0005', category: 'Trái cây', description: 'Đĩa nho tươi', isActive: true },
  { id: '4', name: 'Đĩa ổi', code: '6 TC0006', category: 'Trái cây', description: 'Đĩa ổi tươi', isActive: true },
  { id: '5', name: 'Đĩa táo', code: '8 TC0007', category: 'Trái cây', description: 'Đĩa táo tươi', isActive: true },
  { id: '6', name: 'Đĩa xoài', code: '16 TC0008', category: 'Trái cây', description: 'Đĩa xoài tươi', isActive: true },
  
  // Đĩa trái cây mix
  { id: '7', name: 'Đĩa trái cây', code: '8 TC0002', category: 'Trái cây', description: 'Đĩa trái cây hỗn hợp', isActive: true },
  
  // Đĩa combo
  { id: '8', name: 'Đĩa trái cây combo', code: '6 TC0020', category: 'Trái cây', description: 'Đĩa trái cây combo đặc biệt', isActive: true },
  
  // Nước ép
  { id: '9', name: 'Nước ép cam', code: 'NE001', category: 'Nước ép', description: 'Nước ép cam tươi', isActive: true },
  { id: '10', name: 'Nước ép táo', code: 'NE002', category: 'Nước ép', description: 'Nước ép táo tươi', isActive: true },
  { id: '11', name: 'Nước ép xoài', code: 'NE003', category: 'Nước ép', description: 'Nước ép xoài tươi', isActive: true },
  
  // Smoothie
  { id: '12', name: 'Smoothie cam', code: 'SM001', category: 'Smoothie', description: 'Smoothie cam sữa', isActive: true },
  { id: '13', name: 'Smoothie xoài', code: 'SM002', category: 'Smoothie', description: 'Smoothie xoài sữa', isActive: true },
  { id: '14', name: 'Smoothie dứa', code: 'SM003', category: 'Smoothie', description: 'Smoothie dứa sữa', isActive: true },
];

export class ProductLookupService {
  private static instance: ProductLookupService;
  private mappings: ProductMapping[] = PRODUCT_MAPPINGS;

  private constructor() {}

  public static getInstance(): ProductLookupService {
    if (!ProductLookupService.instance) {
      ProductLookupService.instance = new ProductLookupService();
    }
    return ProductLookupService.instance;
  }

  // Get all product mappings
  public getAllProducts(): ProductMapping[] {
    return this.mappings.filter(p => p.isActive);
  }

  // Search products by name or code
  public searchProducts(query: string): ProductMapping[] {
    if (!query.trim()) return this.getAllProducts();
    
    const searchTerm = query.toLowerCase();
    return this.mappings.filter(product => 
      product.isActive && (
        product.name.toLowerCase().includes(searchTerm) ||
        product.code.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
      )
    );
  }

  // Lookup product code by name
  public getCodeByName(name: string): string | null {
    const product = this.mappings.find(p => 
      p.isActive && p.name.toLowerCase() === name.toLowerCase()
    );
    return product ? product.code : null;
  }

  // Lookup product name by code
  public getNameByCode(code: string): string | null {
    const product = this.mappings.find(p => 
      p.isActive && p.code.toLowerCase() === code.toLowerCase()
    );
    return product ? product.name : null;
  }

  // Validate mapping between name and code
  public validateMapping(name: string, code: string): {
    isValid: boolean;
    message: string;
    suggestedCode?: string;
    suggestedName?: string;
  } {
    const nameProduct = this.mappings.find(p => 
      p.isActive && p.name.toLowerCase() === name.toLowerCase()
    );
    const codeProduct = this.mappings.find(p => 
      p.isActive && p.code.toLowerCase() === code.toLowerCase()
    );

    // Both name and code exist and match
    if (nameProduct && codeProduct && nameProduct.id === codeProduct.id) {
      return {
        isValid: true,
        message: '✅ Mapping hợp lệ'
      };
    }

    // Name exists but code doesn't match
    if (nameProduct && (!codeProduct || nameProduct.id !== codeProduct.id)) {
      return {
        isValid: false,
        message: `⚠️ Tên sản phẩm "${name}" không khớp với mã "${code}"`,
        suggestedCode: nameProduct.code
      };
    }

    // Code exists but name doesn't match
    if (codeProduct && (!nameProduct || nameProduct.id !== codeProduct.id)) {
      return {
        isValid: false,
        message: `⚠️ Mã sản phẩm "${code}" không khớp với tên "${name}"`,
        suggestedName: codeProduct.name
      };
    }

    // Neither exists
    if (!nameProduct && !codeProduct) {
      return {
        isValid: false,
        message: `❌ Không tìm thấy sản phẩm với tên "${name}" và mã "${code}"`
      };
    }

    return {
      isValid: false,
      message: '❌ Mapping không hợp lệ'
    };
  }

  // Bulk validate mappings
  public bulkValidate(items: Array<{ name: string; code: string }>): {
    valid: Array<{ name: string; code: string; message: string }>;
    invalid: Array<{ name: string; code: string; message: string; suggestedCode?: string; suggestedName?: string }>;
    stats: {
      total: number;
      valid: number;
      invalid: number;
      validPercentage: number;
    };
  } {
    const valid: Array<{ name: string; code: string; message: string }> = [];
    const invalid: Array<{ name: string; code: string; message: string; suggestedCode?: string; suggestedName?: string }> = [];

    items.forEach(item => {
      const validation = this.validateMapping(item.name, item.code);
      if (validation.isValid) {
        valid.push({
          name: item.name,
          code: item.code,
          message: validation.message
        });
      } else {
        invalid.push({
          name: item.name,
          code: item.code,
          message: validation.message,
          suggestedCode: validation.suggestedCode,
          suggestedName: validation.suggestedName
        });
      }
    });

    const total = items.length;
    const validCount = valid.length;
    const invalidCount = invalid.length;

    return {
      valid,
      invalid,
      stats: {
        total,
        valid: validCount,
        invalid: invalidCount,
        validPercentage: total > 0 ? Math.round((validCount / total) * 100) : 0
      }
    };
  }

  // Add new product mapping
  public addProduct(product: Omit<ProductMapping, 'id'>): ProductMapping {
    const newProduct: ProductMapping = {
      ...product,
      id: Date.now().toString()
    };
    this.mappings.push(newProduct);
    return newProduct;
  }

  // Update existing product mapping
  public updateProduct(id: string, updates: Partial<ProductMapping>): boolean {
    const index = this.mappings.findIndex(p => p.id === id);
    if (index !== -1) {
      this.mappings[index] = { ...this.mappings[index], ...updates };
      return true;
    }
    return false;
  }

  // Get products by category
  public getProductsByCategory(category: string): ProductMapping[] {
    return this.mappings.filter(p => 
      p.isActive && p.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Get unique categories
  public getCategories(): string[] {
    const categories = new Set(this.mappings.filter(p => p.isActive).map(p => p.category));
    return Array.from(categories).sort();
  }
}

// Export singleton instance
export const productLookupService = ProductLookupService.getInstance();
