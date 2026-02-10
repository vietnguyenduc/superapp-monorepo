import React from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../components/UI/Button";
import type { TimeRange } from "../Dashboard";

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
    <div className="flex gap-0.5 sm:gap-1">
      {timeRanges.map((range) => (
        <Button
          key={range}
          variant={value === range ? "primary" : "secondary"}
          size="sm"
          onClick={() => onChange(range)}
          className="text-xs px-2 sm:px-3 whitespace-nowrap min-h-[40px]"
        >
          {t(`dashboard.timeRange.${range}`)}
        </Button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;
