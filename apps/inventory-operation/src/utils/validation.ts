import { Product, ProductCategory, InventoryRecord } from '../types';

// ============================================================
// Product Validation
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export const validateProduct = (
  product: Partial<Product>,
  existingProducts?: Product[]
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Required fields
  if (!product.businessCode?.trim()) {
    errors.push({ field: 'businessCode', message: 'Mã sản phẩm không được để trống' });
  } else if (product.businessCode.length > 50) {
    errors.push({ field: 'businessCode', message: 'Mã sản phẩm tối đa 50 ký tự' });
  } else if (existingProducts?.some(p => 
    p.businessCode === product.businessCode && p.id !== product.id
  )) {
    errors.push({ field: 'businessCode', message: 'Mã sản phẩm đã tồn tại' });
  }

  if (!product.name?.trim()) {
    errors.push({ field: 'name', message: 'Tên sản phẩm không được để trống' });
  } else if (product.name.length > 200) {
    errors.push({ field: 'name', message: 'Tên sản phẩm tối đa 200 ký tự' });
  }

  if (!product.category) {
    errors.push({ field: 'category', message: 'Vui lòng chọn loại sản phẩm' });
  } else if (!Object.values(ProductCategory).includes(product.category as ProductCategory)) {
    errors.push({ field: 'category', message: 'Loại sản phẩm không hợp lệ' });
  }

  if (product.businessStatus && !['active', 'inactive'].includes(product.businessStatus)) {
    errors.push({ field: 'businessStatus', message: 'Trạng thái kinh doanh không hợp lệ' });
  }

  // Conversion quantities
  if (product.inputQuantity !== undefined) {
    if (product.inputQuantity <= 0) {
      errors.push({ field: 'inputQuantity', message: 'Định lượng nhập phải lớn hơn 0' });
    }
  }

  if (product.outputQuantity !== undefined) {
    if (product.outputQuantity <= 0) {
      errors.push({ field: 'outputQuantity', message: 'Định lượng xuất phải lớn hơn 0' });
    }
  }

  // Units
  if (!product.inputUnit?.trim()) {
    errors.push({ field: 'inputUnit', message: 'ĐVT nhập không được để trống' });
  }

  if (!product.outputUnit?.trim()) {
    errors.push({ field: 'outputUnit', message: 'ĐVT xuất không được để trống' });
  }

  return { valid: errors.length === 0, errors };
};

// ============================================================
// Inventory Record Validation
// ============================================================

export const validateInventoryRecord = (
  record: Partial<InventoryRecord>,
  existingRecords?: InventoryRecord[]
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!record.productCode?.trim()) {
    errors.push({ field: 'productCode', message: 'Mã sản phẩm không được để trống' });
  }

  if (!record.productName?.trim()) {
    errors.push({ field: 'productName', message: 'Tên sản phẩm không được để trống' });
  }

  // Stock quantities - must be >= 0
  if (record.rawMaterialStock !== undefined && record.rawMaterialStock < 0) {
    errors.push({ field: 'rawMaterialStock', message: 'Tồn NVL không được âm' });
  }

  if (record.processedStock !== undefined && record.processedStock < 0) {
    errors.push({ field: 'processedStock', message: 'Tồn sơ chế không được âm' });
  }

  if (record.finishedProductStock !== undefined && record.finishedProductStock < 0) {
    errors.push({ field: 'finishedProductStock', message: 'Tồn thành phẩm không được âm' });
  }

  if (record.inputQuantity !== undefined && record.inputQuantity < 0) {
    errors.push({ field: 'inputQuantity', message: 'Số lượng nhập không được âm' });
  }

  return { valid: errors.length === 0, errors };
};

// ============================================================
// Bulk Import Validation
// ============================================================

export interface BulkImportRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
}

export interface BulkImportResult {
  valid: boolean;
  rows: BulkImportRow[];
  totalRows: number;
  validRows: number;
  errorCount: number;
}

export const MAX_IMPORT_ROWS = 200;

export const validateBulkImport = (
  rows: Record<string, any>[],
  requiredColumns: string[],
  validators?: Record<string, (value: any) => string | null>
): BulkImportResult => {
  const result: BulkImportRow[] = [];
  let validRows = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors: string[] = [];

    // Check required columns
    for (const col of requiredColumns) {
      if (row[col] === undefined || row[col] === null || row[col] === '') {
        rowErrors.push(`Cột "${col}" không được để trống`);
      }
    }

    // Run custom validators
    if (validators) {
      for (const [col, validator] of Object.entries(validators)) {
        const value = row[col];
        if (value !== undefined && value !== null && value !== '') {
          const error = validator(value);
          if (error) {
            rowErrors.push(`Cột "${col}": ${error}`);
          }
        }
      }
    }

    if (rowErrors.length === 0) {
      validRows++;
    } else {
      errorCount += rowErrors.length;
    }

    result.push({
      rowNumber: i + 1,
      data: row,
      errors: rowErrors,
    });
  }

  return {
    valid: errorCount === 0,
    rows: result,
    totalRows: rows.length,
    validRows,
    errorCount,
  };
};

export const checkImportLimit = (rowCount: number): { allowed: boolean; message?: string } => {
  if (rowCount > MAX_IMPORT_ROWS) {
    return {
      allowed: false,
      message: `Số lượng bản ghi vượt quá giới hạn ${MAX_IMPORT_ROWS} dòng. Vui lòng chia nhỏ file.`,
    };
  }
  if (rowCount === 0) {
    return {
      allowed: false,
      message: 'Không tìm thấy dữ liệu để import.',
    };
  }
  return { allowed: true };
};

// ============================================================
// Common Validators
// ============================================================

export const validators = {
  positiveNumber: (value: any): string | null => {
    const num = Number(value);
    if (isNaN(num)) return 'Phải là số';
    if (num <= 0) return 'Phải lớn hơn 0';
    return null;
  },

  nonNegativeNumber: (value: any): string | null => {
    const num = Number(value);
    if (isNaN(num)) return 'Phải là số';
    if (num < 0) return 'Không được âm';
    return null;
  },

  integer: (value: any): string | null => {
    const num = Number(value);
    if (isNaN(num)) return 'Phải là số';
    if (!Number.isInteger(num)) return 'Phải là số nguyên';
    return null;
  },

  maxLength: (max: number) => (value: any): string | null => {
    if (typeof value === 'string' && value.length > max) {
      return `Tối đa ${max} ký tự`;
    }
    return null;
  },

  date: (value: any): string | null => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
    if (date > new Date()) return 'Ngày không được trong tương lai';
    return null;
  },

  email: (value: any): string | null => {
    if (!value || typeof value !== 'string') return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email không hợp lệ';
    return null;
  },

  phone: (value: any): string | null => {
    if (!value || typeof value !== 'string') return null;
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Số điện thoại không hợp lệ (10-11 số)';
    return null;
  },

  oneOf: (options: string[]) => (value: any): string | null => {
    if (!options.includes(value)) return `Phải là một trong: ${options.join(', ')}`;
    return null;
  },
};

// ============================================================
// Auth Validation (for Login/SignUp)
// ============================================================

export const validateEmail = (email: string): string | null => {
  if (!email || typeof email !== 'string') return 'Email không được để trống';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Email không hợp lệ';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password || typeof password !== 'string') return 'Mật khẩu không được để trống';
  if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  return null;
};
