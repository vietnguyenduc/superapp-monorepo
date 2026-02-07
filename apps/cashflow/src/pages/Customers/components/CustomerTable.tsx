import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Customer } from "../../../types";
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
    if (balance < 0) return "text-red-600 dark:text-red-300";
    if (balance > 0) return "text-green-600 dark:text-green-300";
    return "text-gray-600 dark:text-gray-300";
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
            <div key={i} className="border-b border-gray-200 dark:border-gray-600">
              <div className="px-4 py-4">
                <div className="flex items-center space-x-4">
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
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
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
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
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {t("customers.noCustomers")}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("customers.noCustomersDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1480px] divide-y divide-gray-300 dark:divide-gray-600">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              scope="col"
              className="hidden sm:table-cell px-2 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20"
            >
              <span>Giao dịch</span>
            </th>
            <th
              scope="col"
              className="hidden sm:table-cell px-2 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20"
            >
              <span>Mã</span>
            </th>
            <th
              scope="col"
              className="px-2 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-1/2"
              onClick={() => handleSort("full_name")}
            >
              <div className="flex items-center space-x-1">
                <span>Tên khách hàng</span>
                {getSortIcon("full_name")}
              </div>
            </th>
            <th
              scope="col"
              className="hidden md:table-cell px-4 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort("total_balance")}
            >
              <div className="flex items-center justify-end space-x-1">
                <span>Công nợ</span>
                {getSortIcon("total_balance")}
              </div>
            </th>
            <th
              scope="col"
              className="hidden lg:table-cell px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort("last_transaction_date")}
            >
              <div className="flex items-center space-x-1">
                <span>Giao dịch cuối</span>
                {getSortIcon("last_transaction_date")}
              </div>
            </th>
            <th
              scope="col"
              className="hidden sm:table-cell px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort("phone")}
            >
              <div className="flex items-center space-x-1">
                <span>Điện thoại</span>
                {getSortIcon("phone")}
              </div>
            </th>
            <th
              scope="col"
              className="hidden xl:table-cell px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort("address")}
            >
              <div className="flex items-center space-x-1">
                <span>Địa chỉ</span>
                {getSortIcon("address")}
              </div>
            </th>
            <th scope="col" className="relative px-2 sm:px-4 py-3">
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-300 dark:divide-gray-600">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className={`hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 ${
                hoveredRow === customer.id ? "bg-gray-100 dark:bg-gray-700" : ""
              }`}
              onMouseEnter={() => setHoveredRow(customer.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => onCustomerSelect(customer)}
            >
              <td className="hidden sm:table-cell px-2 sm:px-4 py-4 sm:py-4 whitespace-nowrap w-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewTransactions(e, customer);
                  }}
                  className="inline-flex items-center justify-center px-2.5 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                  title="Xem giao dịch"
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
                  <span className="hidden sm:inline">Giao dịch</span>
                  <span className="sm:hidden">GD</span>
                </button>
              </td>
              <td className="hidden sm:table-cell px-2 sm:px-4 py-4 sm:py-4 whitespace-nowrap w-20">
                <div className="text-sm sm:text-base font-bold font-mono text-gray-900 dark:text-white">{customer.customer_code}</div>
              </td>
              <td className="px-2 sm:px-4 py-4 sm:py-4 w-1/2">
                <div className="flex items-center justify-between gap-2 sm:hidden mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewTransactions(e, customer);
                    }}
                    className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
                    title="Xem giao dịch"
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
                    <span>Giao dịch</span>
                  </button>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-300">
                    {customer.customer_code}
                  </span>
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight whitespace-normal break-words">
                  {customer.full_name}
                </div>
                {customer.email && (
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-all mt-1">{customer.email}</div>
                )}
                {/* Mobile details */}
                <div className="md:hidden mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      onClick={(event) => event.stopPropagation()}
                      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{formatPhoneNumber(customer.phone)}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{customer.address || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {customer.last_transaction_date
                        ? formatDate(customer.last_transaction_date)
                        : t("customers.noTransactions")}
                    </span>
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      customer.total_balance >= 0
                        ? "text-green-600 dark:text-green-300"
                        : "text-red-600 dark:text-red-300"
                    }`}
                  >
                    {formatCurrency(customer.total_balance)}
                  </div>
                </div>
              </td>
              <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-right">
                <div
                  className={`text-sm font-medium ${getBalanceColor(customer.total_balance)}`}
                >
                  {formatCurrency(customer.total_balance)}
                </div>
              </td>
              <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {customer.last_transaction_date
                  ? formatDate(customer.last_transaction_date)
                  : t("customers.noTransactions")}
              </td>
              <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {customer.phone ? formatPhoneNumber(customer.phone) : "-"}
              </td>
              <td className="hidden xl:table-cell px-4 py-4 text-sm text-gray-900 dark:text-white">
                <div className="max-w-xs truncate">
                  {customer.address || "-"}
                </div>
              </td>
              <td className="px-2 sm:px-4 py-4 sm:py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCustomerAction("edit", customer);
                    }}
                    className="p-2 text-gray-600 hover:text-green-600 bg-white border border-gray-300 rounded-lg hover:bg-green-50 transition-colors"
                    title="Sửa"
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
                    className="p-2 text-gray-600 hover:text-red-600 bg-white border border-gray-300 rounded-lg hover:bg-red-50 transition-colors"
                    title="Xóa"
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
