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
  AreaChart,
  Area,
} from "recharts";
import { formatCurrency } from "../../../utils/formatting";

interface BalanceByBankAccount {
  bank_account_id: string;
  account_name: string;
  account_number: string;
  balance: number;
  trend?: number[];
  // Add historical data for trend visualization
  historical_data?: { date: string; balance: number }[];
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

  // Prepare data for chart using real data from database
  const chartData = data.map((account) => {
    // Ensure account_name exists before using it
    const accountName = account.account_name || '';
    
    // Extract bank name and account type
    const parts = accountName.split(' - ');
    const bankName = parts[0] || '';
    const accountType = parts.length > 1 ? parts[1] : '';
    
    // Use historical data if available
    const historicalData = account.historical_data || [];
    
    return {
      id: account.bank_account_id,
      name: accountName,
      displayName: bankName || accountName,
      accountType: accountType,
      balance: account.balance || 0,
      accountNumber: account.account_number || '',
      bankName: bankName,
      historicalData: historicalData,
      // Calculate trend change if historical data exists
      trendChange: historicalData.length >= 2 ?
        ((historicalData[historicalData.length-1].balance - historicalData[0].balance) / 
         Math.abs(historicalData[0].balance)) * 100 : 0,
    };
  });

  // Custom tooltip with mini chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0] && payload[0].payload) {
      const tooltipData = payload[0].payload;
      const value = payload[0].value || 0;
      const trendChange = tooltipData.trendChange || 0;
      const historicalData = tooltipData.historicalData || [];
      
      const miniChartData = historicalData.map((item: any) => ({
        name: item.date,
        value: item.balance
      }));
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg" style={{ width: '220px' }}>
          <p className="text-sm font-medium text-gray-900">{tooltipData.name || ''}</p>
          <p className="text-xs text-gray-500">
            {t("dashboard.accountNumber")}: {tooltipData.accountNumber || ''}
          </p>
          <p className={`text-sm font-bold ${value >= 0 ? "text-green-600" : "text-red-600"}`}>
            {t("dashboard.balance")}: {formatCurrency(value)}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-1">
              {t("dashboard.trend")}: <span className={trendChange >= 0 ? "text-green-600" : "text-red-600"}>
                {trendChange >= 0 ? '▲' : '▼'} {Math.abs(trendChange).toFixed(1)}%
              </span>
            </p>
            <div style={{ width: '100%', height: '60px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={miniChartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} fill="url(#colorTrend)" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom bar component with conditional colors
  const CustomBar = (props: any) => {
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

  // Responsive X-axis tick component
  const renderXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    
    // Get the data for this tick
    const tickData = (chartData.find((item) => item.name === payload.value) || {
      bankName: "",
      accountType: "",
      accountNumber: "",
    }) as {
      bankName: string;
      accountType: string;
      accountNumber: string;
    };

    const bankName = tickData.bankName || '';
    const accountType = tickData.accountType || '';
    const accountNumber = String(tickData.accountNumber || "");
    const last4 = accountNumber.length >= 4 ? accountNumber.slice(-4) : accountNumber;
    
    // Truncate text if needed (keep more characters for readability)
    const maxBankNameChars = chartData.length > 6 ? 14 : 18;
    const maxAccountTypeChars = chartData.length > 6 ? 12 : 14;
    
    const displayBankName = bankName.length > maxBankNameChars ? 
      bankName.substring(0, maxBankNameChars - 2) + '...' : bankName;
    
    const displayAccountType = accountType.length > maxAccountTypeChars ? 
      accountType.substring(0, maxAccountTypeChars - 2) + '...' : accountType;

    const secondaryLabel = accountType ? `${displayAccountType}${last4 ? ` • ${last4}` : ""}` : last4;
    
    return (
      <g transform={`translate(${x}, ${y + 8}) rotate(-32)`}>
        {/* Bank name */}
        <text
          x={0}
          y={0}
          textAnchor="end"
          fill="#111827"
          fontSize={chartData.length > 6 ? 11 : 12}
          fontWeight={600}
        >
          {displayBankName}
        </text>

        {/* Account type / last4 */}
        {secondaryLabel && (
          <text
            x={0}
            y={14}
            textAnchor="end"
            fill="#4b5563"
            fontSize={chartData.length > 6 ? 10 : 11}
            fontWeight={500}
          >
            {secondaryLabel}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-96"> {/* Increased height to match CashFlowChart */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 10, bottom: 24 }}
          barGap={0}
          barCategoryGap={"15%"} // Adjust space between bars to use more width for better readability
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            height={64}
            interval={0}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            tick={renderXAxisTick}
          />
          <YAxis
            tick={{ fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => {
              // Clean, rounded Y-axis labels
              const absValue = Math.abs(value / 1000000);
              if (absValue === 0) return '0';
              return absValue < 1 ? `${(absValue * 1000).toFixed(0)}K` : `${Math.round(absValue)}M`;
            }}
            width={50}
            tickCount={5}
            label={{ 
              value: t("dashboard.balance") + " (VND)", 
              angle: -90, 
              position: "insideLeft",
              fontSize: 12,
              fill: "#666",
              offset: 0
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Bar chart for balance */}
          <Bar 
            dataKey="balance" 
            name={t("dashboard.currentBalance")}
            shape={<CustomBar />}
            barSize={60} // Increase bar width to use more space
          >
            <LabelList
              dataKey="balance"
              position="top"
              formatter={(value: number) => formatCurrency(value)}
              style={{
                fontSize: "11px",
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
