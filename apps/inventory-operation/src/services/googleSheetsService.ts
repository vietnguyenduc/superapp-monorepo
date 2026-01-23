// Google Sheets API Service
// Handles import/export data from Google Sheets

import { Product, InventoryRecord, SalesRecord } from '../types';

export interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  range: string;
}

export interface SheetData {
  values: string[][];
  range: string;
  majorDimension: 'ROWS' | 'COLUMNS';
}

class GoogleSheetsService {
  private apiKey: string = '';
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  constructor() {
    // Get API key from environment variables
    this.apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';
  }

  // Set API key dynamically
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  // Read data from Google Sheets
  async readSheet(spreadsheetId: string, range: string): Promise<SheetData | null> {
    if (!this.apiKey) {
      throw new Error('Google Sheets API key is not configured');
    }

    try {
      const url = `${this.baseUrl}/${spreadsheetId}/values/${range}?key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        values: data.values || [],
        range: data.range || range,
        majorDimension: data.majorDimension || 'ROWS'
      };
    } catch (error) {
      console.error('Error reading Google Sheet:', error);
      throw error;
    }
  }

  // Write data to Google Sheets (requires OAuth2 authentication)
  async writeSheet(
    spreadsheetId: string, 
    range: string, 
    values: string[][],
    accessToken: string
  ): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values,
          majorDimension: 'ROWS'
        })
      });

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error writing to Google Sheet:', error);
      throw error;
    }
  }

  // Convert Google Sheets data to Products
  parseProductsFromSheet(sheetData: SheetData): Product[] {
    if (!sheetData.values || sheetData.values.length < 2) {
      return [];
    }

    const [headers, ...rows] = sheetData.values;
    const products: Product[] = [];

    // Expected headers: businessCode, name, category, inputUnit, outputUnit, inputQuantity, outputQuantity
    const headerMap = this.createHeaderMap(headers);

    for (const row of rows) {
      if (row.length === 0) continue;

      try {
        const product: Partial<Product> = {
          id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          businessCode: row[headerMap.businessCode] || '',
          name: row[headerMap.name] || '',
          category: row[headerMap.category] || 'finished',
          inputUnit: row[headerMap.inputUnit] || '',
          outputUnit: row[headerMap.outputUnit] || '',
          inputQuantity: parseFloat(row[headerMap.inputQuantity]) || 1,
          outputQuantity: parseFloat(row[headerMap.outputQuantity]) || 1,
          isFinishedProduct: true,
          status: 'active',
          businessStatus: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'google-sheets-import',
          updatedBy: 'google-sheets-import'
        };

        if (product.businessCode && product.name) {
          products.push(product as Product);
        }
      } catch (error) {
        console.warn('Error parsing product row:', row, error);
      }
    }

    return products;
  }

  // Convert Google Sheets data to Inventory Records
  parseInventoryFromSheet(sheetData: SheetData): InventoryRecord[] {
    if (!sheetData.values || sheetData.values.length < 2) {
      return [];
    }

    const [headers, ...rows] = sheetData.values;
    const records: InventoryRecord[] = [];

    // Expected headers: date, productCode, inputQuantity, actualStock, unit
    const headerMap = this.createHeaderMap(headers);

    for (const row of rows) {
      if (row.length === 0) continue;

      try {
        const record: Partial<InventoryRecord> = {
          id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: new Date(row[headerMap.date] || Date.now()),
          productCode: row[headerMap.productCode] || '',
          inputQuantity: parseFloat(row[headerMap.inputQuantity]) || 0,
          actualStock: parseFloat(row[headerMap.actualStock]) || 0,
          unit: row[headerMap.unit] || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'google-sheets-import',
          updatedBy: 'google-sheets-import'
        };

        if (record.productCode) {
          records.push(record as InventoryRecord);
        }
      } catch (error) {
        console.warn('Error parsing inventory row:', row, error);
      }
    }

    return records;
  }

  // Convert Google Sheets data to Sales Records
  parseSalesFromSheet(sheetData: SheetData): SalesRecord[] {
    if (!sheetData.values || sheetData.values.length < 2) {
      return [];
    }

    const [headers, ...rows] = sheetData.values;
    const records: SalesRecord[] = [];

    // Expected headers: outputDate, productCode, quantitySold, notes
    const headerMap = this.createHeaderMap(headers);

    for (const row of rows) {
      if (row.length === 0) continue;

      try {
        const record: Partial<SalesRecord> = {
          id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productCode: row[headerMap.productCode] || '',
          outputDate: new Date(row[headerMap.outputDate] || Date.now()),
          quantitySold: parseFloat(row[headerMap.quantitySold]) || 0,
          notes: row[headerMap.notes] || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'google-sheets-import',
          updatedBy: 'google-sheets-import'
        };

        if (record.productCode && record.quantitySold > 0) {
          records.push(record as SalesRecord);
        }
      } catch (error) {
        console.warn('Error parsing sales row:', row, error);
      }
    }

    return records;
  }

  // Create header mapping for flexible column order
  private createHeaderMap(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    
    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Map common header variations
      if (normalizedHeader.includes('code') || normalizedHeader.includes('mã')) {
        map.businessCode = index;
        map.productCode = index;
      } else if (normalizedHeader.includes('name') || normalizedHeader.includes('tên')) {
        map.name = index;
      } else if (normalizedHeader.includes('category') || normalizedHeader.includes('loại')) {
        map.category = index;
      } else if (normalizedHeader.includes('input') && normalizedHeader.includes('unit')) {
        map.inputUnit = index;
      } else if (normalizedHeader.includes('output') && normalizedHeader.includes('unit')) {
        map.outputUnit = index;
      } else if (normalizedHeader.includes('input') && normalizedHeader.includes('quantity')) {
        map.inputQuantity = index;
      } else if (normalizedHeader.includes('output') && normalizedHeader.includes('quantity')) {
        map.outputQuantity = index;
      } else if (normalizedHeader.includes('actual') || normalizedHeader.includes('thực')) {
        map.actualStock = index;
      } else if (normalizedHeader.includes('sold') || normalizedHeader.includes('bán')) {
        map.quantitySold = index;
      } else if (normalizedHeader.includes('date') || normalizedHeader.includes('ngày')) {
        map.date = index;
        map.outputDate = index;
      } else if (normalizedHeader.includes('unit') || normalizedHeader.includes('đơn vị')) {
        map.unit = index;
      } else if (normalizedHeader.includes('note') || normalizedHeader.includes('ghi chú')) {
        map.notes = index;
      }
    });

    return map;
  }

  // Generate template for Google Sheets
  generateProductTemplate(): string[][] {
    return [
      ['Mã SP', 'Tên sản phẩm', 'Loại', 'Đơn vị nhập', 'Đơn vị xuất', 'Số lượng nhập', 'Số lượng xuất'],
      ['SP001', 'Cà phê Arabica', 'finished', 'kg', 'ly', '1', '100'],
      ['SP002', 'Bánh mì sandwich', 'finished', 'cái', 'phần', '1', '1'],
      ['SP003', 'Nước cam tươi', 'finished', 'lít', 'ly', '1', '5']
    ];
  }

  generateInventoryTemplate(): string[][] {
    return [
      ['Ngày', 'Mã SP', 'Số lượng nhập', 'Tồn thực tế', 'Đơn vị'],
      ['2024-01-15', 'SP001', '50', '4950', 'ly'],
      ['2024-01-15', 'SP002', '100', '95', 'phần'],
      ['2024-01-15', 'SP003', '20', '95', 'ly']
    ];
  }

  generateSalesTemplate(): string[][] {
    return [
      ['Ngày xuất', 'Mã SP', 'Số lượng bán', 'Ghi chú'],
      ['2024-01-15', 'SP001', '150', 'Bán chạy trong ngày'],
      ['2024-01-15', 'SP002', '80', 'Combo khuyến mãi'],
      ['2024-01-15', 'SP003', '200', 'Nước cam tươi bán tốt']
    ];
  }

  // Validate Google Sheets URL
  extractSpreadsheetId(url: string): string | null {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Check if API key is valid
  async validateApiKey(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      // Test with a simple request
      const testUrl = `${this.baseUrl}/test/values/A1?key=${this.apiKey}`;
      const response = await fetch(testUrl);
      
      // Even if spreadsheet doesn't exist, a valid API key should return 404, not 403
      return response.status !== 403;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
