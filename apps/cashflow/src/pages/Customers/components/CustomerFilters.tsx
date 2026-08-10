import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import Button from "../../../components/UI/Button";

interface CustomerFiltersProps {
  dateRange: { start: string; end: string } | null;
  onDateRangeChange: (dateRange: { start: string; end: string } | null) => void;
  balanceRange: { min: number | null; max: number | null } | null;
  onBalanceRangeChange: (balanceRange: { min: number | null; max: number | null } | null) => void;
}

const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  dateRange,
  onDateRangeChange,
  balanceRange,
  onBalanceRangeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [minInput, setMinInput] = useState(balanceRange?.min ?? "");
  const [maxInput, setMaxInput] = useState(balanceRange?.max ?? "");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setMinInput(balanceRange?.min ?? "");
    setMaxInput(balanceRange?.max ?? "");
  }, [balanceRange?.min, balanceRange?.max]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQuickDateSelect = (
    range: "today" | "week" | "month" | "quarter" | "year" | "custom",
  ) => {
    const now = new Date();
    let start: Date;
    const end: Date = now;

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

    onDateRangeChange({
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    });
    setIsOpen(false);
  };

  const handleCustomDateChange = (type: "start" | "end", value: string) => {
    if (!dateRange) {
      onDateRangeChange({ start: value, end: value });
    } else {
      onDateRangeChange({
        ...dateRange,
        [type]: value,
      });
    }
  };

  const clearFilters = () => {
    onDateRangeChange(null);
    onBalanceRangeChange(null);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!dateRange) return "Tất cả thời gian";

    const startDate = format(new Date(dateRange.start), "dd/MM/yyyy");
    const endDate = format(new Date(dateRange.end), "dd/MM/yyyy");

    if (dateRange.start === dateRange.end) {
      return startDate;
    }

    return `${startDate} - ${endDate}`;
  };

  const handleReset = () => {
    clearFilters();
    setIsOpen(false);
  };

  const handleApply = () => {
    setIsOpen(false);
  };

  const handleMinChange = (value: string) => {
    const num = value === "" ? null : Number(value);
    const nextMin = Number.isFinite(num) && num !== null ? num : null;
    const nextMax = maxInput === "" ? null : Number(maxInput);
    setMinInput(value);
    onBalanceRangeChange({
      min: nextMin,
      max: Number.isFinite(nextMax) ? nextMax : null,
    });
  };

  const handleMaxChange = (value: string) => {
    const num = value === "" ? null : Number(value);
    const nextMax = Number.isFinite(num) && num !== null ? num : null;
    const nextMin = minInput === "" ? null : Number(minInput);
    setMaxInput(value);
    onBalanceRangeChange({
      min: Number.isFinite(nextMin) ? nextMin : null,
      max: nextMax,
    });
  };

  const hasActiveFilters = Boolean(dateRange) || (balanceRange?.min != null) || (balanceRange?.max != null);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Date Range Filter */}
      <div className="relative" ref={dropdownRef}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg
            className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500"
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
          <div className="absolute z-50 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-12rem)] overflow-y-auto bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Khoảng thời gian
              </h3>

              {/* Quick Date Options */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  onClick={() => handleQuickDateSelect("today")}
                  className="text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 rounded-md transition-colors"
                >
                  Hôm nay
                </Button>
                <Button
                  onClick={() => handleQuickDateSelect("week")}
                  className="text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 rounded-md transition-colors"
                >
                  Tuần trước
                </Button>
                <Button
                  onClick={() => handleQuickDateSelect("month")}
                  className="text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 rounded-md transition-colors"
                >
                  Tháng này
                </Button>
                <Button
                  onClick={() => handleQuickDateSelect("quarter")}
                  className="text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 rounded-md transition-colors"
                >
                  Quý này
                </Button>
                <Button
                  onClick={() => handleQuickDateSelect("year")}
                  className="text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 rounded-md transition-colors"
                >
                  Năm nay
                </Button>
              </div>

              {/* Custom Date Range */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={dateRange?.start || ""}
                    onChange={(e) =>
                      handleCustomDateChange("start", e.target.value)
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={dateRange?.end || ""}
                    onChange={(e) =>
                      handleCustomDateChange("end", e.target.value)
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-4">
                <Button variant="secondary" size="md" onClick={handleReset}>
                  {t("common.reset")}
                </Button>
                <Button variant="primary" size="md" onClick={handleApply}>
                  {t("common.apply")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Balance Range Filter */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Dư nợ từ"
          value={minInput}
          onChange={(e) => handleMinChange(e.target.value)}
          className="w-28 sm:w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="Dư nợ đến"
          value={maxInput}
          onChange={(e) => handleMaxChange(e.target.value)}
          className="w-28 sm:w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
            {dateRange ? formatDateRange() : ""}
            {dateRange && (balanceRange?.min != null || balanceRange?.max != null) && " · "}
            {(balanceRange?.min != null || balanceRange?.max != null) && `${balanceRange?.min ?? 0} - ${balanceRange?.max ?? "∞"}`}
            <button
              onClick={clearFilters}
              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-700 hover:text-primary-500 dark:hover:text-primary-100 focus:outline-none focus:bg-primary-500 focus:text-white"
            >
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </span>
        </div>
      )}
    </div>
  );
};

export default CustomerFilters;
