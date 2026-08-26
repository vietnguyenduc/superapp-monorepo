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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Date Range Filter */}
      <div className="relative space-y-1" ref={dropdownRef}>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Thời gian</label>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-full inline-flex items-center justify-between"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <svg
              className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
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
            <span className="truncate">{formatDateRange()}</span>
          </span>
          <svg
            className={`h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
          <div className="absolute z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="p-3 space-y-3">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Khoảng thời gian</div>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { k: "today", l: "Hôm nay" },
                  { k: "week", l: "7 ngày qua" },
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

              <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex items-center gap-2">
                  <span className="w-14 text-xs text-gray-500">Từ</span>
                  <input
                    type="date"
                    value={dateRange?.start || ""}
                    onChange={(e) => handleCustomDateChange("start", e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 text-xs text-gray-500">Đến</span>
                  <input
                    type="date"
                    value={dateRange?.end || ""}
                    onChange={(e) => handleCustomDateChange("end", e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="secondary" size="sm" onClick={handleReset}>
                  {t("common.reset", "Đặt lại")}
                </Button>
                <Button variant="primary" size="sm" onClick={handleApply}>
                  {t("common.apply", "Áp dụng")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Balance Range Filter */}
      <div className="space-y-1 sm:col-span-1 lg:col-span-2">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Dư nợ</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Từ"
            value={minInput}
            onChange={(e) => handleMinChange(e.target.value)}
            className="h-10 flex-1 min-w-0 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-400 flex-shrink-0">-</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Đến"
            value={maxInput}
            onChange={(e) => handleMaxChange(e.target.value)}
            className="h-10 flex-1 min-w-0 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {hasActiveFilters && (
            <Button variant="secondary" size="md" onClick={clearFilters} className="h-10 flex-shrink-0">
              Xóa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerFilters;
