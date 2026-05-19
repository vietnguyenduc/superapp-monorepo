// Import Utilities for Inventory Operation
// Based on cashflow's importUtils.ts pattern

import * as XLSX from 'xlsx';
import type { Product } from '../types';

export interface RawProductData {
  name: string;
  category?: string;
  businessCode?: string;
  promotionCode?: string;
  inputQuantity?: string;
  outputQuantity?: string;
  finishedProductCode?: string;
  inputUnit?: string;
  outputUnit?: string;
  notes?: string;
}

export interface ImportError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  data: RawProductData[];
}

export interface ImportData {
  file: File | null;
  data: RawProductData[];
  errors: ImportError[];
  isValid: boolean;
}

const MAX_BULK_ROWS = 200;
const BUSINESS_CODE_REGEX = /^[A-Z0-9]{2,20}$/i;

/**
 * Parse Excel/CSV file into structured product data
 */
export async function parseProductFile(file: File): Promise<RawProductData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];
        
        const parsedData = jsonData.map((row: any, index: number) => ({
          name: row['Tên sản phẩm'] || row['name'] || row['Name'] || '',
          category: row['Danh mục'] || row['category'] || row['Category'] || '',
          businessCode: row['Mã SP'] || row['businessCode'] || row['Business Code'] || '',
          promotionCode: row['Mã KM'] || row['promotionCode'] || row['Promotion Code'] || '',
          inputQuantity: row['Định lượng Nhập'] || row['inputQuantity'] || row['Input Quantity'] || '',
          outputQuantity: row['Định lượng Xuất'] || row['outputQuantity'] || row['Output Quantity'] || '',
          finishedProductCode: row['Thành phẩm'] || row['finishedProductCode'] || row['Finished Product'] || '',
          inputUnit: row['ĐVT Nhập'] || row['inputUnit'] || row['Input Unit'] || '',
          outputUnit: row['ĐVT Xuất'] || row['outputUnit'] || row['Output Unit'] || '',
          notes: row['Ghi chú'] || row['notes'] || row['Notes'] || '',
        }));

        resolve(parsedData);
      } catch (error) {
        reject(new Error('Failed to parse file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Parse raw text data (tab or comma separated) into structured data
 */
export function parseProductData(rawData: string): RawProductData[] {
  const lines = rawData.trim().split('\n');

  if (lines.length === 0) {
    throw new Error('No data provided');
  }

  // Remove empty lines and trim whitespace
  const nonEmptyLines = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (nonEmptyLines.length === 0) {
    throw new Error('No valid data found');
  }

  // Parse each line as tab or comma separated data
  return nonEmptyLines.map((line, index) => {
    const columns = parseLine(line);

    if (columns.length < 2) {
      throw new Error(`Row ${index + 1}: Insufficient columns. Expected at least 2 columns.`);
    }

    return {
      name: columns[0]?.trim() || '',
      category: columns[1]?.trim() || '',
      businessCode: columns[2]?.trim() || '',
      promotionCode: columns[3]?.trim() || '',
      inputQuantity: columns[4]?.trim() || '',
      outputQuantity: columns[5]?.trim() || '',
      finishedProductCode: columns[6]?.trim() || '',
      inputUnit: columns[7]?.trim() || '',
      outputUnit: columns[8]?.trim() || '',
      notes: columns[9]?.trim() || '',
    };
  });
}

/**
 * Parse a single line of data, handling both tab and comma separators
 */
function parseLine(line: string): string[] {
  // First try to split by tabs (Excel format)
  if (line.includes('\t')) {
    return line.split('\t');
  }

  // Then try to split by commas (CSV format)
  if (line.includes(',')) {
    return parseCSVLine(line);
  }

  // Default to single column
  return [line];
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Validate product data
 */
export function validateProductData(data: RawProductData[]): ValidationResult {
  const errors: ImportError[] = [];

  data.forEach((row, index) => {
    const rowNumber = index + 1;

    // Validate name (required)
    if (!row.name || row.name.trim() === '') {
      errors.push({
        row: rowNumber,
        column: 'name',
        message: 'Tên sản phẩm là bắt buộc',
        severity: 'error',
      });
    }

    // Validate business code format
    if (row.businessCode && !BUSINESS_CODE_REGEX.test(row.businessCode)) {
      errors.push({
        row: rowNumber,
        column: 'businessCode',
        message: 'Mã SP không hợp lệ (chỉ chấp nhận chữ cái và số, 2-20 ký tự)',
        severity: 'warning',
      });
    }

    // Validate input quantity is a number
    if (row.inputQuantity && isNaN(Number(row.inputQuantity))) {
      errors.push({
        row: rowNumber,
        column: 'inputQuantity',
        message: 'Định lượng nhập phải là số',
        severity: 'error',
      });
    }

    // Validate output quantity is a number
    if (row.outputQuantity && isNaN(Number(row.outputQuantity))) {
      errors.push({
        row: rowNumber,
        column: 'outputQuantity',
        message: 'Định lượng xuất phải là số',
        severity: 'error',
      });
    }

    // Validate units
    if (!row.inputUnit) {
      errors.push({
        row: rowNumber,
        column: 'inputUnit',
        message: 'ĐVT nhập nên được cung cấp',
        severity: 'warning',
      });
    }
  });

  const hasErrors = errors.some((error) => error.severity === 'error');

  return {
    isValid: !hasErrors,
    errors,
    data,
  };
}

/**
 * Convert raw product data to Product format
 */
export function convertToProduct(
  rawData: RawProductData,
  companyId: string,
  branchId: string,
  userId: string
): Partial<Product> {
  return {
    name: rawData.name,
    category: rawData.category as any,
    businessCode: rawData.businessCode || '',
    promotionCode: rawData.promotionCode,
    inputQuantity: Number(rawData.inputQuantity) || 0,
    outputQuantity: Number(rawData.outputQuantity) || 0,
    finishedProductCode: rawData.finishedProductCode,
    inputUnit: rawData.inputUnit || '',
    outputUnit: rawData.outputUnit || '',
    isFinishedProduct: !rawData.finishedProductCode,
    status: 'active' as any,
    businessStatus: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  };
}

/**
 * Get validation summary
 */
export function getValidationSummary(errors: ImportError[]): {
  totalErrors: number;
  totalWarnings: number;
  rowsWithErrors: number;
} {
  const errorRows = new Set(errors.map((e) => e.row));
  const errorsList = errors.filter((e) => e.severity === 'error');
  const warningsList = errors.filter((e) => e.severity === 'warning');

  return {
    totalErrors: errorsList.length,
    totalWarnings: warningsList.length,
    rowsWithErrors: errorRows.size,
  };
}

/**
 * Check if import can proceed based on validation
 */
export function canProceedWithImport(errors: ImportError[]): boolean {
  // Allow import if there are no errors (warnings are OK)
  return !errors.some((error) => error.severity === 'error');
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: ImportError): string {
  return `Dòng ${error.row}, cột "${error.column}": ${error.message}`;
}
