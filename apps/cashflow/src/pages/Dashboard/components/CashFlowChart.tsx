import React from "react";
import { useTranslation } from "react-i18next";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
  Customized,
} from "recharts";
import { formatCurrency } from "../../../utils/formatting";
import type { TimeRange } from "../Dashboard";

interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

interface WaterfallDataItem {
  name: string;
  value: number;
  type: "total" | "increase" | "decrease";
  runningTotal: number;
  base: number;
  delta: number;
  date: string;
  displayDate?: string;
  inflow?: number;
  outflow?: number;
  netFlow?: number;
  isEndBalance?: boolean;
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
  
  // Transform data for waterfall chart
  const waterfallData: WaterfallDataItem[] = [];
  
  // Add start point with calculated initial balance
  waterfallData.push({
    name: t("dashboard.startBalance"),
    value: effectiveStartBalance,
    type: "total",
    runningTotal: effectiveStartBalance,
    base: 0,
    delta: effectiveStartBalance,
    date: "Start",
  });

  // Add each aggregated data point
  let runningTotal = effectiveStartBalance;
  trimmedAggregatedData.forEach((item) => {
    const nextTotal = runningTotal + item.netFlow;
    const base = Math.min(runningTotal, nextTotal);
    const delta = Math.abs(item.netFlow);

    waterfallData.push({
      name: item.displayDate || "",
      value: item.netFlow,
      type: item.netFlow >= 0 ? "increase" : "decrease",
      runningTotal: nextTotal,
      base,
      delta,
      date: item.date,
      displayDate: item.displayDate,
      inflow: item.inflow,
      outflow: item.outflow,
      netFlow: item.netFlow,
    });

    runningTotal = nextTotal;
  });

