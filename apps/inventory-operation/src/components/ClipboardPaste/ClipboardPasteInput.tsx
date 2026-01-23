import React, { useState, useRef, useCallback } from 'react';
import { 
  ClipboardDocumentIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface ClipboardPasteInputProps {
  onDataParsed: (data: any[]) => void;
  expectedColumns?: string[];
  placeholder?: string;
  className?: string;
}

interface ParseResult {
  success: boolean;
  data: any[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

const ClipboardPasteInput: React.FC<ClipboardPasteInputProps> = ({
  onDataParsed,
  expectedColumns = [],
  placeholder = "Paste dữ liệu từ Excel/Google Sheets vào đây...",
  className = ""
}) => {
  const [pastedText, setPastedText] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse CSV/TSV data
  const parseClipboardData = useCallback((text: string): ParseResult => {
    const lines = text.trim().split('\n');
    if (lines.length === 0) {
      return {
        success: false,
        data: [],
        errors: ['Không có dữ liệu để xử lý'],
        warnings: [],
        totalRows: 0,
        validRows: 0
      };
    }

    const result: ParseResult = {
      success: true,
      data: [],
      errors: [],
      warnings: [],
      totalRows: lines.length,
      validRows: 0
    };

    // Detect delimiter (tab or comma)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    
    // Parse header row
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
    
    // Validate headers if expected columns provided
    if (expectedColumns.length > 0) {
      const missingColumns = expectedColumns.filter(col => 
        !headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
      );
      if (missingColumns.length > 0) {
        result.warnings.push(`Thiếu cột: ${missingColumns.join(', ')}`);
      }
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
        
        if (values.length !== headers.length) {
          result.errors.push(`Dòng ${i + 1}: Số cột không khớp (${values.length}/${headers.length})`);
          continue;
        }

        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        result.data.push(rowData);
        result.validRows++;
      } catch (error) {
        result.errors.push(`Dòng ${i + 1}: Lỗi parse dữ liệu`);
      }
    }

    if (result.validRows === 0) {
      result.success = false;
      result.errors.push('Không có dòng dữ liệu hợp lệ');
    }

    return result;
  }, [expectedColumns]);

  // Handle paste event
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const clipboardData = e.clipboardData;
      let pastedData = '';

      // Try to get text data
      if (clipboardData.types.includes('text/plain')) {
        pastedData = clipboardData.getData('text/plain');
      } else if (clipboardData.types.includes('text/html')) {
        // Handle HTML table data (from Excel/Google Sheets)
        const htmlData = clipboardData.getData('text/html');
        pastedData = parseHTMLTable(htmlData);
      }

      if (!pastedData.trim()) {
        setParseResult({
          success: false,
          data: [],
          errors: ['Không thể đọc dữ liệu từ clipboard'],
          warnings: [],
          totalRows: 0,
          validRows: 0
        });
        return;
      }

      setPastedText(pastedData);
      const result = parseClipboardData(pastedData);
      setParseResult(result);

      if (result.success && result.data.length > 0) {
        onDataParsed(result.data);
      }
    } catch (error) {
      setParseResult({
        success: false,
        data: [],
        errors: [`Lỗi xử lý clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        totalRows: 0,
        validRows: 0
      });
    } finally {
      setIsProcessing(false);
    }
  }, [parseClipboardData, onDataParsed]);

  // Parse HTML table to text
  const parseHTMLTable = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr');
    
    const textRows: string[] = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim() || '');
      textRows.push(cellTexts.join('\t'));
    });
    
    return textRows.join('\n');
  };

  // Handle manual text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedText(text);
    
    if (text.trim()) {
      const result = parseClipboardData(text);
      setParseResult(result);
      
      if (result.success && result.data.length > 0) {
        onDataParsed(result.data);
      }
    } else {
      setParseResult(null);
    }
  };

  // Clear data
  const handleClear = () => {
    setPastedText('');
    setParseResult(null);
    onDataParsed([]);
    textareaRef.current?.focus();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ClipboardDocumentIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Paste Dữ Liệu
          </h3>
        </div>
        {pastedText && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Xóa</span>
          </button>
        )}
      </div>

      {/* Expected columns info */}
      {expectedColumns.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Cột mong đợi:</strong> {expectedColumns.join(', ')}
          </p>
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={pastedText}
          onChange={handleTextChange}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical font-mono text-sm"
          disabled={isProcessing}
        />
        
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Đang xử lý...</span>
            </div>
          </div>
        )}
      </div>

      {/* Parse Result */}
      {parseResult && (
        <div className={`p-4 rounded-lg border ${
          parseResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            {parseResult.success ? (
              <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-0.5" />
            )}
            
            <div className="flex-1">
              <h4 className={`font-medium ${
                parseResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {parseResult.success ? 'Parse Thành Công' : 'Parse Có Lỗi'}
              </h4>
              
              <div className="mt-2 space-y-1 text-sm">
                <p>Tổng số dòng: {parseResult.totalRows}</p>
                <p>Dòng hợp lệ: {parseResult.validRows}</p>
                {parseResult.totalRows > parseResult.validRows && (
                  <p>Dòng lỗi: {parseResult.totalRows - parseResult.validRows}</p>
                )}
              </div>

              {parseResult.warnings.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-yellow-800">Cảnh báo:</h5>
                  <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                    {parseResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {parseResult.errors.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-red-800">Lỗi:</h5>
                  <ul className="list-disc list-inside text-sm text-red-700 mt-1 max-h-24 overflow-y-auto">
                    {parseResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>... và {parseResult.errors.length - 5} lỗi khác</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Hướng dẫn:</p>
            <ul className="space-y-1">
              <li>• Copy dữ liệu từ Excel/Google Sheets và paste vào ô trên</li>
              <li>• Hỗ trợ định dạng CSV (dấu phẩy) và TSV (tab)</li>
              <li>• Dòng đầu tiên sẽ được coi là header</li>
              <li>• Dữ liệu sẽ được parse tự động khi paste</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClipboardPasteInput;
