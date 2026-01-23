import React from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { formatCurrency } from "../../../utils/formatting";

interface BalanceByBankAccount {
  bank_account_id: string;
  account_name: string;
  account_number: string;
  balance: number;
}

interface BalanceByBankChartProps {
  data: BalanceByBankAccount[];
}

const BalanceByBankChart: React.FC<BalanceByBankChartProps> = ({ data }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("dashboard.noBankData")}</p>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = data.map((account) => ({
    name: account.account_name,
    balance: account.balance,
    accountNumber: account.account_number,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">
            {t("dashboard.accountNumber")}: {payload[0].payload.accountNumber}
          </p>
          <p
            className={`text-sm font-bold ${
              payload[0].value >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {t("dashboard.balance")}: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom bar component with conditional colors
  const CustomBar = (props: any) => {
    const { x, y, width, height, value } = props;
    const isPositive = value >= 0;

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isPositive ? "#92cf9a" : "#ed6455"}
        rx={2}
      />
    );
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => Math.round(value / 1000000) + "M"}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="balance" shape={<CustomBar />}>
            <LabelList
              dataKey="balance"
              position="top"
              formatter={(value: number) => formatCurrency(value)}
              style={{
                fontSize: "10px",
                fontWeight: "500",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceByBankChart;
