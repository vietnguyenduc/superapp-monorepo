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
import { TimeRange } from "../Dashboard";

interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  timeRange: TimeRange;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, timeRange }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("dashboard.noCashFlowData")}</p>
      </div>
    );
  }

  // Transform data for proper waterfall chart
  const waterfallData = [];
  let runningTotal = 0;

  // Add start point with initial balance (negative for debt tracking)
  waterfallData.push({
    name: "Số dư đầu kỳ",
    value: -50000000, // Initial debt balance (negative)
    type: "total",
    runningTotal: -50000000,
    date: "Start",
  });

  runningTotal = -50000000;

  // Process each data point
  data.forEach((item) => {
    const netFlow = item.inflow - item.outflow;

    // Add the net flow bar
    waterfallData.push({
      name: item.date,
      value: netFlow,
      type: netFlow >= 0 ? "increase" : "decrease",
      runningTotal: runningTotal + netFlow,
      date: item.date,
      inflow: item.inflow,
      outflow: item.outflow,
      netFlow: netFlow,
    });

    runningTotal += netFlow;
  });

  // Add end point
  waterfallData.push({
    name: "Số dư cuối kỳ",
    value: runningTotal,
    type: "total",
    runningTotal: runningTotal,
    date: "End",
  });

  // Debug log to check data
  console.log("Waterfall data:", waterfallData);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      if (data.type === "total") {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-gray-900">
              {data.name === "Số dư đầu kỳ"
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
            {formatDate(data.date)}
          </p>
          <div className="space-y-1 mt-2">
            <p className="text-sm font-bold text-green-600">
              {t("dashboard.inflow")}: {formatCurrency(data.inflow)}
            </p>
            <p className="text-sm font-bold text-red-600">
              {t("dashboard.outflow")}: {formatCurrency(data.outflow)}
            </p>
            <p
              className={`text-sm font-bold ${data.value >= 0 ? "text-blue-600" : "text-red-600"}`}
            >
              {data.value >= 0
                ? t("dashboard.increase")
                : t("dashboard.decrease")}
              : {formatCurrency(Math.abs(data.value))}
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

  // Format date based on time range
  const formatDate = (dateString: string) => {
    if (dateString === "Số dư đầu kỳ" || dateString === "Số dư cuối kỳ")
      return dateString;

    const date = new Date(dateString);
    switch (timeRange) {
      case "day":
        return date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "week":
        const weekdays = [
          t("dashboard.timeLabels.weekdays.sunday"),
          t("dashboard.timeLabels.weekdays.monday"),
          t("dashboard.timeLabels.weekdays.tuesday"),
          t("dashboard.timeLabels.weekdays.wednesday"),
          t("dashboard.timeLabels.weekdays.thursday"),
          t("dashboard.timeLabels.weekdays.friday"),
          t("dashboard.timeLabels.weekdays.saturday"),
        ];
        return weekdays[date.getDay()];
      case "month":
        const monthNames = [
          "Tháng 1",
          "Tháng 2",
          "Tháng 3",
          "Tháng 4",
          "Tháng 5",
          "Tháng 6",
          "Tháng 7",
          "Tháng 8",
          "Tháng 9",
          "Tháng 10",
          "Tháng 11",
          "Tháng 12",
        ];
        return `${date.getDate()} ${monthNames[date.getMonth()]}`;
      case "quarter":
        const quarterMonthNames = [
          "Tháng 1",
          "Tháng 2",
          "Tháng 3",
          "Tháng 4",
          "Tháng 5",
          "Tháng 6",
          "Tháng 7",
          "Tháng 8",
          "Tháng 9",
          "Tháng 10",
          "Tháng 11",
          "Tháng 12",
        ];
        return quarterMonthNames[date.getMonth()];
      case "year":
        const yearMonthNames = [
          "Tháng 1",
          "Tháng 2",
          "Tháng 3",
          "Tháng 4",
          "Tháng 5",
          "Tháng 6",
          "Tháng 7",
          "Tháng 8",
          "Tháng 9",
          "Tháng 10",
          "Tháng 11",
          "Tháng 12",
        ];
        return yearMonthNames[date.getMonth()];
      default:
        return date.toLocaleDateString("vi-VN");
    }
  };

  return (
    <div className="w-full h-64">
      {/* Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color bg-gray-400"></div>
          <span>Số dư</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-green-400"></div>
          <span>Tăng (thu {">"} chi)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-red-400"></div>
          <span>Giảm (thu {"<"} chi)</span>
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
            tickFormatter={(value) => formatDate(value)}
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
              formatter={(value: number) => formatCurrency(Math.abs(value))}
              style={{ fontSize: "10px", fontWeight: "500" }}
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
