import React, { useState, useCallback } from 'react';
import { ImportError, ImportResult, MAX_IMPORT_ROWS, checkImportLimit, validateBulkImport, BulkImportRow } from '../../utils/validation';

interface BulkImportProps {
  title: string;
  requiredColumns: string[];
  columnLabels: Record<string, string>;
  validators?: Record<string, (value: any) => string | null>;
  onImport: (data: any[]) => Promise<{ success: boolean; error?: string }>;
  onDownloadTemplate: () => void;
  onExportErrors?: (errors: ImportError[]) => void;
}

export const BulkImport: React.FC<BulkImportProps> = ({
  title,
  requiredColumns,
  columnLabels,
  validators,
  onImport,
  onDownloadTemplate,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; error?: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const parseCSV = (text: string): Record<string, any>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, any> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return row;
    });
  };

  const parseExcel = (buffer: ArrayBuffer): Record<string, any>[] => {
    // Simple CSV-like parsing for now
    // In production, use xlsx library
    const text = new TextDecoder().decode(buffer);
    return parseCSV(text);
  };

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result;
      if (!buffer) return;
      
      let rows: Record<string, any>[] = [];
      if (file.name.endsWith('.csv')) {
        rows = parseCSV(new TextDecoder().decode(buffer as ArrayBuffer));
      } else {
        rows = parseExcel(buffer as ArrayBuffer);
      }

      const limitCheck = checkImportLimit(rows.length);
      if (!limitCheck.allowed) {
        alert(limitCheck.message);
        return;
      }

      setRawData(rows);
      const result = validateBulkImport(rows, requiredColumns, validators);
      setValidationResult(result);
      setStep('preview');
    };
    reader.readAsArrayBuffer(file);
  }, [requiredColumns, validators]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleImport = async () => {
    if (!validationResult || !validationResult.valid) return;
    
    setStep('importing');
    const validRows = validationResult.rows
      .filter(r => r.errors.length === 0)
      .map(r => r.data);
    
    const result = await onImport(validRows);
    
    setImportResult({
      success: result.success,
      imported: result.success ? validRows.length : 0,
      error: result.error,
    });
    setStep('result');
  };

  const handleReset = () => {
    setStep('upload');
    setRawData([]);
    setValidationResult(null);
    setImportResult(null);
  };

  const exportErrors = () => {
    if (!validationResult) return;
    
    const errors = validationResult.rows.flatMap(r => 
      r.errors.map(err => ({
        row: r.rowNumber,
        column: '',
        message: err,
      }))
    );
    
    const csv = [
      'Dòng,Cột,Lỗi',
      ...errors.map(e => `${e.row},"${e.column}","${e.message}"`),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'import-errors.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex space-x-3">
          <button
            onClick={onDownloadTemplate}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            Tải mẫu
          </button>
          {step === 'preview' && validationResult && !validationResult.valid && (
            <button
              onClick={exportErrors}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm"
            >
              Xuất lỗi
            </button>
          )}
        </div>
      </div>

      {step === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors
            ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
        >
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <p className="text-gray-600">
              Kéo thả file Excel/CSV vào đây hoặc{' '}
              <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                chọn file
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-sm text-gray-500">
              Tối đa {MAX_IMPORT_ROWS} dòng. Định dạng: CSV, Excel
            </p>
          </div>
        </div>
      )}

      {step === 'preview' && validationResult && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${validationResult.valid ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
            <p className="font-medium">
              {validationResult.valid 
                ? `✅ Tất cả ${validationResult.validRows} dòng hợp lệ` 
                : `⚠️ ${validationResult.validRows}/${validationResult.totalRows} dòng hợp lệ, ${validationResult.errorCount} lỗi`}
            </p>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dòng</th>
                  {requiredColumns.map(col => (
                    <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {columnLabels[col] || col}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lỗi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {validationResult.rows.map((row) => (
                  <tr key={row.rowNumber} className={row.errors.length > 0 ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2 text-sm text-gray-500">{row.rowNumber}</td>
                    {requiredColumns.map(col => (
                      <td key={col} className="px-3 py-2 text-sm text-gray-900">
                        {row.data[col] || '-'}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-sm">
                      {row.errors.length > 0 ? (
                        <ul className="text-red-600 list-disc list-inside">
                          {row.errors.map((err, i) => (
                            <li key={i} className="text-xs">{err}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-green-600">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Chọn file khác
            </button>
            <button
              onClick={handleImport}
              disabled={!validationResult.valid}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import dữ liệu
            </button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang import dữ liệu...</p>
        </div>
      )}

      {step === 'result' && importResult && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="font-medium">
              {importResult.success 
                ? `✅ Import thành công ${importResult.imported} dòng` 
                : `❌ Import thất bại: ${importResult.error}`}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Import file khác
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkImport;
