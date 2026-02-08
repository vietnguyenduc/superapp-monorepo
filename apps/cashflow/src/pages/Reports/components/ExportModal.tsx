import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../components/UI/Button";
import type { ReportType, ExportFormat } from "../../../types";

interface ExportModalProps {
  onClose: () => void;
  onExport: (format: ExportFormat, options: any) => void;
  reportType: ReportType;
  progress: number;
  error: string | null;
}

const ExportModal: React.FC<ExportModalProps> = ({
  onClose,
  onExport,
  reportType,
  progress,
  error,
}) => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>("excel");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    const options = {
      includeHeaders,
      includeCharts,
      includeDetails,
    };
    onExport(format, options);
  };

  const getReportTypeLabel = () => {
    switch (reportType) {
      case "keyMetrics":
        return t("reports.keyMetrics.title");
      case "customerBalance":
        return t("reports.customerBalance.title");
      case "transactionReport":
        return t("reports.transactionReport.title");
      case "cashFlowReport":
        return t("reports.cashFlowReport.title");
      default:
        return t("reports.unknownReportType");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-700/70 dark:bg-gray-900/80 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  {t("reports.export.title")}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("reports.export.subtitle")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Report Info */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t("reports.export.reportInfo")}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{getReportTypeLabel()}</p>
            </div>

            {/* Export Options */}
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("reports.export.format")}
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="excel"
                      checked={format === "excel"}
                      onChange={(e) =>
                        setFormat(e.target.value as ExportFormat)
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("reports.export.excel")}
                      </span>
                      <span className="block text-sm text-gray-500 dark:text-gray-400">
                        {t("reports.export.excelDescription")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={format === "csv"}
                      onChange={(e) =>
                        setFormat(e.target.value as ExportFormat)
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("reports.export.csv")}
                      </span>
                      <span className="block text-sm text-gray-500 dark:text-gray-400">
                        {t("reports.export.csvDescription")}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Include Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("reports.export.includeOptions")}
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeHeaders}
                      onChange={(e) => setIncludeHeaders(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                      {t("reports.export.includeHeaders")}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                      {t("reports.export.includeCharts")}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeDetails}
                      onChange={(e) => setIncludeDetails(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                      {t("reports.export.includeDetails")}
                    </span>
                  </label>
                </div>
              </div>

              {/* Progress Bar */}
              {progress > 0 && progress < 100 && (
                <div className="progress-bar">
                  <div className={`progress-fill w-[${progress}%]`}></div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <svg
                      className="w-5 h-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {t("reports.export.error")}
                      </h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {progress === 100 && !error && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        {t("reports.export.success")}
                      </h3>
                      <p className="mt-1 text-sm text-green-700">
                        {t("reports.export.downloadStarted")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" size="md" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? t("common.exporting") : t("common.export")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