  // Add end point with actual end balance
  waterfallData.push({
    name: t("dashboard.endBalance"),
    type: "total",
    value: effectiveEndBalance,
    runningTotal: effectiveEndBalance,
    base: 0,
    delta: effectiveEndBalance,
    date: "End",
  });

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 shadow-md rounded-md border border-gray-200 dark:border-gray-600">
          <p className="font-medium text-gray-900 dark:text-white">
            {data.displayDate || data.name}
          </p>
          {showBalance && (
            <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("dashboard.runningTotal")}: {formatCurrency(data.runningTotal)}
              </p>
            </div>
          )}
          
          {data.type !== "total" && (
            <>
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{t("dashboard.inflow")}</span>: {formatCurrency(data.inflow || 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{t("dashboard.outflow")}</span>: {formatCurrency(data.outflow || 0)}
                </p>
              </div>
              <div className="mt-1 pt-2 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t("dashboard.delta")}: {formatCurrency(data.delta || 0)}
                </p>
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Function to format numbers for display
  const formatNumberForDisplay = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${value < 0 ? '-' : ''}${Math.round(absValue / 1000000)}M`;
    } else if (absValue >= 1000) {
      return `${value < 0 ? '-' : ''}${Math.round(absValue / 1000)}K`;
    }
    return value.toString();
  };

  // Filter data to exclude balance bars if showBalance is false
  const balanceOffset = showBalance ? 0 : effectiveStartBalance;
  const displayData = showBalance 
    ? waterfallData 
    : waterfallData
        .filter(entry => entry.type !== "total")
        .map((entry) => ({
          ...entry,
          base: Number(entry.base ?? 0) - balanceOffset,
        }));

  const noBalanceBarSize = Math.max(32, Math.min(60, Math.round(260 / Math.max(displayData.length, 1))));
  const barSize = showBalance ? 45 : noBalanceBarSize;
  const barCategoryGap = showBalance ? 5 : 12;
  const xAxisPadding = showBalance ? { left: 0, right: 0 } : { left: 12, right: 12 };

  const renderConnectors = (props: any) => {
    const { xAxisMap, yAxisMap, formattedGraphicalItems } = props || {};
    const xAxis = xAxisMap?.[0];
    const yAxis = yAxisMap?.[0];
    if (!xAxis || !yAxis) return null;

    const scaleX = xAxis.scale;
    const scaleY = yAxis.scale;
    if (!scaleX || !scaleY) return null;

    const bandWidth = scaleX.bandwidth ? scaleX.bandwidth() : 0;
    const barWidth = Math.min(barSize, bandWidth || 0);
    const barOffset = Math.max(0, (bandWidth - barWidth) / 2);

    const barItem = Array.isArray(formattedGraphicalItems)
      ? formattedGraphicalItems.find((item: any) => item?.props?.dataKey === "delta")
      : null;
    const barRects = Array.isArray(barItem?.props?.data) ? barItem.props.data : null;
    const useRects = Array.isArray(barRects) && barRects.length >= displayData.length;

    return (
      <g>
        {displayData.slice(0, -1).map((entry, index) => {
          const next = displayData[index + 1];
          if (!next) return null;

          const startX = scaleX(entry.name);
          const endX = scaleX(next.name);
          if (startX === undefined || endX === undefined) return null;

          if (useRects) {
            const rect = barRects[index];
            const nextRect = barRects[index + 1];
            if (!rect || !nextRect) return null;
            const x1 = Number(rect.x) + Number(rect.width);
            const x2 = Number(nextRect.x);
            const y = Number(entry.value) < 0
              ? Number(rect.y) + Number(rect.height)
              : Number(rect.y);
            if (!Number.isFinite(x1) || !Number.isFinite(x2) || !Number.isFinite(y)) {
              return null;
            }
            return (
              <line
                key={`connector-${entry.name}-${next.name}`}
                x1={x1}
                x2={x2}
                y1={y}
                y2={y}
                stroke="#6B7280"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            );
          }

          const x1 = startX + barOffset + barWidth;
          const x2 = endX + barOffset;
          const entryBase = Number(entry.base ?? 0);
          const entryDelta = Number(entry.delta ?? 0);
          const entryEnd = entry.type === "decrease" ? entryBase : entryBase + entryDelta;
          const y = scaleY(entryEnd);
          if (!Number.isFinite(x1) || !Number.isFinite(x2) || !Number.isFinite(y)) {
            return null;
          }

          return (
            <line
              key={`connector-${entry.name}-${next.name}`}
              x1={x1}
              x2={x2}
              y1={y}
              y2={y}
              stroke="#6B7280"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          );
        })}
      </g>
    );
  };

  return (
    <div className="w-full h-80 sm:h-96">
      {/* Controls and Legend */}
      <div className="flex justify-between items-center mb-2">
        {/* Legend with integrated toggle */}
        <div className="chart-legend flex items-center gap-3">
          {/* Toggle button styled as checkbox */}
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
            <div className="legend-color bg-emerald-400 dark:bg-emerald-300"></div>
            <span className="text-gray-700 dark:text-gray-100">
              {t("dashboard.increase")} ({t("dashboard.inflow")} {">"} {t("dashboard.outflow")})
            </span>
          </div>
          
          <div className="legend-item">
            <div className="legend-color bg-rose-400 dark:bg-rose-300"></div>
            <span className="text-gray-700 dark:text-gray-100">
              {t("dashboard.decrease")} ({t("dashboard.inflow")} {"<"} {t("dashboard.outflow")})
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
            tickFormatter={(value) => {
              // Clean, rounded Y-axis labels
              const absValue = Math.abs(value / 1000000);
              if (absValue === 0) return '0';
              return value < 0 ? `-${Math.round(absValue)}M` : `${Math.round(absValue)}M`;
            }}
            width={50}
            tickCount={7}
            domain={[(dataMin: number) => dataMin * 1.1, (dataMax: number) => dataMax * 1.1]}
            axisLine={{ stroke: axisLineColor }}
          />
          <ReferenceLine y={0} stroke={referenceLineColor} strokeDasharray="4 3" />
          <Tooltip content={<CustomTooltip />} />

          <Bar dataKey="base" stackId="flow" fill="transparent" barSize={barSize} />
          <Bar
            dataKey="delta"
            stackId="flow"
            barSize={barSize}
          >
            {displayData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.type === "total"
                    ? "#e5e7eb"
                    : entry.value >= 0
                      ? "#22c55e"
                      : "#f97316"
                }
              />
            ))}
            <LabelList
              dataKey="delta"
              position="top"
              content={(props) => {
                const { x, y, width, height, index } = props;
                if (x === undefined || y === undefined || width === undefined || height === undefined || index === undefined) {
                  return null;
                }

                const entry = displayData[index];
                if (!entry) return null;

                const labelValue = entry.type === "total" ? entry.runningTotal : entry.value;
                if (labelValue === 0) return null;

                const absValue = Math.abs(Number(labelValue));
                if (absValue < 500) return null;

                const displayValue = formatNumberForDisplay(Number(labelValue));
                const yPos = Number(labelValue) < 0
                  ? Number(y) + Number(height) + 14
                  : Number(y) - 10;

                return (
                  <text
                    x={Number(x) + Number(width) / 2}
                    y={yPos}
                    textAnchor="middle"
                    fill="#f3f4f6"
                    fontSize="11px"
                    fontWeight={entry.type === "total" ? "600" : "500"}
                  >
                    {displayValue}
                  </text>
                );
              }}
            />
          </Bar>
          <Customized component={renderConnectors} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
