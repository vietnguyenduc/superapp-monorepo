import React from "react";
import { formatCompactNumber } from "../../../utils/formatting";

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
          bg: "bg-gradient-to-br from-rose-50 via-rose-50 to-red-50 dark:from-rose-950/40 dark:via-rose-950/30 dark:to-red-950/30",
          icon: "text-rose-500 dark:text-rose-300",
          value: "text-gray-900 dark:text-white",
        };
      case "success":
        return {
          bg: "bg-gradient-to-br from-emerald-50 via-emerald-50 to-green-50 dark:from-emerald-950/40 dark:via-emerald-950/30 dark:to-green-950/30",
          icon: "text-emerald-600 dark:text-emerald-300",
          value: "text-green-900 dark:text-emerald-100",
        };
      case "warning":
        return {
          bg: "bg-gradient-to-br from-sky-50 via-sky-50 to-cyan-50 dark:from-sky-950/40 dark:via-sky-950/30 dark:to-cyan-950/30",
          icon: "text-sky-600 dark:text-sky-300",
          value: "text-sky-900 dark:text-sky-100",
        };
      case "info":
        return {
          bg: "bg-gradient-to-br from-slate-50 via-slate-50 to-gray-50 dark:from-slate-950/40 dark:via-slate-950/30 dark:to-gray-950/30",
          icon: "text-gray-600 dark:text-gray-300",
          value: "text-gray-900 dark:text-white",
        };
      default:
        return {
          bg: "bg-gradient-to-br from-gray-50 to-gray-50 dark:from-gray-900 dark:to-gray-900",
          icon: "text-gray-600 dark:text-gray-300",
          value: "text-gray-900 dark:text-white",
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div
      className={`${colorClasses.bg} rounded-2xl p-3 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_4px_10px_rgba(15,23,42,0.04)] border border-gray-100/70 dark:border-white/5 h-full flex flex-col justify-center overflow-hidden`}
    >
      <div className="flex items-center">
        <div
          className={`${colorClasses.icon} p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm`}
        >
          {getIcon()}
        </div>
        <div className="ml-2 flex-1 min-w-0">
          <p className="text-sm sm:text-base font-normal text-gray-600 dark:text-gray-300 tracking-normal leading-snug break-words">
            {title}
          </p>
          {dualValues ? (
            <div className="mt-1 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 min-w-0">
                  <span className="text-sm sm:text-base font-medium text-green-600 whitespace-nowrap">
                    Thu:
                  </span>
                  <span className="text-base sm:text-xl font-semibold text-green-600 break-words">
                    {typeof dualValues.income === "number"
                      ? formatCompactNumber(dualValues.income)
                      : dualValues.income}
                  </span>
                  {dualValues.incomeChange !== undefined && (
                    <div className="flex items-center gap-0.5">
                      <span
                        className={`text-xs font-normal ${
                          dualValues.incomeChange >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {dualValues.incomeChange >= 0 ? "+" : ""}
                        {formatCompactNumber(dualValues.incomeChange)}
                      </span>
                      <svg
                        className={`ml-0.5 w-2.5 h-2.5 ${
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
              </div>

              <div className="my-1 h-px bg-gray-300/80" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 min-w-0">
                  <span className="text-sm sm:text-base font-medium text-red-600 whitespace-nowrap">
                    Cho nợ:
                  </span>
                  <span className="text-base sm:text-xl font-semibold text-red-600 break-words">
                    {typeof dualValues.debt === "number"
                      ? formatCompactNumber(dualValues.debt)
                      : dualValues.debt}
                  </span>
                  {dualValues.debtChange !== undefined && (
                    <div className="flex items-center gap-0.5">
                      <span
                        className={`text-xs font-normal ${
                          dualValues.debtChange >= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {dualValues.debtChange >= 0 ? "+" : ""}
                        {formatCompactNumber(dualValues.debtChange)}
                      </span>
                      <svg
                        className={`ml-0.5 w-2.5 h-2.5 ${
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
            </div>
          ) : (
            <div></div>
          )}
          <div className="flex items-baseline gap-x-2 gap-y-0.5">
            <p
              className={`text-xl sm:text-2xl font-semibold ${colorClasses.value} tracking-tight break-words`}
            >
              {value}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-0.5">
                <span
                  className={`text-xs font-normal ${
                    changeType === "increase" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {changeType === "increase" ? "+" : ""}
                  {formatCompactNumber(change)}
                </span>
                <svg
                  className={`ml-0.5 w-2.5 h-2.5 ${
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
    </div>
  );
};

export default MetricsCard;
