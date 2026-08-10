/**
 * File export utilities for Excel and CSV formats
 */

import * as XLSX from 'xlsx';

export interface ExportOptions {
  fileName?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

/**
 * Convert data to CSV string
 */
function convertToCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) return '';

  const keys = headers || Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(keys.join(','));

  // Add data rows
  for (const row of data) {
    const values = keys.map(key => {
      const value = row[key];
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T = any>(
  data: T[],
  options: ExportOptions = {}
): { success: boolean; filename: string; blob?: Blob } {
  const { fileName = 'export.csv' } = options;

  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Convert data to CSV
  const csv = convertToCSV(data);

  // Create blob
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Only attempt download if document is available (browser environment)
  if (typeof document !== 'undefined') {
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  return { success: true, filename: fileName, blob };
}

/**
 * Export data to JSON file
 */
export function exportToJSON<T = any>(
  data: T[],
  options: { fileName?: string; pretty?: boolean } = {}
): { success: boolean; filename: string; blob?: Blob } {
  const { fileName = 'export.json', pretty = true } = options;

  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });

  // Only attempt download if document is available (browser environment)
  if (typeof document !== 'undefined') {
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  return { success: true, filename: fileName, blob };
}

/**
 * Export data to Excel file (.xlsx)
 */
export function exportToExcel<T = any>(
  data: T[],
  options: ExportOptions = {}
): { success: boolean; filename: string } {
  const {
    fileName = 'export.xlsx',
    sheetName = 'Sheet1',
    includeHeaders = true,
  } = options;

  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: includeHeaders ? undefined : [],
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, fileName);

  return { success: true, filename: fileName };
}

/**
 * Export data to file (auto-detect format from fileName)
 */
export function exportToFile<T = any>(
  data: T[],
  options: ExportOptions = {}
): void {
  const fileName = options.fileName || 'export.xlsx';
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'xlsx':
    case 'xls':
      exportToExcel(data, options);
      break;
    case 'csv':
      exportToCSV(data, options);
      break;
    case 'json':
      exportToJSON(data, options);
      break;
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

/**
 * Generate a template file for import
 */
export function generateTemplate(
  columns: string[],
  fileName: string
): { success: boolean; filename: string; blob?: Blob } {
  if (columns.length === 0) {
    throw new Error('No columns provided');
  }

  // Export as CSV
  const csv = columns.join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Only attempt download if document is available (browser environment)
  if (typeof document !== 'undefined') {
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  return { success: true, filename: fileName, blob };
}
