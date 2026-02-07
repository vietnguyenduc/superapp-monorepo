import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Customer } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatting";

interface TopCustomersProps {
  customers: Customer[];
  maxItems?: number;
  onMaxItemsChange?: (maxItems: number) => void;
}

const TopCustomers: React.FC<TopCustomersProps> = ({
  customers,
  maxItems = 10,
  onMaxItemsChange,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{t("dashboard.noCustomers")}</p>
      </div>
    );
  }

  const displayCustomers = customers.slice(0, maxItems);

  return (
    <div>
      {/* Display Count Selector */}
      {onMaxItemsChange && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Hiển thị {maxItems}/{customers.length}
          </span>
          <div className="relative">
            <select
              value={maxItems}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                console.log("Changing maxItems from", maxItems, "to", newValue);
                onMaxItemsChange(newValue);
              }}
              className="appearance-none text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 pr-8 text-gray-900 dark:text-gray-100 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-3">
        {displayCustomers.map((customer, index) => (
          <div
            key={customer.id}
            className="p-4 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => navigate(`/customers/${customer.id}`)}
          >
            {/* Header with index and customer info */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm sm:text-sm font-medium text-blue-600 dark:text-blue-300">
                      {index + 1}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-lg sm:text-base font-semibold text-gray-900 dark:text-white leading-snug sm:leading-normal">
                    {customer.full_name}
                  </p>
                  <div className="text-right hidden sm:block">
                    <p
                      className={`text-sm sm:text-base font-bold ${
                        customer.total_balance >= 0
                          ? "text-green-600 dark:text-green-300"
                          : "text-red-600 dark:text-red-300"
                      }`}
                    >
                      {formatCurrency(customer.total_balance)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 text-sm text-gray-500 dark:text-white">
                  <span className="font-mono text-xs sm:text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {customer.customer_code}
                  </span>
                  <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        onClick={(event) => event.stopPropagation()}
                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-xs sm:text-xs">{customer.phone}</span>
                      </a>
                    )}
                    <span
                      className={`text-sm font-semibold sm:hidden ${
                        customer.total_balance >= 0
                          ? "text-green-600 dark:text-green-300"
                          : "text-red-600 dark:text-red-300"
                      }`}
                    >
                      {formatCurrency(customer.total_balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Last transaction at bottom */}
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
              {customer.last_transaction_date && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t("dashboard.lastTransaction")}: {formatDate(customer.last_transaction_date)}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {customers.length > maxItems && !onMaxItemsChange && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hiển thị {maxItems}/{customers.length} khách hàng
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopCustomers;
