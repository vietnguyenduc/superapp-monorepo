import * as XLSX from 'xlsx';
import { Product, InventoryRecord, SalesRecord } from '../types';

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

export interface ExcelColumnMapping {
  [key: string]: string; // Excel column name -> data field name
}

// Default column mappings for different data types
export const DEFAULT_PRODUCT_MAPPING: ExcelColumnMapping = {
  'Mã sản phẩm': 'businessCode',
  'Tên sản phẩm': 'name',
  'Danh mục': 'category',
  'Đơn vị nhập': 'inputUnit',
  'Đơn vị xuất': 'outputUnit',
  'Đơn vị trung gian': 'intermediateUnits',
  'Tỷ lệ quy đổi sơ chế': 'conversionRatioRawToProcessed',
  'Định mức thành phẩm': 'conversionRatioProcessedToFinished',
  'Giá nhập': 'standardInputPrice',
  'Trạng thái': 'status',
  'Ghi chú': 'notes',
};

export const DEFAULT_INVENTORY_MAPPING: ExcelColumnMapping = {
  'Ngày': 'date',
  'Mã sản phẩm': 'productCode',
  'Tên sản phẩm': 'productName',
  'Nhà cung cấp': 'supplier',
  'Đơn giá nhập': 'unitPrice',
  'Số lượng nhập kho': 'inputQuantity',
  'Thành tiền': 'totalAmount',
  'Tồn Nguyên liệu (Gốc)': 'rawMaterialStock',
  'Đơn vị Nguyên liệu': 'rawMaterialUnit',
  'Tồn Sơ chế (Trung gian)': 'processedStock',
  'Đơn vị Sơ chế': 'processedUnit',
  'Tồn Thành phẩm (Món)': 'finishedProductStock',
  'Đơn vị Thành phẩm': 'finishedProductUnit',
  'Ghi chú': 'notes',
};

export const DEFAULT_SALES_MAPPING: ExcelColumnMapping = {
  'Ngày': 'date',
  'Mã sản phẩm': 'product_id',
  'Số lượng bán': 'sales_quantity',
  'Số lượng khuyến mãi': 'promotion_quantity',
  'Đơn vị': 'unit',
  'Ghi chú': 'notes',
};

