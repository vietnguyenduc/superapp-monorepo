import React from "react";

export type InventoryTimeRange = "day" | "week" | "month" | "quarter" | "year";

interface InventoryTimeRangeSelectorProps {
  value: InventoryTimeRange;
  onChange: (range: InventoryTimeRange) => void;
}

const InventoryTimeRangeSelector: React.FC<InventoryTimeRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  const timeRanges: InventoryTimeRange[] = ["day", "week", "month", "quarter", "year"];

  const getRangeLabel = (range: InventoryTimeRange) => {
    switch (range) {
      case "day":
        return "Hôm nay";
      case "week":
        return "Tuần này";
      case "month":
        return "Tháng này";
      case "quarter":
        return "Quý này";
      case "year":
        return "Năm nay";
      default:
        return range;
    }
  };

  return (
    <div className="flex flex-wrap gap-1 bg-gray-50 rounded-xl p-1 overflow-x-auto shadow-sm border border-gray-100">
      {timeRanges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
            value === range
              ? "bg-white text-blue-600 shadow-sm border border-blue-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          {getRangeLabel(range)}
        </button>
      ))}
    </div>
  );
};

export default InventoryTimeRangeSelector;
