import React from "react";
import { useTranslation } from "react-i18next";
import { ReportType } from "../../../types";

interface ReportTypeSelectorProps {
  selectedType: ReportType | null;
  onSelect: (type: ReportType) => void;
}

const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  const { t } = useTranslation();

  const reportTypes = [
    {
      type: "keyMetrics" as ReportType,
      title: t("reports.keyMetrics.title"),
      description: t("reports.keyMetrics.description"),
      icon: (
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      type: "customerBalance" as ReportType,
      title: t("reports.customerBalance.title"),
      description: t("reports.customerBalance.description"),
      icon: (
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      type: "transactionReport" as ReportType,
      title: t("reports.transactionReport.title"),
      description: t("reports.transactionReport.description"),
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      type: "cashFlowReport" as ReportType,
      title: t("reports.cashFlowReport.title"),
      description: t("reports.cashFlowReport.description"),
      icon: (
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {t("reports.selectReportType")}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t("reports.selectReportTypeDescription")}
        </p>
      </div>

      <div className="p-6 space-y-3">
        {reportTypes.map((reportType) => (
          <button
            key={reportType.type}
            onClick={() => onSelect(reportType.type)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedType === reportType.type
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`flex-shrink-0 ${
                  selectedType === reportType.type
                    ? "text-primary-600"
                    : "text-gray-400"
                }`}
              >
                {reportType.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-medium ${
                    selectedType === reportType.type
                      ? "text-primary-700"
                      : "text-gray-900"
                  }`}
                >
                  {reportType.title}
                </h4>
                <p
                  className={`mt-1 text-sm ${
                    selectedType === reportType.type
                      ? "text-primary-600"
                      : "text-gray-500"
                  }`}
                >
                  {reportType.description}
                </p>
              </div>
              {selectedType === reportType.type && (
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportTypeSelector;
