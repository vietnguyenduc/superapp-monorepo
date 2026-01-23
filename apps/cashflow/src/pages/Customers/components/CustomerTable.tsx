import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Customer } from "../../../types";
import {
  formatCurrency,
  formatDate,
  formatPhoneNumber,
} from "../../../utils/formatting";

interface CustomerTableProps {
  customers: Customer[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
  onCustomerSelect: (customer: Customer) => void;
  onCustomerAction: (action: string, customer: Customer) => void;
  loading?: boolean;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  sortBy,
  sortOrder,
  onSort,
  onCustomerSelect,
  onCustomerAction,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return (
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
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortOrder === "asc" ? (
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-blue-600"
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
    );
  };

  const handleSort = (column: string) => {
    onSort(column);
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return "text-red-600";
    if (balance > 0) return "text-green-600";
    return "text-gray-600";
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        {t("customers.status.active")}
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        {t("customers.status.inactive")}
      </span>
    );
  };

  const handleViewTransactions = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    onCustomerAction("transactions", customer);
  };

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-gray-200">
              <div className="px-4 py-4">
                <div className="flex items-center space-x-4">
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {t("customers.noCustomers")}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t("customers.noCustomersDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <span>Giao dịch</span>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("customer_code")}
            >
              <div className="flex items-center space-x-1">
                <span>{t("customers.columns.code")}</span>
                {getSortIcon("customer_code")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("full_name")}
            >
              <div className="flex items-center space-x-1">
                <span>{t("customers.columns.name")}</span>
                {getSortIcon("full_name")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("phone")}
            >
              <div className="flex items-center space-x-1">
                <span>{t("customers.columns.phone")}</span>
                {getSortIcon("phone")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("address")}
            >
              <div className="flex items-center space-x-1">
                <span>Địa chỉ</span>
                {getSortIcon("address")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("total_balance")}
            >
              <div className="flex items-center justify-end space-x-1">
                <span>{t("customers.columns.balance")}</span>
                {getSortIcon("total_balance")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("last_transaction_date")}
            >
              <div className="flex items-center space-x-1">
                <span>{t("customers.columns.lastTransaction")}</span>
                {getSortIcon("last_transaction_date")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("is_active")}
            >
              <div className="flex items-center space-x-1">
                <span>{t("customers.columns.status")}</span>
                {getSortIcon("is_active")}
              </div>
            </th>
            <th scope="col" className="relative px-4 py-3">
              <span className="sr-only">{t("customers.columns.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className={`hover:bg-gray-50 cursor-pointer ${
                hoveredRow === customer.id ? "bg-gray-50" : ""
              }`}
              onMouseEnter={() => setHoveredRow(customer.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => onCustomerSelect(customer)}
            >
              {/* Giao dịch Column - Nổi bật */}
              <td className="px-4 py-4 whitespace-nowrap">
                <button
                  onClick={(e) => handleViewTransactions(e, customer)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                  title="Xem chi tiết giao dịch"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Giao dịch
                </button>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {customer.customer_code}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {customer.full_name}
                </div>
                {customer.email && (
                  <div className="text-sm text-gray-500">{customer.email}</div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {customer.phone ? formatPhoneNumber(customer.phone) : "-"}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <div className="max-w-xs truncate">
                  {customer.address || "-"}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right">
                <div
                  className={`text-sm font-medium ${getBalanceColor(customer.total_balance)}`}
                >
                  {formatCurrency(customer.total_balance)}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {customer.last_transaction_date
                  ? formatDate(customer.last_transaction_date)
                  : t("customers.noTransactions")}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {getStatusBadge(customer.is_active)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCustomerAction("edit", customer);
                    }}
                    className="p-1.5 text-gray-600 hover:text-green-600 bg-white border border-gray-300 rounded hover:bg-green-50 transition-colors"
                    title={t("customers.actions.edit")}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCustomerAction("delete", customer);
                    }}
                    className="p-1.5 text-gray-600 hover:text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 transition-colors"
                    title={t("customers.actions.delete")}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
