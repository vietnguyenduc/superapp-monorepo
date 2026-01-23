import React, { useState, useCallback, useRef } from 'react';

export interface PasteData {
  headers: string[];
  rows: string[][];
  rawText: string;
}

interface ClipboardPasteInputProps {
  onPaste: (data: PasteData) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const ClipboardPasteInput: React.FC<ClipboardPasteInputProps> = ({
  onPaste,
  placeholder = "Paste dữ liệu từ Excel/Google Sheets vào đây (Ctrl+V)",
  className = "",
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse clipboard text data
  const parseClipboardData = useCallback((text: string): PasteData => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      return { headers: [], rows: [], rawText: text };
    }

    // First line as headers
    const headers = lines[0].split('\t').map(header => header.trim());
    
    // Remaining lines as data rows
    const rows = lines.slice(1).map(line => 
      line.split('\t').map(cell => cell.trim())
    );

    return { headers, rows, rawText: text };
  }, []);

  // Handle paste event
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    
    try {
      const clipboardData = e.clipboardData.getData('text');
      
      if (!clipboardData.trim()) {
        return;
      }

      const parsedData = parseClipboardData(clipboardData);
      
      // Validate data
      if (parsedData.headers.length === 0) {
        throw new Error('Không tìm thấy dữ liệu hợp lệ');
      }

      onPaste(parsedData);
      
      // Clear textarea after successful paste
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error processing paste data:', error);
      alert(`Lỗi xử lý dữ liệu: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [disabled, isProcessing, parseClipboardData, onPaste]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isProcessing) return;

    const text = e.dataTransfer.getData('text');
    if (text) {
      setIsProcessing(true);
      
      try {
        const parsedData = parseClipboardData(text);
        
        if (parsedData.headers.length === 0) {
          throw new Error('Không tìm thấy dữ liệu hợp lệ');
        }

        onPaste(parsedData);
        
      } catch (error) {
        console.error('Error processing drop data:', error);
        alert(`Lỗi xử lý dữ liệu: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [disabled, isProcessing, parseClipboardData, onPaste]);

  // Handle focus to show instructions
  const handleFocus = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.placeholder = "Nhấn Ctrl+V để paste dữ liệu...";
    }
  }, []);

  const handleBlur = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.placeholder = placeholder;
    }
  }, [placeholder]);

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled || isProcessing}
        className={`
          w-full h-32 p-4 border-2 border-dashed rounded-lg resize-none
          transition-all duration-200 ease-in-out
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || isProcessing 
            ? 'bg-gray-100 cursor-not-allowed' 
            : 'bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
          }
          ${isProcessing ? 'animate-pulse' : ''}
        `}
        readOnly
      />
      
      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">Đang xử lý...</span>
          </div>
        </div>
      )}
      
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center rounded-lg border-2 border-blue-400 border-dashed">
          <div className="text-center text-blue-600">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm font-medium">Thả dữ liệu vào đây</div>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>💡 Hỗ trợ:</span>
          <span>📋 Copy từ Excel/Google Sheets</span>
          <span>⌨️ Ctrl+V để paste</span>
          <span>🖱️ Drag & drop</span>
        </div>
      </div>
    </div>
  );
};

export default ClipboardPasteInput;
