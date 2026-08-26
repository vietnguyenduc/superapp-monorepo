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
  visibleColumns?: Record<string, boolean>;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  sortBy,
  sortOrder,
  onSort,
  onCustomerSelect,
  onCustomerAction,
  loading = false,
  visibleColumns = {},
}) => {
  const { t } = useTranslation();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Use balance + last_transaction_date directly from customer record.
  // These fields are already populated by the API (customerService maps
  // current_balance → total_balance). No need to fetch 1000 transactions
  // client-side just to recompute them — that was a major perf bottleneck.

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

  const isVisible = (key: string) => visibleColumns[key] !== false;

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
    <div className="-mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-visible">
      <table className="w-full table-fixed divide-y divide-gray-300 dark:divide-gray-600">
        <thead className="hidden sm:table-header-group bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              scope="col"
              className={`${isVisible("customerCode") ? "hidden sm:table-cell" : "hidden"} sticky z-10 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50 dark:bg-gray-700`}
              style={{ top: "var(--customer-sticky-top, 0px)", width: "7%" }}
              onClick={() => handleSort("customer_code")}
            >
              <div className="flex items-center space-x-1">
                <span>Mã</span>
                {getSortIcon("customer_code")}
              </div>
            </th>
            <th
              scope="col"
              className={`${isVisible("fullName") ? "" : "hidden"} sticky z-10 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50 dark:bg-gray-700`}
              style={{ top: "var(--customer-sticky-top, 0px)", width: "24%" }}
              onClick={() => handleSort("full_name")}
            >
              <div className="flex items-center space-x-1">
                <span>Tên khách hàng</span>
                {getSortIcon("full_name")}
              </div>
            </th>
            <th
              scope="col"
              className={`${isVisible("balance") ? "hidden md:table-cell text-right" : "hidden"} sticky z-10 px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50 dark:bg-gray-700`}
              style={{ top: "var(--customer-sticky-top, 0px)", width: "12%" }}
              onClick={() => handleSort("total_balance")}
            >
              <div className="flex items-center justify-end space-x-1">
                <span>Công nợ</span>
                {getSortIcon("total_balance")}
              </div>
            </th>
            <th
              scope="col"
              className={`${isVisible("lastTransaction") ? "hidden lg:table-cell" : "hidden"} sticky z-10 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-normal leading-tight bg-gray-50 dark:bg-gray-700`}
              style={{ top: "var(--customer-sticky-top, 0px)", width: "13%" }}
              onClick={() => handleSort("last_transaction_date")}
            >
              <div className="flex items-center space-x-1">
                <span>Giao dịch cuối</span>
                {getSortIcon("last_transaction_date")}
              </div>
            </th>
            <th
              scope="col"
              className={`${isVisible("phone") ? "hidden sm:table-cell" : "hidden"} sticky z-10 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50 dark:bg-gray-700`}
              style={{ top: "var(--customer-sticky-top, 0px)", width: "10%" }}
              onClick={() => handleSort("phone")}
            >
              <div className="flex items-center space-x-1">
                <span>ĐT</span>
                {getSortIcon("phone")}
              </div>
            </th>
            <th
              scope="col"
              className={`${isVisible("address") ? "hidden xl:table-cell" : "hidden"} sticky z-10 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-normal leading-tight bg-gray-50 dark:bg-gray-700`}
              style={{ top: "var(--customer-sticky-top, 0px)", width: "14%" }}
              onClick={() => handleSort("address")}
            >
              <div className="flex items-center space-x-1">
                <span>Địa chỉ</span>
                {getSortIcon("address")}
              </div>
            </th>
            <th
              scope="col"
              className={`${isVisible("workingMethod") ? "hidden lg:table-cell" : "hidden"} sticky z-10 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-normal leading-tight bg-gray-50 dark:bg-gray-700`}
              style={{ top: "var(--customer-sticky-top, 0px)", width: "13%" }}
              onClick={() => handleSort("working_method")}
            >
              <div className="flex items-center space-x-1">
                <span>Cách làm việc công nợ</span>
                {getSortIcon("working_method")}
              </div>
            </th>
            <th scope="col" className="hidden sm:table-cell sticky z-10 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50 dark:bg-gray-700" style={{ top: "var(--customer-sticky-top, 0px)", width: "10%" }}>
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-300 dark:divide-gray-600">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className={`group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 ${
                hoveredRow === customer.id ? "bg-gray-100 dark:bg-gray-700" : ""
              }`}
              onMouseEnter={() => setHoveredRow(customer.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => onCustomerSelect(customer)}
            >
              <td className={`${isVisible("customerCode") ? "hidden sm:table-cell" : "hidden"} px-2 py-2 whitespace-nowrap text-sm font-medium font-mono text-gray-900 dark:text-white`}>
                {customer.customer_code}
              </td>
              <td className={`${isVisible("fullName") ? "" : "hidden"} px-2 py-2 text-sm text-gray-900 dark:text-white`}>
                <div className={`flex flex-wrap items-center justify-between gap-2 sm:hidden mb-2 ${isVisible("customerCode") ? "" : "hidden"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-500 dark:text-gray-300">
                      {customer.customer_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCustomerAction("edit", customer);
                      }}
                      className="p-1.5 text-gray-600 hover:text-green-600 bg-white border border-gray-300 rounded hover:bg-green-50 transition-colors"
                      title="Sửa"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCustomerAction("delete", customer);
                      }}
                      className="p-1.5 text-gray-600 hover:text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 transition-colors"
                      title="Xóa"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className={`text-sm font-semibold text-gray-900 dark:text-white leading-snug whitespace-normal break-words ${isVisible("fullName") ? "" : "hidden"}`} title={customer.full_name}>
                  {customer.full_name}
                </div>
                {customer.email && (
                  <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 whitespace-normal break-words mt-0.5" title={customer.email}>{customer.email}</div>
                )}
                {/* Mobile details */}
                <div className="md:hidden mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      onClick={(event) => event.stopPropagation()}
                      className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{formatPhoneNumber(customer.phone)}</span>
                    </a>
                  )}
                  <div className="flex items-start gap-1.5">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="break-words whitespace-normal line-clamp-2">{customer.address || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {customer.last_transaction_date
                        ? formatDate(customer.last_transaction_date)
                        : t("customers.noTransactions")}
                    </span>
                  </div>
                  <div className="text-right pt-1">
                    <span className="text-base font-bold text-gray-900 dark:text-white">
                      {formatCurrency(customer.total_balance || 0)}
                    </span>
                  </div>
                </div>
              </td>
              <td className={`${isVisible("balance") ? "hidden md:table-cell text-right" : "hidden"} px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white`}>
                {formatCurrency(customer.total_balance || 0)}
              </td>
              <td className={`${isVisible("lastTransaction") ? "hidden lg:table-cell" : "hidden"} px-2 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white`}>
                {customer.last_transaction_date
                  ? formatDate(customer.last_transaction_date)
                  : t("customers.noTransactions")}
              </td>
              <td className={`${isVisible("phone") ? "hidden sm:table-cell" : "hidden"} px-2 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white`}>
                {customer.phone ? formatPhoneNumber(customer.phone) : "-"}
              </td>
              <td className={`${isVisible("address") ? "hidden xl:table-cell" : "hidden"} px-2 py-2 text-sm text-gray-900 dark:text-white`}>
                <div className="line-clamp-2 whitespace-normal break-words leading-snug">
                  {customer.address || "-"}
                </div>
              </td>
              <td className={`${isVisible("workingMethod") ? "hidden lg:table-cell" : "hidden"} px-2 py-2 text-sm text-gray-900 dark:text-white`}>
                <div className="truncate" title={customer.working_method || undefined}>
                  {customer.working_method || "-"}
                </div>
              </td>
              <td className="hidden sm:table-cell px-2 py-2 whitespace-nowrap">
                <div className="flex items-center justify-end sm:justify-start space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCustomerAction("edit", customer);
                    }}
                    className="p-1.5 text-gray-600 hover:text-green-600 bg-white border border-gray-300 rounded hover:bg-green-50 transition-colors"
                    title="Sửa"
                  >
                    <svg
                      className="w-3.5 h-3.5"
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
                    title="Xóa"
                  >
                    <svg
                      className="w-3.5 h-3.5"
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
