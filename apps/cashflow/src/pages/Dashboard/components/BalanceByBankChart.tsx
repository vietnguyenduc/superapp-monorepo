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
  const chartData = data.map((account) => {
    // Ensure account_name exists before using it
    const accountName = account.account_name || '';
    
    // Extract bank name from account_name if it contains a separator
    const bankName = accountName && accountName.includes(' - ') 
      ? accountName.split(' - ')[0] 
      : '';
      
    return {
      name: accountName,
      displayName: bankName || accountName,
      balance: account.balance || 0,
      accountNumber: account.account_number || '',
      bankName: bankName,
    };
  });

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: {
        name: string;
        displayName: string;
        balance: number;
        accountNumber: string;
        bankName: string;
      };
    }>;
    label?: string;
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length && payload[0] && payload[0].payload) {
      const tooltipData = payload[0].payload;
      const value = payload[0].value || 0;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label || ''}</p>
          <p className="text-xs text-gray-500">
            {t("dashboard.accountNumber")}: {tooltipData.accountNumber || ''}
          </p>
          <p
            className={`text-sm font-bold ${
              value >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {t("dashboard.balance")}: {formatCurrency(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  interface CustomBarProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    value?: number;
  }

  // Custom bar component with conditional colors
  const CustomBar = (props: CustomBarProps) => {
    // Add null checks and default values
    const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props || {};
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
            dataKey="displayName"
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
