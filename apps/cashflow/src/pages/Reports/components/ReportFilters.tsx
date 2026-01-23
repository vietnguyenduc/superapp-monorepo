import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../components/UI/Button";
import { format } from "date-fns";
import { ReportType, ReportFilters as ReportFiltersType } from "../../../types";

interface ReportFiltersProps {
  filters: ReportFiltersType;
  onChange: (filters: Partial<ReportFiltersType>) => void;
  reportType: ReportType;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onChange,
  reportType,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleQuickDateSelect = (
    range: "today" | "week" | "month" | "quarter" | "year" | "custom",
  ) => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (range) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom":
        setIsOpen(true);
        return;
      default:
        return;
    }

    onChange({
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
    });
    setIsOpen(false);
  };

  const handleCustomDateChange = (type: "start" | "end", value: string) => {
    if (!filters.dateRange) {
      onChange({ dateRange: { start: value, end: value } });
    } else {
      onChange({
        dateRange: {
          ...filters.dateRange,
          [type]: value,
        },
      });
    }
  };

  const clearFilters = () => {
    onChange({
      dateRange: undefined,
      groupBy: null,
      sortBy: null,
      sortOrder: "desc",
    });
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!filters.dateRange) return t("reports.filters.allTime");

    const startDate = format(new Date(filters.dateRange.start), "MMM dd, yyyy");
    const endDate = format(new Date(filters.dateRange.end), "MMM dd, yyyy");

    if (filters.dateRange.start === filters.dateRange.end) {
      return startDate;
    }

    return `${startDate} - ${endDate}`;
  };

  const getSortOptions = () => {
    switch (reportType) {
      case "customerBalance":
        return [
          { value: "full_name", label: t("reports.filters.sortBy.name") },
          {
            value: "total_balance",
            label: t("reports.filters.sortBy.balance"),
          },
          {
            value: "last_transaction_date",
            label: t("reports.filters.sortBy.lastTransaction"),
          },
          { value: "created_at", label: t("reports.filters.sortBy.createdAt") },
        ];
      case "transactionReport":
        return [
          {
            value: "transaction_date",
            label: t("reports.filters.sortBy.date"),
          },
          { value: "amount", label: t("reports.filters.sortBy.amount") },
          {
            value: "transaction_type",
            label: t("reports.filters.sortBy.type"),
          },
          { value: "created_at", label: t("reports.filters.sortBy.createdAt") },
        ];
      default:
        return [];
    }
  };

  const getGroupByOptions = () => {
    switch (reportType) {
      case "customerBalance":
        return [
          { value: "branch", label: t("reports.filters.groupBy.branch") },
          { value: "status", label: t("reports.filters.groupBy.status") },
        ];
      case "transactionReport":
        return [
          {
            value: "transaction_type",
            label: t("reports.filters.groupBy.type"),
          },
          { value: "customer", label: t("reports.filters.groupBy.customer") },
          { value: "date", label: t("reports.filters.groupBy.date") },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Range Filter */}
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg
              className="w-4 h-4 mr-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDateRange()}
            <svg
              className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Button>

          {isOpen && (
            <div className="absolute z-10 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  {t("reports.filters.dateRange")}
                </h3>

                {/* Quick Date Options */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button
                    onClick={() => handleQuickDateSelect("today")}
                    className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    {t("reports.filters.today")}
                  </Button>
                  <Button
                    onClick={() => handleQuickDateSelect("week")}
                    className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    {t("reports.filters.lastWeek")}
                  </Button>
                  <Button
                    onClick={() => handleQuickDateSelect("month")}
                    className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    {t("reports.filters.thisMonth")}
                  </Button>
                  <Button
                    onClick={() => handleQuickDateSelect("quarter")}
                    className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    {t("reports.filters.thisQuarter")}
                  </Button>
                  <Button
                    onClick={() => handleQuickDateSelect("year")}
                    className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    {t("reports.filters.thisYear")}
                  </Button>
                </div>

                {/* Custom Date Range */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("reports.filters.startDate")}
                    </label>
                    <input
                      type="date"
                      value={filters.dateRange?.start || ""}
                      onChange={(e) =>
                        handleCustomDateChange("start", e.target.value)
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("reports.filters.endDate")}
                    </label>
                    <input
                      type="date"
                      value={filters.dateRange?.end || ""}
                      onChange={(e) =>
                        handleCustomDateChange("end", e.target.value)
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <Button variant="secondary" size="md" onClick={clearFilters}>
                    {t("reports.filters.clear")}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsOpen(false)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {t("reports.filters.apply")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sort By */}
        {getSortOptions().length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("reports.filters.sortBy")}
            </label>
            <select
              value={filters.sortBy || ""}
              onChange={(e) => onChange({ sortBy: e.target.value || null })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">{t("reports.filters.noSort")}</option>
              {getSortOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort Order */}
        {filters.sortBy && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("reports.filters.sortOrder")}
            </label>
            <select
              value={filters.sortOrder || "desc"}
              onChange={(e) =>
                onChange({ sortOrder: e.target.value as "asc" | "desc" })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="asc">{t("reports.filters.ascending")}</option>
              <option value="desc">{t("reports.filters.descending")}</option>
            </select>
          </div>
        )}

        {/* Group By */}
        {getGroupByOptions().length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("reports.filters.groupBy")}
            </label>
            <select
              value={filters.groupBy || ""}
              onChange={(e) => onChange({ groupBy: e.target.value || null })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">{t("reports.filters.noGroup")}</option>
              {getGroupByOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Include Options */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.includeCharts}
              onChange={(e) => onChange({ includeCharts: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              {t("reports.filters.includeCharts")}
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.includeDetails}
              onChange={(e) => onChange({ includeDetails: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              {t("reports.filters.includeDetails")}
            </span>
          </label>
        </div>

        {/* Clear All Filters */}
        {(filters.dateRange || filters.sortBy || filters.groupBy) && (
          <Button
            variant="secondary"
            size="md"
            onClick={clearFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg
              className="w-4 h-4 mr-1"
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
            {t("reports.filters.clearAll")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReportFilters;