class ExcelImportService {
  /**
   * Read Excel file and convert to JSON
   */
  async readExcelFile(file: File): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to array of arrays
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false 
          });
          
          resolve(jsonData as any[][]);
        } catch (error) {
          reject(new Error(`Lỗi đọc file Excel: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Lỗi đọc file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Map Excel data to typed objects
   */
  mapExcelData<T>(
    excelData: any[][],
    columnMapping: ExcelColumnMapping,
    validator?: (row: any) => { isValid: boolean; errors: string[] }
  ): ImportResult<T> {
    const result: ImportResult<T> = {
      success: false,
      data: [],
      errors: [],
      warnings: [],
      totalRows: 0,
      validRows: 0,
    };

    if (!excelData || excelData.length < 2) {
      result.errors.push('File Excel trống hoặc không có dữ liệu');
      return result;
    }

    // Get headers from first row
    const headers = excelData[0] as string[];
    const dataRows = excelData.slice(1);
    
    result.totalRows = dataRows.length;

    // Create reverse mapping (field name -> column index)
    const fieldToColumnIndex: { [key: string]: number } = {};
    Object.entries(columnMapping).forEach(([excelColumn, fieldName]) => {
      const columnIndex = headers.findIndex(header => 
        header.toString().trim().toLowerCase() === excelColumn.toLowerCase()
      );
      if (columnIndex !== -1) {
        fieldToColumnIndex[fieldName] = columnIndex;
      } else {
        result.warnings.push(`Không tìm thấy cột "${excelColumn}" trong file Excel`);
      }
    });

    // Process each data row
    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel starts at 1 and we skip header
      
      try {
        const mappedObject: any = {};
        
        // Map each field
        Object.entries(fieldToColumnIndex).forEach(([fieldName, columnIndex]) => {
          const cellValue = row[columnIndex];
          mappedObject[fieldName] = this.cleanCellValue(cellValue, fieldName);
        });

        // Add metadata
        mappedObject.id = `import-${Date.now()}-${index}`;
        mappedObject.createdAt = new Date().toISOString();
        mappedObject.updatedAt = new Date().toISOString();
        mappedObject.createdBy = 'excel-import';
        mappedObject.updatedBy = 'excel-import';

        // Validate if validator provided
        if (validator) {
          const validation = validator(mappedObject);
          if (!validation.isValid) {
            result.errors.push(`Dòng ${rowNumber}: ${validation.errors.join(', ')}`);
            return;
          }
        }

        result.data.push(mappedObject as T);
        result.validRows++;
        
      } catch (error) {
        result.errors.push(`Dòng ${rowNumber}: Lỗi xử lý dữ liệu - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    result.success = result.validRows > 0;
    return result;
  }

  /**
   * Clean and normalize cell values
   */
  private cleanCellValue(value: any, fieldName?: string): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    // Special handling for intermediateUnits (comma-separated string to array)
    if (fieldName === 'intermediateUnits' && typeof value === 'string') {
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    if (typeof value === 'string') {
      const trimmed = value.toString().trim();
      
      // Try to parse as number (but skip if it's a code or name)
      if (/^\d+(\.\d+)?$/.test(trimmed) && fieldName !== 'businessCode' && fieldName !== 'productCode') {
        return parseFloat(trimmed);
      }
      
      // Try to parse as date
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      return trimmed;
    }
    
    return value;
  }

  /**
   * Import products from Excel
   */
  async importProducts(file: File): Promise<ImportResult<Product>> {
    const excelData = await this.readExcelFile(file);
    
    const validator = (row: any) => {
      const errors: string[] = [];
      
      if (!row.businessCode) errors.push('Thiếu mã sản phẩm');
      if (!row.name) errors.push('Thiếu tên sản phẩm');
      if (!row.inputUnit) errors.push('Thiếu đơn vị nhập');
      if (!row.outputUnit) errors.push('Thiếu đơn vị xuất');
      
      return {
        isValid: errors.length === 0,
        errors
      };
    };

    return this.mapExcelData<Product>(excelData, DEFAULT_PRODUCT_MAPPING, validator);
  }

  /**
   * Import inventory records from Excel
   */
  async importInventoryRecords(file: File): Promise<ImportResult<InventoryRecord>> {
    const excelData = await this.readExcelFile(file);
    
    const validator = (row: any) => {
      const errors: string[] = [];
      
      if (!row.date) errors.push('Thiếu ngày');
      if (!row.productCode) errors.push('Thiếu mã sản phẩm');
      if (!row.productName) errors.push('Thiếu tên sản phẩm');
      
      return {
        isValid: errors.length === 0,
        errors
      };
    };

    return this.mapExcelData<InventoryRecord>(excelData, DEFAULT_INVENTORY_MAPPING, validator);
  }

  /**
   * Import sales records from Excel
   */
  async importSalesRecords(file: File): Promise<ImportResult<SalesRecord>> {
    const excelData = await this.readExcelFile(file);
    
    const validator = (row: any) => {
      const errors: string[] = [];
      
      if (!row.date) errors.push('Thiếu ngày');
      if (!row.product_id) errors.push('Thiếu mã sản phẩm');
      if (row.sales_quantity === null || row.sales_quantity === undefined) {
        errors.push('Thiếu số lượng bán');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    };

    return this.mapExcelData<SalesRecord>(excelData, DEFAULT_SALES_MAPPING, validator);
  }

  /**
   * Export data to Excel
   */
  exportToExcel<T>(data: T[], filename: string, sheetName: string = 'Data'): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  /**
   * Generate Excel template for import
   */
  generateTemplate(type: 'products' | 'inventory' | 'sales', isCommercial: boolean = false): void {
    let headers: string[] = [];
    let sampleData: any[] = [];
    let filename = '';

    switch (type) {
      case 'products':
        if (isCommercial) {
          // Commercial mode: only finished products — no raw/intermediate/conversion columns
          headers = ['Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị', 'Giá nhập', 'Giá bán', 'Trạng thái', 'Ghi chú'];
          sampleData = [
            {
              'Mã sản phẩm': 'SP001',
              'Tên sản phẩm': 'Sting dâu 330ml',
              'Đơn vị': 'Lon',
              'Giá nhập': 8000,
              'Giá bán': 10000,
              'Trạng thái': 'ACTIVE',
              'Ghi chú': 'Hàng bán'
            }
          ];
          filename = 'template-san-pham-thuong-mai';
        } else {
          headers = Object.keys(DEFAULT_PRODUCT_MAPPING);
          sampleData = [
            {
              'Mã sản phẩm': 'SP001',
              'Tên sản phẩm': 'Xoài cát Hòa Lộc',
              'Danh mục': 'RAW',
              'Đơn vị nhập': 'Quả',
              'Đơn vị xuất': 'Dĩa',
              'Đơn vị trung gian': 'Miếng, Gram',
              'Tỷ lệ quy đổi sơ chế': 10,
              'Định mức thành phẩm': 20,
              'Giá nhập': 5000,
              'Trạng thái': 'ACTIVE',
              'Ghi chú': 'Hàng loại 1'
            }
          ];
          filename = 'template-san-pham';
        }
        break;
        
      case 'inventory':
        if (isCommercial) {
          // Commercial mode: only finished product stock, no raw/intermediate
          headers = ['Ngày', 'Mã sản phẩm', 'Tên sản phẩm', 'Nhà cung cấp', 'Đơn giá nhập', 'Số lượng nhập kho', 'Thành tiền', 'Tồn kho', 'Đơn vị', 'Ghi chú'];
          sampleData = [
            {
              'Ngày': '01/01/2024',
              'Mã sản phẩm': 'SP001',
              'Tên sản phẩm': 'Sting dâu 330ml',
              'Nhà cung cấp': 'Đại lý ABC',
              'Đơn giá nhập': 8000,
              'Số lượng nhập kho': 24,
              'Thành tiền': 192000,
              'Tồn kho': 20,
              'Đơn vị': 'Lon',
              'Ghi chú': 'Nhập lô mới'
            }
          ];
          filename = 'template-ton-kho-thuong-mai';
        } else {
          headers = Object.keys(DEFAULT_INVENTORY_MAPPING);
          sampleData = [
            {
              'Ngày': '01/01/2024',
              'Mã sản phẩm': 'SP001',
              'Tên sản phẩm': 'Xoài cát Hòa Lộc',
              'Nhà cung cấp': 'Hộ KD Trái Cây',
              'Đơn giá nhập': 50000,
              'Số lượng nhập kho': 10,
              'Thành tiền': 500000,
              'Tồn Nguyên liệu (Gốc)': 5,
              'Đơn vị Nguyên liệu': 'Quả',
              'Tồn Sơ chế (Trung gian)': 20,
              'Đơn vị Sơ chế': 'Miếng',
              'Tồn Thành phẩm (Món)': 2,
              'Đơn vị Thành phẩm': 'Dĩa',
              'Ghi chú': 'Nhập kho đầu ca'
            }
          ];
          filename = 'template-ton-kho';
        }
        break;
        
      case 'sales':
        headers = Object.keys(DEFAULT_SALES_MAPPING);
        sampleData = [
          {
            'Ngày': '01/01/2024',
            'Mã sản phẩm': 'SP001',
            'Số lượng bán': 5,
            'Số lượng khuyến mãi': 1,
            'Đơn vị': 'Dĩa',
            'Ghi chú': 'Giờ cao điểm'
          }
        ];
        filename = 'template-ban-hang';
        break;
    }

    this.exportToExcel(sampleData, filename, 'Template');
  }
}

export const excelImportService = new ExcelImportService();
export default excelImportService;
