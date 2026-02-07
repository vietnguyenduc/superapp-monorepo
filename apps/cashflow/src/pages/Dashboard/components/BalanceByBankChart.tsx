import React, { useState, useEffect } from "react";
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
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Update screen size on mount and resize
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-300">
          {t("dashboard.noBankData")}
        </p>
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
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg" style={{ width: '220px' }}>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{tooltipData.name || ''}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("dashboard.accountNumber")}: {tooltipData.accountNumber || ''}
          </p>
          <p className={`text-sm font-bold ${value >= 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
            {t("dashboard.balance")}: {formatCurrency(value)}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("dashboard.trend")}: <span className={trendChange >= 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}>
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
        fill={isPositive ? "#22c55e" : "#f97316"}
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
    
    // Responsive sizing based on screen size and data count
    const hasManyBanks = chartData.length > 6;
    
    // Dynamic character limits based on screen size and data count
    let maxBankNameChars, maxAccountTypeChars, fontSize;
    
    if (screenSize === 'mobile') {
      maxBankNameChars = hasManyBanks ? 6 : 8;
      maxAccountTypeChars = hasManyBanks ? 4 : 6;
      fontSize = 10;
    } else if (screenSize === 'tablet') {
      maxBankNameChars = hasManyBanks ? 8 : 10;
      maxAccountTypeChars = hasManyBanks ? 6 : 8;
      fontSize = 9;
    } else {
      maxBankNameChars = hasManyBanks ? 10 : 12;
      maxAccountTypeChars = hasManyBanks ? 8 : 10;
      fontSize = 10;
    }
    
    const displayBankName = bankName.length > maxBankNameChars ? 
      bankName.substring(0, maxBankNameChars - 1) + '.' : bankName;
    
    const displayAccountType = accountType.length > maxAccountTypeChars ? 
      accountType.substring(0, maxAccountTypeChars - 1) + '.' : accountType;

    // Always show account type on desktop, be more selective on mobile
    let secondaryLabel = '';
    if (screenSize !== 'mobile' || !hasManyBanks) {
      secondaryLabel = accountType ? `${displayAccountType}${last4 ? ` • ${last4}` : ""}` : last4;
    } else if (screenSize === 'mobile' && !hasManyBanks) {
      secondaryLabel = last4;
    }
    
    return (
      <g transform={`translate(${x}, ${y + 6}) rotate(-45)`}>
        {/* Bank name */}
        <text
          x={0}
          y={0}
          textAnchor="end"
          fill="#e5e7eb"
          fontSize={fontSize}
          fontWeight={600}
        >
          {displayBankName}
        </text>
        {/* Account type and number */}
        {secondaryLabel && (
          <text
            x={0}
            y={fontSize + 2}
            textAnchor="end"
            fill="#9ca3af"
            fontSize={fontSize - 1}
            fontWeight={500}
          >
            {secondaryLabel}
          </text>
        )}
      </g>
    );
  };

  // Responsive chart configuration
  const getChartConfig = () => {
    switch (screenSize) {
      case 'mobile':
        return {
          height: 'h-80',
          margin: { top: 40, right: 5, left: 5, bottom: 60 },
          xAxisHeight: 80,
          barSize: 30,
          barGap: '8%',
          labelFontSize: '9px',
          tickFontSize: 10,
          yWidth: 30,
        };
      case 'tablet':
        return {
          height: 'h-96',
          margin: { top: 40, right: 8, left: 8, bottom: 70 },
          xAxisHeight: 90,
          barSize: 35,
          barGap: '9%',
          labelFontSize: '9px',
          tickFontSize: 10,
          yWidth: 32,
        };
      default:
        return {
          height: 'lg:h-[400px] xl:h-[450px]',
          margin: { top: 40, right: 10, left: 10, bottom: 80 },
          xAxisHeight: 100,
          barSize: 40,
          barGap: '10%',
          labelFontSize: '10px',
          tickFontSize: 11,
          yWidth: 35,
        };
    }
  };

  const chartConfig = getChartConfig();

  return (
    <div className={`w-full ${chartConfig.height}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={chartConfig.margin}
          barGap={0}
          barCategoryGap={chartConfig.barGap}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            height={chartConfig.xAxisHeight}
            interval={0}
            tickLine={false}
            axisLine={{ stroke: "#4b5563" }}
            tick={renderXAxisTick}
          />
          <YAxis
            tick={{ fontSize: chartConfig.tickFontSize, fontWeight: 600, fill: "#e5e7eb" }}
            tickFormatter={(value) => {
              // Clean, rounded Y-axis labels
              const absValue = Math.abs(value / 1000000);
              if (absValue === 0) return '0';
              return absValue < 1 ? `${(absValue * 1000).toFixed(0)}K` : `${Math.round(absValue)}M`;
            }}
            width={chartConfig.yWidth}
            tickCount={4}
            axisLine={{ stroke: "#4b5563" }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Bar chart for balance */}
          <Bar 
            dataKey="balance" 
            name={t("dashboard.currentBalance")}
            shape={<CustomBar />}
            barSize={chartConfig.barSize}
          >
            <LabelList
              dataKey="balance"
              position="top"
              formatter={(value: number) => {
                const absValue = Math.abs(value / 1000000);
                if (absValue === 0) return '0';
                return absValue < 1 ? `${(absValue * 1000).toFixed(0)}K` : `${Math.round(absValue)}M`;
              }}
              style={{
                fontSize: chartConfig.labelFontSize,
                fontWeight: "600",
                fill: "#f3f4f6"
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceByBankChart;
