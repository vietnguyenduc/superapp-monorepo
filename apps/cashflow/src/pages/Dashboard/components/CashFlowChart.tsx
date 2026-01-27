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
  const { t } = useTranslation();
  const [showBalance, setShowBalance] = React.useState(true);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("dashboard.noData")}</p>
      </div>
    );
  }

  const chartData = data;

  // Function to format date based on time range
  const formatDateByTimeRange = (dateStr: string): string => {
    const date = new Date(dateStr);
    switch (timeRange) {
      case "day":
        return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
      case "week":
        {
          const weekStart = new Date(date);
          const day = (weekStart.getDay() + 6) % 7;
          weekStart.setDate(weekStart.getDate() - day);
          return weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" });
        }
      case "month":
        return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
      case "quarter":
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString();
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
    date: "Start",
  });

  // Add each aggregated data point
  let runningTotal = effectiveStartBalance;
  trimmedAggregatedData.forEach((item) => {
    runningTotal += item.netFlow;

    waterfallData.push({
      name: item.displayDate || "",
      value: item.netFlow,
      type: item.netFlow >= 0 ? "increase" : "decrease",
      runningTotal,
      date: item.date,
      displayDate: item.displayDate,
      inflow: item.inflow,
      outflow: item.outflow,
      netFlow: item.netFlow,
    });
  });

  // Add end point with actual end balance
  waterfallData.push({
    name: t("dashboard.endBalance"),
    type: "total",
    value: effectiveEndBalance,
    runningTotal: effectiveEndBalance,
    date: "End",
  });

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
          <p className="font-medium text-gray-900">
            {data.displayDate || data.name}
          </p>
          
          {data.type !== "total" && (
            <>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t("dashboard.inflow")}</span>: {formatCurrency(data.inflow || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t("dashboard.outflow")}</span>: {formatCurrency(data.outflow || 0)}
                </p>
              </div>
              <div className="mt-1 pt-1 border-t border-gray-200">
                <p className="text-sm font-medium" style={{ color: data.netFlow >= 0 ? '#10b981' : '#ef4444' }}>
                  {t("dashboard.netFlow")}: {formatCurrency(data.netFlow || 0)}
                </p>
              </div>
            </>
          )}
          
          <div className="mt-1 pt-1 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {t("dashboard.runningTotal")}: {formatCurrency(data.runningTotal)}
            </p>
          </div>
          
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
  const displayData = showBalance 
    ? waterfallData 
    : waterfallData.filter(entry => entry.type !== "total");

  return (
    <div className="w-full h-96">
      {/* Controls and Legend */}
      <div className="flex justify-between items-center mb-2">
        {/* Legend with integrated toggle */}
        <div className="chart-legend flex items-center gap-3">
          {/* Toggle button styled as checkbox */}
          <div 
            className="legend-item cursor-pointer flex items-center border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50" 
            onClick={() => setShowBalance(!showBalance)}
          >
            <div className="w-4 h-4 border border-gray-400 rounded mr-1 flex items-center justify-center" style={{background: showBalance ? '#4f46e5' : 'white'}}>
              {showBalance && <span className="text-xs text-white">✓</span>}
            </div>
            <span className="text-sm font-medium">{t("dashboard.balance")}</span>
          </div>
          
          <div className="legend-item">
            <div className="legend-color bg-green-400"></div>
            <span>{t("dashboard.increase")} ({t("dashboard.inflow")} {">"} {t("dashboard.outflow")})</span>
          </div>
          
          <div className="legend-item">
            <div className="legend-color bg-red-400"></div>
            <span>{t("dashboard.decrease")} ({t("dashboard.inflow")} {"<"} {t("dashboard.outflow")})</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={displayData}
          margin={{ top: 30, right: 30, left: 10, bottom: 50 }}
          barGap={0}
          barCategoryGap={5}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => {
              // Clean, rounded Y-axis labels
              const absValue = Math.abs(value / 1000000);
              if (absValue === 0) return '0';
              return value < 0 ? `-${Math.round(absValue)}M` : `${Math.round(absValue)}M`;
            }}
            width={50}
            tickCount={7}
            domain={[(dataMin: number) => dataMin * 1.1, (dataMax: number) => dataMax * 1.1]}
          />
          <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />

          <Bar 
            dataKey="value" 
            radius={[6, 6, 0, 0]} 
            barSize={showBalance ? 45 : 60} // Larger bars when balance is hidden
            minPointSize={15}
          >
            {waterfallData.map((entry, index) => {
              // Skip balance bars if showBalance is false
              if (!showBalance && entry.type === "total") {
                return null;
              }
              
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.type === "total"
                      ? "#bdbdbd"
                      : entry.value >= 0
                        ? "#92cf9a"
                        : "#ed6455"
                  }
                />
              );
            })}
            <LabelList
              dataKey="value"
              position="top"
              content={(props) => {
                const { x, y, width, value, index } = props;
                if (x === undefined || y === undefined || width === undefined || value === undefined || index === undefined) {
                  return null;
                }
                
                const entry = waterfallData[index];
                
                // Skip labels for zero values or balance bars when hidden
                if (value === 0) return null;
                if (!showBalance && entry && entry.type === "total") return null;
                
                // Special handling for start balance
                if (entry && entry.name === t("dashboard.startBalance")) {
                  const formattedValue = formatNumberForDisplay(entry.value);
                  return (
                    <text 
                      x={Number(x) + Number(width) / 2} 
                      y={Number(y) + 15} // Position below for negative values
                      textAnchor="middle"
                      fill="#333"
                      fontSize="12px"
                      fontWeight="600"
                    >
                      {formattedValue}
                    </text>
                  );
                }
                
                // Regular values
                const absValue = Math.abs(Number(value));
                if (absValue < 500) return null; // Skip very small values
                
                const displayValue = formatNumberForDisplay(Number(value));
                const yPos = Number(value) < 0 ? Number(y) + 15 : Number(y) - 12;
                
                return (
                  <text 
                    x={Number(x) + Number(width) / 2} 
                    y={yPos}
                    textAnchor="middle"
                    fill="#333"
                    fontSize="11px"
                    fontWeight="500"
                  >
                    {displayValue}
                  </text>
                );
              }}
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
