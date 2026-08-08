import React from "react";
import { useTranslation } from "react-i18next";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "../../../utils/formatting";
import type { TimeRange } from "../Dashboard";

interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

interface ChartDataItem {
  name: string;
  type: "total" | "increase" | "decrease";
  runningTotal: number;
  inflow: number;
  outflow: number;
  netFlow: number;
  date: string;
  displayDate?: string;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  timeRange: TimeRange;
  startBalance?: number;
  endBalance?: number;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, timeRange, startBalance, endBalance }) => {
  const { t, i18n } = useTranslation();
  const [showBalance, setShowBalance] = React.useState(true);
  const isDark = typeof document !== "undefined"
    && document.documentElement.classList.contains("dark");
  const axisLabelColor = isDark ? "#e5e7eb" : "#374151";
  const axisLineColor = isDark ? "#4b5563" : "#9ca3af";
  const gridLineColor = isDark ? "#374151" : "#e5e7eb";
  const referenceLineColor = isDark ? "#9ca3af" : "#9ca3af";
  const locale = i18n.language === "vi" ? "vi-VN" : undefined;

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-300">{t("dashboard.noData")}</p>
      </div>
    );
  }

  const chartData = data;

  // Function to format date based on time range
  const formatDateByTimeRange = (dateStr: string): string => {
    const date = new Date(dateStr);
    switch (timeRange) {
      case "day":
        return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
      case "week":
        {
          const weekStart = new Date(date);
          const day = (weekStart.getDay() + 6) % 7;
          weekStart.setDate(weekStart.getDate() - day);
          return weekStart.toLocaleDateString(locale, { day: "numeric", month: "short" });
        }
      case "month":
        return date.toLocaleDateString(locale, { month: "short", year: "numeric" });
      case "quarter":
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString(locale);
    }
  };

  // Aggregate data by date to prevent duplicates
  const aggregatedData: Record<string, {
    inflow: number;
    outflow: number;
    netFlow: number;
    date: string;
    displayDate: string;
  }> = {};

  // Pre-populate date keys based on time range to ensure all periods are represented
  const populateDateKeys = () => {
    const latestDate = chartData.length
      ? new Date(Math.max(...chartData.map((item) => new Date(item.date).getTime())))
      : new Date();

    switch (timeRange) {
      case "day":
        // Populate for the number of days in chartData
        for (let i = chartData.length - 1; i >= 0; i--) {
          const date = new Date(latestDate);
          date.setDate(latestDate.getDate() - i);
          const dateKey = formatDateByTimeRange(date.toISOString());

          aggregatedData[dateKey] = {
            inflow: 0,
            outflow: 0,
            netFlow: 0,
            date: date.toISOString(),
            displayDate: dateKey
          };
        }
        break;

      case "week":
        // Populate for the number of weeks in chartData
        {
          const weekStart = new Date(latestDate);
          const day = (weekStart.getDay() + 6) % 7;
          weekStart.setDate(weekStart.getDate() - day);
          for (let i = chartData.length - 1; i >= 0; i--) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() - (i * 7));
          const dateKey = formatDateByTimeRange(date.toISOString());

          aggregatedData[dateKey] = {
            inflow: 0,
            outflow: 0,
            netFlow: 0,
            date: date.toISOString(),
            displayDate: dateKey
          };
        }
        }
        break;

      case "month":
        // Populate for the number of months in chartData
        for (let i = chartData.length - 1; i >= 0; i--) {
          const date = new Date(latestDate);
          date.setMonth(latestDate.getMonth() - i);
          const dateKey = formatDateByTimeRange(date.toISOString());

          aggregatedData[dateKey] = {
            inflow: 0,
            outflow: 0,
            netFlow: 0,
            date: date.toISOString(),
            displayDate: dateKey
          };
        }
        break;

      case "quarter":
        // Populate for 4 quarters
        for (let i = 3; i >= 0; i--) {
          const date = new Date(latestDate);
          date.setMonth(latestDate.getMonth() - (i * 3));
          const dateKey = formatDateByTimeRange(date.toISOString());

          aggregatedData[dateKey] = {
            inflow: 0,
            outflow: 0,
            netFlow: 0,
            date: date.toISOString(),
            displayDate: dateKey
          };
        }
        break;

      case "year":
        // Use actual years from data instead of hardcoded years
        if (chartData && chartData.length > 0) {
          // Extract unique years from the actual data
          const years = [...new Set(chartData.map(item => {
            const date = new Date(item.date);
            return date.getFullYear();
          }))].sort();

          // If we have years in the data, use them
          if (years.length > 0) {
            years.forEach(year => {
              const date = new Date(year, 0, 1); // January 1st of that year
              const dateKey = formatDateByTimeRange(date.toISOString());

              aggregatedData[dateKey] = {
                inflow: 0,
                outflow: 0,
                netFlow: 0,
                date: date.toISOString(),
                displayDate: dateKey
              };
            });
            break;
          }
        }

        // Fallback to current year if no data
        const date = new Date();
        const dateKey = formatDateByTimeRange(date.toISOString());

        aggregatedData[dateKey] = {
          inflow: 0,
          outflow: 0,
          netFlow: 0,
          date: date.toISOString(),
          displayDate: dateKey
        };
        break;
    }
  };

  // Pre-populate date keys
  populateDateKeys();

  // Aggregate data by date
  chartData.forEach(item => {
    const dateKey = formatDateByTimeRange(item.date);

    if (aggregatedData[dateKey]) {
      aggregatedData[dateKey].inflow += item.inflow;
      aggregatedData[dateKey].outflow += item.outflow;
      aggregatedData[dateKey].netFlow += item.netFlow;
    } else {
      aggregatedData[dateKey] = {
        inflow: item.inflow,
        outflow: item.outflow,
        netFlow: item.netFlow,
        date: item.date,
        displayDate: dateKey
      };
    }
  });

  // Convert aggregated data to array and sort by date
  const aggregatedDataArray = Object.values(aggregatedData).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const expectedCount = chartData.length;
  const trimmedAggregatedData =
    expectedCount > 0
      ? aggregatedDataArray.slice(-expectedCount)
      : aggregatedDataArray;

  const effectiveStartBalance = typeof startBalance === "number" ? startBalance : 0;
  const totalNetFlow = trimmedAggregatedData.reduce((sum, item) => sum + item.netFlow, 0);
  const effectiveEndBalance = typeof endBalance === "number" ? endBalance : effectiveStartBalance + totalNetFlow;

  // Build chart data: inflow (positive), outflow (negative) and running total
  const chartItems: ChartDataItem[] = [];

  let runningTotal = effectiveStartBalance;
  chartItems.push({
    name: t("dashboard.startBalance"),
    type: "total",
    runningTotal: effectiveStartBalance,
    inflow: 0,
    outflow: 0,
    netFlow: 0,
    date: "Start",
  });

  trimmedAggregatedData.forEach((item) => {
    const nextTotal = runningTotal + item.netFlow;
    chartItems.push({
      name: item.displayDate || "",
      type: item.netFlow >= 0 ? "increase" : "decrease",
      runningTotal: nextTotal,
      inflow: item.inflow,
      outflow: -item.outflow,
      netFlow: item.netFlow,
      date: item.date,
      displayDate: item.displayDate,
    });
    runningTotal = nextTotal;
  });

  chartItems.push({
    name: t("dashboard.endBalance"),
    type: "total",
    runningTotal: effectiveEndBalance,
    inflow: 0,
    outflow: 0,
    netFlow: 0,
    date: "End",
  });

  const displayData = chartItems;
  const barSize = Math.max(16, Math.min(40, Math.round(320 / Math.max(displayData.length, 1))));
  const barCategoryGap = 12;
  const xAxisPadding = { left: 12, right: 12 };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataItem;

      return (
        <div className="bg-white dark:bg-gray-800 p-3 shadow-md rounded-md border border-gray-200 dark:border-gray-600">
          <p className="font-medium text-gray-900 dark:text-white">
            {data.displayDate || data.name}
          </p>

          {data.type !== "total" && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{t("dashboard.inflow")}</span>: {formatCurrency(data.inflow || 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{t("dashboard.outflow")}</span>: {formatCurrency(Math.abs(data.outflow || 0))}
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("dashboard.delta")}: {formatCurrency(data.netFlow || 0)}
              </p>
            </div>
          )}

          {showBalance && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("dashboard.runningTotal")}: {formatCurrency(data.runningTotal)}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const formatYAxisTick = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) {
      return `${value < 0 ? "-" : ""}${Math.round(abs / 1_000_000)}M`;
    }
    if (abs >= 1_000) {
      return `${value < 0 ? "-" : ""}${Math.round(abs / 1_000)}K`;
    }
    return value.toString();
  };

  return (
    <div className="w-full h-80 sm:h-96">
      {/* Controls and Legend */}
      <div className="flex justify-between items-center mb-2">
        <div className="chart-legend flex items-center gap-3 flex-wrap">
          <div
            className="legend-item cursor-pointer flex items-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setShowBalance(!showBalance)}
          >
            <div
              className="w-4 h-4 border border-gray-400 dark:border-gray-500 rounded mr-1 flex items-center justify-center"
              style={{ background: showBalance ? "#4f46e5" : "#1f2937" }}
            >
              {showBalance && <span className="text-xs text-white">✓</span>}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-100">
              {t("dashboard.balance")}
            </span>
          </div>

          <div className="legend-item">
            <div className="legend-color bg-emerald-500 dark:bg-emerald-400"></div>
            <span className="text-gray-700 dark:text-gray-100 text-sm">
              {t("dashboard.inflow")}
            </span>
          </div>

          <div className="legend-item">
            <div className="legend-color bg-rose-500 dark:bg-rose-400"></div>
            <span className="text-gray-700 dark:text-gray-100 text-sm">
              {t("dashboard.outflow")}
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={displayData}
          margin={{ top: 20, right: 20, left: 5, bottom: 40 }}
          barGap={0}
          barCategoryGap={barCategoryGap}
          stackOffset="sign"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: axisLabelColor, fontWeight: 600 }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
            tickLine={false}
            padding={xAxisPadding}
            axisLine={{ stroke: axisLineColor }}
          />
          <YAxis
            tick={{ fontSize: 10, fontWeight: 600, fill: axisLabelColor }}
            tickFormatter={formatYAxisTick}
            width={50}
            tickCount={7}
            domain={["auto", "auto"]}
            axisLine={{ stroke: axisLineColor }}
          />
          <ReferenceLine y={0} stroke={referenceLineColor} strokeDasharray="4 3" />
          <Tooltip content={<CustomTooltip />} />

          <Bar
            dataKey="inflow"
            name={t("dashboard.inflow")}
            stackId="flow"
            fill="#10b981"
            barSize={barSize}
          />
          <Bar
            dataKey="outflow"
            name={t("dashboard.outflow")}
            stackId="flow"
            fill="#f43f5e"
            barSize={barSize}
          />
          {showBalance && (
            <Line
              type="monotone"
              dataKey="runningTotal"
              name={t("dashboard.balance")}
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
