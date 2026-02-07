import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { databaseService } from "../../services/database";
import type { Transaction, Customer } from "../../types";
import {
  formatCurrency,
  formatDate,
  getTransactionTypeColor,
  getTransactionTypeTextColor,
} from "../../utils/formatting";
import { LoadingFallback, ErrorFallback } from "../../components/UI/FallbackUI";
import Pagination from "../../components/UI/Pagination";
import TimeRangeFilter from "../../components/UI/TimeRangeFilter";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";

interface TransactionListState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  dateRange: {
    start: string;
    end: string;
  } | null;
  transactionType: string | null;
  branchFilter: string | null;
  bankAccountFilter: string | null;
  userFilter: string | null;
  customerFilter: {
    id: string | null;
    name: string | null;
  } | null;
}

const TransactionList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; name: string }[]>([]);
  const [userOptions, setUserOptions] = useState<string[]>([]);
  const [state, setState] = useState<TransactionListState>({
    transactions: [],
    loading: true,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    searchTerm: "",
    dateRange: null,
    transactionType: null,
    branchFilter: null,
    bankAccountFilter: null,
    userFilter: null,
    customerFilter: null,
  });

  // Initialize customer filter from URL params
  useEffect(() => {
    const customerId = searchParams.get("customer_id");
    const customerName = searchParams.get("customer_name");

    if (customerId) {
      setState((prev) => ({
        ...prev,
        customerFilter: {
          id: customerId,
          name: customerName || null,
        },
      }));
    }
  }, [searchParams]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const filters = {
        search: state.searchTerm || undefined,
        dateRange: state.dateRange || undefined,
        transaction_type: state.transactionType || undefined,
        customer_id: state.customerFilter?.id || undefined,
        branch_id: state.branchFilter || undefined,
        page: state.currentPage,
        pageSize: state.pageSize,
      };

      const response = await databaseService.transactions.getTransactions(filters);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const rawTransactions = response.data || [];
      const filteredTransactions = rawTransactions.filter((transaction) => {
        if (state.bankAccountFilter && transaction.bank_account_id !== state.bankAccountFilter) {
          return false;
        }
        if (state.userFilter && transaction.created_by !== state.userFilter) {
          return false;
        }
        return true;
      });

      const users = Array.from(
        new Set(rawTransactions.map((transaction) => transaction.created_by).filter(Boolean)),
      );

      setState((prev) => ({
        ...prev,
        transactions: filteredTransactions,
        totalCount: filteredTransactions.length,
        loading: false,
      }));

      setUserOptions(users);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to fetch transactions",
        loading: false,
      }));
    }
  }, [state.searchTerm, state.dateRange, state.transactionType, state.customerFilter, state.branchFilter, state.bankAccountFilter, state.userFilter, state.currentPage, state.pageSize]);

  useEffect(() => {
    const loadFilters = async () => {
      const [branchResult, bankResult] = await Promise.all([
        databaseService.branches.getBranches(),
        databaseService.bankAccounts.getBankAccounts(),
      ]);
      if (branchResult?.data) {
        setBranches(
          branchResult.data.map((branch: any) => ({
            id: String(branch.id),
            name: String(branch.name || branch.branch_name || branch.code || branch.id),
          })),
        );
      }
      if (bankResult?.data) {
        setBankAccounts(
          bankResult.data.map((account: any) => ({
            id: String(account.id),
            name: String(account.account_name || account.bank_name || account.id),
          })),
        );
      }
    };
    loadFilters();
  }, []);

  // Load transactions on mount and when filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (term: string) => {
    setState((prev) => ({ ...prev, searchTerm: term, currentPage: 1 }));
  };

  const handleDateRangeChange = (range: { start: string; end: string } | null) => {
    setState((prev) => ({ ...prev, dateRange: range, currentPage: 1 }));
  };

  const handleTransactionTypeChange = (type: string | null) => {
    setState((prev) => ({ ...prev, transactionType: type, currentPage: 1 }));
  };

  const getBranchName = (branchId: string): string => {
    const match = branches.find((branch) => branch.id === String(branchId));
    return match?.name || "N/A";
  };

  const getTransactionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      payment: "Thanh toán",
      charge: "Cho nợ",
      adjustment: "Điều chỉnh",
      refund: "Hoàn tiền",
    };
    return labels[type] || type;
  };

  const hasCustomerFilter = Boolean(state.customerFilter?.id);

  if (state.loading) {
    return (
      <LoadingFallback
        title="Đang tải giao dịch"
        message="Vui lòng chờ trong giây lát"
      />
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorFallback
            title="Lỗi tải giao dịch"
            message={state.error}
            retry={fetchTransactions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {hasCustomerFilter && (
          <div className="sm:hidden mb-3">
            <button
              type="button"
              onClick={() => navigate("/customers")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại khách hàng
            </button>
          </div>
        )}
        <PageHeader
          title="Danh sách giao dịch"
          subtitle="Xem và quản lý tất cả các giao dịch"
        />

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm giao dịch..."
                value={state.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="lg:w-64">
              <TimeRangeFilter
                value={state.dateRange}
                onChange={handleDateRangeChange}
              />
            </div>
            <div>
              <select
                value={state.branchFilter || ""}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    branchFilter: event.target.value || null,
                    currentPage: 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tất cả văn phòng</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={state.bankAccountFilter || ""}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    bankAccountFilter: event.target.value || null,
                    currentPage: 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tất cả tài khoản</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <select
                value={state.userFilter || ""}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    userFilter: event.target.value || null,
                    currentPage: 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tất cả người thực hiện</option>
                {userOptions.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hiển thị {(state.currentPage - 1) * state.pageSize + 1} đến{" "}
            {Math.min(state.currentPage * state.pageSize, state.totalCount)}{" "}
            trong tổng số {state.totalCount} giao dịch
          </p>
        </div>

        {/* Transaction Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {state.transactions.length === 0 ? (
            <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">Không có giao dịch nào</p>
            </div>
          ) : (
            <>
              <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {state.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 flex flex-col gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDate(transaction.transaction_date)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {transaction.customer_name || `Customer #${transaction.customer_id}`}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className={`text-sm font-bold ${
                            transaction.amount >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatCurrency(transaction.amount)}
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mt-1 ${
                            transaction.transaction_type === "payment"
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : transaction.transaction_type === "charge"
                              ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                              : transaction.transaction_type === "adjustment"
                              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                              : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                          }`}
                        >
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Văn phòng:</span>
                        <span className="truncate">
                          {getBranchName(transaction.branch_id)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Tài khoản:</span>
                        <span className="truncate">
                          {transaction.bank_account_name || `#${transaction.bank_account_id}`}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {transaction.transaction_code}
                      </span>
                      <span>{transaction.created_by}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">
                      Cập nhật: {formatDate(transaction.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-[1200px] divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ngày giao dịch
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Loại giao dịch
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Số tiền
                      </th>
                      <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Văn phòng
                      </th>
                      <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tài khoản
                      </th>
                      <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Người thực hiện
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mã giao dịch
                      </th>
                      <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cập nhật gần nhất
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {state.transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.transaction_type === "payment"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : transaction.transaction_type === "charge"
                                ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                : transaction.transaction_type === "adjustment"
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            }`}
                          >
                            {getTransactionTypeLabel(transaction.transaction_type)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                          <span
                            className={`text-xs sm:text-sm font-bold ${
                              transaction.amount >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                          {transaction.customer_name || `Customer #${transaction.customer_id}`}
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                          {getBranchName(transaction.branch_id)}
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                          {transaction.bank_account_name || `#${transaction.bank_account_id}`}
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                          {transaction.created_by}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 sm:px-2 py-0.5 rounded text-xs sm:text-xs">
                            {transaction.transaction_code}
                          </span>
                        </td>
                        <td className="hidden xl:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                          {formatDate(transaction.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {state.totalCount > state.pageSize && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-600">
              <Pagination
                currentPage={state.currentPage}
                totalPages={Math.ceil(state.totalCount / state.pageSize)}
                onPageChange={handlePageChange}
                totalItems={state.totalCount}
                itemsPerPage={state.pageSize}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
