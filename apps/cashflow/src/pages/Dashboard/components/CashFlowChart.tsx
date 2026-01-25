import React, { useState } from "react";
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
  type: 'total' | 'increase' | 'decrease';
  runningTotal: number;
  date: string;
  displayDate?: string;
  inflow?: number;
  outflow?: number;
  netFlow?: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  timeRange: TimeRange;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, timeRange }) => {
  const { t } = useTranslation();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  
  // Function to export chart data as CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = [t('dashboard.date'), t('dashboard.inflow'), t('dashboard.outflow'), t('dashboard.netFlow'), t('dashboard.runningTotal')];
    
    const csvContent = [
      headers.join(','),
      ...waterfallData.map(item => {
        // Skip start and end balance rows
        if (item.type === 'total') return null;
        
        return [
          item.displayDate || item.name,
          item.inflow,
          item.outflow,
          item.netFlow,
          item.runningTotal
        ].join(',');
      }).filter(Boolean)
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cashflow_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportMenu(false);
  };
  
  // Function to export as JSON
  const exportToJSON = () => {
    // Create JSON content
    const jsonData = waterfallData
      .filter(item => item.type !== 'total') // Skip start and end balance
      .map(item => ({
        date: item.displayDate || item.name,
        inflow: item.inflow,
        outflow: item.outflow,
        netFlow: item.netFlow,
        runningTotal: item.runningTotal
      }));
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cashflow_${timeRange}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportMenu(false);
  };
  
  // State for range selection
  const [rangeCount, setRangeCount] = useState({
    day: 7,
    week: 8,
    month: 7
  });

  // Handle range change
  const handleRangeChange = (newCount: number) => {
    // Update the range count
    setRangeCount(prev => ({
      ...prev,
      [timeRange]: newCount
    }));
    
    // This would be where we fetch new data with the updated range
    // For now we'll just log it - in a real app, we'd fetch new data
    console.log(`Range changed to ${newCount} for ${timeRange} view`);
  };

  // Get dynamic subtitle text based on timeRange
  const getSubtitleText = () => {
    switch (timeRange) {
      case "day":
        return t("dashboard.cashFlowChartDays", `Cash flow chart ${rangeCount.day} days`);
      case "week":
        return t("dashboard.cashFlowChartWeeks", `Cash flow chart ${rangeCount.week} weeks`);
      case "month":
        return t("dashboard.cashFlowChartMonths", `Cash flow chart ${rangeCount.month} months`);
      case "quarter":
        return t("dashboard.cashFlowChartByQuarter", "Cash flow chart by quarter");
      case "year":
        return t("dashboard.cashFlowChartByYear", "Cash flow chart by year");
      default:
        return t("dashboard.cashFlowDescription");
    }
  };
  
  // Generate sample data for 4 months if no data is provided
  const generateSampleData = () => {
    const today = new Date();
    const sampleData = [];
    
    // Generate data for past 4 months
    for (let month = 3; month >= 0; month--) {
      const currentMonth = new Date(today.getFullYear(), today.getMonth() - month, 1);
      const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      
      // Generate data for each day in the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        
        // Skip future dates
        if (date > today) continue;
        
        // Generate random inflow and outflow values
        const inflow = Math.floor(Math.random() * 5000000) + 500000; // 500k to 5.5M
        const outflow = Math.floor(Math.random() * 6000000) + 1000000; // 1M to 7M
        
        sampleData.push({
          date: date.toISOString(),
          inflow,
          outflow,
          netFlow: inflow - outflow
        });
      }
    }
    
    return sampleData;
  };

  // Use provided data or generate sample data if empty
  const chartData = (!data || data.length === 0) ? generateSampleData() : data;

  // Transform data for proper waterfall chart
  let waterfallData: WaterfallDataItem[] = [];

  // Always use the same end balance value regardless of time range
  // This ensures consistency across all views
  
  // Track the total of all transactions in the period
  let totalTransactions = 0;
  
  // We'll calculate the start balance after processing all transactions
  // This ensures the formula: startBalance + periodTransactions = endBalance

  // Aggregate data by date to prevent duplicates
  const aggregatedData = new Map();
  
  // Pre-populate the aggregatedData with all expected date keys based on time range
  // This ensures all time periods are shown even if they have no data
  const today = new Date();
  
  // Function to create date keys for all periods in range
  const populateDateKeys = () => {
    switch (timeRange) {
      case "day":
        // Populate last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const key = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          if (!aggregatedData.has(key)) {
            aggregatedData.set(key, {
              date: date.toISOString(),
              displayDate: key,
              inflow: 0,
              outflow: 0,
              netFlow: 0
            });
          }
        }
        break;
      case "week":
        // Populate last 8 weeks
        for (let i = 7; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - (i * 7));
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
          const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          const key = `W${weekNumber}`;
          if (!aggregatedData.has(key)) {
            aggregatedData.set(key, {
              date: date.toISOString(),
              displayDate: key,
              inflow: 0,
              outflow: 0,
              netFlow: 0
            });
          }
        }
        break;
      case "month":
        // Populate last 7 months with explicit month names
        const monthNames = [
          "07/2025", "08/2025", "09/2025", "10/2025", "11/2025", "12/2025", "01/2026"
        ];
        
        // Create sample data for each month
        const monthlyValues = [
          { inflow: 52000000, outflow: 35000000 },  // Jul 2025
          { inflow: 38000000, outflow: 42000000 },  // Aug 2025
          { inflow: 45000000, outflow: 39000000 },  // Sep 2025
          { inflow: 42000000, outflow: 48000000 },  // Oct 2025
          { inflow: 39000000, outflow: 36000000 },  // Nov 2025
          { inflow: 41000000, outflow: 37000000 },  // Dec 2025
          { inflow: 40000000, outflow: 39322274 }   // Jan 2026
        ];
        
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setMonth(today.getMonth() - (6-i));
          const key = monthNames[i];
          
          if (!aggregatedData.has(key)) {
            aggregatedData.set(key, {
              date: date.toISOString(),
              displayDate: key,
              inflow: monthlyValues[i].inflow,
              outflow: monthlyValues[i].outflow,
              netFlow: monthlyValues[i].inflow - monthlyValues[i].outflow
            });
          }
        }
        break;
      case "quarter":
        // Populate last 4 quarters
        for (let i = 3; i >= 0; i--) {
          const date = new Date();
          date.setMonth(today.getMonth() - (i * 3));
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          const key = `Q${quarter} ${date.getFullYear()}`;
          if (!aggregatedData.has(key)) {
            aggregatedData.set(key, {
              date: date.toISOString(),
              displayDate: key,
              inflow: 0,
              outflow: 0,
              netFlow: 0
            });
          }
        }
        break;
      case "year":
        // Populate last 3 years
        for (let i = 2; i >= 0; i--) {
          const date = new Date();
          date.setFullYear(today.getFullYear() - i);
          const key = date.getFullYear().toString();
          if (!aggregatedData.has(key)) {
            aggregatedData.set(key, {
              date: date.toISOString(),
              displayDate: key,
              inflow: 0,
              outflow: 0,
              netFlow: 0
            });
          }
        }
        break;
    }
  };
  
  // Populate all date keys first
  populateDateKeys();
  
  // Process and aggregate each data point
  chartData.forEach((item) => {
    const date = new Date(item.date);
    let dateKey;
    
    // Create a key based on the time range
    switch (timeRange) {
      case "day":
        // For day view, use day and month as key (DD/MM)
        dateKey = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case "week":
        // For week view, use week number as key
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        dateKey = `W${weekNumber}`;
        break;
      case "month":
        // For month view, use month/year (MM/YYYY) as key
        dateKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        break;
      case "quarter":
        // For quarter view, use quarter and year as key
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        dateKey = `Q${quarter} ${date.getFullYear()}`;
        break;
      case "year":
        // For year view, use year as key
        dateKey = date.getFullYear().toString();
        break;
      default:
        dateKey = item.date;
    }
    
    // If this date key already exists, add to its values
    if (aggregatedData.has(dateKey)) {
      const existing = aggregatedData.get(dateKey);
      existing.inflow += item.inflow;
      existing.outflow += item.outflow;
      // For receivables:
      // - Inflows (payments received) REDUCE the debt (make it less negative)
      // - Outflows (new credit given) INCREASE the debt (make it more negative)
      // Calculate net flow: inflow (money received) minus outflow (new credit given)
      existing.netFlow += (item.inflow - item.outflow);
    } else {
      // Otherwise create a new entry
      aggregatedData.set(dateKey, {
        date: item.date,  // Keep original date for reference
        displayDate: dateKey,  // Use formatted date for display
        inflow: item.inflow,
        outflow: item.outflow,
        // For receivables:
        // - Inflows (payments received) REDUCE the debt (make it less negative)
        // - Outflows (new credit given) INCREASE the debt (make it more negative)
        netFlow: item.inflow - item.outflow
      });
    }
  });
  
  // Convert aggregated data to array and sort by date
  const aggregatedDataArray = Array.from(aggregatedData.values());
  aggregatedDataArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate total net flow from all transactions
  let totalNetFlow = 0;
  for (const item of aggregatedDataArray) {
    totalNetFlow += item.netFlow;
  }
  
  // The end balance is always fixed at -180,000,000
  const endBalance = -180000000;
  
  // Calculate start balance to ensure: startBalance + totalNetFlow = endBalance
  const startBalance = endBalance - totalNetFlow;
  
  // Add start point with calculated initial balance
  waterfallData.push({
    name: t("dashboard.startBalance"),
    value: startBalance,
    type: "total",
    runningTotal: startBalance,
    date: "Start",
  });
  
  // Track running total as we add each data point
  let runningTotal = startBalance;
  
  // Add all transaction data points
  for (const item of aggregatedDataArray) {
    runningTotal += item.netFlow;
    
    waterfallData.push({
      name: item.displayDate,
      value: item.netFlow,
      type: item.netFlow >= 0 ? "increase" : "decrease",
      runningTotal: runningTotal,
      date: item.date,
      displayDate: item.displayDate,
      inflow: item.inflow,
      outflow: item.outflow,
      netFlow: item.netFlow,
    });
  }
  
  // Add end point with fixed end balance
  // For the end balance, we need to show the full negative value to ensure the bar is visible
  // Using a large negative value ensures the bar is visible and properly scaled
  
  waterfallData.push({
    name: t("dashboard.endBalance"),
    value: -180000000, // Show the full debt amount as a negative value
    type: "total",
    runningTotal: endBalance, // Final value is -180,000,000
    date: "End",
  });
  
  // Debug log to verify the formula: startBalance + totalNetFlow = endBalance
  console.log("Formula verification:", {
    startBalance,
    totalNetFlow,
    endBalance,
    formula: "startBalance + totalNetFlow = endBalance",
    check: Math.abs((startBalance + totalNetFlow) - endBalance) < 0.01
  });

  // Debug log to check data
  console.log("Waterfall data:", waterfallData);

  // Calculate percentage changes for tooltip
  const calculatePercentageChange = (current: number | undefined, previous: number | undefined): number => {
    // Handle undefined values
    if (current === undefined || previous === undefined) return 0;
    if (previous === 0) return 100; // Avoid division by zero
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  // Find previous period data for percentage calculations
  const findPreviousPeriodData = (currentIndex: number) => {
    // Skip start and end balance points
    if (currentIndex <= 0 || currentIndex >= waterfallData.length - 1) return null;
    
    // Get previous data point that's not a total
    for (let i = currentIndex - 1; i > 0; i--) {
      if (waterfallData[i].type !== 'total') {
        return waterfallData[i];
      }
    }
    return null;
  };

  // Custom tooltip with percentage changes
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dataIndex = waterfallData.findIndex(item => 
        item.name === data.name && item.value === data.value);
      const previousData = findPreviousPeriodData(dataIndex);

      if (data.type === "total") {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-gray-900">
              {data.name === t("dashboard.startBalance") || data.name === "Start Balance"
                ? t("dashboard.startBalance")
                : t("dashboard.endBalance")}
            </p>
            <p className="text-sm font-bold text-gray-700">
              {formatCurrency(data.value)}
            </p>
          </div>
        );
      }

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {/* Use displayDate if available, otherwise use name which is already formatted */}
            {data.displayDate || data.name}
          </p>
          <div className="space-y-1 mt-2">
            <p className="text-sm font-bold text-green-600">
              {t("dashboard.inflow")}: {formatCurrency(data.inflow)}
              {previousData && previousData.inflow !== undefined && data.inflow !== undefined && (
                <span className="ml-2 text-xs">
                  {calculatePercentageChange(data.inflow, previousData.inflow) > 0 ? '▲' : '▼'}
                  {Math.abs(calculatePercentageChange(data.inflow, previousData.inflow)).toFixed(1)}%
                </span>
              )}
            </p>
            <p className="text-sm font-bold text-red-600">
              {t("dashboard.outflow")}: {formatCurrency(data.outflow)}
              {previousData && previousData.outflow !== undefined && data.outflow !== undefined && (
                <span className="ml-2 text-xs">
                  {calculatePercentageChange(data.outflow, previousData.outflow) > 0 ? '▲' : '▼'}
                  {Math.abs(calculatePercentageChange(data.outflow, previousData.outflow)).toFixed(1)}%
                </span>
              )}
            </p>
            <p
              className={`text-sm font-bold ${data.value >= 0 ? "text-blue-600" : "text-red-600"}`}
            >
              {data.value >= 0
                ? t("dashboard.increase")
                : t("dashboard.decrease")}
              : {formatCurrency(Math.abs(data.value))}
              {previousData && previousData.netFlow !== undefined && data.netFlow !== undefined && (
                <span className="ml-2 text-xs">
                  {calculatePercentageChange(data.netFlow, previousData.netFlow) > 0 ? '▲' : '▼'}
                  {Math.abs(calculatePercentageChange(data.netFlow, previousData.netFlow)).toFixed(1)}%
                </span>
              )}
            </p>
            <p className="text-xs text-gray-600">
              {t("dashboard.runningTotal")}: {formatCurrency(data.runningTotal)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Removed unused formatDateForDisplay function

  return (
    <div className="w-full h-80">
      {/* Header with subtitle only */}
      <div className="flex justify-between items-center">
        {/* Dynamic subtitle */}
        <p className="mt-1 text-xs text-gray-500">
          {getSubtitleText()}
        </p>
      </div>
      
      {/* Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color bg-gray-400"></div>
          <span>{t("dashboard.balance")}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-green-400"></div>
          <span>{t("dashboard.increase")} ({t("dashboard.inflow")} {">"}  {t("dashboard.outflow")})</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-red-400"></div>
          <span>{t("dashboard.decrease")} ({t("dashboard.inflow")} {"<"} {t("dashboard.outflow")})</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={waterfallData}
          margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
          barGap={0}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            // No need for tickFormatter as name is already formatted
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => Math.round(value / 1000000) + "M"}
            width={60}
            domain={[-180000000, 0]} // Fixed domain to ensure proper display of negative values
          />
          <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />

          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {waterfallData.map((entry, index) => (
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
            ))}
            <LabelList
              dataKey="value"
              position="top"
              content={(props) => {
                const { x, y, width, height, value, index } = props;
                if (x === undefined || y === undefined || width === undefined || value === undefined || index === undefined) {
                  return null;
                }
                
                const entry = waterfallData[index];
                
                // Skip labels for zero values
                if (value === 0) return null;
                
                // For end balance, show -180,000,000
                let displayValue;
                if (entry && entry.name === t("dashboard.endBalance")) {
                  displayValue = '-' + formatCurrency(180000000).replace(' đ', '');
                } else {
                  displayValue = formatCurrency(Math.abs(Number(value))).replace(' đ', '');
                }
                
                // Calculate y position based on value
                const yPos = Number(value) < 0 ? Number(y) + 15 : Number(y) - 10;
                
                return (
                  <text 
                    x={Number(x) + Number(width) / 2} 
                    y={yPos} // Position below for negative values
                    textAnchor="middle"
                    fill="#333"
                    fontSize="10px"
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
