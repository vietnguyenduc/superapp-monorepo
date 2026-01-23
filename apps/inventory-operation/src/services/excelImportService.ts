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
  'Số lượng nhập': 'inputQuantity',
  'Số lượng xuất': 'outputQuantity',
  'Trạng thái': 'status',
  'Ghi chú': 'notes',
};

export const DEFAULT_INVENTORY_MAPPING: ExcelColumnMapping = {
  'Ngày': 'date',
  'Mã sản phẩm': 'productCode',
  'Tên sản phẩm': 'productName',
  'Số lượng nhập': 'inputQuantity',
  'Tồn nguyên liệu': 'rawMaterialStock',
  'Đơn vị nguyên liệu': 'rawMaterialUnit',
  'Tồn thành phẩm': 'finishedProductStock',
  'Đơn vị thành phẩm': 'finishedProductUnit',
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
          mappedObject[fieldName] = this.cleanCellValue(cellValue);
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
  private cleanCellValue(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    if (typeof value === 'string') {
      const trimmed = value.toString().trim();
      
      // Try to parse as number
      if (/^\d+(\.\d+)?$/.test(trimmed)) {
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
  generateTemplate(type: 'products' | 'inventory' | 'sales'): void {
    let headers: string[] = [];
    let sampleData: any[] = [];
    let filename = '';

    switch (type) {
      case 'products':
        headers = Object.keys(DEFAULT_PRODUCT_MAPPING);
        sampleData = [
          {
            'Mã sản phẩm': 'SP001',
            'Tên sản phẩm': 'Cà phê Arabica',
            'Danh mục': 'FINISHED',
            'Đơn vị nhập': 'kg',
            'Đơn vị xuất': 'ly',
            'Số lượng nhập': 1,
            'Số lượng xuất': 100,
            'Trạng thái': 'ACTIVE',
            'Ghi chú': 'Cà phê hạt rang xay'
          }
        ];
        filename = 'template-san-pham';
        break;
        
      case 'inventory':
        headers = Object.keys(DEFAULT_INVENTORY_MAPPING);
        sampleData = [
          {
            'Ngày': '01/01/2024',
            'Mã sản phẩm': 'SP001',
            'Tên sản phẩm': 'Cà phê Arabica',
            'Số lượng nhập': 50,
            'Tồn nguyên liệu': 45,
            'Đơn vị nguyên liệu': 'kg',
            'Tồn thành phẩm': 4500,
            'Đơn vị thành phẩm': 'ly',
            'Ghi chú': 'Nhập kho đầu tuần'
          }
        ];
        filename = 'template-ton-kho';
        break;
        
      case 'sales':
        headers = Object.keys(DEFAULT_SALES_MAPPING);
        sampleData = [
          {
            'Ngày': '01/01/2024',
            'Mã sản phẩm': 'SP001',
            'Số lượng bán': 150,
            'Số lượng khuyến mãi': 20,
            'Đơn vị': 'ly',
            'Ghi chú': 'Bán chạy trong ngày'
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
