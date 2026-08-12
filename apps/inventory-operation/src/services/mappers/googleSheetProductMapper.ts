import { Product, ProductCategory, ProductStatus, InventoryForm } from '../types';
import { parseDateOrNow } from '@superapp/shared-utils';

export interface GoogleSheetProductRow {
  'Tên': string;
  'Mã SP KD': string;
  'Mã SP KM'?: string;
  'Loại': string;
  'Đvt Nhập': string;
  'Đvt Xuất': string;
  'Định lượng Nhập': string | number;
  'Định lượng Xuất': string | number;
  'Mã Thành phẩm'?: string;
  'Định lượng Thành phẩm'?: string | number;
  'NGUYÊN LIỆU'?: string;
  'SƠ CHẾ'?: string;
  'THÀNH PHẨM'?: string;
  'Ngày cập nhật'?: string;
  'Tình trạng'?: string;
}

export class GoogleSheetImportMapper {
  static mapRowToProduct(row: GoogleSheetProductRow): Product {
    const isFinished = row['Loại'] === 'Thành phẩm';
    
    // Map tracking categories to allowed forms
    const allowedForms: InventoryForm[] = [];
    if (row['NGUYÊN LIỆU']) allowedForms.push('raw');
    if (row['SƠ CHẾ']) allowedForms.push('processed');
    if (row['THÀNH PHẨM']) allowedForms.push('finished');

    // Parse numeric values safely
    const inputQuantity = typeof row['Định lượng Nhập'] === 'number' ? row['Định lượng Nhập'] : parseFloat(row['Định lượng Nhập'] || '1');
    const outputQuantity = typeof row['Định lượng Xuất'] === 'number' ? row['Định lượng Xuất'] : parseFloat(row['Định lượng Xuất'] || '1');
    const finishedQuantity = typeof row['Định lượng Thành phẩm'] === 'number' ? row['Định lượng Thành phẩm'] : parseFloat(row['Định lượng Thành phẩm'] || '1');

    return {
      id: `gs-${row['Mã SP KD']}-${Date.now()}`,
      name: row['Tên'],
      businessCode: row['Mã SP KD'],
      promotionCode: row['Mã SP KM'] || '',
      category: isFinished ? ProductCategory.FINISHED : ProductCategory.PROCESSED,
      isFinishedProduct: isFinished,
      inputUnit: row['Đvt Nhập'],
      outputUnit: row['Đvt Xuất'],
      inputQuantity: inputQuantity,
      outputQuantity: outputQuantity,
      finishedProductCode: row['Mã Thành phẩm'],
      
      // Logic ratios
      rawToProcessedRatio: outputQuantity / (inputQuantity || 1),
      processedToFinishedRatio: finishedQuantity,
      
      allowedForms: allowedForms.length > 0 ? allowedForms : (isFinished ? ['finished'] : ['raw', 'processed']),
      canBePurchased: !isFinished,
      canBeSold: isFinished,
      
      status: row['Tình trạng']?.toLowerCase() === 'active' ? ProductStatus.ACTIVE : ProductStatus.INACTIVE,
      businessStatus: 'active',
      
      createdAt: new Date(),
      updatedAt: row['Ngày cập nhật'] ? parseDateOrNow(row["Ngày cập nhật"]) : new Date(),
      createdBy: 'google-sheet-import',
      updatedBy: 'google-sheet-import',
      
      recipe: [],
      linkedFinishedProductCodes: row['Mã Thành phẩm'] ? [row['Mã Thành phẩm']] : [],
      intermediateUnits: row['SƠ CHẾ'] ? [row['SƠ CHẾ']] : []
    };
  }
}