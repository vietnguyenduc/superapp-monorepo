import React from "react";
import { formatNumber, formatCompactCurrency, formatCompactChange } from "../../../utils/formatting";

interface MetricsCardProps {
  title: string;
  value: string;
  change?: number;
  changeType?: "increase" | "decrease";
  icon: "currency" | "users" | "chart" | "database";
  color: "primary" | "success" | "warning" | "info";
  // New props for dual value cards
  dualValues?: {
    income: number | string;
    debt: number | string;
    incomeChange?: number;
    debtChange?: number;
  };
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  color,
  dualValues,
}) => {
  const getIcon = () => {
    switch (icon) {
      case "currency":
        return (
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
        );
      case "users":
        return (
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case "chart":
        return (
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case "database":
        return (
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return {
          bg: "bg-gradient-to-br from-blue-50 to-blue-100",
          icon: "text-blue-600",
          value: "text-gray-900",
        };
      case "success":
        return {
          bg: "bg-gradient-to-br from-green-50 to-green-100",
          icon: "text-green-600",
          value: "text-green-900",
        };
      case "warning":
        return {
          bg: "bg-gradient-to-br from-slate-50 to-slate-100",
          icon: "text-slate-600",
          value: "text-slate-900",
        };
      case "info":
        return {
          bg: "bg-gradient-to-br from-gray-50 to-gray-100",
          icon: "text-gray-600",
          value: "text-gray-900",
        };
      default:
        return {
          bg: "bg-gradient-to-br from-gray-50 to-gray-100",
          icon: "text-gray-600",
          value: "text-gray-900",
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div
      className={`${colorClasses.bg} rounded-xl p-3 sm:p-4 shadow-sm border border-white/50 backdrop-blur-sm h-full flex flex-col overflow-hidden`}
    >
      <div className="flex items-center">
        <div
          className={`${colorClasses.icon} p-2 rounded-lg bg-white/80 shadow-sm border border-white/50`}
        >
          {getIcon()}
        </div>
        <div className="ml-2 flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium text-gray-700 tracking-normal truncate">
            {title}
          </p>
          {dualValues ? (
            <div className="mt-1 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs sm:text-sm font-bold text-green-600 whitespace-nowrap">
                    Thu:
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-green-600 ml-1">
                    {/* Format raw numbers directly */}
                    {typeof dualValues.income === 'number' ? 
                      formatCompactCurrency(dualValues.income) : 
                      dualValues.income}
                  </span>
                </div>
                {dualValues.incomeChange !== undefined && (
                  <div className="flex items-center ml-1">
                    <span
                      className={`text-xs font-medium ${
                        dualValues.incomeChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {dualValues.incomeChange >= 0 ? "+" : ""}
                      {formatCompactChange(dualValues.incomeChange)}
                    </span>
                    <svg
                      className={`ml-1 w-3 h-3 ${
                        dualValues.incomeChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {dualValues.incomeChange >= 0 ? (
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      ) : (
                        <path
                          fillRule="evenodd"
                          d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      )}
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center">
                  <span className="text-xs sm:text-sm font-bold text-red-600 whitespace-nowrap">
                    Cho nợ:
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-red-600 ml-1">
                    {/* Format raw numbers directly */}
                    {typeof dualValues.debt === 'number' ? 
                      formatCompactCurrency(dualValues.debt) : 
                      dualValues.debt}
                  </span>
                </div>
                {dualValues.debtChange !== undefined && (
                  <div className="flex items-center ml-1">
                    <span
                      className={`text-xs font-medium ${
                        dualValues.debtChange >= 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {dualValues.debtChange >= 0 ? "+" : ""}
                      {formatCompactChange(dualValues.debtChange)}
                    </span>
                    <svg
                      className={`ml-1 w-3 h-3 ${
                        dualValues.debtChange >= 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {dualValues.debtChange >= 0 ? (
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      ) : (
                        <path
                          fillRule="evenodd"
                          d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      )}
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p
              className={`text-lg sm:text-xl font-semibold ${colorClasses.value} tracking-normal truncate`}
            >
              {value}
            </p>
          )}
          {change !== undefined && (
            <div className="flex items-center mt-1">
              <span
                className={`text-xs font-medium ${
                  changeType === "increase" ? "text-green-600" : "text-red-600"
                }`}
              >
                {changeType === "increase" ? "+" : ""}
                {formatNumber(change)}
              </span>
              <svg
                className={`ml-1 w-3 h-3 ${
                  changeType === "increase" ? "text-green-600" : "text-red-600"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {changeType === "increase" ? (
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;
