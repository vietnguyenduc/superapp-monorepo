import React, { useState } from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from "date-fns";
import { vi } from "date-fns/locale";

interface TimeRangeFilterProps {
  value: {
    start: string;
    end: string;
  } | null;
  onChange: (range: { start: string; end: string } | null) => void;
  placeholder?: string;
}

const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  value,
  onChange,
  placeholder = "Tất cả thời gian",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const today = new Date();

  const predefinedRanges = [
    {
      label: "Hôm nay",
      start: format(today, "yyyy-MM-dd"),
      end: format(today, "yyyy-MM-dd"),
    },
    {
      label: "Tuần trước",
      start: format(
        startOfWeek(subDays(today, 7), { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      ),
      end: format(
        endOfWeek(subDays(today, 7), { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      ),
    },
    {
      label: "Tháng này",
      start: format(startOfMonth(today), "yyyy-MM-dd"),
      end: format(endOfMonth(today), "yyyy-MM-dd"),
    },
    {
      label: "Quý này",
      start: format(startOfQuarter(today), "yyyy-MM-dd"),
      end: format(endOfQuarter(today), "yyyy-MM-dd"),
    },
    {
      label: "Năm nay",
      start: format(startOfYear(today), "yyyy-MM-dd"),
      end: format(endOfYear(today), "yyyy-MM-dd"),
    },
  ];

  const [customStart, setCustomStart] = useState(value?.start || "");
  const [customEnd, setCustomEnd] = useState(value?.end || "");

  const handlePredefinedRange = (range: { start: string; end: string }) => {
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      onChange({ start: customStart, end: customEnd });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setCustomStart("");
    setCustomEnd("");
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!value) return placeholder;

    const startDate = format(new Date(value.start), "dd/MM/yyyy", {
      locale: vi,
    });
    const endDate = format(new Date(value.end), "dd/MM/yyyy", { locale: vi });

    if (value.start === value.end) {
      return startDate;
    }

    return `${startDate} - ${endDate}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
        {getDisplayText()}
        <svg
          className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
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

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Khoảng thời gian
            </h3>

            {/* Predefined ranges */}
            <div className="space-y-2 mb-4">
              {predefinedRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => handlePredefinedRange(range)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Custom range */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Tùy chọn
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Xóa
              </button>
              <button
                onClick={handleCustomRange}
                disabled={!customStart || !customEnd}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeRangeFilter;
