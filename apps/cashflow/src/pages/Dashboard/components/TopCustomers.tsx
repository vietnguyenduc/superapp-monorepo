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
        <p className="text-gray-500">{t("dashboard.noCustomers")}</p>
      </div>
    );
  }

  const displayCustomers = customers.slice(0, maxItems);

  return (
    <div>
      {/* Display Count Selector */}
      {onMaxItemsChange && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
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
              className="appearance-none text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 pr-8 text-gray-900 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
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

      <div className="space-y-3">
        {displayCustomers.map((customer, index) => (
          <div
            key={customer.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => navigate(`/customers/${customer.id}`)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {index + 1}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {customer.full_name}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{customer.customer_code}</span>
                  {customer.phone && (
                    <>
                      <span>•</span>
                      <span>{customer.phone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <p
                className={`text-sm font-bold ${
                  customer.total_balance >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(customer.total_balance)}
              </p>
              {customer.last_transaction_date && (
                <p className="text-xs text-gray-500">
                  {t("dashboard.lastTransaction")}:{" "}
                  {formatDate(customer.last_transaction_date)}
                </p>
              )}
            </div>
          </div>
        ))}

        {customers.length > maxItems && !onMaxItemsChange && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              Hiển thị {maxItems}/{customers.length} khách hàng
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopCustomers;
