import React, { useState, useRef, useEffect } from "react";
import Button from "./Button";

export interface DateRange {
  start: string;
  end: string;
}

export interface DateRangeFilterProps {
  value?: DateRange;
  onChange: (range: DateRange | null) => void;
  placeholder?: string;
  className?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  placeholder = "Khoảng thời gian",
  className = "",
}) => {
  // const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  // Initialize custom dates when value changes
  useEffect(() => {
    if (value) {
      setCustomStart(value.start);
      setCustomEnd(value.end);
    }
  }, [value]);

  const handleClear = () => {
    setCustomStart("");
    setCustomEnd("");
    onChange(null);
    setIsOpen(false);
  };

  const handleApply = () => {
    if (customStart && customEnd) {
      onChange({ start: customStart, end: customEnd });
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (!value) return placeholder;

    const startDate = new Date(value.start);
    const endDate = new Date(value.end);

    if (value.start === value.end) {
      return startDate.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    return `${startDate.toLocaleDateString("vi-VN", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-left text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
      >
        <span className="flex items-center">
          <svg
            className="w-4 h-4 text-gray-400 mr-2"
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
          {getDisplayText()}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white !bg-white border border-gray-100 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Predefined Ranges */}
          <div className="p-3 border-b border-gray-100 bg-white !bg-white">
            <div className="space-y-1">
              {/* The predefinedRanges array and its mapping are removed as per the edit hint. */}
            </div>
          </div>

          {/* Custom Range */}
          <div className="p-3 border-b border-gray-100 bg-white !bg-white">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Tùy chọn
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors duration-200 bg-white !bg-white text-gray-900 !text-gray-900"
                  placeholder="dd/mm/yyyy"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors duration-200 bg-white !bg-white text-gray-900 !text-gray-900"
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center p-3 border-t border-gray-100 bg-white !bg-white">
            <Button variant="secondary" size="sm" onClick={handleClear}>
              Xóa
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply}>
              Áp dụng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
