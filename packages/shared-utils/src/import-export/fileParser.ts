/**
 * File parsing utilities for Excel and CSV files
 */

import * as XLSX from 'xlsx';

export interface ParseOptions {
  sheetName?: string;
  headerRow?: number;
  skipEmptyRows?: boolean;
  trimWhitespace?: boolean;
}

export interface ParsedData<T = any> {
  data: T[];
  headers: string[];
  rowCount: number;
  fileName: string;
}

/**
 * Parse an Excel file (.xlsx, .xls)
 */
export async function parseExcelFile<T = any>(
  file: File,
  options: ParseOptions = {}
): Promise<ParsedData<T>> {
  const {
    sheetName,
    headerRow = 0,
    skipEmptyRows = true,
    trimWhitespace = true,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const sheet = sheetName 
          ? workbook.Sheets[sheetName]
          : (firstSheetName ? workbook.Sheets[firstSheetName] : undefined);
        
        if (!sheet) {
          reject(new Error('Sheet not found'));
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: headerRow,
          defval: null,
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });

        let processedData = jsonData as any[];

        if (skipEmptyRows) {
          processedData = processedData.filter(row => {
            return Object.values(row).some(
              value => value !== null && value !== undefined && value !== ''
            );
          });
        }

        if (trimWhitespace) {
          processedData = processedData.map(row => {
            const cleaned: any = {};
            for (const key in row) {
              if (typeof row[key] === 'string') {
                cleaned[key] = row[key].trim();
              } else {
                cleaned[key] = row[key];
              }
            }
            return cleaned;
          });
        }

        const headers = processedData.length > 0 
          ? Object.keys(processedData[0])
          : [];

        resolve({
          data: processedData as T[],
          headers,
          rowCount: processedData.length,
          fileName: file.name,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a CSV file
 */
export async function parseCSVFile<T = any>(
  file: File,
  options: ParseOptions = {}
): Promise<ParsedData<T>> {
  const {
    headerRow = 0,
    skipEmptyRows = true,
    trimWhitespace = true,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          resolve({
            data: [],
            headers: [],
            rowCount: 0,
            fileName: file.name,
          });
          return;
        }

        // Parse headers
        const headers = parseCSVLine(lines[headerRow] || '').map(h => 
          trimWhitespace ? h.trim() : h
        );

        // Parse data rows
        const data: T[] = [];
        for (let i = headerRow + 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i] || '');
          
          if (skipEmptyRows && values.every(v => !v || v.trim() === '')) {
            continue;
          }

          const row: any = {};
          headers.forEach((header, index) => {
            let value: string | number = values[index] || '';
            
            if (trimWhitespace && typeof value === 'string') {
              value = value.trim();
            }

            // Try to convert to number if possible
            if (value !== '' && !isNaN(Number(value))) {
              value = Number(value);
            }

            row[header] = value;
          });

          data.push(row as T);
        }

        resolve({
          data,
          headers,
          rowCount: data.length,
          fileName: file.name,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Parse a file (auto-detect format)
 */
export async function parseFile<T = any>(
  file: File,
  options: ParseOptions = {}
): Promise<ParsedData<T>> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcelFile<T>(file, options);
    case 'csv':
      return parseCSVFile<T>(file, options);
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}
