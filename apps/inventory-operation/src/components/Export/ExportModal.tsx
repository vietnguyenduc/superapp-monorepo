// Export Modal with Progress Tracking
// Based on cashflow's ExportModal pattern

import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'excel' | 'csv') => Promise<void>;
  title: string;
  description?: string;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  title,
  description,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'csv'>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedFormat('excel');
      setIsExporting(false);
      setExportProgress(0);
      setExportError(null);
      setExportSuccess(false);
    }
  }, [isOpen]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);
    setExportSuccess(false);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onExport(selectedFormat);

      clearInterval(progressInterval);
      setExportProgress(100);
      setExportSuccess(true);

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Format selection */}
          {!isExporting && !exportSuccess && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Định dạng file
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedFormat('excel')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    selectedFormat === 'excel'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => setSelectedFormat('csv')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    selectedFormat === 'csv'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {isExporting && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Đang xuất file...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {exportError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{exportError}</p>
            </div>
          )}

          {/* Success message */}
          {exportSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">✓ Export thành công!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          {!isExporting && !exportSuccess && (
            <>
              <Button onClick={onClose} variant="secondary">
                Hủy
              </Button>
              <Button onClick={handleExport} className="flex-1">
                Xuất file
              </Button>
            </>
          )}
          {exportError && (
            <Button onClick={onClose} className="flex-1">
              Đóng
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
