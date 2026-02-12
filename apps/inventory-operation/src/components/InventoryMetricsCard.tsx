import React from "react";
import { formatCompactNumber } from "../utils/formatting";

interface InventoryMetricsCardProps {
  title: string;
  value: string;
  change?: number;
  changeType?: "increase" | "decrease";
  icon: "inventory" | "products" | "transactions" | "warehouse";
  color: "primary" | "success" | "warning" | "info";
  // New props for dual value cards (input/output)
  dualValues?: {
    input: number | string;
    output: number | string;
    inputChange?: number;
    outputChange?: number;
  };
}

const InventoryMetricsCard: React.FC<InventoryMetricsCardProps> = ({
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
      case "inventory":
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        );
      case "products":
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        );
      case "transactions":
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
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        );
      case "warehouse":
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
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
          bg: "bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50",
          icon: "text-blue-500",
          value: "text-gray-900",
        };
      case "success":
        return {
          bg: "bg-gradient-to-br from-emerald-50 via-emerald-50 to-green-50",
          icon: "text-emerald-600",
          value: "text-green-900",
        };
      case "warning":
        return {
          bg: "bg-gradient-to-br from-amber-50 via-amber-50 to-yellow-50",
          icon: "text-amber-600",
          value: "text-amber-900",
        };
      case "info":
        return {
          bg: "bg-gradient-to-br from-slate-50 via-slate-50 to-gray-50",
          icon: "text-gray-600",
          value: "text-gray-900",
        };
      default:
        return {
          bg: "bg-gradient-to-br from-gray-50 to-gray-50",
          icon: "text-gray-600",
          value: "text-gray-900",
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div
      className={`${colorClasses.bg} rounded-2xl p-3 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_4px_10px_rgba(15,23,42,0.04)] border border-gray-100/70 h-full flex flex-col justify-center overflow-hidden`}
    >
      <div className="flex items-center">
        <div
          className={`${colorClasses.icon} p-2.5 rounded-xl bg-white shadow-sm`}
        >
          {getIcon()}
        </div>
        <div className="ml-2 flex-1 min-w-0">
          <p className="text-sm sm:text-base font-normal text-gray-600 tracking-normal leading-snug break-words">
            {title}
          </p>
          {dualValues ? (
            <div className="mt-1 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 min-w-0">
                  <span className="text-sm sm:text-base font-medium text-green-600 whitespace-nowrap">
                    Nhập:
                  </span>
                  <span className="text-base sm:text-xl font-semibold text-green-600 break-words">
                    {typeof dualValues.input === "number"
                      ? formatCompactNumber(dualValues.input)
                      : dualValues.input}
                  </span>
                  {dualValues.inputChange !== undefined && (
                    <div className="flex items-center gap-0.5">
                      <span
                        className={`text-xs font-normal ${
                          dualValues.inputChange >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {dualValues.inputChange >= 0 ? "+" : ""}
                        {formatCompactNumber(dualValues.inputChange)}
                      </span>
                      <svg
                        className={`ml-0.5 w-2.5 h-2.5 ${
                          dualValues.inputChange >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {dualValues.inputChange >= 0 ? (
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
                  <span className="text-sm sm:text-base font-medium text-blue-600 whitespace-nowrap">
                    Xuất:
                  </span>
                  <span className="text-base sm:text-xl font-semibold text-blue-600 break-words">
                    {typeof dualValues.output === "number"
                      ? formatCompactNumber(dualValues.output)
                      : dualValues.output}
                  </span>
                  {dualValues.outputChange !== undefined && (
                    <div className="flex items-center gap-0.5">
                      <span
                        className={`text-xs font-normal ${
                          dualValues.outputChange >= 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {dualValues.outputChange >= 0 ? "+" : ""}
                        {formatCompactNumber(dualValues.outputChange)}
                      </span>
                      <svg
                        className={`ml-0.5 w-2.5 h-2.5 ${
                          dualValues.outputChange >= 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {dualValues.outputChange >= 0 ? (
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

export default InventoryMetricsCard;
