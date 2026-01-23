import React from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../components/UI/Button";
import { TimeRange } from "../Dashboard";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  const timeRanges: TimeRange[] = ["day", "week", "month", "quarter", "year"];

  return (
    <div className="flex flex-wrap gap-1 bg-gray-50 rounded-xl p-1 overflow-x-auto shadow-sm border border-gray-100">
      {timeRanges.map((range) => (
        <Button
          key={range}
          variant={value === range ? "primary" : "secondary"}
          size="sm"
          onClick={() => onChange(range)}
          className="text-xs"
        >
          {t(`dashboard.timeRange.${range}`)}
        </Button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;
