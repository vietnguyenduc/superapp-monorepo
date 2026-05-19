import React, { useState } from "react";
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
import { formatNumber } from "../../utils/formatting";

interface InventoryFlowData {
  date: string;
  inflow: number; // Nhập
  outflow: number; // Xuất
  netFlow: number; // Nhập - Xuất
}

interface WaterfallDataItem {
  name: string;
  value: number;
  type: "increase" | "decrease";
  runningTotal: number;
  base: number;
  delta: number;
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

interface Props {
  data: InventoryFlowData[];
  startBalance?: number;
}

const InventoryWaterfallChart: React.FC<Props> = ({ data, startBalance = 0 }) => {
  const [showBalance, setShowBalance] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Chưa có dữ liệu
      </div>
    );
  }

  // Ensure data is sorted by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const waterfallData: WaterfallDataItem[] = [];

  const effectiveStartBalance = showBalance ? 0 : startBalance;

  if (!showBalance) {
    waterfallData.push({
      name: 'Tồn đầu kỳ',
      value: effectiveStartBalance,
      type: 'increase',
      runningTotal: effectiveStartBalance,
      base: 0,
      delta: effectiveStartBalance,
      date: 'Đầu kỳ',
      inflow: effectiveStartBalance,
      outflow: 0,
      netFlow: effectiveStartBalance,
    });
  }

  let runningTotal = effectiveStartBalance;
  sortedData.forEach((item) => {
    const nextTotal = runningTotal + item.netFlow;
    const base = Math.min(runningTotal, nextTotal);
    const delta = Math.abs(item.netFlow);

    waterfallData.push({
      name: item.date,
      value: item.netFlow,
      type: item.netFlow >= 0 ? "increase" : "decrease",
      runningTotal: nextTotal,
      base,
      delta,
      date: item.date,
      inflow: item.inflow,
      outflow: item.outflow,
      netFlow: item.netFlow,
    });

    runningTotal = nextTotal;
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
          <p className="font-medium text-gray-900">{pData.name}</p>
          {showBalance && (
            <div className="mt-1 pt-1 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                Lũy kế: {formatNumber(pData.runningTotal)}
              </p>
            </div>
          )}
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-emerald-600">Nhập kho:</span>{" "}
              {formatNumber(pData.inflow)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-rose-600">Xuất kho:</span>{" "}
              {formatNumber(pData.outflow)}
            </p>
          </div>
          <div className="mt-1 pt-2 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              Chênh lệch: {formatNumber(pData.netFlow)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // No longer subtract startBalance; let "Lũy kế" just mean showing the running line instead of hiding it.
  const displayData = showBalance
    ? waterfallData
    : waterfallData;


  const barSize = 30;
  const barCategoryGap = 8;
  const xAxisPadding = { left: 12, right: 12 };

  const renderConnectors = (props: any) => {
    const { xAxisMap, yAxisMap } = props || {};
    const xAxis = xAxisMap?.[0];
    const yAxis = yAxisMap?.[0];
    if (!xAxis || !yAxis) return null;

    const scaleX = xAxis.scale;
    const scaleY = yAxis.scale;
    if (!scaleX || !scaleY) return null;

    const bandWidth = scaleX.bandwidth ? scaleX.bandwidth() : 0;
    const barWidth = Math.min(barSize, bandWidth || 0);
    const barOffset = Math.max(0, (bandWidth - barWidth) / 2);

    return (
      <g>
        {displayData.slice(0, -1).map((entry, index) => {
          const next = displayData[index + 1];
          if (!next) return null;

          const startX = scaleX(entry.name);
          const endX = scaleX(next.name);
          if (startX === undefined || endX === undefined) return null;

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
              stroke="#9ca3af"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          );
        })}
      </g>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-2 px-2">
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <div
            className="cursor-pointer flex items-center border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 transition-colors"
            onClick={() => setShowBalance(!showBalance)}
          >
            <div
              className="w-3.5 h-3.5 border border-gray-400 rounded mr-1.5 flex items-center justify-center transition-colors"
              style={{ background: showBalance ? "#3b82f6" : "transparent" }}
            >
              {showBalance && <span className="text-[10px] text-white leading-none">✓</span>}
            </div>
            <span className="font-medium text-gray-700">Lũy kế</span>
          </div>

          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#22c55e] mr-1.5"></div>
            <span className="text-gray-600">Nhập {">"} Xuất</span>
          </div>

          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#f97316] mr-1.5"></div>
            <span className="text-gray-600">Nhập {"<"} Xuất</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={displayData}
            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
            barCategoryGap={barCategoryGap}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              padding={xAxisPadding}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (value === 0) return "0";
                return formatNumber(value);
              }}
            />
            <ReferenceLine y={0} stroke="#d1d5db" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />

            <Bar dataKey="base" stackId="flow" fill="transparent" barSize={barSize} />
            <Bar dataKey="delta" stackId="flow" barSize={barSize} radius={[2, 2, 0, 0]}>
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.type === "increase" ? "#22c55e" : "#f97316"}
                />
              ))}
              <LabelList
                dataKey="delta"
                position="top"
                content={(props: any) => {
                  const { x, y, width, height, index } = props;
                  if (x === undefined || y === undefined || width === undefined || height === undefined || index === undefined) {
                    return null;
                  }

                  const entry = displayData[index];
                  if (!entry) return null;
                  if (entry.value === 0) return null;

                  const yPos = entry.value < 0 ? Number(y) + Number(height) + 12 : Number(y) - 8;

                  return (
                    <text
                      x={Number(x) + Number(width) / 2}
                      y={yPos}
                      textAnchor="middle"
                      fill={entry.type === "increase" ? "#15803d" : "#c2410c"}
                      fontSize="10px"
                      fontWeight="600"
                    >
                      {formatNumber(entry.value)}
                    </text>
                  );
                }}
              />
            </Bar>
            <Customized component={renderConnectors} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InventoryWaterfallChart;
