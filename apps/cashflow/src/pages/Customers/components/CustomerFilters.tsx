import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import Button from "../../../components/UI/Button";
import { formatNumber } from "../../../utils/formatting";

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

  const hasActiveFilters = Boolean(dateRange) || (balanceRange?.min != null) || (balanceRange?.max != null);

  const formatBalanceChip = () => {
    const min = balanceRange?.min;
    const max = balanceRange?.max;
    if (min == null && max == null) return null;
    const minText = min != null ? `${formatNumber(min)} đ` : "0 đ";
    const maxText = max != null ? `${formatNumber(max)} đ` : "∞";
    if (min != null && max != null) return `${minText} - ${maxText}`;
    if (min != null) return `≥ ${minText}`;
    return `≤ ${maxText}`;
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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Filter */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsOpen(!isOpen)}
            className="h-10"
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
                <div className="grid grid-cols-1 gap-1 mb-3">
                  {[
                    { k: "today", l: "Hôm nay" },
                    { k: "week", l: "Tuần trước" },
                    { k: "month", l: "Tháng này" },
                    { k: "quarter", l: "Quý này" },
                    { k: "year", l: "Năm nay" },
                  ].map((o) => (
                    <button
                      key={o.k}
                      type="button"
                      onClick={() => handleQuickDateSelect(o.k as any)}
                      className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white transition-colors"
                    >
                      {o.l}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-xs text-gray-500">Từ ngày</span>
                    <input
                      type="date"
                      value={dateRange?.start || ""}
                      onChange={(e) =>
                        handleCustomDateChange("start", e.target.value)
                      }
                      className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-xs text-gray-500">Đến ngày</span>
                    <input
                      type="date"
                      value={dateRange?.end || ""}
                      onChange={(e) =>
                        handleCustomDateChange("end", e.target.value)
                      }
                      className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t("common.reset", "Đặt lại")}
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    {t("common.apply", "Áp dụng")}
                  </button>
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
            min={0}
            placeholder="Dư nợ từ"
            value={minInput}
            onChange={(e) => handleMinChange(e.target.value)}
            className="h-10 w-24 sm:w-28 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Dư nợ đến"
            value={maxInput}
            onChange={(e) => handleMaxChange(e.target.value)}
            className="h-10 w-24 sm:w-28 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="secondary" size="md" onClick={clearFilters} className="h-10">
            Xóa lọc
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Đang lọc:</span>
          {dateRange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
              {formatDateRange()}
              <button
                type="button"
                onClick={() => onDateRangeChange(null)}
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300"
                aria-label="Xóa lọc thời gian"
              >
                ×
              </button>
            </span>
          )}
          {(balanceRange?.min != null || balanceRange?.max != null) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
              Dư nợ: {formatBalanceChip()}
              <button
                type="button"
                onClick={() => onBalanceRangeChange(null)}
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300"
                aria-label="Xóa lọc dư nợ"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerFilters;
